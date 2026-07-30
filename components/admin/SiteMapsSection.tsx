"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSiteMaps,
  createSiteMap,
  updateSiteMap,
  deleteSiteMap,
} from "@/utils/adminApiClients";
import { SiteMap } from "@/utils/Types";
import SiteMapModal from "./SiteMapModal";
import { Globe, Plus, Trash2, Edit2, Map as MapIcon } from "lucide-react";
import toast from "react-hot-toast";
import { SITE_MAPS_TEXT } from "@/constants";

interface SiteMapsSectionProps {
  token: string;
}

interface SiteMapPayload {
  key: string;
  label: string;
  base_path: string;
  default_query_param?: string;
}

export default function SiteMapsSection({ token }: SiteMapsSectionProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<SiteMap | null>(null);

  const {
    data: siteMaps = [],
    isLoading,
    isError,
    error,
  } = useQuery<SiteMap[], Error>({
    queryKey: ["siteMaps"],
    queryFn: async () => {
      const res = await fetchSiteMaps(token);
      return res.data;
    },
  });
  const createMutation = useMutation({
    mutationFn: (payload: SiteMapPayload) => createSiteMap(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteMaps"] });
      toast.success(SITE_MAPS_TEXT.SUCCESS_CREATE);
      setIsModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || SITE_MAPS_TEXT.ERROR_CREATE);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<SiteMapPayload> &
        Pick<SiteMapPayload, "label" | "base_path">;
    }) => updateSiteMap(id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteMaps"] });
      toast.success(SITE_MAPS_TEXT.SUCCESS_UPDATE);
      setIsModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || SITE_MAPS_TEXT.ERROR_UPDATE);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSiteMap(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteMaps"] });
      toast.success(SITE_MAPS_TEXT.SUCCESS_DELETE);
    },
    onError: (err: Error) => {
      toast.error(err.message || SITE_MAPS_TEXT.ERROR_DELETE);
    },
  });

  const handleSave = async (payload: SiteMapPayload, isEdit: boolean) => {
    if (isEdit && editingMap) {
      updateMutation.mutate({ id: editingMap.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (siteMap: SiteMap) => {
    if (confirm(`${SITE_MAPS_TEXT.CONFIRM_DELETE}"${siteMap.label}"?`)) {
      deleteMutation.mutate(siteMap.id);
    }
  };

  const openAddModal = () => {
    setEditingMap(null);
    setIsModalOpen(true);
  };

  const openEditModal = (siteMap: SiteMap) => {
    setEditingMap(siteMap);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">
          {SITE_MAPS_TEXT.LOADING_TEXT}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50/50 rounded-3xl border border-red-100 p-8 text-center">
        <Globe className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {SITE_MAPS_TEXT.ERROR_TITLE}
        </h3>
        <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">
          {error?.message || SITE_MAPS_TEXT.ERROR_DESC_DEFAULT}
        </p>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["siteMaps"] })
          }
          className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-xl transition-colors text-sm"
        >
          {SITE_MAPS_TEXT.TRY_AGAIN}
        </button>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            {SITE_MAPS_TEXT.PAGE_TITLE}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {SITE_MAPS_TEXT.PAGE_DESCRIPTION}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {SITE_MAPS_TEXT.ADD_MAPPING}
        </button>
      </div>

      {siteMaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
            <MapIcon size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {SITE_MAPS_TEXT.NO_MAPPINGS_TITLE}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
            {SITE_MAPS_TEXT.NO_MAPPINGS_DESC}
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {SITE_MAPS_TEXT.ADD_FIRST_MAPPING}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    {SITE_MAPS_TEXT.LABEL_DISPLAY_LABEL}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    {SITE_MAPS_TEXT.LABEL_KEY}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    {SITE_MAPS_TEXT.LABEL_BASE_PATH}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600">
                    {SITE_MAPS_TEXT.LABEL_QUERY_PARAM}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(Array.isArray(siteMaps) ? siteMaps : []).map((map) => (
                  <tr
                    key={map.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {map.label}
                        {map.is_system && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                            {SITE_MAPS_TEXT.SYSTEM_TAG}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs bg-slate-50/30">
                      {map.key}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {map.base_path}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {map.default_query_param ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-mono">
                          ?{map.default_query_param}=...
                        </span>
                      ) : (
                        <span className="text-gray-300 italic">
                          {SITE_MAPS_TEXT.EMPTY_QUERY_PARAM}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(map)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit mapping"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!map.is_system ? (
                          <button
                            onClick={() => handleDelete(map)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete mapping"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SiteMapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingSiteMap={editingMap}
        isSaving={isSaving}
      />
    </div>
  );
}
