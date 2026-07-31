"use client";
import { SlidersHorizontal, ChevronUp, ChevronDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Category } from "@/utils/Types";
import { SortBy } from "@/utils/commonAPiClient";
import { SORT_OPTIONS } from "./ShoppingList";
import { FILTER_SIDEBAR_TEXT } from "@/constants/customerText";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  selectedCategories: string[];
}

interface FilterSidebarProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  totalResults: number;
}

const DEFAULT_MAX = 50000;
const DEFAULT_FILTERS: FilterState = {
  minPrice: 0,
  maxPrice: DEFAULT_MAX,
  selectedCategories: [],
};

// Desktop layout component
function DesktopSidebarContent({
  categories,
  filters,
  onFiltersChange,
  isPriceOpen,
  setIsPriceOpen,
}: {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  isPriceOpen: boolean;
  setIsPriceOpen: (v: boolean) => void;
}) {
  const toggleCategory = (cat: Category) => {
    const isCurrentlySelected =
      filters.selectedCategories.includes(cat.id) ||
      filters.selectedCategories.includes(cat.slug);
    const next = isCurrentlySelected ? [] : [cat.slug];
    onFiltersChange({ ...filters, selectedCategories: next });
  };

  return (
    <div className="flex flex-col gap-8 h-full pr-4">
      {/* Desktop Categories (Left-Aligned Checkboxes) */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-theme-body-plus font-bold text-gray-900 mb-4">
            {FILTER_SIDEBAR_TEXT.CATEGORY}
          </h2>
          <div className="flex flex-col gap-3">
            {categories.map((cat) => {
              const isSelected =
                filters.selectedCategories.includes(cat.id) ||
                filters.selectedCategories.includes(cat.slug);
              return (
                <label
                  key={cat.id}
                  className="flex items-center gap-3 cursor-pointer group py-1"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCategory(cat)}
                    className="border-gray-300 data-[state=checked]:bg-theme-primary data-[state=checked]:border-theme-primary"
                  />
                  <span
                    className={`text-theme-body-sm ${isSelected ? "text-gray-900 font-medium" : "text-gray-500 group-hover:text-gray-700"}`}
                  >
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      <hr className="border-gray-100" />

      {/* Desktop Price Range (Input Boxes) */}
      <section>
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <h2 className="text-theme-body-plus font-bold text-gray-900">
            {FILTER_SIDEBAR_TEXT.PRICE_RANGE}
          </h2>
          {isPriceOpen ? (
            <ChevronUp
              size={16}
              className="text-gray-400 group-hover:text-gray-600"
            />
          ) : (
            <ChevronDown
              size={16}
              className="text-gray-400 group-hover:text-gray-600"
            />
          )}
        </button>

        <AnimatePresence>
          {isPriceOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="px-2 pt-4 pb-2">
                <Slider
                  min={0}
                  max={DEFAULT_MAX}
                  step={100}
                  value={[filters.minPrice, filters.maxPrice]}
                  onValueChange={(val) => 
                    onFiltersChange({ ...filters, minPrice: val[0], maxPrice: val[1] })
                  }
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-gray-400 transition-colors">
                  <span className="text-gray-500 mr-1 text-theme-caption-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        minPrice: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-transparent outline-none text-theme-body-sm font-medium text-gray-900"
                  />
                </div>
                <span className="text-gray-400 text-theme-body-sm">
                  {FILTER_SIDEBAR_TEXT.TO}
                </span>
                <div className="flex-1 flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-gray-400 transition-colors">
                  <span className="text-gray-500 mr-1 text-theme-caption-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        maxPrice: Math.min(DEFAULT_MAX, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-transparent outline-none text-theme-body-sm font-medium text-gray-900"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

export function FilterSidebar({
  categories,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  totalResults,
}: FilterSidebarProps) {
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Mobile bottom sheet state

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleClearAll = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const toggleCategory = (cat: Category) => {
    const isCurrentlySelected =
      filters.selectedCategories.includes(cat.id) ||
      filters.selectedCategories.includes(cat.slug);
    const next = isCurrentlySelected ? [] : [cat.slug];
    onFiltersChange({ ...filters, selectedCategories: next });
  };

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden lg:block w-[240px] flex-shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
        <DesktopSidebarContent
          categories={categories}
          filters={filters}
          onFiltersChange={onFiltersChange}
          isPriceOpen={isPriceOpen}
          setIsPriceOpen={setIsPriceOpen}
        />
      </aside>

      {/* Mobile Filter Button (Top Right of product grid) */}
      <div className="lg:hidden absolute top-0 right-4 z-10 mt-1">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0A0A0B] text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-md hover:bg-black transition-colors"
        >
          <SlidersHorizontal size={14} />
          <span className="font-semibold text-theme-body-sm">
            {FILTER_SIDEBAR_TEXT.FILTER}
          </span>
        </button>
      </div>

      {/* Mobile Bottom Sheet Modal */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="bg-white rounded-t-3xl h-[85vh] flex flex-col lg:hidden p-0 gap-0 overflow-hidden [&>button]:hidden">
          {/* Drag Handle & Header */}
          <SheetHeader className="flex-shrink-0 pt-3 pb-4 px-6 border-b border-gray-100 flex flex-col items-center relative bg-white space-y-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full mb-5" />
            <div className="w-full flex items-center justify-between">
              <SheetTitle className="text-theme-h5 font-bold text-gray-900">
                {FILTER_SIDEBAR_TEXT.FILTERS}
              </SheetTitle>
              <button
                onClick={handleClearAll}
                className="text-theme-body-plus font-semibold text-theme-primary hover:text-theme-secondary transition-colors"
              >
                {FILTER_SIDEBAR_TEXT.CLEAR_ALL}
              </button>
            </div>
          </SheetHeader>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-28">
                {/* Sort By Pills */}
                <section>
                  <h3 className="text-theme-body font-bold text-gray-900 mb-4">
                    {FILTER_SIDEBAR_TEXT.SORT_BY}
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onSortChange(opt.value)}
                        className={`px-5 py-2.5 rounded-full text-theme-body-sm font-medium transition-colors border ${
                          sortBy === opt.value
                            ? "bg-[#0A0A0B] text-white border-[#0A0A0B]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Price Range Visual */}
                <section>
                  <h3 className="text-theme-body font-bold text-gray-900 mb-5">
                    {FILTER_SIDEBAR_TEXT.PRICE_RANGE}
                  </h3>
                  <div className="w-full bg-theme-primary/10 h-2.5 rounded-full mb-4 relative">
                    <div
                      className="absolute h-full bg-theme-primary rounded-full"
                      style={{
                        left: `${(filters.minPrice / DEFAULT_MAX) * 100}%`,
                        right: `${100 - (filters.maxPrice / DEFAULT_MAX) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-theme-body-plus font-medium text-gray-700">
                    <span>$0</span>
                    <span>$5000+</span>
                  </div>
                </section>

                {/* Category (Right-Aligned Checkboxes) */}
                <section>
                  <h3 className="text-theme-body font-bold text-gray-900 mb-4">
                    {FILTER_SIDEBAR_TEXT.CATEGORY}
                  </h3>
                  <div className="flex flex-col gap-5">
                    {categories.map((cat) => {
                      const isSelected =
                        filters.selectedCategories.includes(cat.id) ||
                        filters.selectedCategories.includes(cat.slug);
                      return (
                        <label
                          key={cat.id}
                          className="flex items-center justify-between cursor-pointer group"
                        >
                          <span className="text-gray-700 text-theme-body-plus">
                            {cat.name}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-[4px] flex items-center justify-center border transition-colors ${isSelected ? "bg-[#0A0A0B] border-[#0A0A0B]" : "border-gray-300 bg-white group-hover:border-gray-400"}`}
                          >
                            {isSelected && (
                              <Check
                                size={14}
                                className="text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => toggleCategory(cat)}
                          />
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Sticky Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom border-t border-gray-100 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-[#0A0A0B] hover:bg-black text-white font-semibold py-4 rounded-[12px] text-theme-body-plus transition-colors"
                >
                  {FILTER_SIDEBAR_TEXT.APPLY} {totalResults}{" "}
                  {FILTER_SIDEBAR_TEXT.RESULTS}
                </button>
              </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
