import { useFormContext, useFieldArray } from "react-hook-form";
import { Package, AlertCircle, Plus, Sparkles, Tag, Trash2 } from "lucide-react";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ProductFormValuesType } from "@/utils/validation";

export const GeneralInformationSection = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValuesType>();

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({ control, name: "features" });

  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({ control, name: "attributes" });

  return (
    <div
      className="bg-white border border-slate-100 rounded-3xl mb-6 overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)]"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
    >
      {/* Section Header */}
      <div
        className="px-6 py-4 border-b border-slate-100 flex items-center gap-3"
        style={{
          background:
            "linear-gradient(to right, rgba(248,250,252,0.8), #ffffff)",
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Package
            size={16}
            className="text-indigo-500"
          />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
          {PRODUCT_FORM_TEXT.SECTIONS.GENERAL}
        </h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Dynamic general fields (productName, description) */}
        {PRODUCT_FORM_TEXT.GENERAL_FIELDS.map(
          (
            field: {
              label: string;
              name: string;
              type: string;
              placeholder: string;
            },
            idx: number,
          ) => {
            const hasError = !!(errors as Record<string, { message?: string }>)[
              field.name
            ];
            return (
              <div key={idx}>
                <label className="form_label">
                  {field.label}{" "}
                  <span className="text-red-400 normal-case">*</span>
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={4}
                    className={`form_input resize-none ${hasError ? "form_input_invalid" : ""}`}
                    placeholder={field.placeholder}
                    aria-multiline={true}
                    {...register(
                      field.name as import("react-hook-form").Path<ProductFormValuesType>,
                    )}
                  />
                ) : (
                  <input
                    type="text"
                    className={`form_input ${hasError ? "form_input_invalid" : ""}`}
                    placeholder={field.placeholder}
                    {...register(
                      field.name as import("react-hook-form").Path<ProductFormValuesType>,
                      {
                        required: `${field.label} is required`,
                      },
                    )}
                  />
                )}
                {hasError && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle
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

        {/* ── Features ───────────────────────────────────────────── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {PRODUCT_FORM_TEXT.SECTIONS.FEATURES}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Highlight the key selling points of your product
              </p>
            </div>
            <button
              type="button"
              onClick={() => appendFeature({ title: "", description: "" })}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
            >
              <Plus size={13} />
              {PRODUCT_FORM_TEXT.ACTIONS.ADD_FEATURE}
            </button>
          </div>

          {featureFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Sparkles
                  size={18}
                />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.FEATURES_TITLE}
              </h4>
              <p className="text-xs text-slate-400 max-w-[260px] mb-4">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.FEATURES_DESC}
              </p>
              <button
                type="button"
                onClick={() => appendFeature({ title: "", description: "" })}
                className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-4 py-2 rounded-lg hover:bg-amber-100 hover:border-amber-200 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus size={13} />
                {PRODUCT_FORM_TEXT.EMPTY_STATES.FEATURES_BTN}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureFields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white group transition-all duration-200 hover:border-indigo-200 hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)]"
                >
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm hover:border-red-200 hover:bg-red-50"
                  >
                    <Trash2
                      size={12}
                    />
                  </button>
                  <div className="mb-3">
                    <label className="form_label">
                      {PRODUCT_FORM_TEXT.LABELS.FEAT_TITLE}
                    </label>
                    <input
                      type="text"
                      className="form_input"
                      placeholder={PRODUCT_FORM_TEXT.LABELS.FEAT_TITLE_PH}
                      {...register(`features.${index}.title`, {
                        required: PRODUCT_FORM_TEXT.ERRORS.FEAT_TITLE,
                      })}
                    />
                  </div>
                  <div>
                    <label className="form_label">
                      {PRODUCT_FORM_TEXT.LABELS.DETAILS}
                    </label>
                    <textarea
                      rows={2}
                      className="form_input resize-none"
                      placeholder={PRODUCT_FORM_TEXT.LABELS.FEAT_DESC_PH}
                      {...register(`features.${index}.description`, {
                        required: PRODUCT_FORM_TEXT.ERRORS.FEAT_DESC,
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Attributes ─────────────────────────────────────────── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {PRODUCT_FORM_TEXT.SECTIONS.ATTRIBUTES}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Specify color, size, material and other variants
              </p>
            </div>
            <button
              type="button"
              onClick={() => appendAttribute({ name: "", value: "" })}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
            >
              <Plus size={13} />
              {PRODUCT_FORM_TEXT.ACTIONS.ADD_ATTRIBUTE}
            </button>
          </div>

          {attributeFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Tag size={18} />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_TITLE}
              </h4>
              <p className="text-xs text-slate-400 max-w-[260px] mb-4">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_DESC}
              </p>
              <button
                type="button"
                onClick={() => appendAttribute({ name: "", value: "" })}
                className="text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-4 py-2 rounded-lg hover:bg-violet-100 hover:border-violet-200 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus size={13} />
                {PRODUCT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_BTN}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attributeFields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white group transition-all duration-200 hover:border-violet-200 hover:shadow-[0_4px_16px_rgba(139,92,246,0.08)]"
                >
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm hover:border-red-200 hover:bg-red-50"
                  >
                    <Trash2
                      size={12}
                    />
                  </button>
                  <div className="mb-3">
                    <label className="form_label">
                      {PRODUCT_FORM_TEXT.LABELS.ATTR_TITLE}
                    </label>
                    <input
                      type="text"
                      className="form_input"
                      placeholder={PRODUCT_FORM_TEXT.LABELS.ATTR_TITLE_PH}
                      {...register(`attributes.${index}.name`, {
                        required: PRODUCT_FORM_TEXT.ERRORS.ATTR_TITLE,
                      })}
                    />
                  </div>
                  <div>
                    <label className="form_label">
                      {PRODUCT_FORM_TEXT.LABELS.DETAILS}
                    </label>
                    <textarea
                      rows={2}
                      className="form_input resize-none"
                      placeholder={PRODUCT_FORM_TEXT.LABELS.ATTR_DESC_PH}
                      {...register(`attributes.${index}.value`, {
                        required: PRODUCT_FORM_TEXT.ERRORS.ATTR_VAL,
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
