"use client";

import React, { useState, useEffect } from "react";
import {
  NavTemplateItem,
  NavTemplateKindEnum,
  CreateNavTemplatePayload,
} from "@/utils/Types";
import { X, Save, ShieldCheck } from "lucide-react";
import { NAV_TEMPLATES_TEXT } from "@/constants";

interface NavTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    payload: CreateNavTemplatePayload & { manual_override?: boolean },
    isEdit: boolean,
  ) => Promise<void>;
  editingItem: NavTemplateItem | null;
  isSaving: boolean;
}

export default function NavTemplateModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  isSaving,
}: NavTemplateModalProps) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<NavTemplateKindEnum>(
    NavTemplateKindEnum.SYSTEM_ROUTE,
  );
  const [path, setPath] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [manualOverride, setManualOverride] = useState(true);

  useEffect(() => {
    if (editingItem) {
      setKey(editingItem.key || "");
      setLabel(editingItem.label || "");
      setKind(editingItem.kind || NavTemplateKindEnum.SYSTEM_ROUTE);
      setPath(editingItem.path || "");
      setTemplateKey(editingItem.template_key || "");
      setManualOverride(
        editingItem.config_schema?.manual_override !== false,
      );
    } else {
      setKey("");
      setLabel("");
      setKind(NavTemplateKindEnum.SYSTEM_ROUTE);
      setPath("");
      setTemplateKey("");
      setManualOverride(true);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(editingItem);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !label.trim()) return;

    const payload: CreateNavTemplatePayload & { manual_override?: boolean } = {
      key: key.trim().toLowerCase().replace(/\s+/g, "_"),
      label: label.trim(),
      kind,
      path: kind === NavTemplateKindEnum.SYSTEM_ROUTE ? path.trim() || "/" : null,
      template_key:
        kind === NavTemplateKindEnum.DYNAMIC_TEMPLATE
          ? templateKey.trim() || null
          : null,
      manual_override: manualOverride,
    };

    await onSave(payload, isEdit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isEdit
                ? NAV_TEMPLATES_TEXT.MODAL_EDIT_TITLE
                : NAV_TEMPLATES_TEXT.MODAL_ADD_TITLE}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {NAV_TEMPLATES_TEXT.MODAL_DESC}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">{NAV_TEMPLATES_TEXT.STATUS_OVERRIDE}</p>
              <p className="text-amber-700">{NAV_TEMPLATES_TEXT.MODAL_DESC}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              {NAV_TEMPLATES_TEXT.LABEL_KEY}
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., store, blog, new_arrivals"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              {NAV_TEMPLATES_TEXT.LABEL_DISPLAY_LABEL}
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Store / Shop"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              {NAV_TEMPLATES_TEXT.LABEL_KIND}
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as NavTemplateKindEnum)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            >
              <option value={NavTemplateKindEnum.SYSTEM_ROUTE}>
                System Route (Fixed Path)
              </option>
              <option value={NavTemplateKindEnum.DYNAMIC_TEMPLATE}>
                Dynamic Template (Configurable)
              </option>
            </select>
          </div>

          {kind === NavTemplateKindEnum.SYSTEM_ROUTE ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                {NAV_TEMPLATES_TEXT.LABEL_PATH}
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="e.g., /store, /about, /contact"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                {NAV_TEMPLATES_TEXT.LABEL_TEMPLATE_KEY}
              </label>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono"
              >
                <option value="">Select Template Type...</option>
                <option value="category_link">category_link (Link to Category)</option>
                <option value="custom_link">custom_link (Custom URL / External)</option>
                <option value="filtered_collection">filtered_collection (Product Collection)</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="manualOverride"
              checked={manualOverride}
              onChange={(e) => setManualOverride(e.target.checked)}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
            />
            <label
              htmlFor="manualOverride"
              className="text-sm font-medium text-slate-700 cursor-pointer select-none"
            >
              {NAV_TEMPLATES_TEXT.LABEL_OVERRIDE}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              {NAV_TEMPLATES_TEXT.BTN_CANCEL}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving
                ? NAV_TEMPLATES_TEXT.BTN_SAVING
                : NAV_TEMPLATES_TEXT.BTN_SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
