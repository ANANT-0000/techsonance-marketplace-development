"use client";
import { getClientCompanyId } from "@/utils/getCompanyId";
import {
  FileOrProductImage,
  ProductImage,
  ProductStatus,
  Product,
  VariantFormValues,
  ProductImageType,
  CreateProductVariantPayload,
} from "@/utils/Types";
import { useAppSelector } from "@/hooks/reduxHooks";
import { RootState } from "@/lib/store";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  createProductVariant,
  updateProductVariant,
} from "@/utils/vendorApiClient";
import { usePreviewUrls } from "@/lib/clientUtils";
import {
  UploadStatus,
  useImageUploadManager,
} from "@/hooks/useImageUploadManager";
import { ImageThumbnailGrid } from "@/components/vendor/ImageThumbnailGrid";
import { PRODUCT_FORM_PRICING_FIELDS } from "@/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductVariantFormInput,
  ProductVariantFormOutput,
  ProductVariantFormValuesType,
  productVariantSchema,
} from "@/utils/validation";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateSKU } from "@/utils/generateSku";
import { authToken } from "@/utils/authToken";
import { PRODUCT_VARIANT_FORM_TEXT } from "@/constants/vendorText";
import { VEDNOR_LOGIN_PATH, VEDNOR_REGISTER_PATH } from "@/constants";
import toast from "react-hot-toast";
import { SessionErrorCard } from "./SessionErrorCard";
const MAX_FILE_SIZE_MB = 0.4;
const MAX_TOTAL_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
// Replaced constants
export const ProductVariantForm = ({
  vendorId,
  productId,
  warehouseOptions,
  productDetails,
  existVariant,
  variantId,
}: {
  vendorId: string;
  productId?: string;
  warehouseOptions?: { value: string; label: string }[];
  productDetails?: {
    id: string;
    name: string;
    category: { id: string; name: string };
  };
  existVariant?: Partial<ProductVariantFormInput> & {
    productId?: string;
    variantId?: string;
  };
  variantId?: string;
}) => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionCheck, setSessionCheck] = useState<"checking" | "failed">(
    "checking",
  );

  useEffect(() => {
    const cid = getClientCompanyId();
    const t = authToken();
    setCompanyId(cid);
    setToken(t);
    setIsMounted(true);

    if (!cid || !t) {
      setSessionCheck("failed");
    }
  }, []);

  const isEditMode = Boolean(variantId && existVariant);
  const router = useRouter();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const {
    control,
    watch,
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductVariantFormInput, any, ProductVariantFormOutput>({
    resolver: zodResolver(productVariantSchema),
    mode: "onChange",
    defaultValues: {
      variantName: "",
      attributes: [{ name: "", value: "" }],
      basePrice: "",
      compareAtPrice: "",
      saleStartsAt: "",
      saleEndsAt: "",
      stocks: "",
      sku: "",
      variantMediaMain: [],
      variantMediaGallery: [],
      warehouseId: "",
      status: ProductStatus.INACTIVE,
      weight_kg: "",
      length_cm: "",
      width_cm: "",
      height_cm: "",
    },
  });
  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({ control, name: "attributes" });
  const [deletedImgs, setDeletedImgs] = useState<string[]>([]);
  const { getPreviewUrl, revokeAll, revokeOne } = usePreviewUrls();
  const productUpload = useImageUploadManager({
    token,
    limit: 1,
    maxSizeMB: 0.4,
    maxTotalSizeMB: 20,
  });
  const featureUpload = useImageUploadManager({
    token,
    limit: 10,
    maxSizeMB: 0.4,
    maxTotalSizeMB: 20,
  });

  // sessionCheck state logic is now handled in the main initialization useEffect

  useEffect(() => {
    if (!existVariant) {
      const draft = sessionStorage.getItem("productVariantFormDraft");
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          reset(parsedDraft);

          if (parsedDraft.variantMediaMain) {
            productUpload.setImages(
              parsedDraft.variantMediaMain.map((item: unknown) => {
                const img = item as Partial<ProductImage> & { url?: string };
                return {
                  id: img.id || `temp-${Date.now()}-${Math.random()}`,
                  previewUrl: img.image_url || img.url || "",
                  cloudUrl: img.image_url || img.url || "",
                  status: UploadStatus.SUCCESS,
                  progress: 100,
                };
              }),
            );
          }
          if (parsedDraft.variantMediaGallery) {
            featureUpload.setImages(
              parsedDraft.variantMediaGallery.map((item: unknown) => {
                const img = item as Partial<ProductImage> & { url?: string };
                return {
                  id: img.id || `temp-${Date.now()}-${Math.random()}`,
                  previewUrl: img.image_url || img.url || "",
                  cloudUrl: img.image_url || img.url || "",
                  status: UploadStatus.SUCCESS,
                  progress: 100,
                };
              }),
            );
          }

          toast.success(PRODUCT_VARIANT_FORM_TEXT.MESSAGES.DRAFT_LOADED);
          sessionStorage.removeItem("productVariantFormDraft");
        } catch (error) {}
      }
    }
  }, [existVariant, reset]);

  const handleSaveDraftAndRedirect = (path: string) => {
    productUpload.bypassCleanup();
    featureUpload.bypassCleanup();
    const currentValues = getValues();
    sessionStorage.setItem(
      "productVariantFormDraft",
      JSON.stringify(currentValues),
    );
    toast.success(PRODUCT_VARIANT_FORM_TEXT.MESSAGES.DRAFT_SAVED);
    router.push(path);
  };

  useEffect(() => {
    const successImages = productUpload.images
      .filter((img) => img.status === UploadStatus.SUCCESS)
      .map((img) => ({ image_url: img.cloudUrl, id: img.id }));

    setValue(
      "variantMediaMain",
      successImages as unknown as FileOrProductImage[],
      { shouldDirty: true },
    );
  }, [productUpload.images, setValue]);

  useEffect(() => {
    const successImages = featureUpload.images
      .filter((img) => img.status === UploadStatus.SUCCESS)
      .map((img) => ({ image_url: img.cloudUrl, id: img.id }));

    setValue(
      "variantMediaGallery",
      successImages as unknown as FileOrProductImage[],
      {
        shouldDirty: true,
      },
    );
  }, [featureUpload.images, setValue]);
  const variantName = watch("variantName");
  const attributes = watch("attributes");

  const basePriceVal = watch("basePrice");
  const compareAtPriceVal = watch("compareAtPrice");
  const saleStartsAtVal = watch("saleStartsAt");
  const saleEndsAtVal = watch("saleEndsAt");

  const computedPrice = useMemo(() => {
    const bp = Number(basePriceVal) || 0;
    const cp = Number(compareAtPriceVal) || 0;
    const now = new Date();

    let isSaleActive = false;
    if (cp > bp) {
      if (!saleStartsAtVal && !saleEndsAtVal) {
        isSaleActive = true;
      } else {
        const start = saleStartsAtVal ? new Date(saleStartsAtVal) : new Date(0);
        const end = saleEndsAtVal
          ? new Date(saleEndsAtVal)
          : new Date(8640000000000000);
        isSaleActive = now >= start && now <= end;
      }
    }

    if (isSaleActive) {
      const discountAmount = cp - bp;
      const discountPercent = Math.round((discountAmount / cp) * 100);
      return {
        price: bp,
        compareAtPrice: cp,
        discountPercent,
        isSaleActive: true,
      };
    }
    const finalPrice = cp > bp ? cp : bp;
    return {
      price: finalPrice,
      compareAtPrice: null,
      discountPercent: 0,
      isSaleActive: false,
    };
  }, [basePriceVal, compareAtPriceVal, saleStartsAtVal, saleEndsAtVal]);

  const [isAutoGenerating, setIsAutoGenerating] = useState(!isEditMode);

  useEffect(() => {
    if (isAutoGenerating && (productDetails?.name || variantName)) {
      const newSku = generateSKU({
        productName: productDetails?.name || variantName || "",
        categoryName: productDetails?.category.name,
        attributes: attributes,
      });

      setValue("sku", newSku, { shouldValidate: true });
    }
  }, [
    variantName,
    attributes,
    productDetails?.name,
    productDetails?.category.name,
    isAutoGenerating,
    setValue,
  ]);

  // ── Populate form when editing ──
  useEffect(() => {
    if (!existVariant) return;
    reset({
      variantName: existVariant.variantName,
      attributes: existVariant.attributes?.length
        ? existVariant.attributes.map(
            (attr: { name: string; value: string }) => ({
              name: attr.name,
              value: attr.value,
            }),
          )
        : [{ name: "", value: "" }],
      basePrice: String(existVariant.basePrice ?? ""),
      compareAtPrice:
        existVariant.compareAtPrice !== null &&
        existVariant.compareAtPrice !== undefined
          ? String(existVariant.compareAtPrice)
          : "",
      saleStartsAt: existVariant.saleStartsAt || "",
      saleEndsAt: existVariant.saleEndsAt || "",
      stocks: String(existVariant.stocks ?? ""),
      sku: existVariant.sku || "",
      variantMediaMain: existVariant.variantMediaMain ?? [],
      variantMediaGallery: existVariant.variantMediaGallery ?? [],
      warehouseId: existVariant.warehouseId || "",
      status: (existVariant.status as ProductStatus) ?? ProductStatus.INACTIVE,
      weight_kg:
        existVariant.weight_kg !== null && existVariant.weight_kg !== undefined
          ? String(existVariant.weight_kg)
          : "",
      length_cm:
        existVariant.length_cm !== null && existVariant.length_cm !== undefined
          ? String(existVariant.length_cm)
          : "",
      width_cm:
        existVariant.width_cm !== null && existVariant.width_cm !== undefined
          ? String(existVariant.width_cm)
          : "",
      height_cm:
        existVariant.height_cm !== null && existVariant.height_cm !== undefined
          ? String(existVariant.height_cm)
          : "",
    });

    const initialProductFiles =
      (existVariant.variantMediaMain as FileOrProductImage[]) || [];
    const initialFeatureFiles =
      (existVariant.variantMediaGallery as FileOrProductImage[]) || [];

    productUpload.setImages(
      initialProductFiles.map((item) => {
        const img = item as Partial<ProductImage> & { url?: string };
        return {
          id: img.id || `temp-${Date.now()}-${Math.random()}`,
          previewUrl: img.image_url || img.url || "",
          cloudUrl: img.image_url || img.url || "",
          status: UploadStatus.SUCCESS,
          progress: 100,
        };
      }),
    );
    featureUpload.setImages(
      initialFeatureFiles.map((item) => {
        const img = item as Partial<ProductImage> & { url?: string };
        return {
          id: img.id || `temp-${Date.now()}-${Math.random()}`,
          previewUrl: img.image_url || img.url || "",
          cloudUrl: img.image_url || img.url || "",
          status: UploadStatus.SUCCESS,
          progress: 100,
        };
      }),
    );

    setValue(
      "variantMediaMain",
      initialProductFiles as unknown as FileOrProductImage[],
      {
        shouldDirty: false,
      },
    );
    setValue(
      "variantMediaGallery",
      initialFeatureFiles as unknown as FileOrProductImage[],
      {
        shouldDirty: false,
      },
    );
  }, [existVariant, variantId]); // reset is stable, no need to add it

  // Re-sync select if options load after initial reset
  useEffect(() => {
    if (existVariant?.warehouseId && warehouseOptions?.length) {
      setValue("warehouseId", existVariant.warehouseId);
    }
  }, [existVariant?.warehouseId, warehouseOptions, setValue]);

  useEffect(() => {
    if (!token) redirect(VEDNOR_LOGIN_PATH);
    return () => revokeAll();
  }, [token, revokeAll]);

  // ── Submit ──
  const onSubmit = async (data: ProductVariantFormOutput) => {
    if (!token || !companyId) {
      toast.error(PRODUCT_VARIANT_FORM_TEXT.ERRORS.SESSION_EXPIRED_SAVE, {
        icon: "🔒",
        style: {
          borderRadius: "12px",
          background: "#334155",
          color: "#fff",
        },
      });
      return;
    }

    if (user && "vendor_id" in user && user.vendor_id && !user.company_id) {
      toast.error(PRODUCT_VARIANT_FORM_TEXT.ERRORS.PROFILE_MISSING, {
        icon: "🏢",
        style: { borderRadius: "12px", background: "#334155", color: "#fff" },
      });
      return;
    }

    const productUrls = productUpload.images
      .map((f) => f.cloudUrl)
      .filter(Boolean) as string[];
    const featureUrls = featureUpload.images
      .map((f) => f.cloudUrl)
      .filter(Boolean) as string[];

    const payload = {
      ...data,
      product_id: productId!,
      product_media: productUrls,
      feature_media: featureUrls,
    };

    const requestBody: CreateProductVariantPayload = {
      variant_data: payload,
      imagesToDelete: deletedImgs.length > 0 ? deletedImgs : undefined,
    };

    const createOrUpdate = async () => {
      productUpload.bypassCleanup();
      featureUpload.bypassCleanup();

      if (!token || !companyId) {
        toast.error(PRODUCT_VARIANT_FORM_TEXT.ERRORS.SESSION_EXPIRED_SAVE, {
          icon: "🔒",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
        return;
      }

      if (variantId && existVariant?.productId) {
        return await updateProductVariant(
          requestBody,
          existVariant.productId,
          variantId,
          token,
          companyId,
        );
      } else {
        if (!productId) {
          return;
        }
        return await createProductVariant(
          requestBody,
          productId,
          token,
          companyId,
        );
      }
    };

    const response = await createOrUpdate();
    if (response?.status === 413) {
      toast.error(
        PRODUCT_VARIANT_FORM_TEXT.ERRORS.PAYLOAD_TOO_LARGE(MAX_TOTAL_SIZE_MB),
        {
          icon: "❌",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
      return;
    }

    if (response?.status !== 200 && response?.status !== 201) {
      toast.error(
        response?.message || PRODUCT_VARIANT_FORM_TEXT.ERRORS.SAVE_FAILED,
        {
          icon: "❌",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
      return;
    }

    if (response?.status === 200 || response?.status == 201) {
      router.push("/vendor/products");
    }
  };

  if (!isMounted) return null;

  if (sessionCheck === "failed") {
    return <SessionErrorCard />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-4 p-2.5 mb-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition shadow-sm"
      >
        <ArrowLeft size={18} /> {PRODUCT_VARIANT_FORM_TEXT.ACTIONS.BACK}
      </button>
      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
        
          const formValues = getValues();
          
          toast.error(
            "Validation Failed. Please check the console for field errors.",
            {
              icon: "⚠️",
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            },
          );
        })}
        noValidate
      >
        {/* ── HEADER ── */}
        <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-theme-h4 font-bold text-slate-900">
              {isEditMode
                ? PRODUCT_VARIANT_FORM_TEXT.PAGE.UPDATE.TITLE
                : PRODUCT_VARIANT_FORM_TEXT.PAGE.CREATE.TITLE}
            </h1>
            <p className="text-theme-body-sm text-slate-500 mt-0.5">
              {isEditMode
                ? `Editing variant: ${existVariant?.variantName}`
                : `Creating a new variation for product #${productId}`}
            </p>
          </div>
        </header>

        {/* ── 1. VARIANT DETAILS & ATTRIBUTES ── */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-3xl mb-8 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-200">
          <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30 flex items-center gap-3">
            <DynamicIcon
              fallback={() => <p></p>}
              name="layers"
              size={18}
              className="text-indigo-500"
            />
            <h2 className="text-theme-body font-semibold text-slate-800">
              {PRODUCT_VARIANT_FORM_TEXT.SECTIONS.DETAILS}
            </h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Variant Name */}
            <div>
              <label className="block mb-1.5 text-theme-body-sm font-semibold text-slate-700">
                {PRODUCT_VARIANT_FORM_TEXT.LABELS.NAME}{" "}
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition text-theme-body-sm"
                placeholder={PRODUCT_VARIANT_FORM_TEXT.LABELS.NAME_PH}
                {...register("variantName", {
                  required: "Variant name is required",
                })}
              />
              {errors.variantName && (
                <p className="text-red-500 text-theme-caption mt-1 flex items-center gap-1">
                  <DynamicIcon
                    fallback={() => <p></p>}
                    name="alert-circle"
                    size={12}
                  />
                  {errors.variantName.message}
                </p>
              )}
            </div>

            {/* Attributes */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-theme-body-sm font-semibold text-slate-700">
                  {PRODUCT_VARIANT_FORM_TEXT.LABELS.ATTR_TITLE}
                </h3>
                <button
                  type="button"
                  onClick={() => appendAttribute({ name: "", value: "" })}
                  className="flex items-center gap-1.5 text-theme-caption font-semibold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                >
                  <DynamicIcon fallback={() => <p></p>} name="plus" size={14} />{" "}
                  {PRODUCT_VARIANT_FORM_TEXT.ACTIONS.ADD_ATTR}
                </button>
              </div>
              {attributeFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                    <DynamicIcon
                      name="list"
                      size={24}
                      className="text-slate-400"
                      fallback={() => <p />}
                    />
                  </div>
                  <p className="text-slate-600 font-medium text-sm mb-1">
                    {PRODUCT_VARIANT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_TITLE}
                  </p>
                  <p className="text-slate-500 text-xs text-center max-w-sm mb-4">
                    {PRODUCT_VARIANT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_DESC}
                  </p>
                  <button
                    type="button"
                    onClick={() => appendAttribute({ name: "", value: "" })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                  >
                    <DynamicIcon
                      fallback={() => <p></p>}
                      name="plus"
                      size={14}
                    />{" "}
                    {PRODUCT_VARIANT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_BTN}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {attributeFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="relative border border-slate-200 rounded-xl p-4 bg-slate-50 group"
                      >
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 bg-white rounded-md p-1 border shadow-sm"
                        >
                          <DynamicIcon
                            fallback={() => <p></p>}
                            name="trash-2"
                            size={14}
                          />
                        </button>
                        <div className="mb-3">
                          <label className="block text-theme-caption font-semibold text-slate-600 mb-1">
                            {PRODUCT_VARIANT_FORM_TEXT.LABELS.ATTR_NAME}
                          </label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={
                              PRODUCT_VARIANT_FORM_TEXT.LABELS.ATTR_NAME_PH
                            }
                            {...register(`attributes.${index}.name`, {
                              required: "Required",
                            })}
                          />
                        </div>
                        <div>
                          <label className="block text-theme-caption font-semibold text-slate-600 mb-1">
                            {PRODUCT_VARIANT_FORM_TEXT.LABELS.ATTR_VAL}
                          </label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={
                              PRODUCT_VARIANT_FORM_TEXT.LABELS.ATTR_VAL_PH
                            }
                            {...register(`attributes.${index}.value`, {
                              required: "Required",
                            })}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. PRICING & INVENTORY ── */}
        <div className="border border-slate-200 rounded-2xl bg-white mb-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <DynamicIcon
              fallback={() => <p></p>}
              name="tag"
              size={18}
              className="text-blue-500"
            />
            <h2 className="text-theme-body font-semibold text-slate-800">
              {PRODUCT_VARIANT_FORM_TEXT.SECTIONS.PRICING}
            </h2>
          </div>
          <div className="p-6">
            <div className="p-6 flex flex-col md:flex-row gap-6 border border-slate-200 rounded-xl bg-slate-50">
              {Array.isArray(PRODUCT_FORM_PRICING_FIELDS) &&
                PRODUCT_FORM_PRICING_FIELDS.map((field) => (
                  <div key={field.name} className="mb-4 flex-1">
                    <label className="block text-theme-body-sm font-semibold text-slate-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      className="form_input w-full border rounded-lg px-4 py-2.5 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={field.placeholder}
                      {...register(
                        field.name as keyof ProductVariantFormValuesType,
                        { required: "Required" },
                      )}
                      onKeyDown={(e) => {
                        if (
                          field.type === "number" &&
                          ["e", "E", "+", "-"].includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        if (field.type === "number") {
                          const pastedData = e.clipboardData.getData("Text");
                          if (/[eE+-]/.test(pastedData)) {
                            e.preventDefault();
                          }
                        }
                      }}
                    />
                    {errors[
                      field.name as keyof ProductVariantFormValuesType
                    ] && (
                      <p className="text-red-500 text-theme-caption mt-1 flex items-center gap-1">
                        <DynamicIcon
                          fallback={() => <p></p>}
                          name="alert-circle"
                          size={16}
                        />
                        {
                          errors[
                            field.name as keyof ProductVariantFormValuesType
                          ]?.message as string
                        }
                      </p>
                    )}
                  </div>
                ))}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-theme-body-sm font-semibold text-slate-700">
                    {PRODUCT_VARIANT_FORM_TEXT.LABELS.WAREHOUSE}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveDraftAndRedirect("/vendor/warehouse/create")
                    }
                    className="text-theme-tiny font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition"
                  >
                    + Add New
                  </button>
                </div>
                {warehouseOptions && warehouseOptions.length > 0 ? (
                  <select
                    className="form_input w-full border rounded-lg px-4 py-2.5 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register(
                      "warehouseId" as keyof ProductVariantFormValuesType,
                      { required: "Please select a warehouse" },
                    )}
                  >
                    <option value="">
                      {PRODUCT_VARIANT_FORM_TEXT.LABELS.SELECT_WAREHOUSE}
                    </option>
                    {warehouseOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-amber-100/50 rounded-md">
                        <DynamicIcon
                          name="alert-triangle"
                          size={16}
                          className="text-amber-600"
                          fallback={() => <p />}
                        />
                      </div>
                      <span className="text-theme-body-sm text-amber-800 font-medium">
                        {PRODUCT_VARIANT_FORM_TEXT.EMPTY_STATES.WAREHOUSE_TITLE}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveDraftAndRedirect("/vendor/warehouse/create")
                      }
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md transition whitespace-nowrap shadow-sm"
                    >
                      {PRODUCT_VARIANT_FORM_TEXT.EMPTY_STATES.WAREHOUSE_BTN}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Live Pricing Preview */}
            <div className="mt-6 p-5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="text-theme-body-sm font-bold text-slate-700 flex items-center gap-2">
                  <DynamicIcon
                    fallback={() => <p></p>}
                    name="eye"
                    size={16}
                    className="text-indigo-500"
                  />
                  {PRODUCT_VARIANT_FORM_TEXT.PREVIEW.TITLE}
                </h3>
                <p className="text-theme-caption text-slate-500 mt-1">
                  {PRODUCT_VARIANT_FORM_TEXT.PREVIEW.DESC}
                </p>
              </div>
              <div className="mt-4 md:mt-0 px-6 py-3 rounded-lg bg-slate-50 border border-slate-100 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-slate-900">
                  ₹{computedPrice.price.toFixed(2)}
                </span>
                {computedPrice.isSaleActive && computedPrice.compareAtPrice && (
                  <>
                    <span className="text-sm text-slate-400 line-through">
                      ₹{computedPrice.compareAtPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      {computedPrice.discountPercent}%{" "}
                      {PRODUCT_VARIANT_FORM_TEXT.PREVIEW.OFF}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. LOGISTICS & DIMENSIONS ── */}
        <div className="border border-slate-200 rounded-2xl bg-white mb-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <DynamicIcon
              fallback={() => <p></p>}
              name="truck"
              size={18}
              className="text-amber-500"
            />
            <h2 className="text-theme-body font-semibold text-slate-800">
              Logistics & Dimensions
            </h2>
          </div>
          <div className="p-6">
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 border border-slate-200 rounded-xl bg-slate-50">
              {/* Weight */}
              <div>
                <label className="block text-theme-body-sm font-semibold text-slate-700 mb-1">
                  Weight (kg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2.5 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="e.g. 0.5"
                  {...register("weight_kg")}
                />
                {errors.weight_kg && (
                  <p className="text-red-500 text-theme-caption mt-1 flex items-center gap-1">
                    <DynamicIcon
                      fallback={() => <p></p>}
                      name="alert-circle"
                      size={14}
                    />
                    {errors.weight_kg.message as string}
                  </p>
                )}
              </div>

              {/* Length */}
              <div>
                <label className="block text-theme-body-sm font-semibold text-slate-700 mb-1">
                  Length (cm) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2.5 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="e.g. 15"
                  {...register("length_cm")}
                />
                {errors.length_cm && (
                  <p className="text-red-500 text-theme-caption mt-1 flex items-center gap-1">
                    <DynamicIcon
                      fallback={() => <p></p>}
                      name="alert-circle"
                      size={14}
                    />
                    {errors.length_cm.message as string}
                  </p>
                )}
              </div>

              {/* Width */}
              <div>
                <label className="block text-theme-body-sm font-semibold text-slate-700 mb-1">
                  Width (cm) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2.5 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="e.g. 10"
                  {...register("width_cm")}
                />
                {errors.width_cm && (
                  <p className="text-red-500 text-theme-caption mt-1 flex items-center gap-1">
                    <DynamicIcon
                      fallback={() => <p></p>}
                      name="alert-circle"
                      size={14}
                    />
                    {errors.width_cm.message as string}
                  </p>
                )}
              </div>

              {/* Height */}
              <div>
                <label className="block text-theme-body-sm font-semibold text-slate-700 mb-1">
                  Height (cm) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2.5 text-theme-body-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="e.g. 8"
                  {...register("height_cm")}
                />
                {errors.height_cm && (
                  <p className="text-red-500 text-theme-caption mt-1 flex items-center gap-1">
                    <DynamicIcon
                      fallback={() => <p></p>}
                      name="alert-circle"
                      size={14}
                    />
                    {errors.height_cm.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. MEDIA ── */}
        <div className="border border-slate-200 rounded-2xl bg-white mb-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <DynamicIcon
              fallback={() => <p></p>}
              name="image"
              size={18}
              className="text-indigo-500"
            />
            <div>
              <h2 className="text-theme-body font-semibold text-slate-800">
                {PRODUCT_VARIANT_FORM_TEXT.SECTIONS.MEDIA}{" "}
                <span className="text-slate-400 font-normal ml-1">
                  {PRODUCT_VARIANT_FORM_TEXT.SECTIONS.MEDIA_OPTIONAL}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {PRODUCT_VARIANT_FORM_TEXT.SECTIONS.MEDIA_NOTE}
              </p>
              <p className="text-xs text-indigo-600 mt-1 font-semibold bg-indigo-50 inline-block px-2 py-0.5 rounded">
                {PRODUCT_VARIANT_FORM_TEXT.MEDIA_GUIDE.ORDER_NOTE}
              </p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRODUCT_VARIANT_FORM_TEXT.FILE_UPLOAD_LABELS.map(
              ({ label, fieldName, limit }) => {
                const manager =
                  fieldName === "variantMediaMain"
                    ? productUpload
                    : featureUpload;

                const fileCount = manager.images.length;

                return (
                  <div
                    key={fieldName}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-theme-body-sm font-semibold text-slate-700">
                        {label}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Live file count badge */}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all duration-200 ${
                            fileCount >= limit
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : fileCount > 0
                                ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                                : "text-slate-500 bg-slate-100 border-slate-200"
                          }`}
                        >
                          {fileCount} / {limit} {limit === 1 ? "file" : "files"}
                        </span>
                      </div>
                    </div>

                    {/* Upload area */}
                    <label
                      className={`flex flex-col items-center justify-center py-4 border border-dashed border-indigo-200 rounded-xl transition-all duration-250 ease-out mt-2 shadow-[0_2px_10px_rgba(0,0,0,0.01)] ${
                        fileCount >= limit
                          ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 grayscale"
                          : "cursor-pointer hover:bg-indigo-50/80 hover:border-indigo-300 bg-indigo-50/30 group hover:shadow-[0_4px_14px_rgba(99,102,241,0.06)]"
                      }`}
                    >
                      <input
                        type="file"
                        disabled={fileCount >= limit}
                        multiple={limit > 1}
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            manager.addFiles(Array.from(e.target.files));
                          }
                          e.target.value = "";
                        }}
                      />
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm border border-indigo-50 group-hover:scale-105 transition-transform duration-250 ease-out">
                        <DynamicIcon
                          fallback={() => <p></p>}
                          name="upload-cloud"
                          size={20}
                          className="text-indigo-400 group-hover:text-indigo-500 transition-colors"
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
                        {PRODUCT_VARIANT_FORM_TEXT.ACTIONS.UPLOAD}
                      </p>
                      <div className="text-center mt-1.5 flex flex-wrap justify-center gap-1.5">
                        <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                          {PRODUCT_VARIANT_FORM_TEXT.MEDIA_GUIDE.MAX_PER_IMAGE(
                            MAX_FILE_SIZE_MB,
                          )}
                        </span>
                        <span className="text-[10px] font-semibold tracking-wide text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/60">
                          {PRODUCT_VARIANT_FORM_TEXT.MEDIA_GUIDE.MAX_TOTAL(
                            MAX_TOTAL_SIZE_MB,
                          )}
                        </span>
                      </div>
                    </label>

                    {/* Preview list */}
                    <ImageThumbnailGrid
                      images={manager.images}
                      onRemove={(id) => {
                        manager.removeImage(id);
                        if (!id.startsWith("temp-")) {
                          setDeletedImgs((prev) => [...prev, id]);
                        }
                      }}
                      onReorder={manager.reorderImage}
                      onRetry={manager.retryUpload}
                      isMainProduct={fieldName === "variantMediaMain"}
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* ── FOOTER CTA ── */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-300 bg-white text-slate-700 text-theme-body-sm font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            {PRODUCT_VARIANT_FORM_TEXT.ACTIONS.CANCEL}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white text-theme-body-sm font-semibold py-2.5 px-8 rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <DynamicIcon
                  name="loader-2"
                  size={15}
                  className="animate-spin"
                  fallback={() => <p />}
                />
                {PRODUCT_VARIANT_FORM_TEXT.ACTIONS.SAVING}
              </>
            ) : isEditMode ? (
              PRODUCT_VARIANT_FORM_TEXT.ACTIONS.UPDATE
            ) : (
              PRODUCT_VARIANT_FORM_TEXT.ACTIONS.SAVE
            )}
          </button>
        </div>
      </form>
    </>
  );
};
