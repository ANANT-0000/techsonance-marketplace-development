import { useEffect, useState } from "react";

import { Search, X } from "lucide-react";
import { buildIndentedCategoryOptions } from "./buildIndentedCategoryOptions";
import type { CatOption } from "@/utils/Types";
import { CMS_CATEGORY_PICKER_TEXT } from "@/constants/vendorText";

function buildCategoryPath(id: string, cats: CatOption[]): string {
  const safeCats = Array.isArray(cats) ? cats : [];
  const map = new Map(safeCats.map((c) => [c.id, c]));
  const parts: string[] = [];
  let current: CatOption | undefined = map.get(id);
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);
    current = current.parent_id ? map.get(current.parent_id) : undefined;
  }
  return parts.join(" › ");
}

export function SearchableCategoryPicker({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (id: string | null) => void;
  categories: CatOption[];
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(handler);
  }, [query]);

  const options = buildIndentedCategoryOptions(categories);
  const filtered = debouncedQuery.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(debouncedQuery.toLowerCase()),
      )
    : options;

  const maxDisplay = 100;
  const displayed = filtered.slice(0, maxDisplay);

  const selectedLabel = value
    ? (options.find((o) => o.value === value)?.label ?? CMS_CATEGORY_PICKER_TEXT.UNKNOWN)
    : "";

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder={CMS_CATEGORY_PICKER_TEXT.SEARCH_PLACEHOLDER}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-8 pr-8 py-2.5 text-xs bg-white border border-stone-200 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-200 focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40 hover:border-stone-300"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl bg-white divide-y divide-stone-50 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        {/* Clear option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
            !value
              ? "bg-amber-50 text-amber-900 font-semibold"
              : "text-stone-400 hover:bg-stone-50"
          }`}
        >
          {CMS_CATEGORY_PICKER_TEXT.ALL_ACTIVE}
        </button>

        {filtered.length > maxDisplay && (
          <p className="px-3 py-1.5 text-[10px] text-amber-800 bg-amber-50/70 font-medium">
            {CMS_CATEGORY_PICKER_TEXT.SHOWING_FIRST(maxDisplay, filtered.length)}
          </p>
        )}

        {displayed.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-stone-400">
              {CMS_CATEGORY_PICKER_TEXT.NO_MATCH(debouncedQuery)}
            </p>
          </div>
        )}

        {displayed.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setQuery("");
              }}
              className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                isSelected
                  ? "bg-amber-50 text-amber-900 font-semibold"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Selected breadcrumb */}
      {selectedLabel && (
        <p className="text-[11px] text-amber-800 font-medium truncate">
          ✓ {buildCategoryPath(value, categories)}
        </p>
      )}
    </div>
  );
}
