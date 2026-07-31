import {
  NavItemColType,
  NavLayoutType,
  NavTemplateKey,
  type CatOption,
  type CreateNavItemPayload,
  type L1Item,
  type L2Column,
  type NavbarTemplate,
  type NavItemMetaPayload,
  type NavItemType,
  type ProductFilter,
} from "@/utils/Types";
import { InputField } from "./InputField";

import { SearchableCategoryPicker } from "./SearchableCategoryPicker";
import { SelectField } from "./SelectField";
import { CmsNavbarConfig } from "@/constants";
import { dispatchNavbarChange } from "@/utils/cache";
import toast from "react-hot-toast";
import {
  copyProductFilter,
  createNavbarItem,
  deleteNavbarItem,
  updateNavbarItem,
} from "@/utils/vendorApiClient";
import { useReducer } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Grid3X3,
  GripVertical,
  Info,
  MousePointerClick,
  Plus,
  Trash2,
} from "lucide-react";
import { L2ColumnEditor } from "./L2ColumnEditor";
import { SaveBtn } from "./SaveBtn";
import { Toggle } from "./Toggle";
import { CMS_L1_EDITOR_TEXT } from "@/constants/vendorText";

export enum L1ItemActionType {
  SET_DRAFT = "SET_DRAFT",
  PATCH_DRAFT = "PATCH_DRAFT",
  SET_SAVING = "SET_SAVING",
  TOGGLE_OPEN = "TOGGLE_OPEN",
  SET_ADDING_COL = "SET_ADDING_COL",
  SET_ERROR = "SET_ERROR",
  RESET_ERROR = "RESET_ERROR",
}
const LAYOUT_OPTIONS = [
  {
    value: NavLayoutType.NONE,
    icon: MousePointerClick,
    label: CMS_L1_EDITOR_TEXT.LAYOUTS.SIMPLE,
    description: CMS_L1_EDITOR_TEXT.LAYOUTS.SIMPLE_DESC,
    color: "border-stone-200 bg-white",
    activeColor: "border-amber-800 bg-amber-50/60 text-amber-900",
  },
  {
    value: NavLayoutType.DIRECTORY,
    icon: FolderTree,
    label: CMS_L1_EDITOR_TEXT.LAYOUTS.DIRECTORY,
    description: CMS_L1_EDITOR_TEXT.LAYOUTS.DIRECTORY_DESC,
    color: "border-stone-200 bg-white",
    activeColor: "border-amber-800 bg-amber-50/60 text-amber-900",
  },
  {
    value: NavLayoutType.GRID,
    icon: Grid3X3,
    label: CMS_L1_EDITOR_TEXT.LAYOUTS.GRID,
    description: CMS_L1_EDITOR_TEXT.LAYOUTS.GRID_DESC,
    color: "border-stone-200 bg-white",
    activeColor: "border-amber-800 bg-amber-50/60 text-amber-900",
  },
];

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
      payload: { field: keyof L1Item; value: unknown };
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
export function L1ItemEditor({
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

  const patch = (field: keyof L1Item, val: unknown) =>
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
      if (
        selectedTemplate?.template_key === NavTemplateKey.FILTERED_COLLECTION &&
        finalConfig?.filter_id
      ) {
        try {
          const copyRes = await copyProductFilter(
            finalConfig.filter_id,
            token,
            companyId,
          );
          if (copyRes?.success && copyRes?.data?.id) {
            finalConfig = { ...finalConfig, filter_id: copyRes.data.id };
          }
        } catch {
          // ignore error and proceed
        }
      }

      const finalSlugRaw =
        draft.slug ||
        (selectedTemplate?.template_key === NavTemplateKey.FILTERED_COLLECTION
          ? draft.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          : undefined);
      
      const finalSlug = 
        selectedTemplate?.template_key === NavTemplateKey.FILTERED_COLLECTION && !finalSlugRaw
          ? "collection-" + Date.now()
          : finalSlugRaw;

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
        label: CMS_L1_EDITOR_TEXT.NEW_COLUMN,
        nav_item_id: "",
        has_mega_menu: false,
        sort_order: draft.megaMenuColumns.length,
        meta: {
          col_type: NavItemColType.SUBCATEGORIES,
          col_title: CMS_L1_EDITOR_TEXT.NEW_COLUMN,
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
          payload: CMS_L1_EDITOR_TEXT.CREATE_FAILED,
        });
        toast.error(CMS_L1_EDITOR_TEXT.CREATE_FAILED);
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
      !confirm(CMS_L1_EDITOR_TEXT.DELETE_CONFIRM(item.label))
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
      return { label: "DIRECTORY", cls: "bg-emerald-50 text-emerald-700" };
    if (lt === NavLayoutType.GRID)
      return { label: "GRID", cls: "bg-orange-50 text-orange-700" };
    if (hasMega)
      return { label: "MEGA MENU", cls: "bg-indigo-50 text-indigo-700" };
    return null;
  }

  return (
    <div className="border border-stone-200 rounded-2xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.03)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_28px_rgb(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-stone-50 border-b border-stone-100">
        <GripVertical className="w-4 h-4 text-stone-300 cursor-grab shrink-0" />
        <span className="flex-1 font-semibold font-serif text-[15px] text-stone-800 truncate">
          {draft.label || CMS_L1_EDITOR_TEXT.UNNAMED_ITEM}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 tracking-wide ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: L1ItemActionType.TOGGLE_OPEN })}
          className="p-1.5 rounded-lg hover:bg-stone-200/60 text-stone-500 transition-colors"
        >
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={remove}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="p-5 space-y-6">
          <div>
            <InputField
              label={CMS_L1_EDITOR_TEXT.NAV_LABEL}
              value={draft.label}
              onChange={(v: string) => patch("label", v)}
            />
            <p className="text-xs text-stone-400 mt-1.5">
              {CMS_L1_EDITOR_TEXT.NAV_HINT}
            </p>
          </div>

          {/* ── Step 2: Destination ── */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer">
                <input
                  type="radio"
                  name={`linkType-${draft.id}`}
                  checked={
                    selectedTemplate?.template_key !== NavTemplateKey.FILTERED_COLLECTION
                  }
                  onChange={() => {
                    const firstStandard = templates.find(
                      (t) =>
                        t.template_key !== NavTemplateKey.FILTERED_COLLECTION,
                    );
                    patch("nav_item_id", firstStandard ? firstStandard.id : "");
                  }}
                  className="accent-amber-800"
                />
                Standard Page
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer">
                <input
                  type="radio"
                  name={`linkType-${draft.id}`}
                  checked={
                    selectedTemplate?.template_key === NavTemplateKey.FILTERED_COLLECTION
                  }
                  onChange={() => {
                    const filteredCollectionTemplate = templates.find(
                      (t) =>
                        t.template_key === NavTemplateKey.FILTERED_COLLECTION,
                    );
                    patch(
                      "nav_item_id",
                      filteredCollectionTemplate
                        ? filteredCollectionTemplate.id
                        : "",
                    );
                  }}
                  className="accent-amber-800"
                />
                Dynamic Collection
              </label>
            </div>

            {mapsLoading ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-500">
                  {CMS_L1_EDITOR_TEXT.DESTINATION}
                </label>
                <div className="h-10 bg-stone-100 rounded-xl animate-pulse" />
              </div>
            ) : selectedTemplate?.template_key !== NavTemplateKey.FILTERED_COLLECTION ? (
              <SelectField
                label={CMS_L1_EDITOR_TEXT.NAV_DESTINATION}
                value={draft.nav_item_id || ""}
                onChange={(v: string) => patch("nav_item_id", v)}
                options={templates
                  .filter(
                    (t) =>
                      t.template_key !== NavTemplateKey.FILTERED_COLLECTION,
                  )
                  .map((route) => ({
                    value: route.id,
                    label: route.label,
                  }))}
              />
            ) : (
              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-4">
                <SelectField
                  label={CMS_L1_EDITOR_TEXT.PRODUCT_FILTER_RULE}
                  value={draft.config?.filter_id || ""}
                  onChange={(v: string) =>
                    patch("config", { ...draft.config, filter_id: v })
                  }
                  options={filters.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}
                />
                <div>
                  <InputField
                    label={CMS_L1_EDITOR_TEXT.WEB_ADDRESS_NAME}
                    value={draft.slug || ""}
                    onChange={(v: string) => patch("slug", v)}
                    placeholder="e.g. summer-sale"
                  />
                  <p className="text-xs text-stone-500 mt-1.5">
                    {CMS_L1_EDITOR_TEXT.WEB_ADDRESS_HINT}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Step 3: Layout Type ── */}
          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2.5">
              Menu Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LAYOUT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = layoutType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: L1ItemActionType.SET_DRAFT,
                        payload: {
                          ...draft,
                          layout_type: opt.value,
                          has_mega_menu:
                            opt.value !== NavLayoutType.NONE
                              ? true
                              : draft.has_mega_menu,
                          root_category_id:
                            opt.value === NavLayoutType.NONE
                              ? null
                              : draft.root_category_id,
                        },
                      })
                    }
                    className={`relative text-left p-4 rounded-xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-800/20 ${
                      isActive
                        ? `${opt.activeColor} shadow-[0_2px_10px_rgb(0,0,0,0.04)]`
                        : `${opt.color} hover:border-stone-300 hover:shadow-[0_2px_10px_rgb(0,0,0,0.03)]`
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-amber-800 flex items-center justify-center">
                        <Check
                          className="w-2.5 h-2.5 text-white"
                          strokeWidth={3}
                        />
                      </span>
                    )}
                    <Icon
                      className={`w-5 h-5 mb-2 ${isActive ? "text-amber-800" : "text-stone-400"}`}
                    />
                    <p
                      className={`text-sm font-semibold font-serif ${isActive ? "text-amber-900" : "text-stone-800"}`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed pr-4">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Step 4a: Root Category (DIRECTORY / GRID only) ── */}
          {isAutoTree && (
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {CMS_L1_EDITOR_TEXT.ROOT_CAT_TITLE}
                  </p>
                  <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed">
                    {CMS_L1_EDITOR_TEXT.ROOT_CAT_DESC}
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
                      {CMS_L1_EDITOR_TEXT.ROOT_CAT_WARNING}
                    </p>
                  </div>
                )}

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-2">
                  {CMS_L1_EDITOR_TEXT.ROOT_CAT_LABEL}
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
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
              <Toggle
                label={CMS_L1_EDITOR_TEXT.ENABLE_MEGA_MENU}
                description={CMS_L1_EDITOR_TEXT.MEGA_MENU_DESC}
                value={draft.has_mega_menu}
                onChange={(v) => patch("has_mega_menu", v)}
              />
            </div>
          )}

          {/* Save L1 */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <SaveBtn onClick={save} saving={saving} label={CMS_L1_EDITOR_TEXT.SAVE_LINK} />
          </div>

          {/* ── Mega-menu columns ── */}
          {draft.has_mega_menu && !isAutoTree && (
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  {CMS_L1_EDITOR_TEXT.MEGA_MENU_COLS(draft.megaMenuColumns.length)}
                </p>
                <button
                  type="button"
                  onClick={addColumn}
                  disabled={addingCol}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addingCol ? CMS_L1_EDITOR_TEXT.ADDING : CMS_L1_EDITOR_TEXT.ADD_COLUMN}
                </button>
              </div>
              {draft.megaMenuColumns.length === 0 && (
                <div className="text-center py-8 text-stone-400 text-sm bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  {CMS_L1_EDITOR_TEXT.NO_COLS_YET}
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
