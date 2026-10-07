"use client";

import { SignOutButton } from "@clerk/nextjs";

export function SignOutAction() {
  return (
    <SignOutButton redirectUrl="/">
      <button type="button" className="button button-primary">Sign out</button>
    </SignOutButton>
  );
}
