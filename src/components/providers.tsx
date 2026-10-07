"use client";

import { useState, type ReactNode } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

function useAnonymousAuth() {
  return {
    isLoading: false,
    isAuthenticated: false,
    fetchAccessToken: async () => null,
  };
}

export function Providers({
  children,
  authConfigured,
}: {
  children: ReactNode;
  authConfigured: boolean;
}) {
  const [client] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new ConvexReactClient(url) : null;
  });
  if (!client) return children;
  if (!authConfigured) {
    return (
      <ConvexProviderWithAuth client={client} useAuth={useAnonymousAuth}>
        {children}
      </ConvexProviderWithAuth>
    );
  }
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
