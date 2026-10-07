import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { giftFields } from "./schema";
import { seedGifts } from "../src/lib/seed-gifts";

const MAX_GIFTS = 100;
const MAX_TOKEN_LENGTH = 256;

const giftInputValidator = v.object(giftFields);

function fail(code: string): never {
  throw new ConvexError(code);
}

function isValidWebUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.username.length === 0 &&
      parsed.password.length === 0;
  } catch {
    return false;
  }
}

function isValidImageUrl(value: string): boolean {
  return value === "" ||
    (value.startsWith("/") && !value.startsWith("//") && !value.includes("..")) ||
    isValidWebUrl(value);
}

function validateGift(input: {
  title: string;
  brand: string;
  description: string;
  url: string;
  imageUrl: string;
  price: string;
  priceNote: string;
  category: string;
  accent: "mint" | "lavender" | "rose";
}): void {
  const limits = [
    [input.title, 120],
    [input.brand, 100],
    [input.description, 1200],
    [input.url, 2048],
    [input.imageUrl, 2048],
    [input.price, 80],
    [input.priceNote, 300],
    [input.category, 80],
  ] as const;
  if (limits.some(([value, max]) => value.length > max)) fail("GIFT_FIELD_TOO_LONG");
  if (input.title.trim().length === 0) fail("GIFT_TITLE_REQUIRED");
  if (!isValidWebUrl(input.url) || !isValidImageUrl(input.imageUrl)) fail("GIFT_URL_INVALID");
}

async function isConfiguredOwner(ctx: Pick<QueryCtx, "auth">): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return false;

  const configuredEmail = process.env.WISHLIST_OWNER_EMAIL?.trim().toLowerCase();
  const configuredSubject = process.env.WISHLIST_OWNER_SUBJECT?.trim();
  if (!configuredEmail && !configuredSubject) return false;

  return (configuredEmail !== undefined && configuredEmail.length > 0 &&
      (identity.emailVerified === true ||
        ("email_verified" in identity && identity.email_verified === true)) &&
      identity.email?.trim().toLowerCase() === configuredEmail) ||
    (configuredSubject !== undefined && configuredSubject.length > 0 &&
      identity.subject === configuredSubject);
}

function getGiftId(ctx: Pick<QueryCtx, "db">, giftId: string): Id<"gifts"> {
  const normalized = ctx.db.normalizeId("gifts", giftId);
  if (normalized === null) fail("GIFT_NOT_FOUND");
  return normalized;
}

function toGift(gift: Doc<"gifts">, reserved: boolean) {
  return {
    id: gift._id,
    title: gift.title,
    brand: gift.brand,
    description: gift.description,
    url: gift.url,
    imageUrl: gift.imageUrl,
    price: gift.price,
    priceNote: gift.priceNote,
    category: gift.category,
    accent: gift.accent,
    reserved,
  };
}

export const list = query({
  args: {},
  returns: v.array(v.object({
    id: v.string(),
    title: v.string(),
    brand: v.string(),
    description: v.string(),
    url: v.string(),
    imageUrl: v.string(),
    price: v.string(),
    priceNote: v.string(),
    category: v.string(),
    accent: v.union(v.literal("mint"), v.literal("lavender"), v.literal("rose")),
    reserved: v.boolean(),
  })),
  handler: async (ctx) => {
    const gifts = await ctx.db.query("gifts").withIndex("by_order").order("asc").take(MAX_GIFTS);
    return await Promise.all(gifts.map(async (gift) => {
      const reservation = await ctx.db.query("reservations")
        .withIndex("by_giftId", (q) => q.eq("giftId", gift._id))
        .first();
      return toGift(gift, reservation !== null);
    }));
  },
});

export const isOwner = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => isConfiguredOwner(ctx),
});

export const myReservations = query({
  args: { tokens: v.array(v.string()) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    if (args.tokens.length > MAX_GIFTS) fail("TOO_MANY_RESERVATION_TOKENS");
    const ownedGiftIds: string[] = [];
    for (const token of args.tokens) {
      if (token.length < 32 || token.length > MAX_TOKEN_LENGTH) continue;
      const reservation = await ctx.db.query("reservations")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      if (reservation !== null) ownedGiftIds.push(reservation.giftId);
    }
    return ownedGiftIds;
  },
});

export const reserve = mutation({
  args: { giftId: v.string(), token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.token.length < 32 || args.token.length > MAX_TOKEN_LENGTH) fail("RESERVATION_TOKEN_INVALID");
    const giftId = getGiftId(ctx, args.giftId);
    const gift = await ctx.db.get(giftId);
    if (gift === null) fail("GIFT_NOT_FOUND");

    const existing = await ctx.db.query("reservations")
      .withIndex("by_giftId", (q) => q.eq("giftId", giftId))
      .first();
    if (existing !== null) {
      if (existing.token === args.token) return null;
      fail("GIFT_ALREADY_RESERVED");
    }

    await ctx.db.insert("reservations", { giftId, token: args.token, reservedAt: Date.now() });
    return null;
  },
});

export const release = mutation({
  args: { giftId: v.string(), token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.token.length < 32 || args.token.length > MAX_TOKEN_LENGTH) fail("RESERVATION_TOKEN_INVALID");
    const giftId = getGiftId(ctx, args.giftId);
    const reservation = await ctx.db.query("reservations")
      .withIndex("by_giftId", (q) => q.eq("giftId", giftId))
      .first();
    if (reservation === null) return null;
    if (reservation.token !== args.token) fail("RESERVATION_TOKEN_MISMATCH");
    await ctx.db.delete(reservation._id);
    return null;
  },
});

export const add = mutation({
  args: { gift: giftInputValidator },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (!(await isConfiguredOwner(ctx))) fail("OWNER_REQUIRED");
    validateGift(args.gift);
    const count = await ctx.db.query("gifts").withIndex("by_order").take(MAX_GIFTS + 1);
    if (count.length >= MAX_GIFTS) fail("WISHLIST_LIMIT_REACHED");
    const order = count.length === 0 ? 0 : Math.max(...count.map((gift) => gift.order)) + 1;
    const id = await ctx.db.insert("gifts", { ...args.gift, order });
    return id;
  },
});

export const edit = mutation({
  args: { giftId: v.string(), gift: giftInputValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isConfiguredOwner(ctx))) fail("OWNER_REQUIRED");
    validateGift(args.gift);
    const giftId = getGiftId(ctx, args.giftId);
    const existing = await ctx.db.get(giftId);
    if (existing === null) fail("GIFT_NOT_FOUND");
    await ctx.db.patch(giftId, args.gift);
    return null;
  },
});

export const remove = mutation({
  args: { giftId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isConfiguredOwner(ctx))) fail("OWNER_REQUIRED");
    const giftId = await getGiftId(ctx, args.giftId);
    const existing = await ctx.db.get(giftId);
    if (existing === null) fail("GIFT_NOT_FOUND");
    const reservation = await ctx.db.query("reservations")
      .withIndex("by_giftId", (q) => q.eq("giftId", giftId))
      .first();
    if (reservation !== null) await ctx.db.delete(reservation._id);
    await ctx.db.delete(giftId);
    return null;
  },
});

export const seed = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const [index, gift] of seedGifts.entries()) {
      const existing = await ctx.db.query("gifts")
        .withIndex("by_seedKey", (q) => q.eq("seedKey", gift.id))
        .first();
      if (existing !== null) continue;
      const count = await ctx.db.query("gifts").withIndex("by_order").take(MAX_GIFTS + 1);
      if (count.length >= MAX_GIFTS) continue;
      validateGift(gift);
      await ctx.db.insert("gifts", {
        title: gift.title,
        brand: gift.brand,
        description: gift.description,
        url: gift.url,
        imageUrl: gift.imageUrl,
        price: gift.price,
        priceNote: gift.priceNote,
        category: gift.category,
        accent: gift.accent,
        order: count.length === 0 ? index : Math.max(...count.map((row) => row.order)) + 1,
        seedKey: gift.id,
      });
    }
    return null;
  },
});
