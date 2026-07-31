"use client";
import React, { useReducer, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CMS_FILTERS_TAB_TEXT } from "@/constants/vendorText";
import { FILTER_RULES_TEXT } from "@/constants";
import {
  CMS_FILTER_LOGICAL_OPERATORS,
  CMS_FILTER_FIELDS,
  CMS_FILTER_OPS_CATEGORY,
  CMS_FILTER_OPS_PRICE,
  CMS_FILTER_OPS_SEARCH,
  CMS_FILTER_OPS_DATE,
} from "@/constants";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Edit,
  AlertCircle,
  RefreshCw,
  ListFilter,
} from "lucide-react";
import { getClientCompanyId } from "@/utils/getCompanyId";
import { authToken } from "@/utils/authToken";
import toast from "react-hot-toast";
import {
  fetchProductFilters,
  createProductFilter,
  updateProductFilter,
  deleteProductFilter,
  fetchVendorsProductsCategory,
} from "@/utils/vendorApiClient";
import {
  FilterRuleType,
  FilterRuleOperator,
  FilterRuleNode,
  type CatOption,
} from "@/utils/Types";
import { PageType } from "@/app/vendor/cms/page";
import { SessionErrorCard } from "../SessionErrorCard";

interface ProductFilter {
  id: string;
  name: string;
  rules: FilterRuleNode[];
  owner_type?: "platform" | "vendor";
}

enum FiltersActionType {
  SET_EDITING_FILTER = "SET_EDITING_FILTER",
  SET_IS_SAVING = "SET_IS_SAVING",
  SET_IS_FORM_DIRTY = "SET_IS_FORM_DIRTY",
  SET_DELETING_ID = "SET_DELETING_ID",
  UPDATE_EDITING_FILTER = "UPDATE_EDITING_FILTER",
}

interface FiltersState {
  editingFilter: ProductFilter | null;
  isSaving: boolean;
  isFormDirty: boolean;
  deletingId: string | null;
}

const initialState: FiltersState = {
  editingFilter: null,
  isSaving: false,
  isFormDirty: false,
  deletingId: null,
};

type FiltersAction =
  | {
      type: FiltersActionType.SET_EDITING_FILTER;
      payload: ProductFilter | null;
    }
  | { type: FiltersActionType.SET_IS_SAVING; payload: boolean }
  | { type: FiltersActionType.SET_IS_FORM_DIRTY; payload: boolean }
  | { type: FiltersActionType.SET_DELETING_ID; payload: string | null }
  | {
      type: FiltersActionType.UPDATE_EDITING_FILTER;
      payload: Partial<ProductFilter>;
    };

function filtersReducer(
  state: FiltersState,
  action: FiltersAction,
): FiltersState {
  switch (action.type) {
    case FiltersActionType.SET_EDITING_FILTER:
      return { ...state, editingFilter: action.payload };
    case FiltersActionType.SET_IS_SAVING:
      return { ...state, isSaving: action.payload };
    case FiltersActionType.SET_IS_FORM_DIRTY:
      return { ...state, isFormDirty: action.payload };
    case FiltersActionType.SET_DELETING_ID:
      return { ...state, deletingId: action.payload };
    case FiltersActionType.UPDATE_EDITING_FILTER:
      return {
        ...state,
        editingFilter: state.editingFilter
          ? { ...state.editingFilter, ...action.payload }
          : null,
      };
    default:
      return state;
  }
}

interface CmsFiltersTabProps {
  registerSave: (key: PageType, fn: () => Promise<void>) => void;
  registerDiscard: (key: PageType, fn: () => void) => void;
  setDirty?: (key: PageType, isDirty: boolean) => void;
}

const RuleNodeEditor = ({
  node,
  onChange,
  onRemove,
  categories,
  isRoot = false,
}: {
  node: FilterRuleNode;
  onChange: (newNode: FilterRuleNode) => void;
  onRemove?: () => void;
  categories: CatOption[];
  isRoot?: boolean;
}) => {
  if (node.type === "group") {
    return (
      <div
        className={`border border-stone-200 rounded-xl p-3.5 space-y-3 ${isRoot ? "" : "bg-stone-50"}`}
      >
        <div className="flex items-center gap-2">
          <select
            value={node.operator || "AND"}
            onChange={(e) =>
              onChange({ ...node, operator: e.target.value as "AND" | "OR" })
            }
            className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-sm font-bold shadow-sm focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40"
          >
            {CMS_FILTER_LOGICAL_OPERATORS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {!isRoot && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg ml-auto transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="pl-4 border-l-2 border-stone-200 space-y-3">
          {node.children?.map((child, idx) => (
            <div key={idx} className="relative">
              <RuleNodeEditor
                node={child}
                categories={categories}
                onChange={(newChild) => {
                  const newChildren = [...(node.children || [])];
                  newChildren[idx] = newChild;
                  onChange({ ...node, children: newChildren });
                }}
                onRemove={() => {
                  const newChildren = (node.children || []).filter(
                    (_, i) => i !== idx,
                  );
                  onChange({ ...node, children: newChildren });
                }}
              />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...node,
                  children: [
                    ...(node.children || []),
                    {
                      type: "rule",
                      field: FilterRuleType.CATEGORY,
                      condition: FilterRuleOperator.IN,
                      value: "",
                    },
                  ],
                })
              }
              className="text-xs font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {CMS_FILTERS_TAB_TEXT.ADD_RULE}
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...node,
                  children: [
                    ...(node.children || []),
                    { type: "group", operator: "AND", children: [] },
                  ],
                })
              }
              className="text-xs font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {CMS_FILTERS_TAB_TEXT.ADD_GROUP}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderValueInput = () => {
    if (node.field === FilterRuleType.CATEGORY) {
      if (node.condition === FilterRuleOperator.IN) {
        if (categories.length === 0) {
          return (
            <div className="flex-1 bg-stone-50 p-3 rounded-lg border border-dashed border-stone-200 text-xs text-stone-400">
              {CMS_FILTERS_TAB_TEXT.NO_CATS}
            </div>
          );
        }
        return (
          <div className="flex-1 bg-white p-2 rounded-lg border border-stone-200 max-h-40 overflow-y-auto text-sm space-y-1">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 rounded px-1 py-0.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(node.value) && node.value.includes(cat.id)
                  }
                  onChange={(e) => {
                    const current = Array.isArray(node.value) ? node.value : [];
                    const next = e.target.checked
                      ? [...current, cat.id]
                      : current.filter((id: string) => id !== cat.id);
                    onChange({ ...node, value: next });
                  }}
                  className="accent-amber-800 w-3.5 h-3.5"
                />
                {cat.name}
              </label>
            ))}
          </div>
        );
      }
      return (
        <select
          className="flex-1 p-2 border border-stone-300 rounded-lg text-sm w-full focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40"
          value={typeof node.value === "string" ? node.value : ""}
          onChange={(e) => onChange({ ...node, value: e.target.value })}
        >
          <option value="">{CMS_FILTERS_TAB_TEXT.SELECT_CAT}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      );
    }

    if (
      node.field === FilterRuleType.DISCOUNT ||
      node.field === FilterRuleType.ON_SALE
    ) {
      return (
        <span className="text-sm text-stone-500 italic p-1.5 inline-block">
          {CMS_FILTERS_TAB_TEXT.DISCOUNT_HINT}
        </span>
      );
    }

    if (node.field === FilterRuleType.CREATED_AT) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="w-24 p-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40"
            placeholder={CMS_FILTERS_TAB_TEXT.DAYS}
            value={node.value || ""}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
            }}
            onPaste={(e) => {
              const pastedData = e.clipboardData.getData("Text");
              if (/[eE+-]/.test(pastedData)) e.preventDefault();
            }}
          />
          <span className="text-sm text-stone-600">
            {CMS_FILTERS_TAB_TEXT.DAYS}
          </span>
        </div>
      );
    }

    return (
      <input
        type={node.field === FilterRuleType.PRICE ? "number" : "text"}
        className="flex-1 p-2 border border-stone-300 rounded-lg text-sm w-full focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40"
        placeholder={CMS_FILTERS_TAB_TEXT.VALUE_PH}
        value={node.value || ""}
        onChange={(e) => onChange({ ...node, value: e.target.value })}
        onKeyDown={(e) => {
          if (
            node.field === FilterRuleType.PRICE &&
            ["e", "E", "+", "-"].includes(e.key)
          )
            e.preventDefault();
        }}
        onPaste={(e) => {
          if (node.field === FilterRuleType.PRICE) {
            const pastedData = e.clipboardData.getData("Text");
            if (/[eE+-]/.test(pastedData)) e.preventDefault();
          }
        }}
      />
    );
  };

  return (
    <div className="flex flex-wrap md:flex-nowrap items-start gap-2 bg-white border border-stone-200 p-2 rounded-lg relative">
      <select
        className="p-2 border border-stone-300 rounded-lg text-sm w-full md:w-[150px] focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40"
        value={(node.field as string) || FilterRuleType.CATEGORY}
        onChange={(e) =>
          onChange({ ...node, field: e.target.value as FilterRuleType })
        }
      >
        {CMS_FILTER_FIELDS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {node.field !== FilterRuleType.DISCOUNT &&
        node.field !== FilterRuleType.ON_SALE && (
          <select
            className="p-2 border border-stone-300 rounded-lg text-sm w-full md:w-[150px] focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40"
            value={node.condition || FilterRuleOperator.IN}
            onChange={(e) =>
              onChange({
                ...node,
                condition: e.target.value as FilterRuleOperator,
              })
            }
          >
            {(!node.field || node.field === FilterRuleType.CATEGORY) &&
              CMS_FILTER_OPS_CATEGORY.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            {node.field === FilterRuleType.PRICE &&
              CMS_FILTER_OPS_PRICE.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            {node.field === FilterRuleType.SEARCH &&
              CMS_FILTER_OPS_SEARCH.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            {node.field === FilterRuleType.CREATED_AT &&
              CMS_FILTER_OPS_DATE.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        )}

      <div className="flex-1 w-full min-w-[200px]">{renderValueInput()}</div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg mt-0.5 shrink-0 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export function CmsFiltersTab({
  registerSave,
  registerDiscard,
  setDirty,
}: CmsFiltersTabProps) {
  const companyId = getClientCompanyId();
  const token = authToken();

  const [state, dispatch] = useReducer(filtersReducer, initialState);
  const { editingFilter, isSaving, isFormDirty, deletingId } = state;

  const {
    data: fetchedData,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cmsFilters", companyId],
    queryFn: async () => {
      if (!token || !companyId) throw new Error("No session");
      const [resFilters, resCats] = await Promise.all([
        fetchProductFilters(token, companyId).catch((err) => {
          throw new Error(err.message || FILTER_RULES_TEXT.FETCH_ERROR);
        }),
        fetchVendorsProductsCategory(token, companyId).catch(() => null),
      ]);

      if (resFilters?.success === false) {
        throw new Error(resFilters?.message || FILTER_RULES_TEXT.FETCH_ERROR);
      }

      return { resFilters, resCats };
    },
    enabled: !!token && !!companyId,
  });

  const loadError = isError ? FILTER_RULES_TEXT.FETCH_ERROR : null;
  const filters: ProductFilter[] = fetchedData?.resFilters?.data || [];
  const categories: CatOption[] = fetchedData?.resCats?.data || [];

  const handleAddNew = () => {
    dispatch({
      type: FiltersActionType.SET_EDITING_FILTER,
      payload: {
        id: "",
        name: FILTER_RULES_TEXT.PLACEHOLDER_FILTER_NAME,
        rules: [{ type: "group", operator: "AND", children: [] }],
      },
    });
    dispatch({ type: FiltersActionType.SET_IS_FORM_DIRTY, payload: true });
    setDirty?.(PageType.FILTERS, true);
  };

  const handleEdit = (filter: ProductFilter) => {
    dispatch({
      type: FiltersActionType.SET_EDITING_FILTER,
      payload: structuredClone(filter),
    });
    dispatch({ type: FiltersActionType.SET_IS_FORM_DIRTY, payload: false });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(FILTER_RULES_TEXT.CONFIRM_DELETE)) return;
    dispatch({ type: FiltersActionType.SET_DELETING_ID, payload: id });
    try {
      const res = await deleteProductFilter(id, token!, companyId!);
      if (res.success) {
        toast.success(FILTER_RULES_TEXT.SUCCESS_DELETE);
        if (editingFilter?.id === id) {
          dispatch({
            type: FiltersActionType.SET_EDITING_FILTER,
            payload: null,
          });
        }
        refetch();
      } else {
        toast.error(res.message || FILTER_RULES_TEXT.FAILED_DELETE);
      }
    } catch {
      toast.error(FILTER_RULES_TEXT.FAILED_DELETE);
    } finally {
      dispatch({ type: FiltersActionType.SET_DELETING_ID, payload: null });
    }
  };

  const handleSave = async () => {
    if (!editingFilter || !editingFilter.name.trim()) {
      toast.error(CMS_FILTERS_TAB_TEXT.ERR_NAME);
      return;
    }
    dispatch({ type: FiltersActionType.SET_IS_SAVING, payload: true });
    try {
      const payload = {
        name: editingFilter.name,
        rules: editingFilter.rules,
      };

      let res;
      if (editingFilter.id) {
        res = await updateProductFilter(
          editingFilter.id,
          payload,
          token!,
          companyId!,
        );
      } else {
        res = await createProductFilter(payload, token!, companyId!);
      }

      if (res.success) {
        toast.success(FILTER_RULES_TEXT.SUCCESS_UPDATE);
        dispatch({ type: FiltersActionType.SET_EDITING_FILTER, payload: null });
        dispatch({ type: FiltersActionType.SET_IS_FORM_DIRTY, payload: false });
        setDirty?.(PageType.FILTERS, false);
        refetch();
      } else {
        toast.error(res.message || FILTER_RULES_TEXT.FAILED_UPDATE);
      }
    } catch (error) {
      toast.error(CMS_FILTERS_TAB_TEXT.ERR_GENERIC);
    } finally {
      dispatch({ type: FiltersActionType.SET_IS_SAVING, payload: false });
    }
  };

  // Register custom discard handler for global discard button in page.tsx
  useEffect(() => {
    if (registerDiscard) {
      registerDiscard(PageType.FILTERS, () => {
        dispatch({ type: FiltersActionType.SET_EDITING_FILTER, payload: null });
        dispatch({ type: FiltersActionType.SET_IS_FORM_DIRTY, payload: false });
        setDirty?.(PageType.FILTERS, false);
        refetch();
      });
    }
  }, [registerDiscard, refetch]);

  if (!token || !companyId) return <SessionErrorCard />;

  return (
    <div className="space-y-6">
      {/* Editor Panel */}
      {editingFilter && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-serif text-stone-800">
              {editingFilter.id
                ? FILTER_RULES_TEXT.MODAL_EDIT_TITLE
                : FILTER_RULES_TEXT.MODAL_CREATE_TITLE}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  dispatch({
                    type: FiltersActionType.SET_EDITING_FILTER,
                    payload: null,
                  });
                  dispatch({
                    type: FiltersActionType.SET_IS_FORM_DIRTY,
                    payload: false,
                  });
                  setDirty?.(PageType.FILTERS, false);
                }}
                className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                {FILTER_RULES_TEXT.CANCEL_BTN}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isFormDirty}
                className="px-4 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-black rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-800/30"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving
                  ? CMS_FILTERS_TAB_TEXT.SAVING
                  : FILTER_RULES_TEXT.SAVE_BTN}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">
                {FILTER_RULES_TEXT.LABEL_FILTER_NAME}
              </label>
              <input
                type="text"
                value={editingFilter.name}
                onChange={(e) => {
                  dispatch({
                    type: FiltersActionType.UPDATE_EDITING_FILTER,
                    payload: { name: e.target.value },
                  });
                  dispatch({
                    type: FiltersActionType.SET_IS_FORM_DIRTY,
                    payload: true,
                  });
                  setDirty?.(PageType.FILTERS, true);
                }}
                placeholder={FILTER_RULES_TEXT.PLACEHOLDER_FILTER_NAME}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40 text-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              />
            </div>

            <div className="pt-4 border-t border-stone-100">
              <label className="block text-sm font-bold text-stone-700 mb-3">
                {CMS_FILTERS_TAB_TEXT.TREE}
              </label>
              <RuleNodeEditor
                node={
                  editingFilter.rules?.length === 1 &&
                  editingFilter.rules[0].type === "group"
                    ? editingFilter.rules[0]
                    : {
                        type: "group",
                        operator: "AND",
                        children: editingFilter.rules || [],
                      }
                }
                categories={categories}
                isRoot={true}
                onChange={(newNode) => {
                  dispatch({
                    type: FiltersActionType.UPDATE_EDITING_FILTER,
                    payload: { rules: [newNode] },
                  });
                  dispatch({
                    type: FiltersActionType.SET_IS_FORM_DIRTY,
                    payload: true,
                  });
                  setDirty?.(PageType.FILTERS, true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* List Panel */}
      {!editingFilter && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-800">
                {"Saved Filters"}
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                {"Manage and organize your custom filter collections."}
              </p>
            </div>
            <button
              onClick={handleAddNew}
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center gap-2 shrink-0 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> {FILTER_RULES_TEXT.ADD_FILTER_BTN}
            </button>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-stone-100/80 animate-pulse"
                />
              ))}
            </div>
          ) : loadError ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-stone-500 max-w-sm mb-6">
                {loadError}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />{" "}
                {CMS_FILTERS_TAB_TEXT.TRY_AGAIN}
              </button>
            </div>
          ) : filters.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
                <ListFilter className="w-6 h-6 text-amber-800" />
              </div>
              <h4 className="text-stone-700 font-bold mb-1">
                {CMS_FILTERS_TAB_TEXT.NO_FILTERS}
              </h4>
              <p className="text-sm text-stone-500 max-w-sm mb-6">
                {CMS_FILTERS_TAB_TEXT.NO_FILTERS_DESC}
              </p>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                {CMS_FILTERS_TAB_TEXT.FIRST_FILTER}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filters.map((filter) => {
                const isDeleting = deletingId === filter.id;
                return (
                  <div
                    key={filter.id}
                    className={`p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div>
                      <h4 className="font-bold font-serif text-stone-800">
                        {filter.name}
                      </h4>
                      <p className="text-xs font-medium text-stone-500 mt-0.5 uppercase tracking-wider">
                        {filter.rules.length}{" "}
                        {filter.rules.length === 1
                          ? CMS_FILTERS_TAB_TEXT.RULE
                          : CMS_FILTERS_TAB_TEXT.RULES}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {filter.owner_type === "platform" ? (
                        <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-full uppercase tracking-wider">
                          {CMS_FILTERS_TAB_TEXT.PRESET}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(filter)}
                            disabled={isDeleting}
                            className="p-2 text-stone-500 hover:bg-stone-200 hover:text-stone-800 rounded-lg transition-colors disabled:opacity-50"
                            title="Edit Filter"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(filter.id)}
                            disabled={isDeleting}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Filter"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
