import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { ClerkProvider } from "@clerk/nextjs";
import { isAuthConfigured } from "@/lib/auth-config";
import "./globals.css";

const sans = Instrument_Sans({ subsets: ["latin"], axes: ["wdth"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "Juan's wishlist",
  description: "A few things I'd love for my birthday or Christmas. Pick a gift, reserve it, and find it at the store.",
  openGraph: {
    title: "Juan's wishlist",
    description: "Gift ideas for my birthday and Christmas. Thanks for thinking of me!",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const authConfigured = isAuthConfigured();
  const content = <Providers authConfigured={authConfigured}>{children}</Providers>;
  return (
    <html lang="en">
      <body className={sans.variable}>
        {authConfigured ? (
          <ClerkProvider signInUrl="/sign-in" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
            {content}
          </ClerkProvider>
        ) : content}
      </body>
    </html>
  );
}
