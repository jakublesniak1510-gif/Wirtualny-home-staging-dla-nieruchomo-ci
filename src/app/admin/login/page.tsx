import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Logowanie" };

export default async function AdminLoginPage() {
  if (await isAdminSession()) redirect("/admin");
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="text-2xl font-semibold text-ink">Logowanie do panelu</h1>
      <p className="mt-2 text-sm text-muted">Dostęp tylko dla operatora serwisu.</p>
      <LoginForm />
    </div>
  );
}
