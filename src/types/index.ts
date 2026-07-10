/** Modullar arası paylaşılan ortaq tiplər. */

export type PaymentType = "nagd" | "kart" | "nisye";

export type Role = "sahib" | "menecer" | "satici";

export interface ActivityLog {
  id: string;
  at: string;
  userId: string;
  action: string;
}
