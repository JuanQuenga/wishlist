import Link from "next/link";

export default function OwnerSetupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-5 px-6">
      <h1 className="text-3xl font-semibold">Owner sign-in is being set up.</h1>
      <p>The wishlist is still open for family to browse. Try signing in again once setup is complete.</p>
      <Link className="rounded-xl bg-[#0F5A3F] px-6 py-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4" href="/">Back to the wishlist</Link>
    </main>
  );
}
