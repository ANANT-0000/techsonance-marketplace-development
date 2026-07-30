import { useFormContext } from "react-hook-form";
import { Truck, AlertCircle } from "lucide-react";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ProductFormValuesType } from "@/utils/validation";

export const LogisticsDimensionsSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProductFormValuesType>();

  return (
    <div className="section">
      <div className="section_header">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Truck
            size={16}
            className="text-amber-500"
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
            {PRODUCT_FORM_TEXT.SECTIONS.LOGISTICS}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Used for shipping calculation and carrier selection</p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 p-5 border border-slate-100 rounded-2xl bg-gradient-to-br from-slate-50/60 to-white">
          {PRODUCT_FORM_TEXT.LOGISTICS_FIELDS.map((field: { label: string; name: string; placeholder: string; unit: string; hint: string }) => {
            const hasError = !!(errors as Record<string, { message?: string }>)[field.name];
            return (
              <div key={field.name}>
                <label className="form_label">
                  {field.label} <span className="text-red-400 normal-case">*</span>
                </label>
                {/* Input with inset unit badge */}
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={`form_input pr-12 ${hasError ? "form_input_invalid" : ""}`}
                    placeholder={field.placeholder}
                    {...register(field.name as import("react-hook-form").Path<ProductFormValuesType>, {
                      required: `${field.label} is required`,
                    })}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const pastedData = e.clipboardData.getData("Text");
                      if (/[eE+-]/.test(pastedData)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md pointer-events-none select-none">
                    {field.unit}
                  </span>
                </div>
                {/* Non-technical helper hint */}
                {!hasError && (
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{field.hint}</p>
                )}
                {hasError && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle
                      size={12}
                      className="shrink-0"
                    />
                    {(errors as Record<string, { message?: string }>)[field.name]?.message as string}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
