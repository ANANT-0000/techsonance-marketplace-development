"use client";
import { getClientCompanyId } from "@/utils/getCompanyId";
import Link from "next/link";
import {
  Plus,
  Package,
  Edit,
  ArrowLeft,
  Layers,
  Tag,
  ImageOff,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import {
  fetchProductVariants,
  updateProductVariantStatus,
} from "@/utils/vendorApiClient";
import { DeleteBtn } from "@/components/vendor/DeleteBtn";
import { VariantImgGrid } from "@/components/vendor/VariantImgGrid";
import { SessionErrorCard } from "@/components/vendor/SessionErrorCard";
import { ProductImage, ProductVariantStatus } from "@/utils/Types";
import { formatCurrency } from "@/lib/utils";
import { StatusConfirmationModal } from "@/components/common/StatusConfirmationModal";
import { authToken } from "@/utils/authToken";
import { useAppSelector } from "@/hooks/reduxHooks";
import { redirect, useParams } from "next/navigation";
import { useEffect, useReducer } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { PRODUCT_VARIANTS_TEXT } from "@/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { VEDNOR_LOGIN_PATH, VEDNOR_REGISTER_PATH } from "@/constants";

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock_quantity: number;
  status: string;
  attributes: { name: string; value: string }[];
  images: ProductImage[] | null;
}

enum VariantListingActionType {
  SET_VARIANTS = "SET_VARIANTS",
  SET_STATUS_TOGGLE = "SET_STATUS_TOGGLE",
  SET_LOADING = "SET_LOADING",
  SET_SHOW_MODAL = "SET_SHOW_MODAL",
  CONFIRM_STATUS_UPDATE = "CONFIRM_STATUS_UPDATE",
}

interface VariantListingState {
  variants: ProductVariant[];
  status: ProductVariantStatus;
  isActive: boolean;
  loading: boolean;
  showModal: boolean;
  selectedVariantId: string | null;
}

type VariantListingAction =
  | { type: VariantListingActionType.SET_VARIANTS; payload: ProductVariant[] }
  | {
      type: VariantListingActionType.SET_STATUS_TOGGLE;
      payload: { variantId: string; currentStatus: ProductVariantStatus };
    }
  | { type: VariantListingActionType.SET_LOADING; payload: boolean }
  | { type: VariantListingActionType.SET_SHOW_MODAL; payload: boolean }
  | {
      type: VariantListingActionType.CONFIRM_STATUS_UPDATE;
      payload: ProductVariantStatus;
    };

const initialState: VariantListingState = {
  variants: [],
  status: ProductVariantStatus.INACTIVE,
  isActive: false,
  loading: false,
  showModal: false,
  selectedVariantId: null,
};

function variantListingReducer(
  state: VariantListingState,
  action: VariantListingAction,
): VariantListingState {
  switch (action.type) {
    case VariantListingActionType.SET_VARIANTS:
      return { ...state, variants: action.payload };
    case VariantListingActionType.SET_STATUS_TOGGLE:
      return {
        ...state,
        showModal: true,
        status: action.payload.currentStatus,
        isActive: action.payload.currentStatus === ProductVariantStatus.ACTIVE,
        selectedVariantId: action.payload.variantId,
      };
    case VariantListingActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case VariantListingActionType.SET_SHOW_MODAL:
      return { ...state, showModal: action.payload };
    case VariantListingActionType.CONFIRM_STATUS_UPDATE:
      return {
        ...state,
        status: action.payload,
        variants: state.variants.map((v) =>
          v.id === state.selectedVariantId
            ? { ...v, status: action.payload }
            : v,
        ),
      };
    default:
      return state;
  }
}

export default function VariantListingPage() {
  const companyId = getClientCompanyId();

  const { productId } = useParams<{ productId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const vendorId = (user && "vendor_id" in user ? user.vendor_id : "") ?? "";

  const token = authToken();

  const [state, dispatch] = useReducer(variantListingReducer, initialState);
  const { variants, status, isActive, loading, showModal, selectedVariantId } =
    state;

  useEffect(() => {
    if (!token || !companyId) {
      return;
    }
    dispatch({ type: VariantListingActionType.SET_LOADING, payload: true });
    fetchProductVariants(productId, token, companyId)
      .then((res) => {
        dispatch({
          type: VariantListingActionType.SET_VARIANTS,
          payload: res.data,
        });
      })
      .catch((error) => {
        toast.error("Failed to load product variants. Please try again.", {
          style: { borderRadius: "12px", background: "#333", color: "#fff" },
        });
        dispatch({ type: VariantListingActionType.SET_VARIANTS, payload: [] });
      })
      .finally(() => {
        dispatch({
          type: VariantListingActionType.SET_LOADING,
          payload: false,
        });
      });
  }, [productId, token]);

  const handleStatusToggle = (
    variantId: string,
    currentStatus: ProductVariantStatus,
  ) => {
    dispatch({
      type: VariantListingActionType.SET_STATUS_TOGGLE,
      payload: { variantId, currentStatus },
    });
  };

  const handleConfirm = async () => {
    dispatch({ type: VariantListingActionType.SET_LOADING, payload: true });
    if (!token || !companyId) {
      toast.error(PRODUCT_VARIANTS_TEXT.TOASTS.AUTH_ERR);
      return;
    }
    const isCurrentlyActive = status === ProductVariantStatus.ACTIVE;
    const nextStatus = isCurrentlyActive
      ? ProductVariantStatus.INACTIVE
      : ProductVariantStatus.ACTIVE;
    try {
      await updateProductVariantStatus(
        selectedVariantId!,
        nextStatus,
        token,
        companyId,
      );
      dispatch({
        type: VariantListingActionType.CONFIRM_STATUS_UPDATE,
        payload: nextStatus,
      });
      toast.success(PRODUCT_VARIANTS_TEXT.TOASTS.UPDATE_SUCCESS);
    } catch (err) {
      toast.error("Failed to update status.", {
        style: { borderRadius: "12px", background: "#333", color: "#fff" },
      });
    } finally {
      dispatch({ type: VariantListingActionType.SET_LOADING, payload: false });
      dispatch({
        type: VariantListingActionType.SET_SHOW_MODAL,
        payload: false,
      });
    }
  };

  if (!token || !companyId) {
    return <SessionErrorCard />;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen max-h-screen overflow-y-auto w-full px-4 sm:px-6 lg:px-8 pb-20 pt-6 bg-slate-50/30"
    >
      <div className="mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <Link
              href={`/vendor/products`}
              className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {PRODUCT_VARIANTS_TEXT.TITLE}
              </h1>
              <p className="text-theme-body text-slate-500 mt-1">
                {PRODUCT_VARIANTS_TEXT.SUBTITLE}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/vendor/products/productUpdateForm/${productId}`}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-theme-body-sm font-semibold py-2.5 px-5 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
            >
              <Edit size={16} />
              {PRODUCT_VARIANTS_TEXT.BTN_EDIT_PRODUCT}
            </Link>
            <Link
              href={`/vendor/products/variantForm/${productId}`}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white text-theme-body-sm font-semibold py-2.5 px-5 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-sm shadow-slate-900/20"
            >
              <Plus size={16} />
              {PRODUCT_VARIANTS_TEXT.BTN_ADD_VARIANT}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-white w-fit px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
          <Layers size={16} className="text-indigo-400" />
          <span className="text-theme-body-sm font-semibold text-slate-600">
            {variants && variants.length}
            {variants && variants.length !== 1
              ? PRODUCT_VARIANTS_TEXT.STATS_VARIANTS
              : PRODUCT_VARIANTS_TEXT.STATS_VARIANT}
          </span>
        </div>

        {state.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="w-full h-96 rounded-3xl" />
            <Skeleton className="w-full h-96 rounded-3xl" />
            <Skeleton className="w-full h-96 rounded-3xl" />
          </div>
        ) : variants && variants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white border border-slate-100 rounded-3xl p-16 text-center flex flex-col items-center justify-center shadow-sm"
          >
            <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <Package size={40} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-theme-h5 font-semibold text-slate-800 tracking-tight">
              {PRODUCT_VARIANTS_TEXT.EMPTY.TITLE}
            </h3>
            <p className="text-slate-500 text-theme-body mt-2 mb-8 max-w-md mx-auto leading-relaxed">
              {PRODUCT_VARIANTS_TEXT.EMPTY.DESC}
            </p>
            <Link
              href={`/vendor/products/variantForm/${productId}`}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-theme-body-sm font-semibold py-3 px-6 rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-sm shadow-slate-900/10"
            >
              <Plus size={18} /> {PRODUCT_VARIANTS_TEXT.EMPTY.BTN_CREATE}
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {variants &&
              variants.length > 0 &&
              variants.map((variant, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  key={variant.id}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col group"
                >
                  <div className="p-1">
                    {variant.images && variant.images.length > 0 && (
                      <VariantImgGrid variantImages={variant?.images} />
                    )}
                  </div>

                  {/* ── CARD BODY ── */}
                  <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* SKU + Status row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-theme-tiny font-semibold text-slate-400 uppercase tracking-widest mb-1">
                          {PRODUCT_VARIANTS_TEXT.CARD.SKU}
                        </p>
                        <p className="text-theme-body font-bold text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                          {variant.sku || "—"}
                        </p>
                      </div>

                      {/* Status */}
                      <span
                        className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-theme-tiny font-bold uppercase tracking-wide border ${
                          variant.status === ProductVariantStatus.ACTIVE
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {variant.status}
                      </span>
                    </div>

                    {variant.attributes.length > 0 && (
                      <div>
                        <p className="text-theme-tiny font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Tag size={12} />{" "}
                          {PRODUCT_VARIANTS_TEXT.CARD.ATTRIBUTES}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {variant.attributes.map((attr, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-700 text-theme-body-sm font-medium px-2.5 py-1.5 rounded-xl"
                            >
                              <span className="text-slate-400 font-semibold">
                                {attr.name}:
                              </span>
                              <span>{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-theme-tiny font-semibold text-slate-400 uppercase tracking-widest mb-1">
                          {PRODUCT_VARIANTS_TEXT.CARD.PRICE}
                        </p>
                        <p className="text-theme-h5 font-bold text-slate-900 tracking-tight">
                          ₹{formatCurrency(variant.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-auto pt-2">
                      <Link
                        href={`/vendor/products/variantUpdateForm/${variant.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 text-slate-600 text-theme-body-sm font-semibold hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all duration-200 ease-out"
                      >
                        <Edit size={16} />
                        {PRODUCT_VARIANTS_TEXT.CARD.BTN_EDIT}
                      </Link>
                      <button
                        onClick={() =>
                          handleStatusToggle(
                            variant.id,
                            variant.status as ProductVariantStatus,
                          )
                        }
                        disabled={loading}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-theme-body-sm font-semibold border transition-all duration-200 ease-out cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      variant.status === ProductVariantStatus.ACTIVE
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                      >
                        {variant.status === ProductVariantStatus.ACTIVE ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}

                        {loading
                          ? PRODUCT_VARIANTS_TEXT.CARD.SAVING
                          : variant.status === ProductVariantStatus.ACTIVE
                            ? PRODUCT_VARIANTS_TEXT.CARD.STATUS_ACTIVE
                            : PRODUCT_VARIANTS_TEXT.CARD.STATUS_INACTIVE}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
      {showModal && (
        <StatusConfirmationModal
          onConfirm={handleConfirm}
          onCancel={() =>
            dispatch({
              type: VariantListingActionType.SET_SHOW_MODAL,
              payload: false,
            })
          }
          isActive={isActive}
        />
      )}
    </motion.main>
  );
}
