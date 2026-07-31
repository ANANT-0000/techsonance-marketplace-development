"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNavTemplates,
  rescanNavTemplates,
  createNavTemplate,
  updateNavTemplate,
  deleteNavTemplate,
} from "@/utils/adminApiClients";
import {
  NavTemplateItem,
  CreateNavTemplatePayload,
  UpdateNavTemplatePayload,
  NavTemplateKindEnum,
} from "@/utils/Types";
import NavTemplateModal from "./NavTemplateModal";
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import toast from "react-hot-toast";
import { NAV_TEMPLATES_TEXT } from "@/constants";

interface NavTemplatesSectionProps {
  token: string;
}

export default function NavTemplatesSection({
  token,
}: NavTemplatesSectionProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavTemplateItem | null>(null);

  const {
    data: navItems = [],
    isLoading,
    isError,
    error,
  } = useQuery<NavTemplateItem[], Error>({
    queryKey: ["navTemplates"],
    queryFn: async () => {
      const res = await fetchNavTemplates(token);

      if (Array.isArray(res?.data)) {
        return res.data;
      }

      return [];
    },
  });

  const rescanMutation = useMutation({
    mutationFn: () => rescanNavTemplates(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navTemplates"] });
      toast.success(NAV_TEMPLATES_TEXT.SUCCESS_RESCAN);
    },
    onError: (err: Error) => {
      toast.error(err.message || NAV_TEMPLATES_TEXT.ERROR_LOAD);
    },
  });

  const createMutation = useMutation({
    mutationFn: (
      payload: CreateNavTemplatePayload & { manual_override?: boolean },
    ) => createNavTemplate(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navTemplates"] });
      toast.success(NAV_TEMPLATES_TEXT.SUCCESS_CREATE);
      setIsModalOpen(false);
      setEditingItem(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create navigation item.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateNavTemplatePayload;
    }) => updateNavTemplate(id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navTemplates"] });
      toast.success(NAV_TEMPLATES_TEXT.SUCCESS_UPDATE);
      setIsModalOpen(false);
      setEditingItem(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update navigation item.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNavTemplate(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navTemplates"] });
      toast.success(NAV_TEMPLATES_TEXT.SUCCESS_DELETE);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete navigation item.");
    },
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: NavTemplateItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (
    payload: CreateNavTemplatePayload & { manual_override?: boolean },
    isEdit: boolean,
  ) => {
    if (isEdit && editingItem) {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        payload: {
          label: payload.label,
          path: payload.path,
          template_key: payload.template_key,
          manual_override: payload.manual_override,
        },
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleDelete = (id: string, label: string) => {
    if (window.confirm(`${NAV_TEMPLATES_TEXT.CONFIRM_DELETE} "${label}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">
          Loading navigation items...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50/50 rounded-3xl border border-red-100 p-8 text-center">
        <Globe className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {NAV_TEMPLATES_TEXT.ERROR_LOAD}
        </h3>
        <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">
          {error?.message || NAV_TEMPLATES_TEXT.ERROR_LOAD}
        </p>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["navTemplates"] })
          }
          className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-xl transition-colors text-sm"
        >
          {NAV_TEMPLATES_TEXT.TRY_AGAIN}
        </button>
      </div>
    );
  }

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    rescanMutation.isPending;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            {NAV_TEMPLATES_TEXT.PAGE_TITLE}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {NAV_TEMPLATES_TEXT.PAGE_DESCRIPTION}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => rescanMutation.mutate()}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${rescanMutation.isPending ? "animate-spin" : ""}`}
            />
            {NAV_TEMPLATES_TEXT.RESCAN_BTN}
          </button>
          <button
            onClick={handleOpenAdd}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {NAV_TEMPLATES_TEXT.ADD_ITEM_BTN}
          </button>
        </div>
      </div>

      {navItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
            <Layers size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {NAV_TEMPLATES_TEXT.NO_ITEMS_TITLE}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
            {NAV_TEMPLATES_TEXT.NO_ITEMS_DESC}
          </p>
          <button
            onClick={() => rescanMutation.mutate()}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {NAV_TEMPLATES_TEXT.RESCAN_BTN}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {NAV_TEMPLATES_TEXT.COL_KEY}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {NAV_TEMPLATES_TEXT.COL_LABEL}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {NAV_TEMPLATES_TEXT.COL_KIND}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {NAV_TEMPLATES_TEXT.COL_PATH}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {NAV_TEMPLATES_TEXT.COL_STATUS}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                    {NAV_TEMPLATES_TEXT.COL_ACTIONS}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {navItems &&
                  Array.isArray(navItems) &&
                  navItems.map((item) => {
                    const isOverride =
                      item.config_schema?.manual_override === true;
                    const isBroken =
                      !item.label ||
                      (item.kind === NavTemplateKindEnum.SYSTEM_ROUTE &&
                        !item.path) ||
                      (item.kind === NavTemplateKindEnum.DYNAMIC_TEMPLATE &&
                        !item.template_key);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-900">
                          {item.key}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-900">
                          {item.label}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                            {item.kind === NavTemplateKindEnum.SYSTEM_ROUTE
                              ? "System Route"
                              : "Dynamic Template"}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-600">
                          {item.path || item.template_key || "—"}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isBroken ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                {NAV_TEMPLATES_TEXT.STATUS_BROKEN}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {NAV_TEMPLATES_TEXT.STATUS_ACTIVE}
                              </span>
                            )}
                            {isOverride ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                {NAV_TEMPLATES_TEXT.BADGE_OVERRIDE}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Cpu className="w-3.5 h-3.5" />
                                {NAV_TEMPLATES_TEXT.BADGE_SYSTEM}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit & Override"
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.label)}
                              title="Delete Item"
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NavTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingItem={editingItem}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
