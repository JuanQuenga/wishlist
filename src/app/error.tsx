"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-5 px-6">
      <h1 className="text-3xl font-semibold">The wishlist couldn&apos;t load.</h1>
      <p>Check your connection, then try again.</p>
      <button className="rounded-xl bg-[#0F5A3F] px-6 py-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4" onClick={reset}>Try again</button>
    </main>
  );
}
