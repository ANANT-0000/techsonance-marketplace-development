import {
  NavItemColType,
  type L2Column,
  type NavItemMetaPayload,
  type NavItemType,
  CatOption,
  NavbarTemplate,
  ProductFilter,
} from "@/utils/Types";
import { InputField } from "./InputField";
import { SelectField } from "./SelectField";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  PackageSearch,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { deleteNavbarItem, updateNavbarItem } from "@/utils/vendorApiClient";
import { CmsNavbarConfig } from "@/constants";
import { dispatchNavbarChange } from "@/utils/cache";
import { useReducer } from "react";
import { buildIndentedCategoryOptions } from "./buildIndentedCategoryOptions";
import { ImageUploadField } from "./ImageUploadField";
import { SaveBtn } from "./SaveBtn";
import { CMS_L2_EDITOR_TEXT } from "@/constants/vendorText";

const COL_TYPE_OPTIONS = [
  { value: NavItemColType.SUBCATEGORIES, label: CMS_L2_EDITOR_TEXT.SUBCATEGORY_LINKS },
  { value: NavItemColType.BRANDS, label: CMS_L2_EDITOR_TEXT.BRAND_LINKS },
  { value: NavItemColType.PROMOTION, label: CMS_L2_EDITOR_TEXT.PROMOTION_BANNER },
  { value: NavItemColType.PRODUCTS, label: CMS_L2_EDITOR_TEXT.MANUAL_PRODUCT_PICKS },
];

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
      payload: { field: keyof L2Column; value: unknown };
    }
  | {
      type: L2ColumnActionType.PATCH_META;
      payload: { field: keyof NavItemMetaPayload; value: unknown };
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

export function L2ColumnEditor({
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

  const patch = (field: keyof L2Column, val: unknown) =>
    dispatch({
      type: L2ColumnActionType.PATCH_DRAFT,
      payload: { field, value: val },
    });
  const patchMeta = (field: keyof NavItemMetaPayload, val: unknown) =>
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
          category_id: draft.category_id,
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
    if (!confirm(CMS_L2_EDITOR_TEXT.DELETE_CONFIRM(col.label || CMS_L2_EDITOR_TEXT.UNNAMED_COLUMN))) return;
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
    <div className="border border-stone-200 rounded-2xl bg-stone-50/60 overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_6px_24px_rgb(0,0,0,0.04)]">
      <div className="flex items-center gap-2 px-3.5 py-3">
        <GripVertical className="w-4 h-4 text-stone-300 shrink-0" />
        <span className="flex-1 text-xs font-semibold font-serif text-stone-700 truncate">
          {draft.label || CMS_L2_EDITOR_TEXT.UNNAMED_COLUMN}
        </span>
        <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-2 py-0.5 rounded-full uppercase shrink-0 tracking-wide">
          {colTypeLabel}
        </span>
        <button
          onClick={() => dispatch({ type: L2ColumnActionType.TOGGLE_OPEN })}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
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
          className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-stone-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={CMS_L2_EDITOR_TEXT.COLUMN_HEADING}
              value={draft.label}
              onChange={(v: string) => patch("label", v)}
            />
            <SelectField
              label={CMS_L2_EDITOR_TEXT.COLUMN_TYPE}
              value={draft.meta.col_type || NavItemColType.SUBCATEGORIES}
              onChange={(v: string) => patchMeta("col_type", v)}
              options={COL_TYPE_OPTIONS}
            />
          </div>

          {isSubcat && (
            <SelectField
              label={CMS_L2_EDITOR_TEXT.SOURCE_CATEGORY}
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
                      draft.label === CMS_L2_EDITOR_TEXT.UNNAMED_COLUMN ||
                      draft.label === CMS_L2_EDITOR_TEXT.NEW_COLUMN
                        ? cat?.name || draft.label
                        : draft.label,
                  },
                });
              }}
              options={[
                { value: "", label: CMS_L2_EDITOR_TEXT.NO_CATEGORY },
                ...buildIndentedCategoryOptions(categories),
              ]}
            />
          )}

          {isProducts && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-600">
                {CMS_L2_EDITOR_TEXT.PRODUCTS_IN_COLUMN}
              </label>
              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                {products.length === 0 && (
                  <div className="flex flex-col items-center text-center px-3 py-6 gap-1.5">
                    <PackageSearch className="w-5 h-5 text-stone-300" />
                    <p className="text-xs text-stone-500 font-medium">
                      {CMS_L2_EDITOR_TEXT.NO_ACTIVE_PRODUCTS}
                    </p>
                    <p className="text-[11px] text-stone-400 max-w-[220px]">
                      {CMS_L2_EDITOR_TEXT.PRODUCTS_HINT}
                    </p>
                  </div>
                )}
                {products.map((p) => {
                  const checked = (draft.meta.product_ids || []).includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-stone-700 cursor-pointer hover:bg-stone-50 transition-colors"
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
                        className="accent-amber-800 w-3.5 h-3.5"
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
                label={CMS_L2_EDITOR_TEXT.PROMO_IMAGE}
                value={draft.meta.promo_image_url || ""}
                onChange={(v: string) => patchMeta("promo_image_url", v)}
                onAutoSave={async () => {}}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label={CMS_L2_EDITOR_TEXT.PROMO_TITLE}
                  value={draft.meta.promo_title || ""}
                  onChange={(v: string) => patchMeta("promo_title", v)}
                />
                <InputField
                  label={CMS_L2_EDITOR_TEXT.CTA_LABEL}
                  value={draft.meta.promo_title || ""}
                  onChange={(v: string) => patchMeta("promo_title", v)}
                />
              </div>
              <InputField
                label={CMS_L2_EDITOR_TEXT.PROMO_SUBTITLE}
                value={draft.meta.promo_subtitle || ""}
                onChange={(v: string) => patchMeta("promo_subtitle", v)}
                textarea
              />
            </>
          )}

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <SaveBtn onClick={save} saving={saving} label={CMS_L2_EDITOR_TEXT.SAVE_COLUMN} />
          </div>
        </div>
      )}
    </div>
  );
}
