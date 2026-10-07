import { ConvexError } from "convex/values";

const messages: Record<string, string> = {
  GIFT_ALREADY_RESERVED: "Someone has already reserved this gift. Please choose another one.",
  RESERVATION_TOKEN_MISMATCH: "This reservation belongs to another browser. You can only release your own reservations.",
  RESERVATION_TOKEN_INVALID: "This reservation couldn't be saved. Refresh the page and try again.",
  GIFT_NOT_FOUND: "This gift is no longer on the wishlist. Refresh to see the latest list.",
  OWNER_REQUIRED: "Sign in with the wishlist owner's account to edit gifts.",
  GIFT_FIELD_TOO_LONG: "One of the fields is too long. Shorten it and try again.",
  GIFT_TITLE_REQUIRED: "Add a name for this gift.",
  GIFT_URL_INVALID: "Use a complete store or image link starting with https:// or http://.",
  WISHLIST_LIMIT_REACHED: "The wishlist has reached its limit of 100 gifts. Remove a gift before adding another.",
};

export async function withFriendlyErrors<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ConvexError && typeof error.data === "string") {
      throw new Error(messages[error.data] ?? "This change couldn't be saved. Refresh the page and try again.");
    }
    throw new Error("This change couldn't be saved. Check your connection and try again.");
  }
}
