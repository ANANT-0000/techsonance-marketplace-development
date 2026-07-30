"use client";

import React, { useState, useEffect } from "react";
import { SiteMap } from "@/utils/Types";
import { X, Save, ShieldAlert } from "lucide-react";
import { SITE_MAPS_TEXT } from "@/constants";

interface SiteMapPayload {
  key: string;
  label: string;
  base_path: string;
  default_query_param?: string;
}

interface SiteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: SiteMapPayload, isEdit: boolean) => Promise<void>;
  editingSiteMap: SiteMap | null;
  isSaving: boolean;
}

export default function SiteMapModal({
  isOpen,
  onClose,
  onSave,
  editingSiteMap,
  isSaving,
}: SiteMapModalProps) {
  const [formData, setFormData] = useState<SiteMapPayload>({
    key: "",
    label: "",
    base_path: "",
    default_query_param: "",
  });

  useEffect(() => {
    if (editingSiteMap) {
      setFormData({
        key: editingSiteMap.key,
        label: editingSiteMap.label,
        base_path: editingSiteMap.base_path,
        default_query_param: editingSiteMap.default_query_param || "",
      });
    } else {
      setFormData({
        key: "",
        label: "",
        base_path: "",
        default_query_param: "",
      });
    }
  }, [editingSiteMap, isOpen]);

  if (!isOpen) return null;

  const isSystem = editingSiteMap?.is_system;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await onSave(
      {
        key: formData.key,
        label: formData.label,
        base_path: formData.base_path,
        default_query_param: formData.default_query_param || undefined,
      },
      !!editingSiteMap,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingSiteMap
                ? SITE_MAPS_TEXT.MODAL_EDIT_TITLE
                : SITE_MAPS_TEXT.MODAL_ADD_TITLE}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingSiteMap
                ? SITE_MAPS_TEXT.MODAL_EDIT_DESC
                : SITE_MAPS_TEXT.MODAL_ADD_DESC}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {isSystem && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/50 mb-4">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <p className="text-sm leading-relaxed">
                {SITE_MAPS_TEXT.MODAL_SYSTEM_WARNING}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {SITE_MAPS_TEXT.LABEL_KEY}
            </label>
            <input
              type="text"
              required
              disabled={isSystem || isSaving}
              value={formData.key}
              onChange={(e) =>
                setFormData({ ...formData, key: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 transition-all"
              placeholder={SITE_MAPS_TEXT.PLACEHOLDER_KEY}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {SITE_MAPS_TEXT.LABEL_DISPLAY_LABEL}
            </label>
            <input
              type="text"
              required
              disabled={isSaving}
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder={SITE_MAPS_TEXT.PLACEHOLDER_LABEL}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {SITE_MAPS_TEXT.LABEL_BASE_PATH}
            </label>
            <input
              type="text"
              required
              disabled={isSaving}
              value={formData.base_path}
              onChange={(e) =>
                setFormData({ ...formData, base_path: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder={SITE_MAPS_TEXT.PLACEHOLDER_BASE_PATH}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {SITE_MAPS_TEXT.LABEL_QUERY_PARAM}
            </label>
            <input
              type="text"
              disabled={isSaving}
              value={formData.default_query_param}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  default_query_param: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder={SITE_MAPS_TEXT.PLACEHOLDER_QUERY_PARAM}
            />
            <p className="text-xs text-gray-500">
              {SITE_MAPS_TEXT.DESC_QUERY_PARAM}
            </p>
          </div>
        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            {SITE_MAPS_TEXT.BTN_CANCEL}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? SITE_MAPS_TEXT.BTN_SAVING : SITE_MAPS_TEXT.BTN_SAVE}
          </button>
        </div>
      </div>
    </div>
  );
}
