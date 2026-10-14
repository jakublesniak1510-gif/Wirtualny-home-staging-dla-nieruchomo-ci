import type { Order, PackageCode, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  adminNewOrderEmail,
  orderConfirmationEmail,
  orderInProgressEmail,
  orderReadyEmail,
  sendEmail,
} from "@/lib/email";
import type { EmailOrder, EmailResult } from "@/lib/email";
import { ImageValidationError, inspectImage } from "@/lib/images";
import type { ImageInfo } from "@/lib/images";
import {
  generatePublicToken,
  getDeadline,
  getOrderNumber,
  parseAddons,
} from "@/lib/orders";
import { FREE_SAMPLE_PHOTOS, calculateOrderPrice } from "@/lib/pricing";
import type { PriceBreakdown } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/site";
import {
  PaymentsNotConfiguredError,
  createCheckoutSession,
  expireCheckoutSession,
  isStripeConfigured,
} from "@/lib/stripe";
import { StorageNotFoundError, getStorage } from "@/lib/storage";
import type { OrderInput, SampleInput } from "@/lib/validation";

/** Operacje na zamówieniach w bazie (tworzenie, płatność, anulowanie, powiadomienia). */

export class OrderError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

/** Wyszukuje kod pakietu i sprawdza, czy można go użyć. */
export async function findUsablePackageCode(code: string): Promise<PackageCode> {
  const found = await prisma.packageCode.findUnique({ where: { code: code.toUpperCase() } });
  if (!found) throw new OrderError(404, "Nie znaleziono takiego kodu pakietu. Sprawdź, czy wpisano go poprawnie.");
  if (found.expiresAt && found.expiresAt.getTime() < Date.now()) {
    throw new OrderError(410, "Ten kod pakietu stracił ważność.");
  }
  if (found.creditsLeft <= 0) {
    throw new OrderError(409, "Ten kod pakietu został już w całości wykorzystany.");
  }
  return found;
}

interface PreparedPhoto {
  tmpKey: string;
  name: string;
  size: number;
  info: ImageInfo;
}

/** Sprawdza wgrane pliki tymczasowe (istnienie, format, wymiary) przed utworzeniem zamówienia. */
async function preparePhotos(photos: ReadonlyArray<{ tmpKey: string; name: string }>): Promise<PreparedPhoto[]> {
  const storage = getStorage();
  const prepared: PreparedPhoto[] = [];
  for (const [index, photo] of photos.entries()) {
    let buffer: Buffer;
    try {
      buffer = await storage.get(photo.tmpKey);
    } catch (error) {
      if (error instanceof StorageNotFoundError) {
        throw new OrderError(
          400,
          `Zdjęcie nr ${index + 1} (${photo.name}) wygasło lub nie zostało wgrane. Usuń je i wgraj ponownie.`,
        );
      }
      throw error;
    }
    try {
      const info = await inspectImage(buffer);
      prepared.push({ tmpKey: photo.tmpKey, name: photo.name, size: buffer.length, info });
    } catch (error) {
      if (error instanceof ImageValidationError) {
        throw new OrderError(400, `Zdjęcie nr ${index + 1}: ${error.message}`);
      }
      throw error;
    }
  }
  return prepared;
}

function originalKey(orderId: string, index: number, ext: string): string {
  return `orders/${orderId}/original/${index + 1}.${ext}`;
}

/** Przenosi pliki z tmp/ do orders/<id>/original/. */
async function moveFiles(orderId: string, photos: readonly PreparedPhoto[]): Promise<void> {
  const storage = getStorage();
  for (const [index, photo] of photos.entries()) {
    const buffer = await storage.get(photo.tmpKey);
    await storage.put(originalKey(orderId, index, photo.info.ext), buffer, photo.info.mime);
  }
  for (const photo of photos) {
    await storage.delete(photo.tmpKey).catch(() => undefined);
  }
}

function photoRows(orderId: string, photos: readonly PreparedPhoto[]): Prisma.PhotoCreateManyInput[] {
  return photos.map((photo, index) => ({
    orderId,
    originalKey: originalKey(orderId, index, photo.info.ext),
    originalName: photo.name.slice(0, 200),
    mimeType: photo.info.mime,
    size: photo.size,
    width: photo.info.width,
    height: photo.info.height,
    sortOrder: index,
  }));
}

export interface CreateOrderResult {
  order: Order;
  breakdown: PriceBreakdown;
  /** Adres Stripe Checkout (gdy total > 0). */
  checkoutUrl?: string;
}

export async function createOrder(input: OrderInput): Promise<CreateOrderResult> {
  const code = input.packageCode ? await findUsablePackageCode(input.packageCode) : null;
  const breakdown = calculateOrderPrice({
    photoCount: input.photos.length,
    addons: input.addons,
    express: input.express,
    packageCredits: code?.creditsLeft ?? 0,
  });

  if (breakdown.total > 0 && !isStripeConfigured()) throw new PaymentsNotConfiguredError();

  const photos = await preparePhotos(input.photos);

  const order = await prisma.$transaction(async (tx) => {
    if (code && breakdown.creditsUsed > 0) {
      const reserved = await tx.packageCode.updateMany({
        where: { id: code.id, creditsLeft: { gte: breakdown.creditsUsed } },
        data: { creditsLeft: { decrement: breakdown.creditsUsed } },
      });
      if (reserved.count !== 1) {
        throw new OrderError(409, "Kredyty z kodu pakietu zostały w międzyczasie wykorzystane. Sprawdź kod ponownie.");
      }
    }
    const created = await tx.order.create({
      data: {
        publicToken: generatePublicToken(),
        email: input.email,
        phone: input.phone,
        name: input.name,
        company: input.company,
        nip: input.nip,
        style: input.style,
        addons: JSON.stringify(breakdown.addonSlugs),
        express: input.express,
        photoCount: breakdown.photoCount,
        priceBreakdown: JSON.stringify(breakdown),
        totalAmount: breakdown.total,
        currency: breakdown.currency,
        packageCodeId: code && breakdown.creditsUsed > 0 ? code.id : null,
        packageCreditsUsed: breakdown.creditsUsed,
        referralCode: input.referralCode,
        notes: input.notes,
        consentTerms: input.consents.terms,
        consentDigital: input.consents.digital,
        consentHonesty: input.consents.honesty,
        consentRights: input.consents.rights,
      },
    });
    await tx.photo.createMany({ data: photoRows(created.id, photos) });
    return created;
  });

  try {
    await moveFiles(order.id, photos);
  } catch (error) {
    console.error("[orders] Nie udało się przenieść plików:", error);
    await cancelOrder(order.id);
    throw new OrderError(500, "Nie udało się zapisać zdjęć. Spróbuj ponownie za chwilę.");
  }

  if (breakdown.total === 0) {
    const paid = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FREE", status: "PAID", paidAt: new Date() },
    });
    await notifyOrderPlaced(paid.id);
    return { order: paid, breakdown };
  }

  try {
    const session = await createCheckoutSession({
      id: order.id,
      number: getOrderNumber(order.id),
      publicToken: order.publicToken,
      email: order.email,
      style: order.style,
      nip: order.nip,
      breakdown,
    });
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });
    return { order: updated, breakdown, checkoutUrl: session.url };
  } catch (error) {
    console.error("[orders] Błąd Stripe Checkout:", error);
    await cancelOrder(order.id);
    throw new OrderError(502, "Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.");
  }
}

/** Nowa sesja płatności dla istniejącego, nieopłaconego zamówienia (np. po anulowaniu w Stripe). */
export async function retryCheckout(publicToken: string): Promise<string> {
  const order = await prisma.order.findUnique({ where: { publicToken } });
  if (!order) throw new OrderError(404, "Nie znaleziono zamówienia.");
  if (order.paymentStatus !== "UNPAID") throw new OrderError(409, "To zamówienie jest już opłacone.");
  if (order.status === "CANCELLED") {
    throw new OrderError(410, "To zamówienie zostało anulowane. Złóż nowe zamówienie.");
  }
  const breakdown = JSON.parse(order.priceBreakdown) as PriceBreakdown;
  const session = await createCheckoutSession({
    id: order.id,
    number: getOrderNumber(order.id),
    publicToken: order.publicToken,
    email: order.email,
    style: order.style,
    nip: order.nip,
    breakdown,
  });
  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  // Poprzednia sesja wciąż przyjmowałaby płatność (np. w drugiej karcie) – klient zapłaciłby dwa razy.
  // Wygaszamy ją DOPIERO po zapisaniu nowej: webhook `expired` starej sesji nie anuluje wtedy zamówienia.
  if (order.stripeSessionId && order.stripeSessionId !== session.id) {
    await expireCheckoutSession(order.stripeSessionId);
  }
  return session.url;
}

export async function createSampleOrder(input: SampleInput): Promise<Order> {
  const existing = await prisma.order.findFirst({
    where: { isSample: true, email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new OrderError(
      409,
      "Darmowa próbka dla tego adresu e-mail została już wykorzystana. Zapraszamy do zwykłego zamówienia – od 10 zdjęć taniej!",
    );
  }
  const photos = await preparePhotos([input.photo]);
  const breakdown = {
    ...calculateOrderPrice({ photoCount: FREE_SAMPLE_PHOTOS, packageCredits: FREE_SAMPLE_PHOTOS }),
    sample: true,
  };
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        publicToken: generatePublicToken(),
        email: input.email,
        phone: input.phone,
        name: input.name,
        company: input.company,
        style: input.style,
        photoCount: FREE_SAMPLE_PHOTOS,
        priceBreakdown: JSON.stringify(breakdown),
        totalAmount: 0,
        notes: input.notes,
        isSample: true,
        paymentStatus: "FREE",
        status: "PAID",
        paidAt: new Date(),
        consentTerms: input.consents.terms,
        consentDigital: input.consents.digital,
        consentHonesty: input.consents.honesty,
        consentRights: input.consents.rights,
      },
    });
    await tx.photo.createMany({ data: photoRows(created.id, photos) });
    return created;
  });
  try {
    await moveFiles(order.id, photos);
  } catch (error) {
    console.error("[orders] Nie udało się przenieść pliku próbki:", error);
    await prisma.order.delete({ where: { id: order.id } });
    throw new OrderError(500, "Nie udało się zapisać zdjęcia. Spróbuj ponownie za chwilę.");
  }
  await notifyOrderPlaced(order.id);
  return order;
}

/**
 * Oznacza zamówienie jako opłacone (idempotentnie). Zwraca true, gdy stan faktycznie się zmienił
 * – wtedy wysyła e-maile do klienta i operatora.
 */
export async function markOrderPaid(
  orderId: string,
  details: { paymentIntentId?: string | null; sessionId?: string | null } = {},
): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return false;
  if (order.paymentStatus === "PAID" || order.paymentStatus === "FREE") return false;
  if (order.status === "CANCELLED") {
    console.warn(`[orders] Płatność dla anulowanego zamówienia ${getOrderNumber(order.id)} – przywracam.`);
  }
  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "UNPAID" },
      data: {
        paymentStatus: "PAID",
        status: "PAID",
        paidAt: new Date(),
        cancelledAt: null,
        stripePaymentIntentId: details.paymentIntentId ?? undefined,
        stripeSessionId: details.sessionId ?? undefined,
      },
    });
    if (result.count !== 1) return false;
    await reclaimReleasedCredits(tx, orderId);
    return true;
  });
  if (!changed) return false;
  await notifyOrderPlaced(orderId);
  return true;
}

/**
 * Anulowanie (cancelOrder) zwraca kredyty kodu pakietu i zeruje `packageCreditsUsed`. Jeśli takie
 * zamówienie zostanie mimo to opłacone (np. admin anulował je, gdy klient był na stronie Stripe),
 * kwota w Stripe uwzględniała rabat z kredytów – rezerwujemy je ponownie, inaczej ten sam kod
 * dałoby się wykorzystać drugi raz.
 */
async function reclaimReleasedCredits(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { packageCodeId: true, packageCreditsUsed: true, priceBreakdown: true },
  });
  if (!order?.packageCodeId || order.packageCreditsUsed > 0) return;
  let creditsUsed = 0;
  try {
    creditsUsed = Number((JSON.parse(order.priceBreakdown) as Partial<PriceBreakdown>).creditsUsed ?? 0);
  } catch {
    creditsUsed = 0;
  }
  if (!Number.isInteger(creditsUsed) || creditsUsed <= 0) return;
  const reserved = await tx.packageCode.updateMany({
    where: { id: order.packageCodeId, creditsLeft: { gte: creditsUsed } },
    data: { creditsLeft: { decrement: creditsUsed } },
  });
  if (reserved.count !== 1) {
    console.warn(
      `[orders] Zamówienie ${getOrderNumber(orderId)} opłacone po anulowaniu, ale kod pakietu nie ma już ${creditsUsed} kredytów – sprawdź ręcznie.`,
    );
    return;
  }
  await tx.order.update({ where: { id: orderId }, data: { packageCreditsUsed: creditsUsed } });
}

/**
 * Anuluje zamówienie i zwalnia zarezerwowane kredyty kodu pakietu (idempotentnie).
 * `onlyIfUnpaid` – nie ruszaj zamówień już opłaconych (webhook „expired/failed”).
 * `sessionId` – anuluj tylko, jeśli to bieżąca sesja Stripe zamówienia.
 */
export async function cancelOrder(
  orderId: string,
  options: { onlyIfUnpaid?: boolean; sessionId?: string } = {},
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === "CANCELLED") return false;
    if (options.onlyIfUnpaid && order.paymentStatus !== "UNPAID") return false;
    if (options.sessionId && order.stripeSessionId && order.stripeSessionId !== options.sessionId) {
      return false;
    }
    if (order.packageCodeId && order.packageCreditsUsed > 0) {
      await tx.packageCode.update({
        where: { id: order.packageCodeId },
        data: { creditsLeft: { increment: order.packageCreditsUsed } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date(), packageCreditsUsed: 0 },
    });
    return true;
  });
}

export function toEmailOrder(order: Order): EmailOrder {
  return {
    number: getOrderNumber(order.id),
    publicToken: order.publicToken,
    email: order.email,
    name: order.name,
    phone: order.phone,
    company: order.company,
    photoCount: order.photoCount,
    style: order.style,
    addons: parseAddons(order.addons),
    express: order.express,
    totalAmount: order.totalAmount,
    deadline: getDeadline(order),
    isSample: order.isSample,
    notes: order.notes,
    deliveredAt: order.deliveredAt,
  };
}

/** E-mail „Przyjęliśmy zamówienie” do klienta i „Nowe zamówienie” do operatora. */
export async function notifyOrderPlaced(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const data = toEmailOrder(order);
  await sendEmail(orderConfirmationEmail(data));
  await sendEmail(adminNewOrderEmail(data, absoluteUrl(`/admin/zamowienia/${order.id}`)));
}

/** Dostarczenie: status DELIVERED + e-mail „gotowe”. Wymaga wyników dla wszystkich zdjęć. */
export async function deliverOrder(orderId: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { photos: true } });
  if (!order) throw new OrderError(404, "Nie znaleziono zamówienia.");
  if (order.status === "CANCELLED") throw new OrderError(409, "Zamówienie jest anulowane.");
  if (order.paymentStatus === "UNPAID") throw new OrderError(409, "Zamówienie nie jest opłacone.");
  const missing = order.photos.filter((photo) => !photo.resultKey).length;
  if (missing > 0) {
    throw new OrderError(409, `Brakuje wyników dla ${missing} zdjęć – wgraj je przed wysłaniem.`);
  }
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
  const sent = await sendEmail(orderReadyEmail(toEmailOrder(updated)));
  if (!sent.ok) {
    throw new OrderError(502, `Status zmieniony na „Dostarczone”, ale e-mail nie wyszedł: ${sent.error ?? "błąd"}.`);
  }
  return updated;
}

export interface NotifyResult extends EmailResult {
  /** Powód pominięcia wysyłki (wtedy ok = false i nic nie wysłano). */
  skipped?: "not-found" | "wrong-status";
}

/**
 * E-mail „Pracujemy nad Twoim zamówieniem” (przejście PAID → IN_PROGRESS).
 *
 * KONTRAKT (idempotentność po stronie wywołującego): wywołaj RAZ, zaraz po zmianie statusu
 * na IN_PROGRESS i tylko wtedy, gdy status PRZED zmianą był PAID (np. w panelu:
 * `updateMany({ where: { id, status: "PAID" }, data: { status: "IN_PROGRESS" } })` i wysyłka,
 * gdy `count === 1`). Funkcja sama sprawdza jedynie, że zamówienie ma teraz status IN_PROGRESS.
 * Nie rzuca wyjątków – zwraca wynik wysyłki.
 */
export async function notifyOrderInProgress(orderId: string): Promise<NotifyResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, skipped: "not-found", error: "Nie znaleziono zamówienia." };
  if (order.status !== "IN_PROGRESS") {
    return { ok: false, skipped: "wrong-status", error: "Zamówienie nie ma statusu „W realizacji”." };
  }
  return sendEmail(orderInProgressEmail(toEmailOrder(order)));
}
