"use client";
import React, { useState, useEffect, useReducer } from "react";
import { Plus, Trash2, Save, Loader2, Edit, AlertCircle } from "lucide-react";
import { getClientCompanyId } from "@/utils/getCompanyId";
import { authToken } from "@/utils/authToken";
import toast from "react-hot-toast";
import {
  fetchProductFilters,
  createProductFilter,
  updateProductFilter,
  deleteProductFilter,
} from "@/utils/vendorApiClient";
import { FilterRuleType, FilterRuleOperator, FilterRule } from "@/utils/Types";
import { PageType } from "@/app/vendor/cms/page";
import { SessionErrorCard } from "../SessionErrorCard";

interface ProductFilter {
  id: string;
  name: string;
  rules: FilterRule[];
}

interface CmsFiltersTabProps {
  registerSave: (key: PageType, fn: () => Promise<void>) => void;
  registerDiscard: (key: PageType, fn: () => void) => void;
  setDirty?: (key: PageType, isDirty: boolean) => void;
}

export function CmsFiltersTab({ registerSave, registerDiscard, setDirty }: CmsFiltersTabProps) {
  const companyId = getClientCompanyId();
  const token = authToken();

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilter[]>([]);
  const [editingFilter, setEditingFilter] = useState<ProductFilter | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    if (token && companyId) {
      loadFilters();
    }
  }, [token, companyId]);

  const loadFilters = async () => {
    setLoading(true);
    const res = await fetchProductFilters(token!, companyId!);
    if (res.success && res.data?.data) {
      setFilters(res.data.data);
    } else {
      toast.error("Failed to load product filters.");
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setEditingFilter({ id: "", name: "New Filter", rules: [] });
    setIsFormDirty(true);
    setDirty?.(PageType.FILTERS, true);
  };

  const handleEdit = (filter: ProductFilter) => {
    setEditingFilter(JSON.parse(JSON.stringify(filter)));
    setIsFormDirty(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;
    const res = await deleteProductFilter(id, token!, companyId!);
    if (res.success) {
      toast.success("Filter deleted successfully.");
      loadFilters();
      if (editingFilter?.id === id) {
        setEditingFilter(null);
      }
    } else {
      toast.error("Failed to delete filter.");
    }
  };

  const addRule = () => {
    if (!editingFilter) return;
    setEditingFilter({
      ...editingFilter,
      rules: [
        ...editingFilter.rules,
        {
          type: FilterRuleType.CATEGORY,
          operator: FilterRuleOperator.IN,
          value: "",
        },
      ],
    });
    setIsFormDirty(true);
    setDirty?.(PageType.FILTERS, true);
  };

  const updateRule = <K extends keyof FilterRule>(index: number, field: K, val: FilterRule[K]) => {
    if (!editingFilter) return;
    const newRules = [...editingFilter.rules];
    newRules[index] = { ...newRules[index], [field]: val };
    setEditingFilter({ ...editingFilter, rules: newRules });
    setIsFormDirty(true);
    setDirty?.(PageType.FILTERS, true);
  };

  const removeRule = (index: number) => {
    if (!editingFilter) return;
    const newRules = editingFilter.rules.filter((_, i) => i !== index);
    setEditingFilter({ ...editingFilter, rules: newRules });
    setIsFormDirty(true);
    setDirty?.(PageType.FILTERS, true);
  };

  const handleSave = async () => {
    if (!editingFilter || !editingFilter.name.trim()) {
      toast.error("Filter name is required.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: editingFilter.name,
        rules: editingFilter.rules,
      };
      
      let res;
      if (editingFilter.id) {
        res = await updateProductFilter(editingFilter.id, payload, token!, companyId!);
      } else {
        res = await createProductFilter(payload, token!, companyId!);
      }

      if (res.success) {
        toast.success("Filter saved successfully!");
        setEditingFilter(null);
        setIsFormDirty(false);
        setDirty?.(PageType.FILTERS, false);
        loadFilters();
      } else {
        toast.error("Failed to save filter.");
      }
    } catch (error) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Register custom discard handler for global discard button in page.tsx
  useEffect(() => {
    if (registerDiscard) {
      registerDiscard(PageType.FILTERS, () => {
        setEditingFilter(null);
        setIsFormDirty(false);
        setDirty?.(PageType.FILTERS, false);
        loadFilters();
      });
    }
  }, [registerDiscard]);

  if (!token || !companyId) return <SessionErrorCard />;

  return (
    <div className="space-y-6">
      {/* Editor Panel */}
      {editingFilter && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {editingFilter.id ? "Edit Filter" : "Create New Filter"}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingFilter(null);
                  setIsFormDirty(false);
                  setDirty?.(PageType.FILTERS, false);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isFormDirty}
                className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Filter
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Filter Name</label>
              <input
                type="text"
                value={editingFilter.name}
                onChange={(e) => {
                  setEditingFilter({ ...editingFilter, name: e.target.value });
                  setIsFormDirty(true);
                  setDirty?.(PageType.FILTERS, true);
                }}
                placeholder="e.g. Summer Sale, Under $50..."
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-slate-700">Filter Rules (AND logic)</label>
                <button
                  type="button"
                  onClick={addRule}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              {editingFilter.rules.length === 0 ? (
                <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                  No rules added. This filter will return all products.
                </div>
              ) : (
                <div className="space-y-3">
                  {editingFilter.rules.map((rule, idx) => (
                    <div key={idx} className="flex flex-wrap md:flex-nowrap items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <select
                        value={rule.type}
                        onChange={(e) => updateRule(idx, "type", e.target.value as FilterRuleType)}
                        className="flex-1 min-w-[120px] px-3 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value={FilterRuleType.CATEGORY}>Category</option>
                        <option value={FilterRuleType.PRICE}>Price</option>
                        <option value={FilterRuleType.BRAND}>Brand</option>
                        <option value={FilterRuleType.SEARCH}>Search (Title)</option>
                      </select>

                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(idx, "operator", e.target.value as FilterRuleOperator)}
                        className="flex-1 min-w-[120px] px-3 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value={FilterRuleOperator.EQ}>Equals (=)</option>
                        <option value={FilterRuleOperator.IN}>In List</option>
                        <option value={FilterRuleOperator.LT}>Less Than (&lt;)</option>
                        <option value={FilterRuleOperator.LTE}>Less or Equal (&lt;=)</option>
                        <option value={FilterRuleOperator.GT}>Greater Than (&gt;)</option>
                        <option value={FilterRuleOperator.GTE}>Greater or Equal (&gt;=)</option>
                        <option value={FilterRuleOperator.CONTAINS}>Contains</option>
                      </select>

                      <input
                        type="text"
                        value={Array.isArray(rule.value) ? rule.value.join(", ") : rule.value}
                        onChange={(e) => {
                          const val = rule.operator === FilterRuleOperator.IN 
                            ? e.target.value.split(",").map(v => v.trim()) 
                            : e.target.value;
                          updateRule(idx, "value", val);
                        }}
                        placeholder={rule.operator === FilterRuleOperator.IN ? "uuid1, uuid2..." : "Value"}
                        className="flex-[2] min-w-[200px] px-3 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List Panel */}
      {!editingFilter && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Saved Filters</h3>
              <p className="text-sm text-slate-500 mt-1">
                Create reusable filter rules to attach to Navbar Collections.
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Filter
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : filters.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <AlertCircle className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-slate-700 font-bold mb-1">No filters found</h4>
              <p className="text-sm text-slate-500 max-w-sm mb-6">
                You haven't created any custom product filters yet.
              </p>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Create your first filter
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filters.map((filter) => (
                <div key={filter.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div>
                    <h4 className="font-bold text-slate-800">{filter.name}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-wider">
                      {filter.rules.length} {filter.rules.length === 1 ? 'Rule' : 'Rules'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(filter)}
                      className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors"
                      title="Edit Filter"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(filter.id)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Filter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
