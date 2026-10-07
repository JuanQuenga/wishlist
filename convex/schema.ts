import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const giftFields = {
  title: v.string(),
  brand: v.string(),
  description: v.string(),
  url: v.string(),
  imageUrl: v.string(),
  price: v.string(),
  priceNote: v.string(),
  category: v.string(),
  accent: v.union(v.literal("mint"), v.literal("lavender"), v.literal("rose")),
};

export default defineSchema({
  gifts: defineTable({
    ...giftFields,
    order: v.number(),
    seedKey: v.optional(v.string()),
  })
    .index("by_order", ["order"])
    .index("by_seedKey", ["seedKey"]),
  reservations: defineTable({
    giftId: v.id("gifts"),
    token: v.string(),
    reservedAt: v.number(),
  })
    .index("by_giftId", ["giftId"])
    .index("by_token", ["token"]),
});
