import React from "react";
import { AddBtn } from "./AddBtn";
import { ListCard } from "./ListCard";

import { CmsSection } from "./Section";

import { InputField } from "./InputField";
import { ImageUploadField } from "./ImageUploadField";
import { PhoneCall } from "lucide-react";
import { UILabels } from "@/constants/ui-labels";
import { UiText } from "@/constants/ui-text";
export const CmsContactTab = ({
  data,
  set,
  addItem,
  removeItem,
  updateItem,
  makeAutoSave,
}: {
  data: any;
  set: (key: string, value: any) => void;
  addItem: (key: string, value: any) => void;
  removeItem: (key: string, id: string) => void;
  updateItem: (key: string, id: string, field: string, value: any) => void;
  makeAutoSave: (key: string) => (newUrl: string) => Promise<void>;
}) => {
  return (
    <>
      <CmsSection title={UILabels.SECTIONS.HERO_BLOCK}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={UILabels.FIELDS.HERO_TITLE}
            value={data.hero?.heroTitle || ""}
            onChange={(v: string) =>
              set("hero", { ...data.hero, heroTitle: v })
            }
          />
          <InputField
            label={UILabels.FIELDS.HERO_SUBTITLE}
            value={data.hero?.heroDesc || ""}
            onChange={(v: string) => set("hero", { ...data.hero, heroDesc: v })}
          />
          <div className="md:col-span-2">
            <ImageUploadField
              label={UILabels.FIELDS.HERO_BACKGROUND_IMAGE}
              value={data.hero?.heroImg || ""}
              onChange={(v: string) =>
                set("hero", { ...data.hero, heroImg: v })
              }
            />
          </div>
        </div>
      </CmsSection>
      <CmsSection
        title={UILabels.SECTIONS.CONTACT_METHODS}
        action={
          <AddBtn
            onClick={() =>
              addItem("list", {
                type: "phone",
                title: "",
                description: "",
                icon: "phone",
              })
            }
            label={UILabels.FIELDS.ADD_METHOD}
          />
        }
      >
        
        {(!data.list || data.list.length === 0) && (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl text-center">
            <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <PhoneCall size={20} />
            </div>
            <h3 className="text-gray-900 font-semibold mb-1">{UiText.NO_CONTACT_METHODS_TITLE}</h3>
            <p className="text-sm text-gray-500 max-w-sm">{UiText.NO_CONTACT_METHODS_DESC}</p>
          </div>
        )}
        {(data.list || []).map((c: any) => (
          <ListCard key={c.id} onRemove={() => removeItem("list", c.id)}>
            <div className="min-w-0 flex flex-col">
              <label className="block text-theme-caption font-bold text-gray-500 mb-1.5">
                {UiText.TABLE_HEADER_TYPE}
              </label>
              <select
                value={c.type}
                onChange={(e) =>
                  updateItem("list", c.id, "type", e.target.value)
                }
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-theme-body-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-slate-900 font-semibold text-gray-750"
              >
                <option value="phone">{UiText.CONTACT_TYPES.PHONE}</option>
                <option value="email">{UiText.CONTACT_TYPES.EMAIL}</option>
                <option value="address">{UiText.CONTACT_TYPES.ADDRESS}</option>
                <option value="other">{UiText.CONTACT_TYPES.OTHER}</option>
              </select>
            </div>
            <InputField
              label={UILabels.FIELDS.TITLE}
              value={c.title}
              onChange={(v: string) => updateItem("list", c.id, "title", v)}
            />
            <InputField
              label={UILabels.FIELDS.ICON_LUCIDE_NAME}
              value={c.icon}
              onChange={(v: string) => updateItem("list", c.id, "icon", v)}
              mono
            />
            <InputField
              label={UILabels.FIELDS.DETAILS__VALUE}
              value={c.description}
              onChange={(v: string) =>
                updateItem("list", c.id, "description", v)
              }
            />
          </ListCard>
        ))}
      </CmsSection>
    </>
  );
};
