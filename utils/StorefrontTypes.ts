import { Product } from "@/utils/Types";

export interface StorefrontProduct extends Product {
  badge?: string | null;
  isNew?: boolean;
  rating?: number | string;
  reviewCount?: number | string;
}
