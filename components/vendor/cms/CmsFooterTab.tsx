import React from "react";
import { CmsDataKey } from "@/constants/cms";
import { CmsSection } from "./Section";
import { InputField } from "./InputField";
import { UILabels } from "@/constants/ui-labels";
import { AddBtn } from "./AddBtn";
import { Plus, Trash2, Layers } from "lucide-react";
import { UiText } from "@/constants/ui-text";

export const CmsFooterTab = ({
  data,
  set,
  addItem,
}: {
  data: any;
  addItem: (key: string, template: any) => void;
  set: (key: string, val: any) => void;
}) => {
  return (
    <>
      <CmsSection title={UILabels.SECTIONS.COPYRIGHT__BOTTOM_TEXT}>
        <InputField
          label={UILabels.FIELDS.BOTTOM_TEXT}
          value={data.bottom_text || ""}
          onChange={(v: string) => set("bottom_text", v)}
        />
      </CmsSection>
      <CmsSection
        title={UILabels.SECTIONS.FOOTER_COLUMNS}
        action={
          <AddBtn
            onClick={() => addItem("content", { header: "", links: [] })}
            label={UILabels.FIELDS.ADD_COLUMN}
          />
        }
      >
        
        {(!data.content || data.content.length === 0) && (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl text-center">
            <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Layers size={20} />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">{UiText.NO_FOOTER_COLUMNS_TITLE}</h3>
            <p className="text-sm text-gray-500 max-w-sm">{UiText.NO_FOOTER_COLUMNS_DESC}</p>
          </div>
        )}
        {(data.content || []).map((col: any, ci: number) => (
          <div
            key={col.id || ci}
            className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 space-y-4 min-w-0 flex flex-col"
          >
            <div className="flex justify-between items-center gap-3">
              <div className="flex-1">
                <InputField
                  label={UILabels.FIELDS.COLUMN_HEADER}
                  value={col.header}
                  onChange={(v: string) =>
                    set(
                      "content",
                      data.content.map((c: any, i: number) =>
                        i === ci ? { ...c, header: v } : c,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex gap-2 self-end mb-0.5">
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "content",
                      data.content.map((c: any, i: number) =>
                        i === ci
                          ? {
                              ...c,
                              links: [
                                ...(c.links || []),
                                { id: Date.now(), title: "", url: "" },
                              ],
                            }
                          : c,
                      ),
                    )
                  }
                  className="text-theme-caption bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl shadow-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={12} /> {UiText.LINK}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "content",
                      data.content.filter((_: any, i: number) => i !== ci),
                    )
                  }
                  className="text-red-400 hover:text-red-655 p-1.5 border border-red-200 rounded-lg"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="space-y-2 pl-3 border-l-2 border-purple-100">
              {(col.links || []).map((lnk: any, li: number) => (
                <div
                  key={lnk.id || li}
                  className="flex gap-3 items-end bg-white border border-gray-100 p-2.5 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    <input
                      placeholder={UiText.PLACEHOLDERS.LINK_LABEL}
                      value={lnk.title}
                      onChange={(e) =>
                        set(
                          "content",
                          data.content.map((c: any, i: number) =>
                            i === ci
                              ? {
                                  ...c,
                                  links: c.links.map((l: any, j: number) =>
                                    j === li
                                      ? {
                                          ...l,
                                          title: e.target.value,
                                        }
                                      : l,
                                  ),
                                }
                              : c,
                          ),
                        )
                      }
                      className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-theme-caption shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-slate-900 min-w-0"
                    />
                    <input
                      placeholder={UiText.PLACEHOLDERS.LINK_PATH}
                      value={lnk.url}
                      onChange={(e) =>
                        set(
                          "content",
                          data.content.map((c: any, i: number) =>
                            i === ci
                              ? {
                                  ...c,
                                  links: c.links.map((l: any, j: number) =>
                                    j === li
                                      ? { ...l, url: e.target.value }
                                      : l,
                                  ),
                                }
                              : c,
                          ),
                        )
                      }
                      className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-theme-caption font-mono text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-slate-900 min-w-0 break-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "content",
                        data.content.map((c: any, i: number) =>
                          i === ci
                            ? {
                                ...c,
                                links: c.links.filter(
                                  (_: any, j: number) => j !== li,
                                ),
                              }
                            : c,
                        ),
                      )
                    }
                    className="text-red-400 hover:text-red-650"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CmsSection>
    </>
  );
};
