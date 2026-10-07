const key = "wishlist.reservations.v1";
const changed = "wishlist-reservations-changed";

export function reservationSnapshot() {
  try {
    return localStorage.getItem(key) ?? "{}";
  } catch {
    return "{}";
  }
}

export function parseReservations(raw: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([id, token]) =>
          id.length > 0 &&
          typeof token === "string" &&
          /^[a-f0-9-]{36}$/i.test(token),
      ),
    );
  } catch {
    return {};
  }
}

export function saveReservations(reservations: Record<string, string>) {
  try {
    localStorage.setItem(key, JSON.stringify(reservations));
  } catch {
    throw new Error(
      "Your browser couldn't save this reservation. Allow website storage, then try again.",
    );
  }
  window.dispatchEvent(new Event(changed));
}

export function subscribeToReservations(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changed, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changed, listener);
  };
}
