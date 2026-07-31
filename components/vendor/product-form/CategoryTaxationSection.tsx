import React, { Component, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFormContext } from "react-hook-form";
import { SecureErrorHandler } from "@/utils/error/error.handler";

import { Building2, Plus, FolderPlus, ChevronDown, Check } from "lucide-react";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ProductFormValuesType } from "@/utils/validation";
import {
  VENDOR_CREATE_CATEGORY_PATH,
  VENDOR_CREATE_TAX_PATH,
  VENDOR_CREATE_WAREHOUSE_PATH,
} from "@/constants";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

class SectionErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: unknown }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown) {
    SecureErrorHandler.handle(error);
  }
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

interface CategoryTaxationSectionProps {
  categoryOptions: { value: string; label: string }[];
  warehouseOptions: { value: string; label: string }[];
  taxSlabsOptions: { value: string; label: string }[];
  handleSaveDraftAndRedirect: (path: string) => void;
}

const CATEGORY_FIELDS = [
  {
    name: "taxSlabId" as const,
    labelKey: "TAX_RATE" as const,
    placeholderKey: "SELECT_TAX" as const,
    addPath: VENDOR_CREATE_TAX_PATH,
  },
  {
    name: "warehouseId" as const,
    labelKey: "WAREHOUSE" as const,
    placeholderKey: "SELECT_WAREHOUSE" as const,
    addPath: VENDOR_CREATE_WAREHOUSE_PATH,
  },
  {
    name: "status" as const,
    labelKey: "STATUS" as const,
    placeholderKey: "SELECT_STATUS" as const,
    addPath: null,
  },
] as const;

export const CategoryTaxationSection = ({
  categoryOptions,
  warehouseOptions,
  taxSlabsOptions,
  handleSaveDraftAndRedirect,
}: CategoryTaxationSectionProps) => {
  const { control, watch, setValue, getValues } =
    useFormContext<ProductFormValuesType>();

  const categoryName = watch("categories");

  const selectedCategories: string[] = Array.isArray(categoryName)
    ? categoryName
    : categoryName
      ? [categoryName as string]
      : [];

  const showPrimarySelector = selectedCategories.length >= 2;

  // Auto-manage primaryCategory based on selection count
  useEffect(() => {
    if (selectedCategories.length === 0) {
      // Nothing selected — clear primary
      setValue("primaryCategory", "", { shouldValidate: false });
    } else if (selectedCategories.length === 1) {
      // Exactly one — auto-set it as primary, no need for selector
      setValue("primaryCategory", selectedCategories[0], {
        shouldValidate: true,
      });
    } else {
      // 2+ selected — keep existing primary only if it's still in the list
      const currentPrimary = getValues("primaryCategory");
      if (
        !currentPrimary ||
        !selectedCategories.includes(currentPrimary as string)
      ) {
        setValue("primaryCategory", "", { shouldValidate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories.join(",")]);

  const getOptionsForField = (
    name: (typeof CATEGORY_FIELDS)[number]["name"],
  ) => {
    if (name === "taxSlabId") return taxSlabsOptions;
    if (name === "warehouseId") return warehouseOptions ?? [];
    if (name === "status")
      return [
        { value: "active", label: PRODUCT_FORM_TEXT.LABELS.STATUS_ACTIVE },
        { value: "inactive", label: PRODUCT_FORM_TEXT.LABELS.STATUS_INACTIVE },
      ];
    return [];
  };

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

        <div className="p-6 overflow-hidden">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
            style={{
              gridTemplateColumns: `repeat(${showPrimarySelector ? 5 : 4}, minmax(0, 1fr))`,
              transition: "grid-template-columns 0.35s ease",
            }}
          >
            {/* ── Category Multi-Select Popover ─────────────────────── */}
            <div className="w-full min-w-0 overflow-hidden">
              <FormField
                control={control}
                name="categories"
                render={() => (
                  <FormItem className="min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <FormLabel className="!mb-0">
                        {PRODUCT_FORM_TEXT.LABELS.CATEGORY}{" "}
                        <span className="text-red-400 normal-case">*</span>
                      </FormLabel>
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors shrink-0"
                        onClick={() =>
                          handleSaveDraftAndRedirect(
                            VENDOR_CREATE_CATEGORY_PATH,
                          )
                        }
                      >
                        <Plus size={11} />
                        {PRODUCT_FORM_TEXT.ACTIONS.ADD_NEW}
                      </button>
                    </div>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full min-w-0 flex items-center justify-between gap-2 px-3 h-9 rounded-md border border-input bg-background text-sm shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                          >
                            <span className="truncate text-left text-sm">
                              {selectedCategories.length === 0 ? (
                                <span className="text-muted-foreground">
                                  {PRODUCT_FORM_TEXT.LABELS.CATEGORY}
                                </span>
                              ) : selectedCategories.length === 1 ? (
                                (categoryOptions.find(
                                  (o) => o.value === selectedCategories[0],
                                )?.label ?? selectedCategories[0])
                              ) : (
                                `${selectedCategories.length} selected`
                              )}
                            </span>
                            <ChevronDown
                              size={14}
                              className="shrink-0 text-muted-foreground"
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                          {categoryOptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                              <div className="w-8 h-8 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-2">
                                <FolderPlus size={15} />
                              </div>
                              <p className="text-xs font-semibold text-slate-700 mb-0.5">
                                {PRODUCT_FORM_TEXT.EMPTY_STATES.CATEGORY_TITLE}
                              </p>
                              <p className="text-[11px] text-slate-400 mb-3 max-w-[140px]">
                                {PRODUCT_FORM_TEXT.EMPTY_STATES.CATEGORY_DESC}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  handleSaveDraftAndRedirect(
                                    VENDOR_CREATE_CATEGORY_PATH,
                                  )
                                }
                                className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 h-7"
                              >
                                <Plus size={11} className="mr-1" />
                                {PRODUCT_FORM_TEXT.EMPTY_STATES.CATEGORY_BTN}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              {categoryOptions.map((c) => {
                                const isChecked = selectedCategories.includes(
                                  c.value,
                                );
                                return (
                                  <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => {
                                      try {
                                        let newCategories = [
                                          ...selectedCategories,
                                        ];
                                        if (isChecked) {
                                          newCategories = newCategories.filter(
                                            (val) => val !== c.value,
                                          );
                                          const currentPrimary =
                                            getValues("primaryCategory");
                                          if (currentPrimary === c.value) {
                                            setValue("primaryCategory", "", {
                                              shouldValidate: true,
                                            });
                                          }
                                        } else {
                                          newCategories.push(c.value);
                                        }
                                        setValue("categories", newCategories, {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                        });
                                      } catch (err) {
                                        SecureErrorHandler.handle(err);
                                      }
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                                      isChecked
                                        ? "bg-indigo-50 border border-indigo-100"
                                        : "hover:bg-slate-50 border border-transparent"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
                                        isChecked
                                          ? "bg-indigo-600 border-indigo-600 text-white"
                                          : "border-slate-300 bg-white"
                                      }`}
                                    >
                                      {isChecked && (
                                        <Check size={10} strokeWidth={3} />
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs font-medium leading-tight ${
                                        isChecked
                                          ? "text-indigo-800"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {c.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Primary Category — appears only when 2+ categories are selected ── */}
            <AnimatePresence initial={false}>
              {showPrimarySelector && (
                <motion.div
                  key="primaryCategory"
                  initial={{ opacity: 0, width: 0, overflow: "hidden" }}
                  animate={{ opacity: 1, width: "auto", overflow: "visible" }}
                  exit={{ opacity: 0, width: 0, overflow: "hidden" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="min-w-0"
                >
                  <FormField
                    control={control}
                    name="primaryCategory"
                    render={({ field: hookField }) => (
                      <FormItem className="min-w-0 max-w-full overflow-hidden">
                        <FormLabel className="!mb-1.5 block">
                          {PRODUCT_FORM_TEXT.LABELS.PRIMARY_CATEGORY}{" "}
                          <span className="text-red-400 normal-case">*</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            value={
                              typeof hookField.value === "string"
                                ? hookField.value
                                : ""
                            }
                            onChange={(e) => hookField.onChange(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-foreground appearance-none cursor-pointer"
                            style={{
                              backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 8px center",
                              paddingRight: "32px",
                            }}
                          >
                            <option value="" disabled>
                              {PRODUCT_FORM_TEXT.LABELS.SELECT_PRIMARY_CATEGORY}
                            </option>
                            {selectedCategories.map((val) => {
                              const opt = categoryOptions.find(
                                (o) => o.value === val,
                              );
                              return (
                                <option key={val} value={val}>
                                  {opt?.label ?? val}
                                </option>
                              );
                            })}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Right selectors (Tax, Warehouse, Status) ── */}
            {CATEGORY_FIELDS.map(
              ({ name, labelKey, placeholderKey, addPath }) => {
                const options = getOptionsForField(name);
                return (
                  <div key={name} className="min-w-0 overflow-hidden">
                    <FormField
                      control={control}
                      name={name}
                      render={({ field: hookField }) => (
                        <FormItem className="min-w-0 max-w-full overflow-hidden">
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="!mb-0">
                              {PRODUCT_FORM_TEXT.LABELS[labelKey]}{" "}
                              <span className="text-red-400 normal-case">
                                *
                              </span>
                            </FormLabel>
                            {addPath && (
                              <button
                                type="button"
                                className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors shrink-0"
                                onClick={() =>
                                  handleSaveDraftAndRedirect(addPath)
                                }
                              >
                                <Plus size={11} />
                                {PRODUCT_FORM_TEXT.ACTIONS.ADD_NEW}
                              </button>
                            )}
                          </div>
                          <FormControl>
                            <select
                              value={
                                typeof hookField.value === "string"
                                  ? hookField.value
                                  : ""
                              }
                              onChange={(e) =>
                                hookField.onChange(e.target.value)
                              }
                              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-foreground appearance-none cursor-pointer"
                              style={{
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 8px center",
                                paddingRight: "32px",
                              }}
                            >
                              <option value="" disabled>
                                {PRODUCT_FORM_TEXT.LABELS[placeholderKey]}
                              </option>
                              {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};
