import { Prisma } from "@prisma/client";
import { sendReferralRewardEmail } from "@/lib/admin-emails";
import { prisma } from "@/lib/db";
import { generatePackageCode } from "@/lib/orders";
import { REFERRAL_REWARD_PHOTOS } from "@/lib/pricing";

/**
 * Program poleceń w panelu: zamówienia opłacone z `referralCode` (e-mail polecającego),
 * pogrupowane po kodzie. Nagroda = kod pakietu na REFERRAL_REWARD_PHOTOS zdjęć.
 */

export interface ReferralOrderInfo {
  id: string;
  email: string;
  paidAt: Date | null;
  totalAmount: number;
  rewardIssuedAt: Date | null;
  selfReferral: boolean;
}

export interface ReferralGroup {
  code: string;
  orders: ReferralOrderInfo[];
  /** Opłacone zamówienia poleconych (bez samopoleceń). */
  paidCount: number;
  /** Ile z nich nie zostało jeszcze nagrodzonych. */
  pendingCount: number;
  lastRewardAt: Date | null;
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toLowerCase();
}

export function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function paidReferralOrders() {
  return prisma.order.findMany({
    where: { referralCode: { not: null }, paymentStatus: "PAID" },
    orderBy: { paidAt: "desc" },
    select: { id: true, email: true, paidAt: true, totalAmount: true, referralCode: true, referralRewardIssuedAt: true },
    take: 2000,
  });
}

export async function getReferralGroups(): Promise<ReferralGroup[]> {
  const orders = await paidReferralOrders();
  const groups = new Map<string, ReferralGroup>();
  for (const order of orders) {
    if (!order.referralCode?.trim()) continue;
    const code = normalizeReferralCode(order.referralCode);
    const group = groups.get(code) ?? { code, orders: [], paidCount: 0, pendingCount: 0, lastRewardAt: null };
    const selfReferral = order.email.trim().toLowerCase() === code;
    group.orders.push({
      id: order.id,
      email: order.email,
      paidAt: order.paidAt,
      totalAmount: order.totalAmount,
      rewardIssuedAt: order.referralRewardIssuedAt,
      selfReferral,
    });
    if (!selfReferral) {
      group.paidCount += 1;
      if (!order.referralRewardIssuedAt) group.pendingCount += 1;
    }
    if (order.referralRewardIssuedAt && (!group.lastRewardAt || order.referralRewardIssuedAt > group.lastRewardAt)) {
      group.lastRewardAt = order.referralRewardIssuedAt;
    }
    groups.set(code, group);
  }
  return [...groups.values()].sort((a, b) => b.pendingCount - a.pendingCount || b.paidCount - a.paidCount);
}

export class ReferralError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ReferralError";
    this.status = status;
  }
}

export interface IssuedReward {
  packageCode: string;
  orders: number;
  emailSent: boolean;
  emailError?: string;
}

/** Tworzy kod pakietu dla polecającego, oznacza zamówienia grupy jako nagrodzone i wysyła e-mail. */
export async function issueReferralReward(rawCode: string): Promise<IssuedReward> {
  const code = normalizeReferralCode(rawCode);
  if (!code) throw new ReferralError(400, "Brak kodu polecenia.");
  const pending = (await paidReferralOrders()).filter(
    (order) =>
      order.referralCode !== null &&
      normalizeReferralCode(order.referralCode) === code &&
      !order.referralRewardIssuedAt &&
      order.email.trim().toLowerCase() !== code,
  );
  if (pending.length === 0) throw new ReferralError(409, "Brak opłaconych poleceń bez nagrody dla tego kodu.");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const packageCode = await prisma.$transaction(async (tx) => {
        const marked = await tx.order.updateMany({
          where: { id: { in: pending.map((order) => order.id) }, referralRewardIssuedAt: null },
          data: { referralRewardIssuedAt: new Date() },
        });
        if (marked.count === 0) throw new ReferralError(409, "Nagroda za te polecenia została już wydana.");
        return tx.packageCode.create({
          data: {
            code: generatePackageCode(),
            creditsTotal: REFERRAL_REWARD_PHOTOS,
            creditsLeft: REFERRAL_REWARD_PHOTOS,
            email: code,
            note: `Nagroda za polecenie (${marked.count} zam.)`,
          },
        });
      });
      let emailSent = false;
      let emailError: string | undefined;
      if (isEmailLike(code)) {
        const sent = await sendReferralRewardEmail({
          to: code,
          code: packageCode.code,
          photos: REFERRAL_REWARD_PHOTOS,
          referredOrders: pending.length,
        });
        emailSent = sent.ok;
        emailError = sent.error;
      } else {
        emailError = "Kod polecenia nie jest adresem e-mail – przekaż kod polecającemu ręcznie.";
      }
      return { packageCode: packageCode.code, orders: pending.length, emailSent, emailError };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new ReferralError(500, "Nie udało się wygenerować unikalnego kodu. Spróbuj ponownie.");
}
