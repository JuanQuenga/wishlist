import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutAction } from "@/components/account-actions";
import { isAuthConfigured } from "@/lib/auth-config";

export default async function SignOutPage() {
  if (!isAuthConfigured()) redirect("/");
  const { userId } = await auth();
  if (!userId) redirect("/");
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-5 px-6">
      <h1 className="text-3xl font-semibold">Sign out of your account?</h1>
      <p>You can still browse and reserve gifts after signing out.</p>
      <div className="flex flex-wrap gap-3">
        <SignOutAction />
        <Link className="button button-secondary" href="/">Back to the wishlist</Link>
      </div>
    </main>
  );
}
