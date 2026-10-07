import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "../convex/_generated/api";
import schema from "../convex/schema";
import type { GiftInput } from "../src/lib/wishlist";

const modules = import.meta.glob("../convex/**/*.ts");
const validGift: GiftInput = {
  title: "Desk lamp",
  brand: "Example",
  description: "A useful light.",
  url: "https://example.com/lamp",
  imageUrl: "/products/lamp.jpg",
  price: "$20",
  priceNote: "",
  category: "Home",
  accent: "mint",
};

describe("wishlist Convex functions", () => {
  beforeEach(() => {
    process.env.WISHLIST_OWNER_EMAIL = "owner@example.com";
    process.env.WISHLIST_OWNER_SUBJECT = "owner-subject";
  });

  it("makes reservation retries idempotent and rejects a competing reservation", async () => {
    const t = convexTest(schema, modules);
    const giftId = await t.run((ctx) => ctx.db.insert("gifts", { ...validGift, order: 0 }));
    const token = "a".repeat(64);

    await t.mutation(api.gifts.reserve, { giftId, token });
    await t.mutation(api.gifts.reserve, { giftId, token });
    await expect(t.mutation(api.gifts.reserve, { giftId, token: "b".repeat(64) }))
      .rejects.toThrow("GIFT_ALREADY_RESERVED");
  });

  it("requires the matching capability token to release a reservation", async () => {
    const t = convexTest(schema, modules);
    const giftId = await t.run((ctx) => ctx.db.insert("gifts", { ...validGift, order: 0 }));
    const token = "c".repeat(64);

    await t.mutation(api.gifts.reserve, { giftId, token });
    await expect(t.mutation(api.gifts.release, { giftId, token: "d".repeat(64) }))
      .rejects.toThrow("RESERVATION_TOKEN_MISMATCH");
    await t.mutation(api.gifts.release, { giftId, token });

    const gifts = await t.query(api.gifts.list, {});
    expect(gifts[0]?.reserved).toBe(false);
  });

  it("reports only matching private reservation IDs and omits capability tokens from public gifts", async () => {
    const t = convexTest(schema, modules);
    const giftId = await t.run((ctx) => ctx.db.insert("gifts", { ...validGift, order: 0 }));
    const token = "e".repeat(64);

    await t.mutation(api.gifts.reserve, { giftId, token });

    expect(await t.query(api.gifts.myReservations, { tokens: [token, "f".repeat(64)] }))
      .toEqual([giftId]);
    const [gift] = await t.query(api.gifts.list, {});
    expect(gift).toMatchObject({ id: giftId, reserved: true });
    expect(gift).not.toHaveProperty("token");
  });

  it("fails closed for non-owners and permits the configured owner", async () => {
    const t = convexTest(schema, modules);
    const guest = t.withIdentity({ subject: "guest-subject", email: "guest@example.com" });
    expect(await guest.query(api.gifts.isOwner, {})).toBe(false);
    await expect(guest.mutation(api.gifts.add, { gift: validGift })).rejects.toThrow("OWNER_REQUIRED");

    const owner = t.withIdentity({ subject: "owner-subject", email: "owner@example.com", emailVerified: true });
    expect(await owner.query(api.gifts.isOwner, {})).toBe(true);
    await expect(owner.mutation(api.gifts.add, { gift: { ...validGift, imageUrl: "" } }))
      .resolves.toEqual(expect.any(String));
  });

  it("does not authorize an explicitly unverified email match", async () => {
    const t = convexTest(schema, modules);
    const unverified = t.withIdentity({
      subject: "not-owner-subject",
      email: "owner@example.com",
      emailVerified: false,
    });

    expect(await unverified.query(api.gifts.isOwner, {})).toBe(false);
    await expect(unverified.mutation(api.gifts.add, { gift: validGift })).rejects.toThrow("OWNER_REQUIRED");
  });

  it("requires an explicit verified-email claim when ownership is configured by email", async () => {
    process.env.WISHLIST_OWNER_SUBJECT = "";
    const t = convexTest(schema, modules);
    const missingVerification = t.withIdentity({
      subject: "not-owner-subject",
      email: "owner@example.com",
    });
    const verified = t.withIdentity({
      subject: "not-owner-subject",
      email: "owner@example.com",
      emailVerified: true,
    });

    expect(await missingVerification.query(api.gifts.isOwner, {})).toBe(false);
    expect(await verified.query(api.gifts.isOwner, {})).toBe(true);
  });

  it("fails closed when no owner identity is configured", async () => {
    delete process.env.WISHLIST_OWNER_EMAIL;
    delete process.env.WISHLIST_OWNER_SUBJECT;
    const t = convexTest(schema, modules);
    const signedIn = t.withIdentity({ subject: "owner-subject", email: "owner@example.com" });

    expect(await signedIn.query(api.gifts.isOwner, {})).toBe(false);
    await expect(signedIn.mutation(api.gifts.add, { gift: validGift })).rejects.toThrow("OWNER_REQUIRED");
  });

  it("seeds missing gifts once and preserves edits to seeded gifts", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.gifts.seed, {});
    const seeded = await t.query(api.gifts.list, {});
    expect(seeded).toHaveLength(3);
    expect(seeded.some((gift) => gift.title === "Microduck" && gift.reserved === false)).toBe(true);

    await t.run(async (ctx) => {
      const giftId = ctx.db.normalizeId("gifts", seeded[0]!.id);
      if (giftId === null) throw new Error("Seeded gift ID could not be normalized");
      await ctx.db.patch(giftId, { title: "My edited gift" });
    });
    await t.mutation(internal.gifts.seed, {});

    const afterSecondSeed = await t.query(api.gifts.list, {});
    expect(afterSecondSeed).toHaveLength(3);
    expect(afterSecondSeed[0]?.title).toBe("My edited gift");
  });

  it("restricts edit and removal to the owner and removes a gift reservation with the gift", async () => {
    const t = convexTest(schema, modules);
    const giftId = await t.run((ctx) => ctx.db.insert("gifts", { ...validGift, order: 0 }));
    const token = "g".repeat(64);
    await t.mutation(api.gifts.reserve, { giftId, token });

    const guest = t.withIdentity({ subject: "guest-subject", email: "guest@example.com" });
    await expect(guest.mutation(api.gifts.edit, { giftId, gift: validGift })).rejects.toThrow("OWNER_REQUIRED");
    await expect(guest.mutation(api.gifts.remove, { giftId })).rejects.toThrow("OWNER_REQUIRED");

    const owner = t.withIdentity({ subject: "owner-subject", email: "owner@example.com" });
    await owner.mutation(api.gifts.edit, { giftId, gift: { ...validGift, title: "Edited lamp" } });
    expect((await owner.query(api.gifts.list, {}))[0]?.title).toBe("Edited lamp");
    await owner.mutation(api.gifts.remove, { giftId });

    expect(await owner.query(api.gifts.list, {})).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("reservations").collect())).toEqual([]);
  });

  it("allows only one concurrent reservation claim for a gift", async () => {
    const t = convexTest(schema, modules);
    const giftId = await t.run((ctx) => ctx.db.insert("gifts", { ...validGift, order: 0 }));
    const claims = await Promise.allSettled([
      t.mutation(api.gifts.reserve, { giftId, token: "h".repeat(64) }),
      t.mutation(api.gifts.reserve, { giftId, token: "i".repeat(64) }),
    ]);

    expect(claims.filter((claim) => claim.status === "fulfilled")).toHaveLength(1);
    expect(claims.filter((claim) => claim.status === "rejected")).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("reservations").collect())).toHaveLength(1);
  });
});
