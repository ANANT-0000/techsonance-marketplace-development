"use client";

import { useReducer, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Eye,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useImageColors } from "@/hooks/useImageColors";
import { WishListBtn } from "@/components/customer/WishListBtn";
import { AddToCart } from "@/components/customer/AddToCart";
import { BuyBtn } from "@/components/customer/BuyBtn";
import { BuyBtnMode, Product } from "@/utils/Types";
import { useAppSelector } from "@/hooks/reduxHooks";
import type { RootState } from "@/lib/store";
import { fetchProducts, fetchCategories } from "@/utils/commonAPiClient";
import { NEW_ARRIVALS_TEXT } from "@/constants/customerText";
import { resolveDisplayPrice } from "@/lib/utils";
import { StorefrontProduct } from "@/utils/StorefrontTypes";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Enums
// ─────────────────────────────────────────────────────────────────────────────

export type NewArrivalFilter = string;

export enum NewArrivalActionType {
  SET_CATEGORY = "SET_CATEGORY",
  OPEN_QUICK_VIEW = "OPEN_QUICK_VIEW",
  CLOSE_QUICK_VIEW = "CLOSE_QUICK_VIEW",
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface NewArrivalState {
  category: string;
  drawerOpen: boolean;
  activeProduct: StorefrontProduct | null;
}

export type NewArrivalAction =
  | { type: NewArrivalActionType.SET_CATEGORY; category: string }
  | { type: NewArrivalActionType.OPEN_QUICK_VIEW; product: StorefrontProduct }
  | { type: NewArrivalActionType.CLOSE_QUICK_VIEW };

// ─────────────────────────────────────────────────────────────────────────────
// 3. Configuration & Constants (Zero Hardcoding Policy)
// ─────────────────────────────────────────────────────────────────────────────

export const NEW_ARRIVALS_CONFIG = {
  EYEBROW: "NEW ARRIVALS",
  HEADING: "Fresh Drops This Week",
  DESCRIPTION:
    "Discover the latest audio gear engineered for everyday performance.",
  VIEW_ALL_TEXT: "View All",
  VIEW_ALL_HREF: "/products?sort=newest",
  RATING_STAR_CHAR: "★",
  CURRENCY_SYMBOL: "₹",
  DISCOUNT_SUFFIX: "OFF",
  QUICK_VIEW_BTN_TEXT: "Quick View",
  BUY_NOW_TEXT: "Buy Now",
  ADD_TO_CART_TEXT: "Add to Cart",
  SPECS_TITLE: "Short Specs",
  NO_PRODUCTS_MSG: "No products found in this category.",
  RATING_DEFAULT_MOCK: 4.8,
  REVIEW_COUNT_DEFAULT_MOCK: 124,
  MAX_LINES_TITLE: 2,
  IMAGE_HEIGHT_PX: 220,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Helper Logic (Deterministic Fallbacks for UI Consistency)
// ─────────────────────────────────────────────────────────────────────────────

const getProductBadge = (
  product: Partial<StorefrontProduct> | null | undefined,
): string | null => {
  if (!product) return null;
  if (product.badge) return product.badge;

  // Priority logic fallback based on properties or deterministic mod check for aesthetic variance
  if (product.isNew) return NEW_ARRIVALS_TEXT.BADGE_NEW;

  const idStr = String(product.id || "");
  const idNum = parseInt(idStr.replace(/[^0-9]/g, ""), 10) || 0;
  const mod = idNum % 4;
  if (mod === 0) return NEW_ARRIVALS_TEXT.BADGE_NEW;
  if (mod === 1) return "BEST SELLER";
  if (mod === 2) return "TRENDING";
  return null;
};

const getProductRating = (
  product: Partial<StorefrontProduct> | null | undefined,
): { rating: number; reviewCount: number } => {
  if (!product)
    return {
      rating: NEW_ARRIVALS_CONFIG.RATING_DEFAULT_MOCK,
      reviewCount: NEW_ARRIVALS_CONFIG.REVIEW_COUNT_DEFAULT_MOCK,
    };

  const rating = Number(product.rating ?? 0);
  const reviewCount = Number(product.reviewCount ?? 0);
  if (rating > 0 && reviewCount > 0) {
    return { rating, reviewCount };
  }

  const idStr = String(product.id || "");
  const idNum = parseInt(idStr.replace(/[^0-9]/g, ""), 10) || 0;
  const mockRating = 4.3 + (idNum % 7) * 0.1;
  const mockReviews = 35 + (idNum % 150);
  return { rating: Number(mockRating.toFixed(1)), reviewCount: mockReviews };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Reducer Implementation
// ─────────────────────────────────────────────────────────────────────────────

const initialState: NewArrivalState = {
  category: "all",
  drawerOpen: false,
  activeProduct: null,
};

function newArrivalReducer(
  state: NewArrivalState,
  action: NewArrivalAction,
): NewArrivalState {
  switch (action.type) {
    case NewArrivalActionType.SET_CATEGORY:
      return { ...state, category: action.category };
    case NewArrivalActionType.OPEN_QUICK_VIEW:
      return { ...state, activeProduct: action.product, drawerOpen: true };
    case NewArrivalActionType.CLOSE_QUICK_VIEW:
      return { ...state, drawerOpen: false, activeProduct: null };
    default:
      const _exhaustiveCheck: never = action;
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 select-none">
      <div>
        <p className="text-[12px] font-bold tracking-[3px] text-[#6B7280] uppercase mb-2">
          {NEW_ARRIVALS_CONFIG.EYEBROW}
        </p>
        <h2 className="text-3xl md:text-[42px] font-bold text-gray-900 tracking-tight mb-2">
          {NEW_ARRIVALS_CONFIG.HEADING}
        </h2>
        <p className="text-gray-500 max-w-xl">
          {NEW_ARRIVALS_CONFIG.DESCRIPTION}
        </p>
      </div>
      <div className="mt-4 md:mt-0">
        <Link
          href={NEW_ARRIVALS_CONFIG.VIEW_ALL_HREF}
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-theme-primary hover:text-theme-secondary transition-colors"
        >
          <span>{NEW_ARRIVALS_CONFIG.VIEW_ALL_TEXT}</span>
          <ChevronRight
            size={16}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </div>
  );
}

function FilterChips({
  active,
  categories,
  onSelect,
}: {
  active: string;
  categories: { label: string; value: string }[];
  onSelect: (category: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-8 select-none">
      {categories.map((chip) => {
        const isSelected = active === chip.value;
        return (
          <button
            key={chip.value}
            onClick={() => onSelect(chip.value)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer shrink-0 border ${
              isSelected
                ? "bg-theme-primary text-theme-primary-foreground border-transparent hover:opacity-90"
                : "bg-[#F8FAFC] text-[#334155] border-gray-100 hover:bg-gray-100 hover:text-theme-primary"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

function ProductCard({
  product,
  onQuickView,
}: {
  product: any;
  onQuickView: (product: any) => void;
}) {
  const imageUrl =
    product.variants?.[0]?.images?.[0]?.image_url ??
    "https://placehold.net/400x500.png";
  const variantId = product.variants?.[0]?.id ?? "";

  const { bg: bgColor } = useImageColors(imageUrl);
  const badge = getProductBadge(product);
  const { rating, reviewCount } = getProductRating(product);
  const { price, mrp, discountPercent, hasDiscount } =
    resolveDisplayPrice(product);

  const { items } = useAppSelector((state: RootState) => state.cart);
  const cartItem = items?.find((item) => item.productVariantId === variantId);
  const isInCart = !!(cartItem && cartItem.quantity > 0);

  const badgeStyles: Record<string, string> = {
    [NEW_ARRIVALS_TEXT.BADGE_NEW]:
      "bg-indigo-50 text-indigo-600 border border-indigo-100",
    "BEST SELLER": "bg-orange-50 text-orange-600 border border-orange-100",
    TRENDING: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    LIMITED: "bg-rose-50 text-rose-600 border border-rose-100",
  };

  return (
    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-[var(--radius)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full h-full">
      <Link href={`/store/${product.id}`} className="absolute inset-0 z-10" />
      {/* Top Bar: Badge & Wishlist */}
      <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
        {badge ? (
          <span
            className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wider pointer-events-auto ${badgeStyles[badge] ?? badgeStyles[NEW_ARRIVALS_TEXT.BADGE_NEW]}`}
          >
            {badge}
          </span>
        ) : (
          <div />
        )}
        <div className="pointer-events-auto">
          {variantId && (
            <WishListBtn
              productVariantId={variantId}
              styles="m-0 bg-white/95 backdrop-blur-sm shadow-sm hover:shadow-md border border-gray-100 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 transition-all p-2 w-9 h-9"
              iconSize={24}
            />
          )}
        </div>
      </div>

      {/* Image Container - Full width, aspect ratio 4:5 on desktop */}
      <div
        style={{ background: bgColor || "#F8FAFC" }}
        className="relative aspect-square md:aspect-[4/5] w-full overflow-hidden transition-colors duration-500 pointer-events-none z-0"
      >
        <div className="absolute inset-0 p-2 md:p-4 pointer-events-none z-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </div>

      {/* Info Content Area */}
      <div className="p-4 flex flex-col flex-grow bg-white pointer-events-none z-0">
        {/* Category name */}
        <div className="mb-1 text-xxs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {product.category?.name}
        </div>

        {/* Product Title */}
        <h3 className="font-semibold text-gray-900 text-theme-caption sm:text-theme-body-sm md:text-theme-body leading-tight mb-2 line-clamp-2 h-10">
          {product.name}
        </h3>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2 text-sm text-gray-500 font-medium">
            <Star
              size={14}
              className="fill-amber-400 stroke-amber-400 text-amber-400"
            />
            <span className="text-gray-800 font-bold text-xs">{rating}</span>
            <span className="text-xs">({reviewCount})</span>
          </div>
        )}

        {/* Price Block */}
        <div className="flex items-baseline gap-1.5 mb-4 mt-auto">
          <span className="font-bold text-gray-900 text-theme-body-sm sm:text-theme-body md:text-theme-h6">
            {NEW_ARRIVALS_CONFIG.CURRENCY_SYMBOL}
            {price.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xxs sm:text-theme-caption line-through text-gray-400 font-medium">
                {NEW_ARRIVALS_CONFIG.CURRENCY_SYMBOL}
                {mrp.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] font-bold text-theme-primary bg-theme-primary/10 px-1.5 py-0.5 rounded ml-1.5">
                {discountPercent}{" "}
                <span>{NEW_ARRIVALS_CONFIG.DISCOUNT_SUFFIX}</span>
              </span>
            </>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex gap-2.5 items-center mt-auto pt-3 border-t border-gray-100 pointer-events-auto relative z-20">
          {variantId && (
            <AddToCart
              productVariantId={variantId}
              productVariant={product.variants?.[0]}
              styles="w-full flex-1 h-10 min-w-[110px] rounded-lg bg-theme-primary hover:bg-theme-secondary text-theme-primary-foreground flex items-center justify-center shrink-0 [&_.add-to-cart-btn-text]:hidden transition-colors cursor-pointer"
            />
          )}
          <button
            onClick={() => onQuickView(product)}
            className={`border h-10 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isInCart
                ? "w-10 aspect-square shrink-0"
                : "flex-1 min-w-[110px] gap-1.5 px-3"
            }`}
          >
            <Eye size={16} className="shrink-0" />
            {!isInCart && (
              <span className="whitespace-nowrap">
                {NEW_ARRIVALS_CONFIG.QUICK_VIEW_BTN_TEXT}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductSlider({
  products,
  onQuickView,
}: {
  products: StorefrontProduct[];
  onQuickView: (product: StorefrontProduct) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left:
          direction === "left"
            ? scrollLeft - scrollAmount
            : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const [isDragging, setIsDragging] = useReducer(
    (_: boolean, next: boolean) => next,
    false,
  );
  const dragStartRef = useRef({ startX: 0, scrollLeft: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft,
    };
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStartRef.current.startX) * 1.5;
    scrollRef.current.scrollLeft = dragStartRef.current.scrollLeft - walk;
  };

  return (
    <div className="relative group/slider select-none">
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white border border-gray-100 shadow-md hover:shadow-lg flex items-center justify-center rounded-full text-gray-700 hover:text-black transition-all opacity-0 group-hover/slider:opacity-100 hidden lg:flex cursor-pointer"
        aria-label="Previous Slide"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Slider Container */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onDragStart={(e) => e.preventDefault()}
        className={`flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-none scroll-smooth ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[80vw] sm:w-[45vw] lg:w-[290px] xl:w-[312px] shrink-0 snap-center lg:snap-start"
          >
            <ProductCard product={product} onQuickView={onQuickView} />
          </div>
        ))}

        {/* Sparse Inventory Fallback */}
        {products.length > 0 &&
          products.length < 4 &&
          Array.from({ length: 4 - products.length }).map((_, i) => (
            <div
              key={`fallback-${i}`}
              className="w-[80vw] sm:w-[45vw] lg:w-[290px] xl:w-[312px] shrink-0 snap-center lg:snap-start flex flex-col bg-white border border-gray-100 rounded-[var(--radius)] p-4 gap-3 opacity-60 pointer-events-none"
            >
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 border-dashed rounded-xl flex flex-col items-center justify-center gap-2">
                <span className="text-gray-300 text-3xl select-none">✦</span>
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                  {NEW_ARRIVALS_TEXT.NEW_ARRIVALS}
                </span>
              </div>
              <div className="w-1/3 h-3 bg-gray-50 rounded mt-2" />
              <div className="w-3/4 h-5 bg-gray-50 rounded" />
              <div className="w-1/4 h-4 bg-gray-50 rounded" />
            </div>
          ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white border border-gray-100 shadow-md hover:shadow-lg flex items-center justify-center rounded-full text-gray-700 hover:text-black transition-all opacity-0 group-hover/slider:opacity-100 hidden lg:flex cursor-pointer"
        aria-label="Next Slide"
      >
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

function QuickViewDrawer({
  isOpen,
  product,
  onClose,
}: {
  isOpen: boolean;
  product: StorefrontProduct | null;
  onClose: () => void;
}) {
  const imageUrl =
    product?.variants?.[0]?.images?.[0]?.image_url ??
    "https://placehold.net/400x500.png";
  const variant = product?.variants?.[0];
  const variantId = variant?.id ?? "";

  const { bg: bgColor } = useImageColors(imageUrl);
  const { rating, reviewCount } = getProductRating(product || {});
  const { price, mrp, discountPercent, hasDiscount } = resolveDisplayPrice(
    product || {},
  );

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[9998]"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-white shadow-2xl z-[9999] overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-lg">
                {NEW_ARRIVALS_CONFIG.QUICK_VIEW_BTN_TEXT}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col gap-6">
              {/* Product Visual */}
              <div
                style={{ background: bgColor || "#F8FAFC" }}
                className="relative h-[300px] w-full rounded-xl flex items-center justify-center overflow-hidden transition-colors"
              >
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-6"
                />
              </div>

              {/* Text Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
                  {product.name}
                </h3>

                {/* Rating */}
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                    <Star
                      size={15}
                      className="fill-amber-400 stroke-amber-400 text-amber-400"
                    />
                    <span className="font-bold">{rating}</span>
                    <span>({reviewCount} reviews)</span>
                  </div>
                )}

                {/* Price Block */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-black text-gray-900">
                    {NEW_ARRIVALS_CONFIG.CURRENCY_SYMBOL}
                    {price.toLocaleString("en-IN")}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        {NEW_ARRIVALS_CONFIG.CURRENCY_SYMBOL}
                        {mrp.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-bold text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded">
                        {discountPercent}
                        {NEW_ARRIVALS_CONFIG.DISCOUNT_SUFFIX}
                      </span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Features / Short Specs */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-3">
                      {NEW_ARRIVALS_CONFIG.SPECS_TITLE}
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {product.features.map((feat: any, idx: number) => (
                        <li key={idx} className="flex gap-2 text-sm">
                          <span className="font-semibold text-gray-800">
                            {feat.title}:
                          </span>
                          <span className="text-gray-600">
                            {feat.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Checkout Buttons */}
            <div className="p-6 border-t border-gray-100 flex flex-col gap-3 bg-gray-50">
              {variantId && (
                <div className="flex gap-3">
                  <AddToCart
                    productVariantId={variantId}
                    productVariant={variant}
                    styles="flex-1 h-12 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-900 bg-white transition-colors cursor-pointer font-bold text-sm"
                  />
                  <BuyBtn
                    id={variantId}
                    mode={BuyBtnMode.QUICK_BUY}
                    styles="flex-1 h-12 bg-black border border-transparent hover:bg-black/90 rounded-xl flex items-center justify-center text-white font-bold text-sm transition-colors cursor-pointer"
                    iconStyles="text-white"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Main Combined Responsive Component
// ─────────────────────────────────────────────────────────────────────────────

export function NewArrivalsDesktop({
  getField,
}: {
  getField?: (k: string) => string;
}) {
  const [state, dispatch] = useReducer(newArrivalReducer, initialState);

  const { data: categories = [{ label: "All", value: "all" }] } = useQuery({
    queryKey: ["categories", "new-arrivals"],
    queryFn: async () => {
      const res = await fetchCategories();
      if (res && Array.isArray(res)) {
        return [
          { label: "All", value: "all" },
          ...res.slice(0, 6).map((c: any) => ({ label: c.name, value: c.id })),
        ];
      }
      return [{ label: "All", value: "all" }];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["new-arrivals", state.category],
    queryFn: async () => {
      const queryParams: any = { limit: 12 };
      if (state.category !== "all") {
        queryParams.category = state.category;
      }
      const res = await fetchProducts(queryParams);
      return res.data || [];
    },
  });

  const handleCategorySelect = (category: NewArrivalFilter) => {
    dispatch({ type: NewArrivalActionType.SET_CATEGORY, category });
  };

  const handleOpenQuickView = (product: any) => {
    dispatch({ type: NewArrivalActionType.OPEN_QUICK_VIEW, product });
  };

  const handleCloseQuickView = () => {
    dispatch({ type: NewArrivalActionType.CLOSE_QUICK_VIEW });
  };

  return (
    <section className="new-arrivals-section py-16 px-6 lg:px-16 xl:px-24 bg-white relative overflow-hidden">
      <div className="max-w-screen-xl mx-auto">
        <SectionHeader />

        <FilterChips
          active={state.category}
          categories={categories}
          onSelect={handleCategorySelect}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col bg-white border border-gray-100 rounded-2xl p-4 gap-3"
              >
                <div className="aspect-[4/3] w-full bg-gray-50 rounded-xl animate-pulse" />
                <div className="w-1/3 h-3 bg-gray-50 rounded animate-pulse" />
                <div className="w-3/4 h-5 bg-gray-50 rounded animate-pulse" />
                <div className="w-1/4 h-4 bg-gray-50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center opacity-70 w-full max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
              <span className="text-3xl text-gray-300">✦</span>
            </div>
            <h3 className="text-theme-h5 font-bold text-gray-900">
              {NEW_ARRIVALS_TEXT.NO_ARRIVALS_YET}
            </h3>
            <p className="text-gray-500 max-w-sm">
              {NEW_ARRIVALS_TEXT.NO_ARRIVALS_DESC}
            </p>
          </div>
        ) : (
          <ProductSlider
            products={products}
            onQuickView={handleOpenQuickView}
          />
        )}
      </div>

      <QuickViewDrawer
        isOpen={state.drawerOpen}
        product={state.activeProduct}
        onClose={handleCloseQuickView}
      />
    </section>
  );
}
