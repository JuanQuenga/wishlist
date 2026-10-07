import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/auth-config";

export default function SignInPage() {
  if (!isAuthConfigured()) redirect("/owner-setup");
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-5 py-12">
      <Link className="account-link" href="/">Back to the wishlist</Link>
      <SignIn path="/sign-in" routing="path" forceRedirectUrl="/" signUpForceRedirectUrl="/" withSignUp />
    </main>
  );
}
