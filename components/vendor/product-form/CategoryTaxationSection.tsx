import React, { Component, ReactNode } from "react";
import { useFormContext } from "react-hook-form";

class SectionErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="section p-8 bg-red-50 text-red-600 border border-red-500 rounded-xl">
          <h3 className="font-bold text-lg mb-2">Category Section Crashed!</h3>
          <p className="text-sm break-all">{String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

import {
  Building2,
  Plus,
  FolderPlus,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ProductFormValuesType } from "@/utils/validation";
import {
  VENDOR_CREATE_CATEGORY_PATH,
  VENDOR_CREATE_TAX_PATH,
  VENDOR_CREATE_WAREHOUSE_PATH,
} from "@/constants";

interface CategoryTaxationSectionProps {
  categoryOptions: { value: string; label: string }[];
  warehouseOptions: { value: string; label: string }[];
  taxSlabsOptions: { value: string; label: string }[];
  handleSaveDraftAndRedirect: (path: string) => void;
}

/**
 * Inline SVG checkmark — no dynamic import, no Suspense risk.
 * Using DynamicIcon inside a conditionally-rendered checkbox tile caused
 * lucide-react/dynamic to throw a Promise (Suspense protocol) on first render
 * without a boundary, blanking the entire page silently.
 */
const CheckIcon = () => (
  <svg
    viewBox="0 0 12 12"
    width={10}
    height={10}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="1.5 6 4.5 9 10.5 3" />
  </svg>
);

export const CategoryTaxationSection = ({
  categoryOptions,
  warehouseOptions,
  taxSlabsOptions,
  handleSaveDraftAndRedirect,
}: CategoryTaxationSectionProps) => {
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<ProductFormValuesType>();

  const categoryName = watch("categories");

  // Defensive: RHF multi-checkbox returns an array; guard against edge cases
  const selectedCategories: string[] = Array.isArray(categoryName)
    ? categoryName
    : categoryName
      ? [categoryName as string]
      : [];

  const hasCategorySelected = selectedCategories.length > 0;

  return (
    <SectionErrorBoundary>
      <div className="section">
        <div className="section_header">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Building2 size={16} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
              {PRODUCT_FORM_TEXT.SECTIONS.CATEGORY_TAX}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select categories, assign tax rate and fulfilment warehouse
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* ── Category Checkbox List (col-span-1) ─────────────── */}
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="form_label !mb-0">
                  {PRODUCT_FORM_TEXT.LABELS.CATEGORY}{" "}
                  <span className="text-red-400 normal-case">*</span>
                </label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
                  onClick={() =>
                    handleSaveDraftAndRedirect(VENDOR_CREATE_CATEGORY_PATH)
                  }
                >
                  <Plus size={11} />
                  {PRODUCT_FORM_TEXT.ACTIONS.ADD_NEW}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl bg-white overflow-y-auto min-h-[160px] max-h-[220px] p-2 shadow-sm">
                {categoryOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-4 h-full min-h-[130px] rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-2">
                      <FolderPlus size={15} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mb-0.5">
                      {PRODUCT_FORM_TEXT.EMPTY_STATES.CATEGORY_TITLE}
                    </p>
                    <p className="text-[11px] text-slate-400 mb-3 max-w-[140px]">
                      {PRODUCT_FORM_TEXT.EMPTY_STATES.CATEGORY_DESC}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveDraftAndRedirect(VENDOR_CREATE_CATEGORY_PATH)
                      }
                      className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1"
                    >
                      <Plus size={11} />
                      {PRODUCT_FORM_TEXT.EMPTY_STATES.CATEGORY_BTN}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {categoryOptions.map((c) => {
                      const isChecked = selectedCategories.includes(c.value);
                      return (
                        <label
                          key={c.value}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                            isChecked
                              ? "bg-indigo-50 border border-indigo-100"
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-150 relative ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <CheckIcon />}
                            <input
                              type="checkbox"
                              value={c.value}
                              checked={isChecked}
                              onChange={(e) => {
                                try {
                                  const checked = e.target.checked;
                                  let newCategories = [...selectedCategories];

                                  if (checked) {
                                    newCategories.push(c.value);
                                  } else {
                                    newCategories = newCategories.filter(
                                      (val) => val !== c.value,
                                    );
                                  }

                                  setValue("categories", newCategories, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });

                                  // If unselected and it was the primary category, clear primary
                                  const currentPrimary =
                                    getValues("primaryCategory");
                                  if (!checked && currentPrimary === c.value) {
                                    setValue("primaryCategory", "", {
                                      shouldValidate: true,
                                    });
                                  }
                                } catch (err) {}
                              }}
                              className="sr-only"
                            />
                          </div>
                          <span
                            className={`text-xs font-medium leading-tight ${
                              isChecked ? "text-indigo-800" : "text-slate-600"
                            }`}
                          >
                            {c.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {errors.categories && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  {errors.categories.message}
                </p>
              )}
            </div>

            {/* ── Right 4-col sub-grid: conditionally includes Primary Category ── */}
            <div className="md:col-span-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/*
               * Primary Category — always rendered to preserve grid layout,
               * visibility toggled via CSS to prevent reflow layout jumps.
               */}
              <div
                className={
                  hasCategorySelected ? "" : "invisible pointer-events-none"
                }
              >
                <label className="form_label">
                  {PRODUCT_FORM_TEXT.LABELS.PRIMARY_CATEGORY}{" "}
                  <span className="text-red-400 normal-case">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register("primaryCategory")}
                    className="form_input appearance-none pr-9"
                  >
                    <option value="" disabled>
                      {PRODUCT_FORM_TEXT.LABELS.SELECT_PRIMARY_CATEGORY}
                    </option>
                    {selectedCategories.map((val: string) => {
                      const opt = categoryOptions.find((o) => o.value === val);
                      return (
                        <option key={val} value={val}>
                          {opt?.label ?? val}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Tax Rate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form_label !mb-0">
                    {PRODUCT_FORM_TEXT.LABELS.TAX_RATE}{" "}
                    <span className="text-red-400 normal-case">*</span>
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
                    onClick={() =>
                      handleSaveDraftAndRedirect(VENDOR_CREATE_TAX_PATH)
                    }
                  >
                    <Plus size={11} />
                    {PRODUCT_FORM_TEXT.ACTIONS.ADD_NEW}
                  </button>
                </div>
                <div className="relative">
                  <select
                    {...register("taxSlabId")}
                    className={`form_input appearance-none pr-9 ${errors.taxSlabId ? "form_input_invalid" : ""}`}
                  >
                    <option value="" disabled>
                      {PRODUCT_FORM_TEXT.LABELS.SELECT_TAX}
                    </option>
                    {taxSlabsOptions.map((t, idx) => (
                      <option key={idx} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                {errors.taxSlabId && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {errors.taxSlabId.message}
                  </p>
                )}
              </div>

              {/* Warehouse */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form_label !mb-0">
                    {PRODUCT_FORM_TEXT.LABELS.WAREHOUSE}{" "}
                    <span className="text-red-400 normal-case">*</span>
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
                    onClick={() =>
                      handleSaveDraftAndRedirect(VENDOR_CREATE_WAREHOUSE_PATH)
                    }
                  >
                    <Plus size={11} />
                    {PRODUCT_FORM_TEXT.ACTIONS.ADD_NEW}
                  </button>
                </div>
                <div className="relative">
                  <select
                    {...register("warehouseId")}
                    className={`form_input appearance-none pr-9 ${errors.warehouseId ? "form_input_invalid" : ""}`}
                  >
                    <option value="" disabled>
                      {PRODUCT_FORM_TEXT.LABELS.SELECT_WAREHOUSE}
                    </option>
                    {warehouseOptions?.map((v) => (
                      <option value={v.value} key={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                {errors.warehouseId && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {errors.warehouseId.message}
                  </p>
                )}
              </div>

              {/* Status — inside the grid, not orphaned below */}
              <div>
                <label className="form_label">
                  {PRODUCT_FORM_TEXT.LABELS.STATUS}{" "}
                  <span className="text-red-400 normal-case">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register("status")}
                    className={`form_input appearance-none pr-9 ${errors.status ? "form_input_invalid" : ""}`}
                  >
                    <option value="" disabled>
                      {PRODUCT_FORM_TEXT.LABELS.SELECT_STATUS}
                    </option>
                    <option value="active">
                      {PRODUCT_FORM_TEXT.LABELS.STATUS_ACTIVE}
                    </option>
                    <option value="inactive">
                      {PRODUCT_FORM_TEXT.LABELS.STATUS_INACTIVE}
                    </option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};
