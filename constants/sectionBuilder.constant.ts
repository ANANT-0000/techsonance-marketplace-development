export const SECTION_HIGHLIGHT_OPTIONS = [
  { value: "trending", label: "Trending Now" },
  { value: "new_arrivals", label: "New Arrivals" },
  { value: "bestseller", label: "Bestsellers" },
  { value: "featured", label: "Featured Selection" },
];

export const SECTION_TIMEFRAME_OPTIONS = [
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_14_days", label: "Last 14 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_90_days", label: "Last 90 Days" },
];

export const SECTION_PRICE_COLLATION_OPTIONS = [
  { value: "under_500", label: "Under ₹500" },
  { value: "under_1000", label: "Under ₹1000" },
  { value: "1000_to_5000", label: "₹1000 - ₹5000" },
  { value: "premium", label: "Premium Collection (₹5000+)" },
];

export const SECTION_DISCOUNT_OPTIONS = [
  { value: "10", label: "10% Off or more" },
  { value: "20", label: "20% Off or more" },
  { value: "30", label: "30% Off or more" },
  { value: "50", label: "50% Off or more" },
];

export const SECTION_ROUTE_OPTIONS = [
  { value: "store/c", label: "Category / Products Page" },
  { value: "store/offers", label: "Special Offers Page" },
  { value: "store/collections", label: "Curated Collections Page" },
];

// Reusable fields for the configuration forms
export const SECTION_UI_FIELDS = [
  { label: "What should this section be called?", name: "title", type: "text", placeholder: "e.g. Trending Now" },
  { label: "Add a short description (Optional)", name: "description", type: "textarea", placeholder: "e.g. Check out our most popular items" },
];

export const SECTION_COLOR_FIELDS = [
  { label: "Background Color", name: "backgroundColor" },
  { label: "Text Color", name: "textColor" },
  { label: "Button & Highlight Color", name: "primaryColor" },
];

export const SECTION_CTA_FIELDS = [
  { label: "What should the button say?", name: "text", type: "text", placeholder: "e.g. View All" },
];
