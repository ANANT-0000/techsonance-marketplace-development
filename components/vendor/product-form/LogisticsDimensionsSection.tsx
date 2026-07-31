import { useFormContext } from "react-hook-form";
import { Truck } from "lucide-react";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ProductFormValuesType } from "@/utils/validation";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const LogisticsDimensionsSection = () => {
  const { control } = useFormContext<ProductFormValuesType>();

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
            return (
              <FormField
                key={field.name}
                control={control}
                name={field.name as import("react-hook-form").Path<ProductFormValuesType>}
                render={({ field: hookField }) => (
                  <FormItem>
                    <FormLabel>
                      {field.label} <span className="text-red-400 normal-case">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="pr-12"
                          placeholder={field.placeholder}
                          {...hookField}
                          value={typeof hookField.value === 'string' ? hookField.value : ''}
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
                    </FormControl>
                    <FormDescription className="text-xs text-slate-400 mt-1 leading-snug">
                      {field.hint}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
