import { useFormContext } from "react-hook-form";
import { useMemo } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { PRODUCT_FORM_PRICING_FIELDS } from "@/constants";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ProductFormValuesType } from "@/utils/validation";

export const PricingInventorySection = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ProductFormValuesType>();

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

  return (
    <div className="section">
      <div className="section_header">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <DynamicIcon
            fallback={() => <p></p>}
            name="tag"
            size={16}
            className="text-blue-500"
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
            {PRODUCT_FORM_TEXT.SECTIONS.PRICING}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set base price, compare-at price and sale window
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Pricing fields grid */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 border border-slate-100 rounded-2xl bg-gradient-to-br from-slate-50/60 to-white">
          {Array.isArray(PRODUCT_FORM_PRICING_FIELDS) &&
            PRODUCT_FORM_PRICING_FIELDS.map(
              (field: {
                label: string;
                name: string;
                type: string;
                placeholder: string;
              }) => {
                const hasError = !!(
                  errors as Record<string, { message?: string }>
                )[field.name];
                return (
                  <div key={field.name}>
                    <label className="form_label">{field.label}</label>
                    <input
                      type={field.type}
                      className={`form_input ${hasError ? "form_input_invalid" : ""}`}
                      placeholder={field.placeholder}
                      {...register(
                        field.name as import("react-hook-form").Path<ProductFormValuesType>,
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
                    {hasError && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                        <DynamicIcon
                          fallback={() => <p></p>}
                          name="alert-circle"
                          size={12}
                          className="shrink-0"
                        />
                        {
                          (errors as Record<string, { message?: string }>)[
                            field.name
                          ]?.message as string
                        }
                      </p>
                    )}
                  </div>
                );
              },
            )}
        </div>

        {/* ── Live Pricing Preview ──────────────────────────────── */}
        <div
          className="p-5 border border-slate-100 rounded-2xl bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <DynamicIcon
                fallback={() => <p></p>}
                name="eye"
                size={15}
                className="text-indigo-400"
              />
              {PRODUCT_FORM_TEXT.PREVIEW.TITLE}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {PRODUCT_FORM_TEXT.PREVIEW.DESC}
            </p>
          </div>
          <div className="flex items-baseline gap-3 px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 transition-all duration-300">
            <span className="text-2xl font-bold text-slate-900 tabular-nums transition-all duration-300">
              ₹{computedPrice.price.toFixed(2)}
            </span>
            {computedPrice.isSaleActive && computedPrice.compareAtPrice && (
              <>
                <span className="text-sm text-slate-400 line-through tabular-nums">
                  ₹{computedPrice.compareAtPrice.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {computedPrice.discountPercent}%{" "}
                  {PRODUCT_FORM_TEXT.PREVIEW.OFF}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
