"use client";
import { useEffect, useReducer } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useImageColors } from "@/hooks/useImageColors";
import { WishListBtn } from "@/components/customer/WishListBtn";
import { AddToCart } from "@/components/customer/AddToCart";
import { BuyBtn } from "@/components/customer/BuyBtn";
import { ProductReview } from "@/components/customer/ProductReview";
import { RelatedProducts } from "@/components/customer/RelatedProducts";
import { RecommendedProducts } from "@/components/customer/RecommendedProducts";
import { CategoryProducts } from "@/components/customer/CategoryProducts";
import { OnSaleProducts } from "@/components/customer/OnSaleProducts";
import { ProductSpecifications } from "@/components/customer/ProductSpec";
import {
  BuyBtnMode,
  Coupon,
  Product,
  ProductImage,
  ProductPolicyInfo,
  ReturnReplaceMode,
  Variant,
} from "@/utils/Types";
import { formatCurrency } from "@/lib/utils";
import { fetchProduct } from "@/utils/commonAPiClient";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
  Tag,
  X,
  Share2,
  Heart,
  Shield,
  Truck,
  RotateCcw,
  Banknote,
  FileSpreadsheet,
  Package,
  AlertCircle,
  Clock,
  Loader2,
  MessageSquareQuote,
  ChevronDown,
} from "lucide-react";
import { AvailableCouponsModal } from "@/components/customer/AvailableCouponsModal";
import { useMediaQuery } from "react-responsive";
import AxiosAPI from "@/lib/axios";
import { authToken } from "@/utils/authToken";
import toast, { Toaster } from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "@/hooks/reduxHooks";
import { openLoginModal } from "@/lib/features/auth/authSlice";
import { RootState } from "@/lib/store";
import { AxiosError, AxiosResponse } from "axios";
import { PageLoader } from "@/components/customer/PageLoader";
import { ProductClientConfig } from "@/constants";
import {
  PRODUCT_ERROR_TEXT,
  PRODUCT_POLICY_TEXT,
  PRODUCT_CLIENT_TEXT,
  BUY_BTN_TEXT,
} from "@/constants/customerText";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// ─── Trust Badges (dynamic, policy-driven) ───────────────────────────────────
function buildTrustBadges(policy: ProductPolicyInfo | null | undefined) {
  const base = [
    { icon: Truck, label: PRODUCT_POLICY_TEXT.FREE_DELIVERY },
    { icon: Banknote, label: PRODUCT_POLICY_TEXT.CASH_ON_DELIVERY },
    { icon: FileSpreadsheet, label: PRODUCT_POLICY_TEXT.GST_BILLING },
  ];

  if (policy?.is_returnable) {
    base.splice(1, 0, {
      icon: RotateCcw,
      label: policy.return_window_days
        ? `${policy.return_window_days}${PRODUCT_POLICY_TEXT.DAY_RETURNS}`
        : PRODUCT_POLICY_TEXT.RETURNS_ACCEPTED,
    });
  }

  if (policy?.has_warranty) {
    base.splice(policy?.is_returnable ? 2 : 1, 0, {
      icon: Shield,
      label:
        policy.warranty_duration_label ?? PRODUCT_POLICY_TEXT.WARRANTY_INCLUDED,
    });
  }

  return base;
}

// ─── Policy Info Card ─────────────────────────────────────────────────────────
function PolicyInfoCard({ policy }: { policy: ProductPolicyInfo | null }) {
  if (!policy) {
    return (
      <Card className="rounded-2xl border-dashed border-gray-200 bg-gray-50/50 shadow-none">
        <CardContent className="p-4 flex items-start gap-3 pb-4">
          <div className="mt-0.5 p-1.5 bg-gray-100 rounded-full shrink-0">
            <Shield size={14} className="text-gray-400" />
          </div>
          <div>
            <p className="text-theme-body-sm font-semibold text-gray-700">
              {PRODUCT_POLICY_TEXT.STANDARD_POLICY_TITLE}
            </p>
            <p className="text-theme-caption text-gray-500 mt-0.5">
              {PRODUCT_POLICY_TEXT.STANDARD_POLICY_DESC}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasReturnOrReplace =
    policy.return_replace_mode !== ReturnReplaceMode.NONE;

  return (
    <Card className="rounded-2xl border-gray-100 bg-gray-50 shadow-none">
      <CardContent className="p-4 pb-4">
        <p className="text-theme-caption font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          {PRODUCT_POLICY_TEXT.RETURN_AND_WARRANTY}
        </p>
        <div className="flex flex-wrap gap-2">
          {policy.is_returnable && (
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 bg-emerald-50 border-emerald-100 text-emerald-700 rounded-full text-theme-caption font-semibold"
            >
              <RotateCcw size={12} />
              {policy.return_window_days
                ? `${policy.return_window_days}${PRODUCT_POLICY_TEXT.DAY_RETURNS}`
                : PRODUCT_POLICY_TEXT.RETURNS_ACCEPTED}
            </Badge>
          )}
          {policy.is_replaceable && (
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 bg-blue-50 border-blue-100 text-blue-700 rounded-full text-theme-caption font-semibold"
            >
              <Package size={12} />
              {policy.replacement_window_days
                ? `${policy.replacement_window_days}${PRODUCT_POLICY_TEXT.DAY_REPLACEMENT}`
                : PRODUCT_POLICY_TEXT.REPLACEMENT_ACCEPTED}
            </Badge>
          )}
          {policy.has_warranty && (
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 bg-purple-50 border-purple-100 text-purple-700 rounded-full text-theme-caption font-semibold"
            >
              <Shield size={12} />
              {policy.warranty_duration_label ??
                PRODUCT_POLICY_TEXT.WARRANTY_INCLUDED}
            </Badge>
          )}
          {!hasReturnOrReplace && (
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 bg-red-50 border-red-100 text-red-600 rounded-full text-theme-caption font-semibold"
            >
              <AlertCircle size={12} />
              {PRODUCT_POLICY_TEXT.NO_RETURNS_FINAL_SALE}
            </Badge>
          )}
        </div>
        {policy.return_conditions && hasReturnOrReplace && (
          <p className="mt-2.5 text-theme-caption text-gray-500 leading-relaxed">
            {policy.return_conditions}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton Components ──────────────────────────────────────────────────────
import { ProductPageSkeleton } from "@/components/customer/ProductPageSkeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import React from "react";
// ─── Star Row ─────────────────────────────────────────────────────────────────
const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <span className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={size}
        fill={i < rating ? "#F59E0B" : "none"}
        className={i < rating ? "text-amber-400" : "text-gray-300"}
      />
    ))}
  </span>
);

type Tab = "description" | "specs";

// ─── Reducer ──────────────────────────────────────────────────────────────────
interface State {
  isLoading: boolean;
  product: Product | undefined;
  activeVariant: Variant | undefined;
  productImages: ProductImage[];
  activeImage: string | undefined;
  activeIndex: number;
  isCouponModalOpen: boolean;
  selectedCoupon: Coupon | null;
  activeTab: Tab;
  quantity: number;
  isPageLoading: boolean;
  isError: boolean;
}

enum ActionType {
  SET_LOADING = "SET_LOADING",
  SET_PRODUCT_DATA = "SET_PRODUCT_DATA",
  SET_ACTIVE_VARIANT = "SET_ACTIVE_VARIANT",
  SET_ACTIVE_IMAGE = "SET_ACTIVE_IMAGE",
  SET_ACTIVE_INDEX = "SET_ACTIVE_INDEX",
  SET_COUPON_MODAL_OPEN = "SET_COUPON_MODAL_OPEN",
  SET_SELECTED_COUPON = "SET_SELECTED_COUPON",
  SET_ACTIVE_TAB = "SET_ACTIVE_TAB",
  SET_QUANTITY = "SET_QUANTITY",
  SET_PAGE_LOADING = "SET_PAGE_LOADING",
  SET_ERROR = "SET_ERROR",
}

type Action =
  | { type: ActionType.SET_LOADING; payload: boolean }
  | {
      type: ActionType.SET_PRODUCT_DATA;
      payload: {
        product: Product;
        variant?: Variant;
        images: ProductImage[];
        activeImage?: string;
      };
    }
  | {
      type: ActionType.SET_ACTIVE_VARIANT;
      payload: {
        variant: Variant;
        images: ProductImage[];
        activeImage?: string;
      };
    }
  | { type: ActionType.SET_ACTIVE_IMAGE; payload: string | undefined }
  | { type: ActionType.SET_ACTIVE_INDEX; payload: number }
  | { type: ActionType.SET_COUPON_MODAL_OPEN; payload: boolean }
  | { type: ActionType.SET_SELECTED_COUPON; payload: Coupon | null }
  | { type: ActionType.SET_ACTIVE_TAB; payload: Tab }
  | { type: ActionType.SET_QUANTITY; payload: number }
  | { type: ActionType.SET_PAGE_LOADING; payload: boolean }
  | { type: ActionType.SET_ERROR; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.SET_PAGE_LOADING:
      return { ...state, isPageLoading: action.payload };
    case ActionType.SET_ERROR:
      return { ...state, isError: action.payload };
    case ActionType.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionType.SET_PRODUCT_DATA:
      return {
        ...state,
        product: action.payload.product,
        activeVariant: action.payload.variant,
        productImages: action.payload.images,
        activeImage: action.payload.activeImage,
      };
    case ActionType.SET_ACTIVE_VARIANT:
      return {
        ...state,
        activeVariant: action.payload.variant,
        productImages: action.payload.images,
        activeImage: action.payload.activeImage,
        selectedCoupon: null,
      };
    case ActionType.SET_ACTIVE_IMAGE:
      return { ...state, activeImage: action.payload };
    case ActionType.SET_ACTIVE_INDEX:
      return { ...state, activeIndex: action.payload };
    case ActionType.SET_COUPON_MODAL_OPEN:
      return { ...state, isCouponModalOpen: action.payload };
    case ActionType.SET_SELECTED_COUPON:
      return { ...state, selectedCoupon: action.payload };
    case ActionType.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    case ActionType.SET_QUANTITY:
      return { ...state, quantity: action.payload };
    default: {
      const _exhaustiveCheck: never = action;
      return state;
    }
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductClient({ id }: { id: string }) {
  const [imgAspect, setImgAspect] = React.useState<number>(1);
  const router = useRouter();
  const token = authToken();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isMobile = useMediaQuery({ maxWidth: "1024px" });
  const reduxDispatch = useAppDispatch();

  const [state, dispatch] = useReducer(reducer, {
    isPageLoading: true,
    isError: false,
    isLoading: false,
    product: undefined,
    activeVariant: undefined,
    productImages: [],
    activeImage: undefined,
    activeIndex: 0,
    isCouponModalOpen: false,
    selectedCoupon: null,
    activeTab: "description",
    quantity: 1,
  });

  const { bg: bgColor } = useImageColors(state.activeImage);
  const { items } = useAppSelector((rootState: RootState) => rootState.cart);
  const cartItem = items?.find((item) => item.productVariantId === id);

  useEffect(() => {
    if (cartItem) {
      dispatch({ type: ActionType.SET_QUANTITY, payload: cartItem.quantity });
    }
  }, [cartItem]);

  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      const response = await fetchProduct(id);
      return response.data as Product;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (productData) {
      let variantData = undefined;
      let imagesData: ProductImage[] = [];
      let activeImgData = undefined;

      if (productData?.variants?.length > 0) {
        variantData = productData.variants[0];
        imagesData = productData.variants[0].images;
        activeImgData = productData.variants[0].images[0]?.image_url;
      }

      dispatch({
        type: ActionType.SET_PRODUCT_DATA,
        payload: {
          product: productData,
          variant: variantData,
          images: imagesData,
          activeImage: activeImgData,
        },
      });
      dispatch({ type: ActionType.SET_PAGE_LOADING, payload: false });
    }
  }, [productData]);

  useEffect(() => {
    if (isProductError) {
      toast.error(ProductClientConfig.PRODUCT_LOAD_ERROR);
      dispatch({ type: ActionType.SET_ERROR, payload: true });
      dispatch({ type: ActionType.SET_PAGE_LOADING, payload: false });
    }
  }, [isProductError]);

  useEffect(() => {
    const idx = state.productImages.findIndex(
      (img) => img.image_url === state.activeImage,
    );
    if (idx !== -1)
      dispatch({ type: ActionType.SET_ACTIVE_INDEX, payload: idx });
  }, [state.activeImage, state.productImages]);

  const handleVariantChange = (variant: Variant) => {
    dispatch({
      type: ActionType.SET_ACTIVE_VARIANT,
      payload: {
        variant,
        images: variant.images,
        activeImage: variant.images[0]?.image_url,
      },
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const basePrice = Number(state.activeVariant?.price) || 0;
  const originalMRP =
    state.product?.compare_at_price &&
    Number(state.product.compare_at_price) > basePrice
      ? Number(state.product.compare_at_price)
      : basePrice;
  const discountPct =
    originalMRP > basePrice
      ? Math.round(((originalMRP - basePrice) / originalMRP) * 100)
      : 0;

  let couponDiscount = 0;
  if (state.selectedCoupon) {
    if (state.selectedCoupon.discount_type === "percentage") {
      couponDiscount = Math.floor(
        basePrice * (Number(state.selectedCoupon.discount_value) / 100),
      );
      if (
        state.selectedCoupon.max_discount_amount &&
        couponDiscount > Number(state.selectedCoupon.max_discount_amount)
      ) {
        couponDiscount = Number(state.selectedCoupon.max_discount_amount);
      }
    } else {
      couponDiscount = Number(state.selectedCoupon.discount_value);
    }
  }
  const finalPrice = Math.max(0, basePrice - couponDiscount);
  const totalSavings = originalMRP - finalPrice;
  const hasDiscount = originalMRP > basePrice || couponDiscount > 0;

  const reviewsList = state.activeVariant?.reviews || [];
  const totalReviews = reviewsList.length;
  const avgRating =
    totalReviews > 0
      ? Math.round(reviewsList.reduce((s, r) => s + r.rating, 0) / totalReviews)
      : 0;

  const validateCouponMutation = useMutation({
    mutationFn: async (coupon: Coupon) => {
      const res = await AxiosAPI.post(
        ProductClientConfig.COUPON_VALIDATE_API,
        {
          userId: user?.id,
          code: coupon.code,
          cartTotal: basePrice,
          productIdsInCart: [state.product?.id],
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return { res, coupon };
    },
    onSuccess: ({ res, coupon }) => {
      if (res.data.success !== true || res.status !== 201) {
        toast.error(
          res.data.message || ProductClientConfig.COUPON_VALIDATE_ERROR,
        );
        setTimeout(
          () =>
            dispatch({
              type: ActionType.SET_COUPON_MODAL_OPEN,
              payload: false,
            }),
          1500,
        );
      } else {
        toast.success(ProductClientConfig.COUPON_SUCCESS);
        dispatch({ type: ActionType.SET_SELECTED_COUPON, payload: coupon });
        dispatch({ type: ActionType.SET_COUPON_MODAL_OPEN, payload: false });
      }
    },
    onError: () => {
      toast.error(ProductClientConfig.COUPON_VALIDATE_ERROR);
    },
  });

  const handleCouponSelect = (coupon: Coupon) => {
    if (!user?.id) {
      toast.error(PRODUCT_ERROR_TEXT.LOGIN_TO_APPLY_COUPON);
      reduxDispatch(openLoginModal(null));
      return;
    }
    validateCouponMutation.mutate(coupon);
  };

  const handleCouponModalOpen = () => {
    // Both guests and logged-in users can open the modal; guests see it in read-only mode
    dispatch({ type: ActionType.SET_COUPON_MODAL_OPEN, payload: true });
  };

  const inStock = (state.activeVariant?.inventory?.stock_quantity ?? 0) > 0;

  if (state.isPageLoading || isProductLoading) return <ProductPageSkeleton />;

  if (state.isError || isProductError || !state.product) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {PRODUCT_ERROR_TEXT.NOT_FOUND_TITLE}
        </h2>
        <p className="text-gray-500 mt-2 text-center max-w-md px-4">
          {PRODUCT_ERROR_TEXT.NOT_FOUND_DESC}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          {PRODUCT_ERROR_TEXT.RETURN_HOME}
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Toaster position="top-center" />

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <div className="hidden lg:block max-w-7xl mx-auto px-8 pt-6 pb-2">
        <Breadcrumb>
          <BreadcrumbList className="text-theme-caption font-medium text-gray-400">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/"
                  className="hover:text-gray-700 transition-colors"
                >
                  {PRODUCT_CLIENT_TEXT.HOME}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/store?category=${(
                    state.product?.categories?.find((c) => c.is_primary)
                      ?.name ||
                    state.product?.categories?.[0]?.name ||
                    "all"
                  )
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  className="hover:text-gray-700 transition-colors capitalize"
                >
                  {state.product?.categories?.find((c) => c.is_primary)?.name ||
                    state.product?.categories?.[0]?.name ||
                    ProductClientConfig.FALLBACK_CATEGORY_NAME}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gray-800 font-semibold">
                {state.product?.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* ── Gallery ──────────────────────────────────────────── */}
          <div className="flex gap-4">
            {/* Thumbnail strip — desktop only */}
            {!isMobile && state.productImages.length > 1 && (
              <div className="flex flex-col gap-3 lg:overflow-y-auto lg:h-0 lg:min-h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {state.productImages.map((img, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => {
                      dispatch({
                        type: ActionType.SET_ACTIVE_IMAGE,
                        payload: img.image_url,
                      });
                      dispatch({
                        type: ActionType.SET_ACTIVE_INDEX,
                        payload: idx,
                      });
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      state.activeImage === img.image_url
                        ? "border-gray-900 shadow-md"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative flex-1 rounded-3xl overflow-hidden transition-colors duration-500">
              {/* Top actions */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <WishListBtn
                  productVariantId={state.activeVariant?.id}
                  styles=""
                  iconSize={20}
                />
              </div>

              <AspectRatio ratio={imgAspect} className="w-full">
                <div className="block lg:hidden w-full h-full">
                  {/* Mobile carousel */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={state.activeIndex}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.22 }}
                      src={state.productImages[state.activeIndex]?.image_url}
                      alt={state.product?.name}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.naturalWidth && target.naturalHeight) {
                          setImgAspect(
                            target.naturalWidth / target.naturalHeight,
                          );
                        }
                      }}
                      className="w-full h-full object-cover"
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.15}
                      onDragEnd={(_, info) => {
                        if (
                          info.offset.x < -50 &&
                          state.activeIndex < state.productImages.length - 1
                        ) {
                          const n = state.activeIndex + 1;
                          dispatch({
                            type: ActionType.SET_ACTIVE_INDEX,
                            payload: n,
                          });
                          dispatch({
                            type: ActionType.SET_ACTIVE_IMAGE,
                            payload: state.productImages[n].image_url,
                          });
                        } else if (
                          info.offset.x > 50 &&
                          state.activeIndex > 0
                        ) {
                          const p = state.activeIndex - 1;
                          dispatch({
                            type: ActionType.SET_ACTIVE_INDEX,
                            payload: p,
                          });
                          dispatch({
                            type: ActionType.SET_ACTIVE_IMAGE,
                            payload: state.productImages[p].image_url,
                          });
                        }
                      }}
                    />
                  </AnimatePresence>

                  {/* Dot indicators */}
                  {state.productImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {state.productImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            dispatch({
                              type: ActionType.SET_ACTIVE_INDEX,
                              payload: idx,
                            });
                            dispatch({
                              type: ActionType.SET_ACTIVE_IMAGE,
                              payload: state.productImages[idx].image_url,
                            });
                          }}
                          className={`rounded-full transition-all duration-300 ${idx === state.activeIndex ? "w-5 h-2 bg-gray-900" : "w-2 h-2 bg-gray-300"}`}
                        />
                      ))}
                    </div>
                  )}

                  {state.activeIndex > 0 && (
                    <button
                      onClick={() => {
                        const p = state.activeIndex - 1;
                        dispatch({
                          type: ActionType.SET_ACTIVE_INDEX,
                          payload: p,
                        });
                        dispatch({
                          type: ActionType.SET_ACTIVE_IMAGE,
                          payload: state.productImages[p].image_url,
                        });
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm border border-gray-100"
                    >
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>
                  )}
                  {state.activeIndex < state.productImages.length - 1 && (
                    <button
                      onClick={() => {
                        const n = state.activeIndex + 1;
                        dispatch({
                          type: ActionType.SET_ACTIVE_INDEX,
                          payload: n,
                        });
                        dispatch({
                          type: ActionType.SET_ACTIVE_IMAGE,
                          payload: state.productImages[n].image_url,
                        });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm border border-gray-100"
                    >
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                  )}
                </div>

                <div className="hidden lg:block relative w-full h-full overflow-hidden transition-colors duration-500">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={state.activeImage}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      src={state.activeImage}
                      alt={state.product?.name}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.naturalWidth && target.naturalHeight) {
                          setImgAspect(
                            target.naturalWidth / target.naturalHeight,
                          );
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                </div>
              </AspectRatio>
            </div>
          </div>
          {/* ── Product Info ──────────────────────────────────────── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="flex flex-col gap-5 lg:pt-2"
          >
            {/* Category badge + Rating */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              className="flex items-center justify-between"
            >
              <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-theme-xxs font-semibold tracking-widest uppercase px-3 py-1 rounded-full">
                {state.product?.categories?.find((c) => c.is_primary)?.name ||
                  state.product?.categories?.[0]?.name ||
                  PRODUCT_CLIENT_TEXT.PRODUCT}
              </span>
              {totalReviews > 0 && (
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const el = document.getElementById(
                        "customer-reviews-section",
                      );
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 text-theme-body-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <StarRow rating={avgRating} />
                  <span className="font-semibold text-gray-800">
                    {(
                      reviewsList.reduce((s, r) => s + r.rating, 0) /
                      totalReviews
                    ).toFixed(1)}
                  </span>
                  <span className="text-gray-400">({totalReviews})</span>
                </button>
              )}
            </motion.div>

            {/* Product name */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <h1 className="text-theme-h5 lg:text-theme-h4 font-bold text-gray-900 leading-tight capitalize tracking-tight">
                {state.product?.name}
              </h1>
              {state.product?.description && (
                <p className="mt-2 text-theme-body-sm text-gray-500 leading-relaxed line-clamp-2">
                  {state.product.description.split("\n")[0]}
                </p>
              )}
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Pricing */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-theme-h3 lg:text-theme-h2 font-black text-gray-900 tracking-tight">
                  ₹{formatCurrency(finalPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-theme-h6 text-gray-400 line-through font-medium">
                      ₹{formatCurrency(originalMRP)}
                    </span>
                    <span className="text-theme-body-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      {discountPct > 0
                        ? `${discountPct}${PRODUCT_CLIENT_TEXT.OFF}`
                        : `${PRODUCT_CLIENT_TEXT.SAVE}${formatCurrency(totalSavings)}`}
                    </span>
                  </>
                )}
              </div>
              <p className="text-theme-caption text-gray-400 mt-1 font-medium uppercase tracking-wider">
                {PRODUCT_CLIENT_TEXT.INCLUSIVE_OF_ALL_TAXES}
              </p>

              {/* Stock indicator */}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className={`w-2 h-2 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-400"}`}
                />
                <span
                  className={`text-theme-body-sm font-semibold ${inStock ? "text-emerald-700" : "text-red-500"}`}
                >
                  {inStock
                    ? ProductClientConfig.IN_STOCK_MESSAGE
                    : ProductClientConfig.OUT_OF_STOCK_MESSAGE}
                </span>
              </div>
            </motion.div>

            {/* Variant selector */}
            {state.product?.variants && state.product.variants.length > 0 && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Attribute label */}
                {state.activeVariant?.attributes?.[0] && (
                  <p className="text-theme-caption font-semibold text-gray-500 uppercase tracking-widest mb-3">
                    {state.activeVariant.attributes[0].name}:{" "}
                    <span className="text-gray-900 normal-case tracking-normal font-bold capitalize">
                      {state.activeVariant.attributes[0].value}
                    </span>
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {state.product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantChange(variant)}
                      className={`group relative flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all duration-200 px-2 pt-2 pb-1.5 min-w-[72px]
                                                ${
                                                  state.activeVariant?.id ===
                                                  variant.id
                                                    ? "border-gray-900 shadow-md"
                                                    : "border-gray-200 hover:border-gray-400"
                                                }`}
                    >
                      {variant.images?.[0] && (
                        <img
                          src={variant.images[0].image_url}
                          alt={variant.variant_name}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                      <span className="text-theme-xxs font-semibold text-gray-700 mt-1">
                        ₹{formatCurrency(Number(variant.price) || 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Coupon strip */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {state.selectedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-1.5 rounded-full">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-theme-body-sm font-bold text-emerald-800 uppercase tracking-wide">
                        {state.selectedCoupon.code}{" "}
                        {PRODUCT_CLIENT_TEXT.APPLIED}
                      </p>
                      <p className="text-theme-caption text-emerald-600">
                        {PRODUCT_CLIENT_TEXT.EXTRA}
                        {formatCurrency(couponDiscount)}
                        {PRODUCT_CLIENT_TEXT.SAVINGS}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      dispatch({
                        type: ActionType.SET_SELECTED_COUPON,
                        payload: null,
                      })
                    }
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-emerald-500 hover:text-red-500"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCouponModalOpen}
                  className="w-full flex items-center justify-between border border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50 rounded-2xl px-4 py-3 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <Tag size={15} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-theme-body-sm font-bold text-blue-800">
                        {PRODUCT_CLIENT_TEXT.AVAILABLE_OFFERS}
                      </p>
                      <p className="text-theme-caption text-blue-500">
                        {PRODUCT_CLIENT_TEXT.TAP_TO_VIEW_COUPONS}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-blue-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              )}
            </motion.div>

            {/* CTA — desktop */}
            {!isMobile && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="flex gap-3 h-12"
              >
                {state.activeVariant ? (
                  <>
                    <AddToCart
                      productVariantId={state.activeVariant.id}
                      productVariant={state.activeVariant}
                      styles="flex-1 h-12 rounded-2xl border-2   border-theme-primary bg-white  text-theme-primary hover:bg-theme-primary hover:text-theme-primary-foreground font-bold text-theme-body-sm transition-all duration-200"
                    />
                    {inStock ? (
                      <BuyBtn
                        id={state.activeVariant.id}
                        mode={BuyBtnMode.QUICK_BUY}
                        styles="flex-1 h-12 rounded-2xl bg-gray-900 text-white hover:bg-black font-bold text-theme-body-sm transition-all duration-200"
                        selectedCoupon={state.selectedCoupon}
                      />
                    ) : (
                      <span className="flex-1 h-12 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-400 font-bold text-theme-body-sm">
                        {ProductClientConfig.OUT_OF_STOCK_MESSAGE}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      disabled
                      className="flex-1 h-12 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-400 font-bold text-theme-body-sm cursor-not-allowed"
                    >
                      {PRODUCT_CLIENT_TEXT.SELECT_A_VARIANT}
                    </button>
                    <button
                      disabled
                      className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-400 font-bold text-theme-body-sm cursor-not-allowed"
                    >
                      {BUY_BTN_TEXT.BUY_NOW}
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* Trust badges — desktop */}
            {!isMobile && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="grid gap-2 pt-2 border-t border-gray-100"
                style={{
                  gridTemplateColumns: `repeat(${buildTrustBadges(state.product?.policy).length}, minmax(0, 1fr))`,
                }}
              >
                {buildTrustBadges(state.product?.policy).map(
                  ({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 text-center"
                    >
                      <div className="p-2 bg-gray-50 rounded-xl">
                        <Icon size={16} className="text-gray-600" />
                      </div>
                      <span className="text-theme-tiny font-semibold text-gray-500 leading-tight">
                        {label}
                      </span>
                    </div>
                  ),
                )}
              </motion.div>
            )}

            {/* Policy info card — desktop */}
            {!isMobile && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <PolicyInfoCard policy={state.product?.policy || null} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Product Details & Features Section ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 lg:mt-10 pb-8 lg:pb-12">
        {/* Mobile Accordion View */}
        <div className="lg:hidden pt-2">
          <Accordion
            type="multiple"
            defaultValue={["item-features"]}
            className="w-full"
          >
            <AccordionItem value="item-desc">
              <AccordionTrigger className="text-gray-900 text-base font-semibold hover:no-underline">
                {PRODUCT_CLIENT_TEXT.PRODUCT_DESCRIPTION}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed text-theme-body-sm space-y-3 pb-6">
                {state.product?.description ? (
                  state.product.description
                    .split("\n")
                    .map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <p className="text-gray-400 italic">
                    {PRODUCT_CLIENT_TEXT.NO_DESCRIPTION}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-features" className="border-b-0">
              <AccordionTrigger className="text-gray-900 text-base font-semibold hover:no-underline">
                {PRODUCT_CLIENT_TEXT.KEY_FEATURES}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                {state.product?.features ? (
                  <ProductSpecifications product={state.product.features} />
                ) : (
                  <p className="text-gray-400 italic text-theme-body-sm">
                    {PRODUCT_CLIENT_TEXT.NO_SPECIFICATIONS}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12 pt-8">
          {/* Description */}
          <div>
            <div className="flex flex-col space-y-3 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {PRODUCT_CLIENT_TEXT.PRODUCT_DESCRIPTION}
              </h2>
              <Separator className="bg-gray-200" />
            </div>
            <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-theme-body-sm space-y-3">
              {state.product?.description ? (
                state.product.description
                  .split("\n")
                  .map((line, i) => <p key={i}>{line}</p>)
              ) : (
                <p className="text-gray-400 italic">
                  {PRODUCT_CLIENT_TEXT.NO_DESCRIPTION}
                </p>
              )}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <div className="flex flex-col space-y-3 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {PRODUCT_CLIENT_TEXT.KEY_FEATURES}
              </h2>
              <Separator className="bg-gray-200" />
            </div>
            {state.product?.features ? (
              <ProductSpecifications product={state.product.features} />
            ) : (
              <p className="text-gray-400 italic text-theme-body-sm">
                {PRODUCT_CLIENT_TEXT.NO_SPECIFICATIONS}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Customer Reviews Section ─────────────────────────────────── */}
      {state.product?.id && (
        <section
          id="customer-reviews-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:mt-12 pb-24 lg:pb-16 border-t border-gray-100 pt-8 text-left"
        >
          <h2 className="text-theme-body font-bold text-gray-900 mb-6 uppercase tracking-wider">
            {PRODUCT_CLIENT_TEXT.CUSTOMER_REVIEWS}
          </h2>
          <ProductReview productId={state.product.id} />
        </section>
      )}

      {/* ── Related Products Section ─────────────────────────────────── */}
      {state.product?.id && <RelatedProducts productId={state.product.id} />}

      {/* ── Recommended Products Section ─────────────────────────────── */}
      {state.product?.id && (
        <RecommendedProducts productId={state.product.id} />
      )}

      {/* ── Category Products Section ────────────────────────────────── */}
      {state.product?.categories && state.product.categories.length > 0 && (
        <CategoryProducts
          categoryId={
            state.product.categories.find((c) => c.is_primary)?.id ||
            state.product.categories[0].id
          }
        />
      )}

      {/* ── On Sale Products Section ─────────────────────────────────── */}
      <OnSaleProducts />

      {/* ── Mobile: Sticky bottom CTA ──────────────────────────────── */}
      <div className="block lg:hidden fixed bottom-[calc(48px+env(safe-area-inset-bottom))] left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl px-4 py-3">
        <div className="flex gap-3 max-w-lg mx-auto h-12">
          {state.activeVariant ? (
            <>
              <AddToCart
                productVariantId={state.activeVariant.id}
                productVariant={state.activeVariant}
                styles="flex-1 h-12 rounded-2xl border-2 border-theme-primary bg-theme-primary text-theme-primary-foreground font-bold text-theme-body-sm transition-all"
              />
              {inStock ? (
                <BuyBtn
                  id={state.activeVariant.id}
                  mode={BuyBtnMode.QUICK_BUY}
                  styles="flex-1 h-12 rounded-2xl bg-gray-900 text-white font-bold text-theme-body-sm transition-all"
                  selectedCoupon={state.selectedCoupon}
                  quantity={state.quantity}
                />
              ) : (
                <span className="flex-1 h-12 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-400 font-bold text-theme-body-sm">
                  {ProductClientConfig.OUT_OF_STOCK_MESSAGE}
                </span>
              )}
            </>
          ) : (
            <>
              <Button
                disabled
                variant="outline"
                className="flex-1 h-12 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-400 font-bold text-theme-body-sm cursor-not-allowed hover:bg-gray-50"
              >
                {PRODUCT_CLIENT_TEXT.SELECT_A_VARIANT}
              </Button>
              <Button
                disabled
                variant="secondary"
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-400 font-bold text-theme-body-sm cursor-not-allowed hover:bg-gray-100"
              >
                {BUY_BTN_TEXT.BUY_NOW}
              </Button>
            </>
          )}
        </div>
      </div>

      <AvailableCouponsModal
        isOpen={state.isCouponModalOpen}
        onClose={() =>
          dispatch({ type: ActionType.SET_COUPON_MODAL_OPEN, payload: false })
        }
        onSelect={handleCouponSelect}
        productId={state.product?.id}
        isReadOnly={!token}
      />
    </main>
  );
}
