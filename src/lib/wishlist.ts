export type Gift = {
  id: string;
  title: string;
  brand: string;
  description: string;
  url: string;
  imageUrl: string;
  price: string;
  priceNote: string;
  category: string;
  accent: "mint" | "lavender" | "rose";
  reserved: boolean;
};

export type GiftInput = Omit<Gift, "id" | "reserved">;

export type WishlistViewProps = {
  gifts: Gift[];
  loading: boolean;
  sharingReady: boolean;
  isOwner: boolean;
  ownedReservationIds: string[];
  onReserve: (giftId: string) => Promise<void>;
  onRelease: (giftId: string) => Promise<void>;
  onAdd: (gift: GiftInput) => Promise<void>;
  onEdit: (giftId: string, gift: GiftInput) => Promise<void>;
  onDelete: (giftId: string) => Promise<void>;
  accountHref: string;
  signedIn: boolean;
};
