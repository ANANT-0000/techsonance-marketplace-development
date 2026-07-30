"use client";
import { getClientCompanyId } from "@/utils/getCompanyId";
import React, { useState, useReducer, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Save,
  LayoutPanelLeft,
  ShoppingCart,
  User,
  Link as LinkIcon,
  Heart,
  FolderTree,
  Grid3X3,
  MousePointerClick,
  Info,
  CheckCircle2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { SessionErrorCard } from "../SessionErrorCard";
import { CmsSection } from "./Section";
import { InputField } from "./InputField";
import { SelectField } from "./SelectField";
import { ImageUploadField } from "./ImageUploadField";
import AxiosAPI from "@/lib/axios";
import {
  upsertNavbarMenu,
  createNavbarItem,
  updateNavbarItem,
  deleteNavbarItem,
  UpsertNavMenuPayload,
  CreateNavItemPayload,
  NavItemMetaPayload,
  fetchVendorActiveProducts,
  fetchNavbarTemplates,
  fetchProductFilters,
  copyProductFilter,
} from "@/utils/vendorApiClient";
import { authToken } from "@/utils/authToken";
import { dispatchNavbarChange } from "@/utils/cache";
import toast from "react-hot-toast";
import {
  NavItemColType,
  NavItemType,
  NavMenuLogoAlignment,
  NavMenuPosition,
  SiteMap,
  NavLayoutType,
  AnnouncementItem,
} from "@/utils/Types";
import { PageType } from "@/app/vendor/cms/page";
import { CmsNavbarConfig } from "@/constants";
import { ANNOUNCEMENT_FEATURES } from "@/components/customer/features/AnnouncementFeatureRegistry";
import { NavbarPreview } from "./NavbarPreview";

interface L2Column {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  meta: NavItemMetaPayload;
  category_id?: string | null;
  item_type?: NavItemType;
}

interface L1Item {
  id: string;
  label: string;
  href: string;
  item_type: NavItemType;
  category_id?: string | null;
  has_mega_menu: boolean;
  sort_order: number;
  meta: NavItemMetaPayload;
  megaMenuColumns: L2Column[];
  layout_type?: NavLayoutType;
  nav_item_id?: string | null;
  slug?: string | null;
  config?: any;
  target_route?: string | null;
  root_category_id?: string | null;
}

export interface NavbarTemplate {
  id: string;
  key: string;
  label: string;
  base_path: string;
}

export interface ProductFilter {
  id: string;
  name: string;
}

interface NavbarData {
  settings: UpsertNavMenuPayload;
  menu_id: string | null;
  navigationItems: L1Item[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
export interface CatOption {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}
const LAYOUT_OPTIONS = [
  {
    value: NavLayoutType.NONE,
    icon: MousePointerClick,
    label: "Simple Link",
    description: "A plain navigation link. Optionally add a mega-menu below.",
    color: "border-gray-200 bg-white",
    activeColor: "border-slate-900 bg-slate-50 text-slate-900",
  },
  {
    value: NavLayoutType.DIRECTORY,
    icon: FolderTree,
    label: "Category Directory",
    description:
      "Auto-generates a full category tree from your selected root category.",
    color: "border-gray-200 bg-white",
    activeColor: "border-indigo-500 bg-slate-50 text-indigo-900",
  },
  {
    value: NavLayoutType.GRID,
    icon: Grid3X3,
    label: "Category Grid",
    description:
      "Auto-generates a visual grid layout from your selected root category.",
    color: "border-gray-200 bg-white",
    activeColor: "border-emerald-500 bg-emerald-50 text-emerald-900",
  },
];

const COL_TYPE_OPTIONS = [
  { value: NavItemColType.SUBCATEGORIES, label: "Subcategory Links" },
  { value: NavItemColType.BRANDS, label: "Brand Links" },
  { value: NavItemColType.PROMOTION, label: "Promotion Banner" },
  { value: NavItemColType.PRODUCTS, label: "Manual Product Picks" },
];

const ALIGNMENT_OPTIONS = [
  { value: NavMenuLogoAlignment.LEFT, label: "Left" },
  { value: NavMenuLogoAlignment.CENTER, label: "Center" },
];
const POSITION_OPTIONS = [
  { value: NavMenuPosition.STICKY, label: "Sticky (follows scroll)" },
  { value: NavMenuPosition.RELATIVE, label: "Static (stays at top)" },
];

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
          value ? "bg-slate-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function SaveBtn({
  onClick,
  saving,
  label = "Save",
}: {
  onClick: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
    >
      <Save className="w-3.5 h-3.5" />
      {saving ? "Saving…" : label}
    </button>
  );
}

/** Resolves a category's display path — "Electronics › Audio › Headphones" */
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

/** Builds an indented flat list for category selects */
function buildIndentedCategoryOptions(cats: CatOption[]) {
  const safeCats = Array.isArray(cats) ? cats : [];
  const byParent = new Map<string | null, CatOption[]>();
  safeCats.forEach((c) => {
    const key = c.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  });
  const options: { value: string; label: string }[] = [];
  const visited = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    (byParent.get(parentId) ?? []).forEach((c) => {
      if (visited.has(c.id)) return;
      visited.add(c.id);
      options.push({
        value: c.id,
        label: `${"—".repeat(depth)}${depth ? " " : ""}${c.name}`,
      });
      walk(c.id, depth + 1);
      visited.delete(c.id);
    });
  };
  walk(null, 0);
  return options;
}

// ─── Searchable Category Picker ───────────────────────────────────────────────
/** Inline searchable picker for root category — replaces the plain <SelectField> */
function SearchableCategoryPicker({
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
    ? (options.find((o) => o.value === value)?.label ?? "Unknown")
    : "";

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Scrollable list */}
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-50">
        {/* Clear option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
            !value
              ? "bg-amber-100 text-amber-800 font-semibold"
              : "text-gray-400 hover:bg-gray-50"
          }`}
        >
          — All active categories —
        </button>

        {filtered.length > maxDisplay && (
          <p className="px-3 py-1.5 text-[10px] text-amber-600 bg-amber-50 font-medium">
            Showing first {maxDisplay} of {filtered.length} categories. Refine
            your search to find more.
          </p>
        )}

        {displayed.length === 0 && (
          <p className="px-3 py-3 text-xs text-gray-400">
            No categories match your search.
          </p>
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
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                isSelected
                  ? "bg-amber-100 text-amber-800 font-semibold"
                  : "text-gray-700 hover:bg-amber-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Selected breadcrumb */}
      {selectedLabel && (
        <p className="text-[11px] text-amber-700 font-medium truncate">
          ✓ {buildCategoryPath(value, categories)}
        </p>
      )}
    </div>
  );
}

export enum L2ColumnActionType {
  SET_DRAFT = "SET_DRAFT",
  PATCH_DRAFT = "PATCH_DRAFT",
  PATCH_META = "PATCH_META",
  SET_SAVING = "SET_SAVING",
  TOGGLE_OPEN = "TOGGLE_OPEN",
  SET_ERROR = "SET_ERROR",
  RESET_ERROR = "RESET_ERROR",
}

export interface L2ColumnState {
  draft: L2Column;
  saving: boolean;
  open: boolean;
  error: string | null;
}

export type L2ColumnAction =
  | { type: L2ColumnActionType.SET_DRAFT; payload: L2Column }
  | {
      type: L2ColumnActionType.PATCH_DRAFT;
      payload: { field: keyof L2Column; value: any };
    }
  | {
      type: L2ColumnActionType.PATCH_META;
      payload: { field: keyof NavItemMetaPayload; value: any };
    }
  | { type: L2ColumnActionType.SET_SAVING; payload: boolean }
  | { type: L2ColumnActionType.TOGGLE_OPEN }
  | { type: L2ColumnActionType.SET_ERROR; payload: string }
  | { type: L2ColumnActionType.RESET_ERROR };

function l2ColumnReducer(
  state: L2ColumnState,
  action: L2ColumnAction,
): L2ColumnState {
  switch (action.type) {
    case L2ColumnActionType.SET_DRAFT:
      return { ...state, draft: action.payload };
    case L2ColumnActionType.PATCH_DRAFT:
      return {
        ...state,
        draft: { ...state.draft, [action.payload.field]: action.payload.value },
      };
    case L2ColumnActionType.PATCH_META:
      return {
        ...state,
        draft: {
          ...state.draft,
          meta: {
            ...state.draft.meta,
            [action.payload.field]: action.payload.value,
          },
        },
      };
    case L2ColumnActionType.SET_SAVING:
      return { ...state, saving: action.payload };
    case L2ColumnActionType.TOGGLE_OPEN:
      return { ...state, open: !state.open };
    case L2ColumnActionType.SET_ERROR:
      return { ...state, error: action.payload };
    case L2ColumnActionType.RESET_ERROR:
      return { ...state, error: null };
    default:
      const _exhaustiveCheck: never = action as never;
      return state;
  }
}

function L2ColumnEditor({
  col,
  categories: rawCategories,
  templates: rawTemplates,
  filters: rawFilters,
  products: rawProducts,
  menuId,
  token,
  companyId,
  onSaved,
  onDeleted,
}: {
  col: L2Column;
  categories: CatOption[];
  templates: NavbarTemplate[];
  filters: ProductFilter[];
  products: { id: string; name: string }[];
  menuId: string;
  token: string;
  companyId: string;
  onSaved: (updated: L2Column) => void;
  onDeleted: (id: string) => void;
}) {
  const categories = rawCategories || [];
  const templates = rawTemplates || [];
  const filters = rawFilters || [];
  const products = rawProducts || [];
  const [state, dispatch] = useReducer(l2ColumnReducer, {
    draft: { ...col, meta: col.meta || {} },
    saving: false,
    open: false,
    error: null,
  });
  const { draft, saving, open, error } = state;

  const patch = (field: keyof L2Column, val: any) =>
    dispatch({
      type: L2ColumnActionType.PATCH_DRAFT,
      payload: { field, value: val },
    });
  const patchMeta = (field: keyof NavItemMetaPayload, val: any) =>
    dispatch({
      type: L2ColumnActionType.PATCH_META,
      payload: { field, value: val },
    });

  const selectedCategory = categories.find((c) => c.id === draft.category_id);
  const save = async () => {
    dispatch({ type: L2ColumnActionType.SET_SAVING, payload: true });
    dispatch({ type: L2ColumnActionType.RESET_ERROR });
    try {
      const res = await updateNavbarItem(
        col.id,
        {
          label: draft.label,
          sort_order: draft.sort_order,
          meta: draft.meta,
        },
        token,
        companyId,
      );
      dispatch({ type: L2ColumnActionType.SET_SAVING, payload: false });
      if (res?.success === false) {
        const errorMsg = res?.message || CmsNavbarConfig.ERROR_SAVE_COLUMN;
        dispatch({ type: L2ColumnActionType.SET_ERROR, payload: errorMsg });
        toast.error(errorMsg);
        return;
      }
      toast.success(CmsNavbarConfig.SUCCESS_SAVE_COLUMN);
      onSaved({ ...draft, id: col.id });
      dispatchNavbarChange();
    } catch {
      dispatch({ type: L2ColumnActionType.SET_SAVING, payload: false });
      dispatch({
        type: L2ColumnActionType.SET_ERROR,
        payload: CmsNavbarConfig.ERROR_SAVE_COLUMN,
      });
      toast.error(CmsNavbarConfig.ERROR_SAVE_COLUMN);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete column "${col.label}"?`)) return;
    try {
      const res = await deleteNavbarItem(col.id, token, companyId);
      if (res?.success === false) {
        toast.error(res?.message || CmsNavbarConfig.ERROR_DELETE_COLUMN);

        return;
      }
      toast.success(CmsNavbarConfig.SUCCESS_DELETE_COLUMN);
      onDeleted(col.id);
      dispatchNavbarChange();
    } catch (err) {
      toast.error(CmsNavbarConfig.ERROR_DELETE_COLUMN);
    }
  };

  const isPromo = draft.meta.col_type === NavItemColType.PROMOTION;
  const isSubcat = draft.meta.col_type === NavItemColType.SUBCATEGORIES;
  const isProducts = draft.meta.col_type === NavItemColType.PRODUCTS;
  const colTypeLabel =
    COL_TYPE_OPTIONS.find((o) => o.value === draft.meta.col_type)?.label ??
    "Subcategory Links";

  return (
    <div className="border border-gray-100 rounded-xl bg-gray-50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
        <span className="flex-1 text-xs font-semibold text-gray-700 truncate">
          {draft.label || "Unnamed Column"}
        </span>
        <span className="text-[10px] bg-slate-100 text-slate-900 font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
          {colTypeLabel}
        </span>
        <button
          onClick={() => dispatch({ type: L2ColumnActionType.TOGGLE_OPEN })}
          className="p-1 text-gray-400 hover:text-gray-700"
        >
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={remove}
          className="p-1 text-red-400 hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Column Heading"
              value={draft.label}
              onChange={(v: string) => patch("label", v)}
            />
            <SelectField
              label="Column Type"
              value={draft.meta.col_type || NavItemColType.SUBCATEGORIES}
              onChange={(v: string) => patchMeta("col_type", v)}
              options={COL_TYPE_OPTIONS}
            />
          </div>

          {isSubcat && (
            <SelectField
              label="Source Category (auto-fills its subcategories)"
              value={draft.category_id || ""}
              onChange={(v: string) => {
                const cat = categories.find((c) => c.id === v);
                dispatch({
                  type: L2ColumnActionType.SET_DRAFT,
                  payload: {
                    ...draft,
                    category_id: v || null,
                    label:
                      !draft.label ||
                      draft.label === "Unnamed Column" ||
                      draft.label === "New Column"
                        ? cat?.name || draft.label
                        : draft.label,
                  },
                });
              }}
              options={[
                { value: "", label: "— No category (manual links) —" },
                ...buildIndentedCategoryOptions(categories),
              ]}
            />
          )}

          {isProducts && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Products in this column
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                {products.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-3">
                    No active products found for this store.
                  </p>
                )}
                {products.map((p) => {
                  const checked = (draft.meta.product_ids || []).includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = draft.meta.product_ids || [];
                          const next = e.target.checked
                            ? [...current, p.id]
                            : current.filter((id) => id !== p.id);
                          patchMeta("product_ids", next);
                        }}
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {isPromo && (
            <>
              <ImageUploadField
                label="Promo Image"
                value={draft.meta.promo_image_url || ""}
                onChange={(v: string) => patchMeta("promo_image_url", v)}
                onAutoSave={async () => {}}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Promo Title"
                  value={draft.meta.promo_title || ""}
                  onChange={(v: string) => patchMeta("promo_title", v)}
                />
                <InputField
                  label="CTA Label (e.g. Shop Now)"
                  value={draft.meta.promo_title || ""}
                  onChange={(v: string) => patchMeta("promo_title", v)}
                />
              </div>
              <InputField
                label="Promo Subtitle"
                value={draft.meta.promo_subtitle || ""}
                onChange={(v: string) => patchMeta("promo_subtitle", v)}
                textarea
              />
            </>
          )}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <div className="flex justify-end">
            <SaveBtn onClick={save} saving={saving} label="Save Column" />
          </div>
        </div>
      )}
    </div>
  );
}

export enum L1ItemActionType {
  SET_DRAFT = "SET_DRAFT",
  PATCH_DRAFT = "PATCH_DRAFT",
  SET_SAVING = "SET_SAVING",
  TOGGLE_OPEN = "TOGGLE_OPEN",
  SET_ADDING_COL = "SET_ADDING_COL",
  SET_ERROR = "SET_ERROR",
  RESET_ERROR = "RESET_ERROR",
}

export interface L1ItemState {
  draft: L1Item;
  saving: boolean;
  open: boolean;
  addingCol: boolean;
  error: string | null;
}

export type L1ItemAction =
  | { type: L1ItemActionType.SET_DRAFT; payload: L1Item }
  | {
      type: L1ItemActionType.PATCH_DRAFT;
      payload: { field: keyof L1Item; value: any };
    }
  | { type: L1ItemActionType.SET_SAVING; payload: boolean }
  | { type: L1ItemActionType.TOGGLE_OPEN }
  | { type: L1ItemActionType.SET_ADDING_COL; payload: boolean }
  | { type: L1ItemActionType.SET_ERROR; payload: string }
  | { type: L1ItemActionType.RESET_ERROR };

function l1ItemReducer(state: L1ItemState, action: L1ItemAction): L1ItemState {
  switch (action.type) {
    case L1ItemActionType.SET_DRAFT:
      return { ...state, draft: action.payload };
    case L1ItemActionType.PATCH_DRAFT:
      return {
        ...state,
        draft: { ...state.draft, [action.payload.field]: action.payload.value },
      };
    case L1ItemActionType.SET_SAVING:
      return { ...state, saving: action.payload };
    case L1ItemActionType.TOGGLE_OPEN:
      return { ...state, open: !state.open };
    case L1ItemActionType.SET_ADDING_COL:
      return { ...state, addingCol: action.payload };
    case L1ItemActionType.SET_ERROR:
      return { ...state, error: action.payload };
    case L1ItemActionType.RESET_ERROR:
      return { ...state, error: null };
    default:
      const _exhaustiveCheck: never = action as never;
      return state;
  }
}

// ─── L1 Item Editor ───────────────────────────────────────────────────────────
function L1ItemEditor({
  item,
  categories: rawCategories,
  templates: rawTemplates,
  filters: rawFilters,
  mapsLoading,
  products: rawProducts,
  menuId,
  token,
  companyId,
  onSaved,
  onDeleted,
}: {
  item: L1Item;
  categories: CatOption[];
  templates: NavbarTemplate[];
  filters: ProductFilter[];
  mapsLoading: boolean;
  products: { id: string; name: string }[];
  menuId: string;
  token: string;
  companyId: string;
  onSaved: (updated: L1Item) => void;
  onDeleted: (id: string) => void;
}) {
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const templates = Array.isArray(rawTemplates) ? rawTemplates : [];
  const filters = Array.isArray(rawFilters) ? rawFilters : [];
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const [state, dispatch] = useReducer(l1ItemReducer, {
    draft: {
      ...item,
      meta: item.meta || {},
      megaMenuColumns: item.megaMenuColumns || [],
      layout_type: item.layout_type || NavLayoutType.NONE,
      target_route:
        item.target_route ||
        templates.find((r) => r.key === "store")?.key ||
        templates[0]?.key ||
        "",
      root_category_id: item.root_category_id || null,
    },
    saving: false,
    open: false,
    addingCol: false,
    error: null,
  });
  const { draft, saving, open, addingCol, error } = state;
  const layoutType = (draft.layout_type || NavLayoutType.NONE) as NavLayoutType;
  const isAutoTree = layoutType !== NavLayoutType.NONE;
  const hasMegaMenu = isAutoTree || draft.has_mega_menu;
  const selectedTemplate = templates.find((t) => t.id === draft.nav_item_id);

  const patch = (field: keyof L1Item, val: any) =>
    dispatch({
      type: L1ItemActionType.PATCH_DRAFT,
      payload: { field, value: val },
    });

  const save = async () => {
    dispatch({ type: L1ItemActionType.SET_SAVING, payload: true });
    dispatch({ type: L1ItemActionType.RESET_ERROR });
    try {
      const layoutTypeVal = layoutType;
      const hasMegaMenuVal = isAutoTree ? true : draft.has_mega_menu;
      const targetRouteVal =
        draft.target_route || selectedTemplate?.key || "store";

      let finalConfig = draft.config;
      if (selectedTemplate?.key === NavTemplateKey.FILTERED_COLLECTION && finalConfig?.filter_id) {
        try {
          const copyRes = await copyProductFilter(finalConfig.filter_id, token, companyId);
          if (copyRes?.success && copyRes?.data?.id) {
            finalConfig = { ...finalConfig, filter_id: copyRes.data.id };
          }
        } catch {
          // ignore error and proceed
        }
      }

      const finalSlug =
        draft.slug ||
        (selectedTemplate?.key === NavTemplateKey.FILTERED_COLLECTION
          ? draft.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          : undefined);

      const res = await updateNavbarItem(
        item.id,
        {
          label: draft.label,
          nav_item_id: draft.nav_item_id || item.nav_item_id || null,
          slug: finalSlug,
          config: finalConfig,
          has_mega_menu: hasMegaMenuVal,
          layout_type: layoutTypeVal,
          root_category_id: isAutoTree
            ? (draft.root_category_id ?? null)
            : null,
          sort_order: draft.sort_order,
          meta: (() => {
            const { route_key, ...rest } = draft.meta || {};
            return rest;
          })(),
        },
        token,
        companyId,
      );
      dispatch({ type: L1ItemActionType.SET_SAVING, payload: false });
      if (res?.success === false) {
        const msg = res?.message || CmsNavbarConfig.ERROR_SAVE_LINK;
        dispatch({ type: L1ItemActionType.SET_ERROR, payload: msg });
        toast.error(msg);
        return;
      }
      toast.success(CmsNavbarConfig.SUCCESS_SAVE_LINK);
      onSaved({
        ...draft,
        nav_item_id: draft.nav_item_id || item.nav_item_id || null,
        slug: finalSlug,
        config: finalConfig,
        has_mega_menu: hasMegaMenuVal,
        layout_type: layoutTypeVal,
        root_category_id: draft.root_category_id || null,
        target_route: targetRouteVal,
        id: item.id,
      });
      dispatchNavbarChange();
    } catch {
      dispatch({ type: L1ItemActionType.SET_SAVING, payload: false });
      dispatch({
        type: L1ItemActionType.SET_ERROR,
        payload: CmsNavbarConfig.ERROR_SAVE_LINK,
      });
      toast.error(CmsNavbarConfig.ERROR_SAVE_LINK);
    }
  };

  const addColumn = async () => {
    dispatch({ type: L1ItemActionType.SET_ADDING_COL, payload: true });
    dispatch({ type: L1ItemActionType.RESET_ERROR });
    try {
      const newCol: CreateNavItemPayload = {
        menu_id: menuId,
        parent_id: item.id,
        label: "New Column",
        nav_item_id: "",
        has_mega_menu: false,
        sort_order: draft.megaMenuColumns.length,
        meta: {
          col_type: NavItemColType.SUBCATEGORIES,
          col_title: "New Column",
        },
      };
      const res = await createNavbarItem(newCol, token, companyId);
      dispatch({ type: L1ItemActionType.SET_ADDING_COL, payload: false });

      if (res?.success === false) {
        const errorMsg = res?.message || CmsNavbarConfig.ERROR_ADD_COLUMN;
        dispatch({ type: L1ItemActionType.SET_ERROR, payload: errorMsg });
        toast.error(errorMsg);

        return;
      }
      const newColData = res?.data?.data || res?.data;
      if (newColData?.id) {
        toast.success(CmsNavbarConfig.SUCCESS_ADD_COLUMN);
        dispatch({
          type: L1ItemActionType.SET_DRAFT,
          payload: {
            ...draft,
            megaMenuColumns: [...draft.megaMenuColumns, newColData as L2Column],
          },
        });
      } else {
        dispatch({
          type: L1ItemActionType.SET_ERROR,
          payload: "Column was not created — please retry.",
        });
        toast.error("Column was not created — please retry.");
      }
    } catch (err) {
      dispatch({ type: L1ItemActionType.SET_ADDING_COL, payload: false });
      dispatch({
        type: L1ItemActionType.SET_ERROR,
        payload: CmsNavbarConfig.ERROR_ADD_COLUMN,
      });
      toast.error(CmsNavbarConfig.ERROR_ADD_COLUMN);
    }
  };

  const remove = async () => {
    if (
      !confirm(
        `Delete "${item.label}"? All mega-menu columns will also be removed.`,
      )
    )
      return;
    try {
      const res = await deleteNavbarItem(item.id, token, companyId);
      if (res?.success === false) {
        toast.error(res?.message || CmsNavbarConfig.ERROR_DELETE_LINK);
        return;
      }
      toast.success(CmsNavbarConfig.SUCCESS_DELETE_LINK);
      onDeleted(item.id);
      dispatchNavbarChange();
    } catch {
      toast.error(CmsNavbarConfig.ERROR_DELETE_LINK);
    }
  };

  const onColSaved = (updated: L2Column) =>
    dispatch({
      type: L1ItemActionType.SET_DRAFT,
      payload: {
        ...draft,
        megaMenuColumns: draft.megaMenuColumns.map((c) =>
          c.id === updated.id ? updated : c,
        ),
      },
    });

  const onColDeleted = (id: string) =>
    dispatch({
      type: L1ItemActionType.SET_DRAFT,
      payload: {
        ...draft,
        megaMenuColumns: draft.megaMenuColumns.filter((c) => c.id !== id),
      },
    });

  const badge = hasMegaMenu ? badgeFor(layoutType, draft.has_mega_menu) : null;
  function badgeFor(lt: NavLayoutType, hasMega: boolean) {
    if (lt === NavLayoutType.DIRECTORY)
      return { label: "DIRECTORY", cls: "bg-emerald-100 text-emerald-700" };
    if (lt === NavLayoutType.GRID)
      return { label: "GRID", cls: "bg-orange-100 text-orange-700" };
    if (hasMega)
      return { label: "MEGA MENU", cls: "bg-indigo-100 text-indigo-700" };
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
        <span className="flex-1 font-semibold text-sm text-gray-800 truncate">
          {draft.label || "Unnamed Item"}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
        <button
          onClick={() => dispatch({ type: L1ItemActionType.TOGGLE_OPEN })}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={remove}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="p-5 space-y-5">
          {/* ── Step 1: Label ── */}
          <div>
            <InputField
              label="Navigation Label"
              value={draft.label}
              onChange={(v: string) => patch("label", v)}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              This is the text shown in the navbar.
            </p>
          </div>

          {/* ── Step 2: Destination ── */}
          <div>
            {mapsLoading ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500">
                  Destination
                </label>
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : (
              <SelectField
                label="Template"
                value={draft.nav_item_id || ""}
                onChange={(v: string) => patch("nav_item_id", v)}
                options={templates.map((route) => ({
                  value: route.id,
                  label: route.label,
                }))}
              />
            )}
            
            {templates.find(t => t.id === draft.nav_item_id)?.key === NavTemplateKey.FILTERED_COLLECTION && (
              <div className="mt-4 space-y-4">
                <InputField
                  label="URL Slug"
                  value={draft.slug || ""}
                  onChange={(v: string) => patch("slug", v)}
                  placeholder="e.g. summer-sale"
                />
                <SelectField
                  label="Product Filter"
                  value={draft.config?.filter_id || ""}
                  onChange={(v: string) => patch("config", { ...draft.config, filter_id: v })}
                  options={filters.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}
                />
              </div>
            )}
          </div>

          {/* ── Step 3: Layout Type ── */}
          <div>
            <SelectField
              label="Menu Style"
              value={layoutType}
              onChange={(v: string) =>
                dispatch({
                  type: L1ItemActionType.SET_DRAFT,
                  payload: {
                    ...draft,
                    layout_type: v as NavLayoutType,
                    has_mega_menu:
                      v !== NavLayoutType.NONE ? true : draft.has_mega_menu,
                    root_category_id:
                      v === NavLayoutType.NONE ? null : draft.root_category_id,
                  },
                })
              }
              options={LAYOUT_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
            <p className="text-xs text-gray-500 mt-1.5 ml-1">
              {LAYOUT_OPTIONS.find((o) => o.value === layoutType)?.description}
            </p>
          </div>

          {/* ── Step 4a: Root Category (DIRECTORY / GRID only) ── */}
          {isAutoTree && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800">
                    Root Category (Optional)
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Select a root category to restrict the menu to a specific
                    branch. If none is selected, the menu will auto-generate
                    from all top-level parent categories.
                  </p>
                </div>
              </div>
              {/* Deleted root warning */}
              {draft.root_category_id &&
                categories.length > 0 &&
                !categories.find((c) => c.id === draft.root_category_id) && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      The previously selected root category no longer exists or
                      has been deleted. Please select a new one.
                    </p>
                  </div>
                )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Root Category
                </label>
                <SearchableCategoryPicker
                  value={draft.root_category_id || ""}
                  onChange={(v) => patch("root_category_id", v)}
                  categories={categories}
                />
              </div>
            </div>
          )}

          {/* ── Step 4b: Mega-menu toggle (NONE layout only) ── */}
          {!isAutoTree && (
            <div className="rounded-xl border border-indigo-100 bg-slate-50 px-4 py-3">
              <Toggle
                label="Enable Mega-Menu Panel"
                description="Adds a dropdown panel with curated columns below this link."
                value={draft.has_mega_menu}
                onChange={(v) => patch("has_mega_menu", v)}
              />
            </div>
          )}

          {/* Save L1 */}
          <div className="flex justify-end pt-2">
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-1">
            <SaveBtn onClick={save} saving={saving} label="Save Link" />
          </div>

          {/* ── Mega-menu columns ── */}
          {draft.has_mega_menu && !isAutoTree && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Mega Menu Columns ({draft.megaMenuColumns.length})
                </p>
                <button
                  onClick={addColumn}
                  disabled={addingCol}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addingCol ? "Adding…" : "Add Column"}
                </button>
              </div>
              {draft.megaMenuColumns.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No columns yet — add your first mega-menu column above
                </div>
              )}
              {draft.megaMenuColumns.map((col) => (
                <L2ColumnEditor
                  key={col.id}
                  col={col}
                  categories={categories}
                  templates={templates}
                  filters={filters}
                  menuId={menuId}
                  token={token}
                  companyId={companyId}
                  onSaved={onColSaved}
                  onDeleted={onColDeleted}
                  products={products}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CmsNavbarState {
  data: NavbarData | null;
  loading: boolean;
  products: { id: string; name: string }[];
  settings: UpsertNavMenuPayload;
  savingSettings: boolean;
  items: L1Item[];
  addingItem: boolean;
  categories: CatOption[];
  templates: NavbarTemplate[];
  filters: ProductFilter[];
  mapsLoading: boolean;
}

// ─── State Management ─────────────────────────────────────────────────────────

const initialState: CmsNavbarState = {
  data: null,
  loading: true,
  products: [],
  settings: {},
  savingSettings: false,
  items: [],
  addingItem: false,
  categories: [],
  templates: [],
  filters: [],
  mapsLoading: true,
};

enum ActionType {
  SET_LOADING = "SET_LOADING",
  SET_MAPS_LOADING = "SET_MAPS_LOADING",
  SET_INITIAL_DATA = "SET_INITIAL_DATA",
  PATCH_SETTINGS = "PATCH_SETTINGS",
  SET_SAVING_SETTINGS = "SET_SAVING_SETTINGS",
  SET_ADDING_ITEM = "SET_ADDING_ITEM",

  ADD_ITEM = "ADD_ITEM",
  SAVE_ITEM = "SAVE_ITEM",
  DELETE_ITEM = "DELETE_ITEM",
}

type NavbarAction =
  | { type: ActionType.SET_LOADING; payload: boolean }
  | { type: ActionType.SET_MAPS_LOADING; payload: boolean }
  | {
      type: ActionType.SET_INITIAL_DATA;
      payload: Omit<
        CmsNavbarState,
        "loading" | "savingSettings" | "addingItem" | "mapsLoading"
      >;
    }
  | {
      type: ActionType.PATCH_SETTINGS;
      payload: { field: keyof UpsertNavMenuPayload; value: any };
    }
  | { type: ActionType.SET_SAVING_SETTINGS; payload: boolean }
  | { type: ActionType.SET_ADDING_ITEM; payload: boolean }
  | { type: ActionType.ADD_ITEM; payload: L1Item }
  | { type: ActionType.SAVE_ITEM; payload: L1Item }
  | { type: ActionType.DELETE_ITEM; payload: string };

function reducer(state: CmsNavbarState, action: NavbarAction): CmsNavbarState {
  switch (action.type) {
    case ActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionType.SET_MAPS_LOADING:
      return { ...state, mapsLoading: action.payload };
    case ActionType.SET_INITIAL_DATA:
      return {
        ...state,
        data: action.payload.data,
        settings: action.payload.settings,
        items: action.payload.items,
        categories: action.payload.categories,
        products: action.payload.products,
        templates: action.payload.templates,
        filters: action.payload.filters,
      };
    case ActionType.PATCH_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.field]: action.payload.value,
        },
      };
    case ActionType.SET_SAVING_SETTINGS:
      return { ...state, savingSettings: action.payload };
    case ActionType.SET_ADDING_ITEM:
      return { ...state, addingItem: action.payload };
    case ActionType.ADD_ITEM:
      return { ...state, items: [...state.items, action.payload] };
    case ActionType.SAVE_ITEM:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        ),
      };
    case ActionType.DELETE_ITEM:
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AnnouncementItemBuilderProps {
  title: string;
  items: AnnouncementItem[];
  siteMaps: SiteMap[];
  onChange: (items: AnnouncementItem[]) => void;
}

function AnnouncementItemBuilder({
  title,
  items,
  siteMaps,
  onChange,
}: AnnouncementItemBuilderProps) {
  const addItem = () => {
    const newItem: AnnouncementItem = {
      id: Math.random().toString(36).substring(2, 11),
      type: "text",
      label: "New Item",
      visible_on: ["desktop", "mobile"],
      is_highlighted: false,
    };
    onChange([...items, newItem]);
  };
  const updateItem = <K extends keyof AnnouncementItem>(
    id: string,
    key: K,
    val: AnnouncementItem[K] | boolean,
  ) => {
    onChange(items.map((i) => (i.id === id ? { ...i, [key]: val } : i)));
  };
  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const toggleVisibility = (id: string, device: "desktop" | "mobile") => {
    onChange(
      items.map((i) => {
        if (i.id !== id) return i;
        const current = i.visible_on || ["desktop", "mobile"];
        const updated = current.includes(device)
          ? current.filter((d) => d !== device)
          : [...current, device];
        // Prevent unchecking both (require at least one)
        return { ...i, visible_on: updated.length === 0 ? [device] : updated };
      }),
    );
  };

  return (
    <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold text-slate-700">{title}</label>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-theme-primary hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      {items.map((item, idx: number) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 p-2 border border-slate-200 rounded bg-white"
        >
          <div className="flex items-center gap-2">
            <select
              value={item.type}
              onChange={(e) => updateItem(item.id, "type", e.target.value as AnnouncementItem["type"])}
              className="text-xs border border-slate-200 rounded p-1"
            >
              <option value="text">Text</option>
              <option value="link">Link</option>
              <option value="feature">Interactive Feature</option>
            </select>
            <input
              type="text"
              placeholder="Label"
              value={item.label}
              onChange={(e) => updateItem(item.id, "label", e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded p-1"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {item.type === "link" && (
            <select
              value={item.target_route || ""}
              onChange={(e) =>
                updateItem(item.id, "target_route", e.target.value)
              }
              className="text-xs border border-slate-200 rounded p-1 w-full"
            >
              <option value="">-- Select Route --</option>
              {siteMaps.map((sm) => (
                <option key={sm.key} value={sm.key}>
                  {sm.label} ({sm.base_path})
                </option>
              ))}
            </select>
          )}
          {item.type === "feature" && (
            <select
              value={item.feature_key || ""}
              onChange={(e) =>
                updateItem(item.id, "feature_key", e.target.value)
              }
              className="text-xs border border-slate-200 rounded p-1 w-full"
            >
              <option value="">-- Select Feature --</option>
              {ANNOUNCEMENT_FEATURES.map((feat) => (
                <option key={feat.key} value={feat.key}>
                  {feat.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(item.visible_on || ["desktop", "mobile"]).includes(
                    "desktop",
                  )}
                  onChange={() => toggleVisibility(item.id, "desktop")}
                  className="rounded text-theme-primary focus:ring-theme-primary/20"
                />
                Show on Desktop
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(item.visible_on || ["desktop", "mobile"]).includes(
                    "mobile",
                  )}
                  onChange={() => toggleVisibility(item.id, "mobile")}
                  className="rounded text-theme-primary focus:ring-theme-primary/20"
                />
                Show on Mobile
              </label>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={item.is_highlighted || false}
                onChange={(e) =>
                  updateItem(item.id, "is_highlighted", e.target.checked)
                }
                className="rounded text-blue-500 focus:ring-blue-500/20"
              />
              Highlight
            </label>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-xs text-slate-400">No items added.</div>
      )}
    </div>
  );
}

export interface CmsNavbarTabProps {
  registerSave?: (page: PageType, saveFn: () => Promise<void>) => void;
  registerDiscard?: (page: PageType, discardFn: () => void) => void;
  setDirty?: (page: PageType, isDirty: boolean) => void;
}

export function CmsNavbarTab({
  registerSave,
  registerDiscard,
  setDirty,
}: CmsNavbarTabProps) {
  const companyId = getClientCompanyId();

  const token = authToken();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sessionError, setSessionError] = useState(false);

  // ── Data load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !companyId) {
      setSessionError(true);
      return;
    }
    const load = async () => {
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      try {
        const [navRes, catRes, prodRes, tmplRes, filtRes] = await Promise.all([
          AxiosAPI.get("/v1/navbar").catch(() => null),
          AxiosAPI.get("/v1/categories?limit=500").catch(() => null),
          token
            ? fetchVendorActiveProducts(token, companyId).catch(() => null)
            : Promise.resolve(null),
          fetchNavbarTemplates(token).catch(() => null),
          fetchProductFilters(token, companyId).catch(() => null),
        ]);

        const d: NavbarData | null = navRes?.data?.data ?? navRes?.data ?? null;
        const setts: UpsertNavMenuPayload = d?.settings ?? {};
        const itms: L1Item[] = d?.navigationItems ?? [];
        const cats: CatOption[] = Array.isArray(catRes?.data?.data)
          ? catRes.data.data
          : Array.isArray(catRes?.data)
            ? catRes.data
            : [];
        const prodList = Array.isArray(prodRes?.data?.data)
          ? prodRes.data.data
          : Array.isArray(prodRes?.data)
            ? prodRes.data
            : [];
        const prods = prodList.map((p: any) => ({ id: p.id, name: p.name }));
        const tmpls = Array.isArray(tmplRes?.data?.data)
          ? tmplRes.data.data
          : Array.isArray(tmplRes?.data)
            ? tmplRes.data
            : [];
        const filts = Array.isArray(filtRes?.data?.data)
          ? filtRes.data.data
          : Array.isArray(filtRes?.data)
            ? filtRes.data
            : [];

        dispatch({
          type: ActionType.SET_INITIAL_DATA,
          payload: {
            data: d,
            settings: setts,
            items: itms,
            categories: cats,
            products: prods,
            templates: tmpls,
            filters: filts,
          },
        });
      } catch {
        toast.error(CmsNavbarConfig.ERROR_LOAD_DATA);
      } finally {
        dispatch({ type: ActionType.SET_MAPS_LOADING, payload: false });
        dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
    };
    load();
  }, [token]);

  // ── Patch helpers ────────────────────────────────────────────────────────────
  const patchSettings = (field: keyof UpsertNavMenuPayload, val: any) =>
    dispatch({
      type: ActionType.PATCH_SETTINGS,
      payload: { field, value: val },
    });

  // ── Save scalar settings ────────────────────────────────────────────────────
  const saveSettings = async () => {
    if (!token || !companyId) throw new Error("No session");
    const res = await upsertNavbarMenu(state.settings, token, companyId);
    if (res?.success === false) {
      throw new Error(res?.message || "Failed to save settings");
    }
    dispatchNavbarChange();
    setDirty?.(PageType.NAVBAR, false);
  };

  useEffect(() => {
    if (registerSave) registerSave(PageType.NAVBAR, saveSettings);
    if (registerDiscard) {
      registerDiscard(PageType.NAVBAR, () => {
        // Discard is simple: just re-trigger load effect by resetting data
        // For now, we can just reload the window if we don't want to re-fetch manually
        window.location.reload();
      });
    }
  }, [registerSave, registerDiscard, saveSettings]);

  const makeAutoSave = async (newUrl: string) => {
    if (!token || !companyId) {
      setSessionError(true);
      return;
    }
    setDirty?.(PageType.NAVBAR, true);
    const updatedSettings = { ...state.settings, logo_src: newUrl };
    dispatch({
      type: ActionType.PATCH_SETTINGS,
      payload: { field: "logo_src", value: newUrl },
    });
    try {
      const res = await upsertNavbarMenu(updatedSettings, token, companyId);
      if (res?.success === false)
        toast.error(res?.message || CmsNavbarConfig.ERROR_SAVE_SETTINGS);
      else toast.success("Logo saved.");
    } catch {
      toast.error(CmsNavbarConfig.ERROR_SAVE_SETTINGS);
    }
  };

  // ── Add a new L1 item ───────────────────────────────────────────────────────
  const addL1Item = async () => {
    if (!token || !companyId) {
      setSessionError(true);
      return;
    }
    if (!state.data?.menu_id) return;
    dispatch({ type: ActionType.SET_ADDING_ITEM, payload: true });
    try {
      const res = await createNavbarItem(
        {
          menu_id: state.data.menu_id,
          label: "New Link",
          nav_item_id: state.templates[0]?.id || "",
          has_mega_menu: false,
          sort_order: state.items.length,
          meta: {},
        },
        token,
        companyId,
      );
      dispatch({ type: ActionType.SET_ADDING_ITEM, payload: false });
      if (res?.success === false) {
        toast.error(res?.message || CmsNavbarConfig.ERROR_ADD_LINK);

        return;
      }
      const newItem = res?.data?.data || res?.data;
      if (newItem?.id) {
        toast.success(CmsNavbarConfig.SUCCESS_ADD_LINK);
        dispatch({
          type: ActionType.ADD_ITEM,
          payload: newItem as L1Item,
        });
        dispatchNavbarChange();
      } else {
        toast.error("Link was not created — please retry.");
      }
    } catch (err) {
      dispatch({ type: ActionType.SET_ADDING_ITEM, payload: false });
      toast.error(CmsNavbarConfig.ERROR_ADD_LINK);
    }
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (sessionError) {
    return <SessionErrorCard />;
  }

  if (state.loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  // ─── Empty state (no menu_id yet) ──────────────────────────────────────────
  const menuId = state.data?.menu_id;
  return (
    <div className="space-y-6">
      {/* ── 1. Logo & Branding ──────────────────────────────────────────────── */}
      <CmsSection
        title="Logo & Branding"
        action={
          <SaveBtn
            onClick={saveSettings}
            saving={state.savingSettings}
            label="Save Settings"
          />
        }
      >
        <div className="space-y-4">
          <ImageUploadField
            label="Logo Image"
            value={state.settings.logo_src || ""}
            onChange={(v: string) => patchSettings("logo_src", v)}
            onAutoSave={makeAutoSave}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Logo Alt Text"
              value={state.settings.logo_alt || ""}
              onChange={(v: string) => patchSettings("logo_alt", v)}
            />
            <SelectField
              label="Logo Alignment"
              value={state.settings.logo_alignment || NavMenuLogoAlignment.LEFT}
              onChange={(v: string) =>
                patchSettings("logo_alignment", v as any)
              }
              options={ALIGNMENT_OPTIONS}
            />
          </div>
        </div>
      </CmsSection>

      {/* ── 2. Behavior ─────────────────────────────────────────────────────── */}
      <CmsSection title="Navbar Behavior">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Scroll Behavior"
            value={state.settings.position || NavMenuPosition.STICKY}
            onChange={(v: string) => patchSettings("position", v as any)}
            options={POSITION_OPTIONS}
          />
          <div className="pt-3 space-y-1 divide-y divide-gray-100">
            <Toggle
              label="Show drop-shadow"
              value={state.settings.show_shadow ?? true}
              onChange={(v) => patchSettings("show_shadow", v)}
            />
            <Toggle
              label="Show bottom border"
              value={state.settings.show_border ?? true}
              onChange={(v) => patchSettings("show_border", v)}
            />
          </div>
        </div>
      </CmsSection>

      {/* ── 3. Search Bar ───────────────────────────────────────────────────── */}
      <CmsSection title="Search Bar">
        <Toggle
          label="Show search bar"
          value={state.settings.search_visible ?? true}
          onChange={(v) => patchSettings("search_visible", v)}
        />
        {state.settings.search_visible !== false && (
          <div className="pt-3">
            <InputField
              label="Placeholder Text"
              value={state.settings.search_placeholder || ""}
              onChange={(v: string) => patchSettings("search_placeholder", v)}
            />
          </div>
        )}
      </CmsSection>

      {/* ── 4. Announcement Bar ─────────────────────────────────────────────── */}
      <CmsSection title="Announcement Bar (Top)">
        <Toggle
          label="Show announcement bar"
          value={state.settings.announcement_visible ?? false}
          onChange={(v) => patchSettings("announcement_visible", v)}
        />
        {state.settings.announcement_visible && (
          <div className="pt-3 space-y-6">
            <NavbarPreview
              itemsLeft={state.settings.announcement_items_left || []}
              itemsRight={state.settings.announcement_items_right || []}
              bgColor={state.settings.announcement_bg_color || "#f8f9fa"}
              textColor={state.settings.announcement_text_color || "#475569"}
              textSize={state.settings.announcement_text_size}
              mobileAlignment={state.settings.announcement_mobile_alignment}
            />
            <AnnouncementItemBuilder
              title="Left Items"
              items={state.settings.announcement_items_left || []}
              siteMaps={state.siteMaps}
              onChange={(items: any) =>
                patchSettings("announcement_items_left", items)
              }
            />
            <AnnouncementItemBuilder
              title="Right Items"
              items={state.settings.announcement_items_right || []}
              siteMaps={state.siteMaps}
              onChange={(items: any) =>
                patchSettings("announcement_items_right", items)
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={state.settings.announcement_bg_color || "#f8f9fa"}
                    onChange={(e) =>
                      patchSettings("announcement_bg_color", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={state.settings.announcement_bg_color || "#f8f9fa"}
                    onChange={(e) =>
                      patchSettings("announcement_bg_color", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={state.settings.announcement_text_color || "#475569"}
                    onChange={(e) =>
                      patchSettings("announcement_text_color", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={state.settings.announcement_text_color || "#475569"}
                    onChange={(e) =>
                      patchSettings("announcement_text_color", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Text Size
                </label>
                <select
                  value={state.settings.announcement_text_size || "text-[11px] sm:text-xs"}
                  onChange={(e) => patchSettings("announcement_text_size", e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                >
                  <option value="text-[10px] sm:text-[11px]">Extra Small</option>
                  <option value="text-[11px] sm:text-xs">Small (Default)</option>
                  <option value="text-xs sm:text-sm">Medium</option>
                  <option value="text-sm sm:text-base">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Alignment
                </label>
                <select
                  value={state.settings.announcement_mobile_alignment || "center"}
                  onChange={(e) => patchSettings("announcement_mobile_alignment", e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                >
                  <option value="left">Left Aligned</option>
                  <option value="center">Center Aligned (Default)</option>
                  <option value="right">Right Aligned</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </CmsSection>

      {/* ── Section 5: Utility Icons ── */}
      <CmsSection title="Utility Icons (right side)">
        <div className="divide-y divide-gray-100 space-y-1">
          <div className="flex items-center gap-3 py-1">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="flex-1">
              <Toggle
                label="Account"
                value={state.settings.show_account ?? true}
                onChange={(v) => patchSettings("show_account", v)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Heart className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="flex-1">
              <Toggle
                label="Wishlist"
                value={state.settings.show_wishlist ?? true}
                onChange={(v) => patchSettings("show_wishlist", v)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="flex-1">
              <Toggle
                label="Cart"
                value={state.settings.show_cart ?? true}
                onChange={(v) => patchSettings("show_cart", v)}
              />
            </div>
          </div>
        </div>
      </CmsSection>

      {/* ── 6. Navigation Items (L1) ────────────────────────────────────────── */}
      <CmsSection
        title={`Navigation Links (${state.items.length})`}
        action={
          menuId ? (
            <button
              onClick={addL1Item}
              disabled={state.addingItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {state.addingItem ? "Adding…" : "Add Link"}
            </button>
          ) : undefined
        }
      >
        {!menuId && (
          <div className="text-center py-10 text-gray-400">
            <LayoutPanelLeft className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Save your settings first to unlock navigation links.
            </p>
            <button
              onClick={saveSettings}
              disabled={state.savingSettings}
              className="mt-3 px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {state.savingSettings ? "Saving…" : "Save Settings & Unlock"}
            </button>
          </div>
        )}

        {menuId && state.items.length === 0 && (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <LinkIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No navigation links yet — add your first link above.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {state.items.map((item, idx) => (
            <L1ItemEditor
              key={item.id || idx}
              item={item}
              categories={state.categories}
              templates={state.templates}
              filters={state.filters}
              mapsLoading={state.mapsLoading}
              menuId={menuId!}
              token={token!}
              companyId={companyId!}
              onSaved={(updated) =>
                dispatch({ type: ActionType.SAVE_ITEM, payload: updated })
              }
              onDeleted={(id) =>
                dispatch({ type: ActionType.DELETE_ITEM, payload: id })
              }
              products={state.products}
            />
          ))}
        </div>
      </CmsSection>
    </div>
  );
}
