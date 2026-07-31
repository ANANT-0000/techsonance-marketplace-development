"use client";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { useAppSelector } from "@/hooks/reduxHooks";
import {
  UploadStatus,
  useImageUploadManager,
  ManagedImage,
} from "@/hooks/useImageUploadManager";
import { generateSKU } from "@/utils/generateSku";
import {
  FileOrProductImage,
  ProductImage,
  ProductStatus,
  CreateProductPayload,
} from "@/utils/Types";
import {
  ProductFormInput,
  ProductFormOutput,
  productSchema,
} from "@/utils/validation";
import { createProduct, updateProduct } from "@/utils/vendorApiClient";
import { useEntitlementUsage } from "@/hooks/useEntitlementUsage";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Info, Loader2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useCallback, useState, use, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { GeneralInformationSection } from "./product-form/GeneralInformationSection";
import { PricingInventorySection } from "./product-form/PricingInventorySection";
import { LogisticsDimensionsSection } from "./product-form/LogisticsDimensionsSection";
import { MediaAssetsSection } from "./product-form/MediaAssetsSection";
import { RootState } from "@/lib/store";
import { CategoryTaxationSection } from "./product-form/CategoryTaxationSection";
import { SecureErrorHandler } from "@/utils/error/error.handler";
// Replaced constants
export function ProductForm({
  companyId,
  token,
  categoryOptions,
  warehouseOptions,
  taxSlabsOptions,
  vendorId,
  existingData,
  productId,
  optionsLoaded = false,
}: {
  companyId: string;
  token: string;
  categoryOptions: { value: string; label: string }[];
  warehouseOptions: { value: string; label: string }[];
  taxSlabsOptions: { value: string; label: string }[];
  vendorId: string;
  existingData?: Partial<ProductFormInput> & {
    variantId?: string;
    productMedia?: FileOrProductImage[];
    featureMedia?: FileOrProductImage[];
  };
  productId?: string;
  /** Set to true only after all option fetches (categories, warehouse, tax) have resolved.
   *  Prevents the "missing options" banner from showing during initial page load. */
  optionsLoaded?: boolean;
}) {
  const isUpdate = Boolean(productId && existingData);
  const methods = useForm({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      productName: "",
      description: "",
      features: [{ title: "", description: "" }],
      attributes: [{ name: "", value: "" }],
      basePrice: "",
      compareAtPrice: "",
      saleStartsAt: "",
      saleEndsAt: "",
      stocks: "",
      sku: "",
      productMedia: [],
      featureMedia: [],
      categories: [],
      primaryCategory: "",
      status: ProductStatus.INACTIVE,
      warehouseId: "",
      taxSlabId: "",
      weight_kg: "",
      length_cm: "",
      width_cm: "",
      height_cm: "",
    },
  });
  const {
    control,
    reset,
    watch,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = methods;
  const productName = watch("productName");
  const attributes = watch("attributes"); // Example: { Color: 'Black', Capacity: '256GB' }
  const categoryName = watch("categories");

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

  // Auto-generate SKU when variant details change, ONLY if the user hasn't manually typed a custom SKU
  const [isAutoGenerating, setIsAutoGenerating] = useState(!isUpdate);

  useEffect(() => {
    try {
      if (isAutoGenerating && productName) {
        const newSku = generateSKU({
          productName: productName, // Passed from parent Product
          categoryName: Array.isArray(categoryName)
            ? categoryName[0] || ""
            : categoryName || "",
          attributes: attributes,
        });

        setValue("sku", newSku, { shouldValidate: true });
      }
    } catch (err) {
      SecureErrorHandler.handle(err);
    }
  }, [isAutoGenerating, attributes, productName, categoryName, setValue]);
  const formPageLabels = isUpdate
    ? PRODUCT_FORM_TEXT.PAGE.UPDATE
    : PRODUCT_FORM_TEXT.PAGE.CREATE;
  const { user } = useAppSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { data: usage, loading: usageLoading } = useEntitlementUsage(
    "max_products",
    companyId || "",
  );

  const hasMissingOptions =
    !categoryOptions?.length ||
    !taxSlabsOptions?.length ||
    !warehouseOptions?.length;

  // token is now tracked in state

  const productUpload = useImageUploadManager({
    token,
    limit: 1,
    maxSizeMB: 0.4,
    maxTotalSizeMB: 20,
  });
  const featureUpload = useImageUploadManager({
    token,
    limit: 5,
    maxSizeMB: 0.4,
    maxTotalSizeMB: 20,
  });

  useEffect(() => {
    if (!isUpdate) {
      const draft = localStorage.getItem("productFormDraft");
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          reset(parsedDraft);

          if (parsedDraft.productMedia) {
            productUpload.setImages(
              parsedDraft.productMedia.map((item: unknown) => {
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
          if (parsedDraft.featureMedia) {
            featureUpload.setImages(
              parsedDraft.featureMedia.map((item: unknown) => {
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

          toast.success(PRODUCT_FORM_TEXT.MESSAGES.DRAFT_LOADED);
          localStorage.removeItem("productFormDraft");
        } catch (error) {
          SecureErrorHandler.handle(error);
        }
      }
    }
  }, [isUpdate, reset]);

  const handleSaveDraftAndRedirect = (path: string) => {
    productUpload.bypassCleanup();
    featureUpload.bypassCleanup();
    const currentValues = getValues();
    localStorage.setItem("productFormDraft", JSON.stringify(currentValues));
    toast.success(PRODUCT_FORM_TEXT.MESSAGES.DRAFT_SAVED);
    router.push(path);
  };

  const [deletedImgs, setDeletedImgs] = useState<string[]>([]);

  // Sync state to react-hook-form
  useEffect(() => {
    const successImages = productUpload.images
      .filter((img: ManagedImage) => img.status === UploadStatus.SUCCESS)
      .map((img: ManagedImage) => ({ image_url: img.cloudUrl, id: img.id }));

    setValue("productMedia", successImages as unknown as FileOrProductImage[], {
      shouldDirty: true,
    });
  }, [productUpload.images, setValue]);

  useEffect(() => {
    const successImages = featureUpload.images
      .filter((img: ManagedImage) => img.status === UploadStatus.SUCCESS)
      .map((img: ManagedImage) => ({ image_url: img.cloudUrl, id: img.id }));

    setValue("featureMedia", successImages as unknown as FileOrProductImage[], {
      shouldDirty: true,
    });
  }, [featureUpload.images, setValue]);

  // Populate form when editing an existing product
  useEffect(() => {
    if (!isUpdate || !existingData) return;
    reset({
      productName: existingData.productName || "",
      description: existingData.description || "",
      features: existingData.features?.length
        ? existingData.features.map((feat) => ({
            title: feat.title,
            description: feat.description,
          }))
        : [{ title: "", description: "" }],
      attributes: existingData.attributes?.length
        ? existingData.attributes.map((attr) => ({
            name: attr.name,
            value: attr.value,
          }))
        : [{ name: "", value: "" }],
      basePrice:
        existingData.basePrice !== undefined && existingData.basePrice !== null
          ? String(existingData.basePrice)
          : "",
      compareAtPrice:
        existingData.compareAtPrice !== undefined &&
        existingData.compareAtPrice !== null
          ? String(existingData.compareAtPrice)
          : "",
      saleStartsAt: existingData.saleStartsAt || "",
      saleEndsAt: existingData.saleEndsAt || "",
      stocks:
        existingData.stocks !== undefined && existingData.stocks !== null
          ? String(existingData.stocks)
          : "",
      sku: existingData.sku || "",
      productMedia: [],
      featureMedia: [],
      categories: Array.isArray(existingData.categories)
        ? existingData.categories
        : existingData.categories
          ? [existingData.categories]
          : [],
      // @ts-ignore
      primaryCategory:
        existingData.primaryCategory ||
        (Array.isArray(existingData.categories)
          ? existingData.categories[0]
          : existingData.categories) ||
        "",
      status: (existingData.status as ProductStatus) || ProductStatus.INACTIVE,
      warehouseId: existingData.warehouseId || "",
      taxSlabId: existingData.taxSlabId || "",
      weight_kg:
        existingData.weight_kg !== undefined && existingData.weight_kg !== null
          ? String(existingData.weight_kg)
          : "",
      length_cm:
        existingData.length_cm !== undefined && existingData.length_cm !== null
          ? String(existingData.length_cm)
          : "",
      width_cm:
        existingData.width_cm !== undefined && existingData.width_cm !== null
          ? String(existingData.width_cm)
          : "",
      height_cm:
        existingData.height_cm !== undefined && existingData.height_cm !== null
          ? String(existingData.height_cm)
          : "",
    });

    const initialProductFiles =
      (existingData.productMedia as FileOrProductImage[]) || [];
    const initialFeatureFiles =
      (existingData.featureMedia as FileOrProductImage[]) || [];

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
      "productMedia",
      initialProductFiles as unknown as FileOrProductImage[],
      {
        shouldDirty: false,
      },
    );
    setValue(
      "featureMedia",
      initialFeatureFiles as unknown as FileOrProductImage[],
      {
        shouldDirty: false,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, existingData]);

  // Re-sync selects if options load after initial reset
  useEffect(() => {
    if (existingData?.warehouseId && warehouseOptions?.length) {
      setValue("warehouseId", existingData.warehouseId);
    }
  }, [existingData?.warehouseId, warehouseOptions, setValue]);

  useEffect(() => {
    if (existingData?.categories && categoryOptions?.length) {
      const cats = Array.isArray(existingData.categories)
        ? existingData.categories
        : [existingData.categories];
      setValue("categories", cats);
      // @ts-ignore
      if (existingData.primaryCategory)
        setValue("primaryCategory", existingData.primaryCategory);
      else setValue("primaryCategory", cats[0] || "");
    }
  }, [existingData?.categories, categoryOptions, setValue]);

  useEffect(() => {
    if (existingData?.taxSlabId && taxSlabsOptions?.length) {
      setValue("taxSlabId", existingData.taxSlabId);
    }
  }, [existingData?.taxSlabId, taxSlabsOptions, setValue]);

  const MAX_FILE_SIZE_MB = 0.4;
  const MAX_TOTAL_SIZE_MB = 20;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

  // ── File handlers ──
  // Image handlers are now managed by useImageUploadManager

  // ── Submit ──

  const onSubmit = async (data: ProductFormOutput) => {
    if (!token || !companyId) {
      toast.error(PRODUCT_FORM_TEXT.ERRORS.SESSION_EXPIRED_SAVE, {
        icon: "🔒",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }
    // On create, both image sets must have at least one file
    if (
      !isUpdate &&
      (productUpload.images.filter((img) => img.status === UploadStatus.SUCCESS)
        .length === 0 ||
        featureUpload.images.filter(
          (img) => img.status === UploadStatus.SUCCESS,
        ).length === 0)
    ) {
      toast.error(
        "Please upload at least one product image and one feature image.",
        {
          icon: "🖼️",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
      return;
    }

    if (!user || ("vendor_id" in user && !user.vendor_id) || !user.company_id) {
      toast.error(
        "Your session details are missing. Please log in again to save your product.",
        {
          icon: "🔒",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
      return;
    }

    const productUrls = productUpload.images
      .map((f: ManagedImage) => f.cloudUrl)
      .filter(Boolean) as string[];
    const featureUrls = featureUpload.images
      .map((f: ManagedImage) => f.cloudUrl)
      .filter(Boolean) as string[];

    const payload: CreateProductPayload["product_data"] = isUpdate
      ? {
          ...data,
          variant_id: existingData?.variantId,
          price: data.base_price,
          base_price: String(data.base_price),
          compare_at_price:
            data.compare_at_price !== null &&
            data.compare_at_price !== undefined
              ? String(data.compare_at_price)
              : null,
          product_media: productUrls,
          feature_media: featureUrls,
        }
      : {
          ...data,
          base_price: String(data.base_price),
          compare_at_price:
            data.compare_at_price !== null &&
            data.compare_at_price !== undefined
              ? String(data.compare_at_price)
              : null,
          product_media: productUrls,
          feature_media: featureUrls,
        };

    const requestBody = {
      product_data: payload,
      imagesToDelete: deletedImgs.length > 0 ? deletedImgs : undefined,
    };

    try {
      productUpload.bypassCleanup();
      featureUpload.bypassCleanup();
      let response: {
        ok?: boolean;
        status: number;
        statusText?: string;
        data?: unknown;
        code?: string;
        reason?: string;
        message?: string;
      };

      if (isUpdate) {
        response = (await updateProduct(
          requestBody,
          productId!,
          token,
          companyId,
        )) as typeof response;
      } else {
        response = (await createProduct(
          requestBody,
          vendorId,
          token,
          companyId,
        )) as typeof response;
      }
      if (response.status === 413) {
        toast.error(
          PRODUCT_FORM_TEXT.ERRORS.PAYLOAD_TOO_LARGE(MAX_TOTAL_SIZE_MB),
          {
            icon: "❌",
            style: { borderRadius: "10px", background: "#333", color: "#fff" },
          },
        );
        return;
      }

      if (
        response.status === 403 &&
        response.code === "FEATURE_LIMIT_REACHED"
      ) {
        const reason = response.reason;
        if (reason === "quota_exceeded") {
          toast.error(
            <span>
              You've reached your product limit!{" "}
              <a
                href="/vendor/settings/billing"
                className="underline font-bold"
              >
                Upgrade Plan
              </a>
            </span>,
            { duration: 5000 },
          );
        } else if (reason === "feature_disabled") {
          toast.error(
            <span>
              Products feature is not included in your plan.{" "}
              <a
                href="/vendor/settings/billing"
                className="underline font-bold"
              >
                Upgrade Plan
              </a>
            </span>,
            { duration: 5000 },
          );
        } else {
          toast.error("You need an active subscription to create products.");
        }
        return;
      }

      if (response.status !== 201 && response.status !== 200) {
        toast.error(response.message || PRODUCT_FORM_TEXT.ERRORS.SAVE_FAILED, {
          icon: "❌",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
        return;
      }
      router.push("/vendor/products");
    } catch (error) {
      toast.error(
        PRODUCT_FORM_TEXT.ERRORS.SAVE_FAILED ||
          PRODUCT_FORM_TEXT.ERRORS.UNEXPECTED_ERROR,
        {
          icon: "❌",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        },
      );
    }
  };
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-2 rounded-xl"
      >
        <ArrowLeft size={16} /> {PRODUCT_FORM_TEXT.ACTIONS.BACK}
      </Button>
      {optionsLoaded && hasMissingOptions && (
        <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle size={18} />
            {PRODUCT_FORM_TEXT.MESSAGES.MISSING_OPTIONS_TITLE}
          </p>
          <p className="mt-1 text-sm ml-6">
            {PRODUCT_FORM_TEXT.MESSAGES.MISSING_OPTIONS_DESC}
          </p>
        </div>
      )}
      <Form {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            toast.error(PRODUCT_FORM_TEXT.ERRORS.VALIDATION_FAILED, {
              icon: "⚠️",
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            });
          })}
          noValidate
        >
          {/* ── HEADER ── */}
          <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-theme-h4 font-bold text-slate-900">
                {formPageLabels.headerTitle}
              </h1>
              <p className="text-theme-body-sm text-slate-500 mt-0.5">
                {formPageLabels.headerDesc}
              </p>
            </div>
          </header>

          {!isUpdate && usage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
              <span className="text-sm text-blue-900 flex items-center gap-2">
                <Info size={16} />
                <strong>{PRODUCT_FORM_TEXT.LIMITS.PRODUCTS_LIMIT}</strong>{" "}
                {usage.isUnlimited
                  ? PRODUCT_FORM_TEXT.LIMITS.UNLIMITED
                  : `${usage.used} ${PRODUCT_FORM_TEXT.LIMITS.OF} ${usage.limitValue} ${PRODUCT_FORM_TEXT.LIMITS.USED}`}
              </span>
              {!usage.isUnlimited &&
                usage.limitValue !== null &&
                usage.used >= usage.limitValue && (
                  <a
                    href="/vendor/settings/billing"
                    className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {PRODUCT_FORM_TEXT.LIMITS.UPGRADE_PLAN}
                  </a>
                )}
            </div>
          )}

          <GeneralInformationSection />
          <PricingInventorySection />
          <LogisticsDimensionsSection />
          <MediaAssetsSection
            productUpload={productUpload}
            featureUpload={featureUpload}
            setDeletedImgs={setDeletedImgs}
          />
          <CategoryTaxationSection
            categoryOptions={categoryOptions}
            warehouseOptions={warehouseOptions}
            taxSlabsOptions={taxSlabsOptions}
            handleSaveDraftAndRedirect={handleSaveDraftAndRedirect}
          />
          {/* ── FOOTER CTA ── */}
          <div className="flex justify-end gap-3 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 font-semibold py-5 px-8 rounded-xl shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isUpdate ? "Updating…" : "Publishing…"}
                </>
              ) : (
                formPageLabels.submitButton
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
