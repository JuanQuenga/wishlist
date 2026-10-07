"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { seedGifts } from "@/lib/seed-gifts";
import { WishlistView } from "@/components/wishlist-view";
import type { GiftInput } from "@/lib/wishlist";
import { withFriendlyErrors } from "@/lib/mutation-errors";
import {
  parseReservations,
  reservationSnapshot,
  saveReservations,
  subscribeToReservations,
} from "@/lib/reservation-store";

function ConnectedWishlist() {
  const gifts = useQuery(api.gifts.list);
  const { isAuthenticated } = useConvexAuth();
  const isOwner = useQuery(api.gifts.isOwner, isAuthenticated ? {} : "skip");
  const reserve = useMutation(api.gifts.reserve);
  const release = useMutation(api.gifts.release);
  const add = useMutation(api.gifts.add);
  const edit = useMutation(api.gifts.edit);
  const remove = useMutation(api.gifts.remove);
  const raw = useSyncExternalStore(
    subscribeToReservations,
    reservationSnapshot,
    () => "{}",
  );
  const reservations = useMemo(() => parseReservations(raw), [raw]);
  const mine = useQuery(api.gifts.myReservations, {
    tokens: Object.entries(reservations)
      .filter(([giftId]) => gifts?.some((gift) => gift.id === giftId))
      .map(([, token]) => token),
  });

  async function onReserve(giftId: string) {
    const current = parseReservations(reservationSnapshot());
    const token = current[giftId] ?? crypto.randomUUID();
    saveReservations({ ...current, [giftId]: token });
    await withFriendlyErrors(() => reserve({ giftId, token }));
  }

  async function onRelease(giftId: string) {
    const current = parseReservations(reservationSnapshot());
    const token = current[giftId];
    if (!token) throw new Error("Use the browser where you reserved this gift to release it.");
    await withFriendlyErrors(() => release({ giftId, token }));
    delete current[giftId];
    saveReservations(current);
  }

  return (
    <WishlistView
      gifts={gifts ?? []}
      loading={gifts === undefined}
      sharingReady
      isOwner={isOwner === true}
      ownedReservationIds={mine ?? []}
      onReserve={onReserve}
      onRelease={onRelease}
      onAdd={async (gift: GiftInput) => { await withFriendlyErrors(() => add({ gift })); }}
      onEdit={async (giftId: string, gift: GiftInput) => { await withFriendlyErrors(() => edit({ giftId, gift })); }}
      onDelete={async (giftId: string) => { await withFriendlyErrors(() => remove({ giftId })); }}
      accountHref={isAuthenticated ? "/sign-out" : "/sign-in"}
      signedIn={isAuthenticated}
    />
  );
}

async function unavailable() {
  throw new Error("Reservations aren't available yet. You can still view each gift at the store.");
}

export function WishlistClient() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) return <ConnectedWishlist />;
  return (
    <WishlistView
      gifts={seedGifts}
      loading={false}
      sharingReady={false}
      isOwner={false}
      ownedReservationIds={[]}
      onReserve={unavailable}
      onRelease={unavailable}
      onAdd={unavailable}
      onEdit={unavailable}
      onDelete={unavailable}
      accountHref="/sign-in"
      signedIn={false}
    />
  );
}
