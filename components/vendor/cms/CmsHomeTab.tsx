import { CmsDataKey, getCategorySelectConfigs } from "@/constants";
import {
  CATEGORY_ASPECT_RATIO_OPTIONS,
  CATEGORY_BORDER_RADIUS_OPTIONS,
  TRUST_STRIP_LAYOUT_OPTIONS,
} from "@/constants";

import { CmsSection } from "./Section";
import { AddBtn } from "./AddBtn";
import { ListCard } from "./ListCard";
import { InputField } from "./InputField";
import { SelectField } from "./SelectField";
import { UiText } from "@/constants/ui-text";
import { ColorField } from "./ColorField";
import { SlideQueryPicker } from "./SlideQueryPicker";
import { ImageUploadField } from "./ImageUploadField";
import {
  Trash2,
  X,
  LayoutPanelLeft,
  MousePointerClick,
  Plus,
} from "lucide-react";
import { ProductPreviewCard } from "./ProductPreviewCard";
import { UILabels } from "@/constants/ui-labels";
import { useEffect, useState } from "react";
import AxiosAPI from "@/lib/axios";
import { toDatetimeLocal } from "@/lib/utils";
import { HeroBgStyle, HeroLayout, HomeCategories } from "@/utils/Types";
import { CategoryCard } from "@/components/customer/homepage/CategoryCard";
import { MobileCategoryPill } from "@/components/customer/homepage/MobileCategoryPill";
import { IconPicker } from "./IconPicker";
import { Button } from "@/components/ui/button";
import { VendorSectionBuilder, initialSectionState } from "./VendorSectionBuilder";

export const CmsHomeTab = ({
  data,
  set,
  removeItem,
  addItem,
  updateItem,
  makeAutoSave,
  handleImageClick,
  selectedHotspotId,
  setSelectedHotspotId,
}: {
  data: any;
  set: (key: string, val: any) => void;
  removeItem: (key: string, id: string) => void;
  addItem: (key: string, val: any) => void;
  updateItem: (key: string, id: string, field: string, val: any) => void;
  makeAutoSave: (key: string) => (newUrl: string) => Promise<void>;
  handleImageClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  selectedHotspotId: any;
  setSelectedHotspotId: (id: any) => void;
}) => {
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [previewCategories, setPreviewCategories] = useState<HomeCategories[]>(
    [],
  );
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    AxiosAPI.get("/v1/products/options")
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data?.data ?? []);
        setProducts(list);
      })
      .catch(() => setProducts([]));

    AxiosAPI.get("/v1/categories/homepage?limit=3", {
      headers: { "x-suppress-toast": true },
    })
      .then((res) => {
        if (res.data && Array.isArray(res.data.data)) {
          setPreviewCategories(res.data.data);
        }
      })
      .catch(() => setPreviewCategories([]));

    AxiosAPI.get("/v1/categories?limit=500", {
      headers: { "x-suppress-toast": true },
    })
      .then((res) => {
        if (res.data && Array.isArray(res.data.data)) {
          setAllCategories(res.data.data);
        }
      })
      .catch(() => setAllCategories([]));
  }, []);
  return (
    <>
      <CmsSection
        title={UILabels.SECTIONS.HERO_CAROUSEL_SLIDES}
        action={
          <AddBtn
            onClick={() =>
              addItem(CmsDataKey.HERO_SLIDES, {
                image_url: "",
                mobile_image_url: "",
                title: "",
                subtitle: "",
                btn_text: "Shop Now",
                search_query: "",
                layout: HeroLayout.CENTER_OVERLAY,
                bg_style: HeroBgStyle.GRADIENT,
                bg_color: "",
              })
            }
            label={UILabels.FIELDS.ADD_SLIDE}
          />
        }
      >
        {(data?.[CmsDataKey.HERO_SLIDES] || []).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
              <LayoutPanelLeft className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {UiText.NO_SLIDES_TITLE}
            </h4>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              {UiText.NO_SLIDES_DESC}
            </p>
            <button
              onClick={() =>
                addItem(CmsDataKey.HERO_SLIDES, {
                  image_url: "",
                  mobile_image_url: "",
                  title: "",
                  subtitle: "",
                  btn_text: "Shop Now",
                  search_query: "",
                  layout: HeroLayout.CENTER_OVERLAY,
                  bg_style: HeroBgStyle.GRADIENT,
                  bg_color: "",
                })
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {UiText.ADD_FIRST_SLIDE}
            </button>
          </div>
        )}
        {(data?.[CmsDataKey.HERO_SLIDES] || []).map(
          (slide: any, idx: number) => (
            <ListCard
              key={slide.id}
              onRemove={() => removeItem(CmsDataKey.HERO_SLIDES, slide.id)}
            >
              <div className="md:col-span-2">
                <p className="text-theme-tiny font-bold text-slate-900 uppercase tracking-widest mb-1">
                  Slide {idx + 1}
                </p>
              </div>
              <InputField
                label={UILabels.FIELDS.TITLE}
                value={slide.title || ""}
                onChange={(v: string) =>
                  updateItem(CmsDataKey.HERO_SLIDES, slide.id, "title", v)
                }
              />
              <InputField
                label={UILabels.FIELDS.SUBTITLE_SMALL_LABEL_ABOVE_TITLE}
                value={slide.subtitle || ""}
                onChange={(v: string) =>
                  updateItem(CmsDataKey.HERO_SLIDES, slide.id, "subtitle", v)
                }
              />
              <InputField
                label={UILabels.FIELDS.BUTTON_TEXT}
                value={slide.btn_text || ""}
                onChange={(v: string) =>
                  updateItem(CmsDataKey.HERO_SLIDES, slide.id, "btn_text", v)
                }
              />

              <SelectField
                label={UILabels.FIELDS.LAYOUT_STYLE}
                value={slide.layout || HeroLayout.CENTER_OVERLAY}
                onChange={(v: string) =>
                  updateItem(CmsDataKey.HERO_SLIDES, slide.id, "layout", v)
                }
                options={[
                  {
                    value: HeroLayout.CENTER_OVERLAY,
                    label: UiText.LAYOUTS.CENTER_OVERLAY,
                  },
                  {
                    value: HeroLayout.LEFT_CONTENT_RIGHT_IMAGE,
                    label: UiText.LAYOUTS.LEFT_SPLIT,
                  },
                  {
                    value: HeroLayout.RIGHT_CONTENT_LEFT_IMAGE,
                    label: UiText.LAYOUTS.RIGHT_SPLIT,
                  },
                ]}
              />
              <SelectField
                label={UILabels.FIELDS.BACKGROUND_STYLE}
                value={slide.bg_style || HeroBgStyle.GRADIENT}
                onChange={(v: string) =>
                  updateItem(CmsDataKey.HERO_SLIDES, slide.id, "bg_style", v)
                }
                options={[
                  {
                    value: HeroBgStyle.GRADIENT,
                    label: UiText.BG_STYLES.GRADIENT,
                  },
                  {
                    value: HeroBgStyle.SOLID,
                    label: UiText.BG_STYLES.SOLID,
                  },
                  {
                    value: "custom",
                    label: UiText.BG_STYLES.CUSTOM,
                  },
                ]}
              />

              <ColorField
                label={
                  UILabels.FIELDS
                    .SLIDE_BACKGROUND_COLOR_USED_WHEN_STYLE_IS_CUSTOM
                }
                value={slide.bg_color || ""}
                onChange={(v: string) =>
                  updateItem(CmsDataKey.HERO_SLIDES, slide.id, "bg_color", v)
                }
              />

              <SlideQueryPicker
                value={slide.search_query || ""}
                onChange={(v: string) =>
                  updateItem(
                    CmsDataKey.HERO_SLIDES,
                    slide.id,
                    "search_query",
                    v,
                  )
                }
              />
              <div className="md:col-span-1">
                <ImageUploadField
                  label={UILabels.FIELDS.SLIDE_BANNER_IMAGE + " (Desktop)"}
                  value={slide.image_url || ""}
                  onChange={(v: string) =>
                    updateItem(CmsDataKey.HERO_SLIDES, slide.id, "image_url", v)
                  }
                />
              </div>
              <div className="md:col-span-1">
                <ImageUploadField
                  label={
                    UILabels.FIELDS.SLIDE_BANNER_IMAGE + " (Mobile - Optional)"
                  }
                  value={slide.mobile_image_url || ""}
                  onChange={(v: string) =>
                    updateItem(
                      CmsDataKey.HERO_SLIDES,
                      slide.id,
                      "mobile_image_url",
                      v,
                    )
                  }
                />
              </div>
            </ListCard>
          ),
        )}
      </CmsSection>

      <CmsSection title={UILabels.SECTIONS.CATEGORIES_SECTION}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getCategorySelectConfigs(data, set).map((config) => (
            <SelectField
              key={config.label}
              label={config.label}
              value={config.value}
              onChange={config.onChange}
              options={config.options}
            />
          ))}
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            {UiText.LIVE_PREVIEW}
          </h4>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            {previewCategories.length === 0 ? (
              <p className="text-gray-400 text-sm text-center">
                {UiText.LOADING_PREVIEW_DOTS}
              </p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    {UiText.DESKTOP_VIEW}
                  </p>
                  <div className="flex gap-4 overflow-x-auto pb-4 items-center border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    {previewCategories.slice(0, 3).map((cat, idx) => (
                      <div
                        key={idx}
                        className="w-[140px] shrink-0 pointer-events-none"
                      >
                        <CategoryCard
                          cat={cat}
                          idx={idx}
                          aspectRatio={
                            data?.[CmsDataKey.CATEGORY_ASPECT_RATIO_DESKTOP] ||
                            "aspect-[3/4]"
                          }
                          borderRadius={
                            data?.[CmsDataKey.CATEGORY_BORDER_RADIUS_DESKTOP] ||
                            "rounded-2xl"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    {UiText.MOBILE_VIEW}
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-4 items-center max-w-[320px] bg-white p-4 rounded-[2rem] border-[4px] border-gray-800 shadow-xl">
                    {previewCategories.slice(0, 3).map((cat, idx) => (
                      <div
                        key={idx}
                        className="shrink-0 pointer-events-none scale-90 origin-left"
                      >
                        <MobileCategoryPill
                          cat={cat}
                          aspectRatio={
                            data?.[CmsDataKey.CATEGORY_ASPECT_RATIO_MOBILE] ||
                            "aspect-square"
                          }
                          borderRadius={
                            data?.[CmsDataKey.CATEGORY_BORDER_RADIUS_MOBILE] ||
                            "rounded-2xl"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CmsSection>

      <CmsSection title={UILabels.SECTIONS.MIDDLE_PROMO_BANNER}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={UILabels.FIELDS.SUBTITLE}
            value={data?.[CmsDataKey.MIDDLE_BANNER_SUBTITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.MIDDLE_BANNER_SUBTITLE, v)}
          />
          <InputField
            label={UILabels.FIELDS.BUTTON_TEXT}
            value={data?.[CmsDataKey.MIDDLE_BANNER_BTN_TEXT] || ""}
            onChange={(v: string) => set(CmsDataKey.MIDDLE_BANNER_BTN_TEXT, v)}
          />
          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.TITLE}
              value={data?.[CmsDataKey.MIDDLE_BANNER_TITLE] || ""}
              onChange={(v: string) => set(CmsDataKey.MIDDLE_BANNER_TITLE, v)}
            />
          </div>
          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.DESCRIPTION}
              value={data?.[CmsDataKey.MIDDLE_BANNER_DESC] || ""}
              onChange={(v: string) => set(CmsDataKey.MIDDLE_BANNER_DESC, v)}
              textarea
            />
          </div>
          <div className="md:col-span-2">
            <ImageUploadField
              label={UILabels.FIELDS.PROMO_BANNER_IMAGE}
              value={data?.[CmsDataKey.MIDDLE_BANNER_IMAGE_URL] || ""}
              onChange={(v: string) =>
                set(CmsDataKey.MIDDLE_BANNER_IMAGE_URL, v)
              }
              onAutoSave={makeAutoSave(CmsDataKey.MIDDLE_BANNER_IMAGE_URL)}
            />
          </div>
        </div>
      </CmsSection>
      <CmsSection title={UILabels.SECTIONS.NEW_ARRIVALS__4_GRID_LAYOUT}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className="border border-gray-200 p-4 rounded-lg bg-gray-50 flex flex-col gap-4"
            >
              <h4 className="font-bold text-theme-body-sm text-gray-700">
                Card {num}
              </h4>

              <ImageUploadField
                label={`Image`}
                value={data[`new_arrivals_card_${num}_image_url`] || ""}
                onChange={(v: string) =>
                  set(`new_arrivals_card_${num}_image_url`, v)
                }
                onAutoSave={(newUrl) =>
                  makeAutoSave(`new_arrivals_card_${num}_image_url`)(newUrl)
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label={UILabels.FIELDS.TITLE}
                  value={data[`new_arrivals_card_${num}_title`] || ""}
                  onChange={(v: string) =>
                    set(`new_arrivals_card_${num}_title`, v)
                  }
                />
                <InputField
                  label={UILabels.FIELDS.SUBTITLE}
                  value={data[`new_arrivals_card_${num}_subtitle`] || ""}
                  onChange={(v: string) =>
                    set(`new_arrivals_card_${num}_subtitle`, v)
                  }
                />
              </div>

              <ColorField
                label={
                  UILabels.FIELDS.CARD_BACKGROUND_COLOR_OVERRIDES_AUTODETECT
                }
                value={data[`new_arrivals_card_${num}_bg_color`] || ""}
                onChange={(v: string) =>
                  set(`new_arrivals_card_${num}_bg_color`, v)
                }
              />
            </div>
          ))}
        </div>
      </CmsSection>
      <CmsSection title={UILabels.SECTIONS.NEWSLETTER_BLOCK}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={UILabels.FIELDS.NEWSLETTER_TITLE}
            value={data?.[CmsDataKey.NEWSLETTER_TITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.NEWSLETTER_TITLE, v)}
          />
          <InputField
            label={UILabels.FIELDS.NEWSLETTER_BUTTON_TEXT}
            value={data?.[CmsDataKey.NEWSLETTER_BTN_TEXT] || ""}
            onChange={(v: string) => set(CmsDataKey.NEWSLETTER_BTN_TEXT, v)}
          />
          <InputField
            label={UILabels.FIELDS.NEWSLETTER_EYEBROW__TAG}
            value={data?.[CmsDataKey.NEWSLETTER_EYEBROW] || ""}
            onChange={(v: string) => set(CmsDataKey.NEWSLETTER_EYEBROW, v)}
          />
          <InputField
            label={UILabels.FIELDS.NEWSLETTER_SUCCESS_MESSAGE}
            value={data?.[CmsDataKey.NEWSLETTER_SUCCESS_TEXT] || ""}
            onChange={(v: string) => set(CmsDataKey.NEWSLETTER_SUCCESS_TEXT, v)}
          />
          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.NEWSLETTER_DESCRIPTION}
              value={data?.[CmsDataKey.NEWSLETTER_DESC] || ""}
              onChange={(v: string) => set(CmsDataKey.NEWSLETTER_DESC, v)}
              textarea
            />
          </div>
          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.NEWSLETTER_TERMS_DISCLAIMER}
              value={data?.[CmsDataKey.NEWSLETTER_DISCLAIMER] || ""}
              onChange={(v: string) => set(CmsDataKey.NEWSLETTER_DISCLAIMER, v)}
            />
          </div>
        </div>
      </CmsSection>

      <CmsSection
        title={UILabels.SECTIONS.BRAND_HIGHLIGHT_BLOCK}
        action={
          <AddBtn
            onClick={() =>
              addItem("brand_highlight_stats", {
                value: "",
                label: "",
              })
            }
            label={UILabels.FIELDS.ADD_STAT}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={UILabels.FIELDS.HIGHLIGHT_EYEBROW__SUBTITLE}
            value={data?.[CmsDataKey.BRAND_HIGHLIGHT_EYEBROW] || ""}
            onChange={(v: string) => set(CmsDataKey.BRAND_HIGHLIGHT_EYEBROW, v)}
          />
          <InputField
            label={UILabels.FIELDS.HIGHLIGHT_BUTTON_TEXT}
            value={data?.[CmsDataKey.BRAND_HIGHLIGHT_BTN_TEXT] || ""}
            onChange={(v: string) =>
              set(CmsDataKey.BRAND_HIGHLIGHT_BTN_TEXT, v)
            }
          />
          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.HIGHLIGHT_TITLE}
              value={data?.[CmsDataKey.BRAND_HIGHLIGHT_TITLE] || ""}
              onChange={(v: string) => set(CmsDataKey.BRAND_HIGHLIGHT_TITLE, v)}
            />
          </div>
          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.HIGHLIGHT_DESCRIPTION}
              value={data?.[CmsDataKey.BRAND_HIGHLIGHT_DESC] || ""}
              onChange={(v: string) => set(CmsDataKey.BRAND_HIGHLIGHT_DESC, v)}
              textarea
            />
          </div>
          <div className="md:col-span-2">
            <ImageUploadField
              label={UILabels.FIELDS.HIGHLIGHT_BANNER_IMAGE}
              value={data?.[CmsDataKey.BRAND_HIGHLIGHT_IMAGE_URL] || ""}
              onChange={(v: string) =>
                set(CmsDataKey.BRAND_HIGHLIGHT_IMAGE_URL, v)
              }
              onAutoSave={makeAutoSave(CmsDataKey.BRAND_HIGHLIGHT_IMAGE_URL)}
            />
          </div>
          <div className="md:col-span-2">
            <ColorField
              label={
                UILabels.FIELDS
                  .CARD_BACKGROUND_COLOR_OVERRIDES_AUTODETECT_FROM_IMAGE
              }
              value={data?.[CmsDataKey.BRAND_HIGHLIGHT_BG_COLOR] || ""}
              onChange={(v: string) =>
                set(CmsDataKey.BRAND_HIGHLIGHT_BG_COLOR, v)
              }
            />
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="text-theme-caption font-bold text-gray-500 uppercase mb-3">
            {UiText.KEY_STATS}
          </h4>
          <div className="space-y-3">
            {(data.brand_highlight_stats || []).map(
              (stat: any, sIdx: number) => (
                <div
                  key={stat.id || sIdx}
                  className="flex gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-150 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeItem("brand_highlight_stats", stat.id)}
                    className="absolute right-3 top-3 text-red-400 hover:text-red-650"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <InputField
                      label={UILabels.FIELDS.STAT_VALUE_EG_500}
                      value={stat.value || ""}
                      onChange={(v: string) =>
                        updateItem("brand_highlight_stats", stat.id, "value", v)
                      }
                    />
                    <InputField
                      label={UILabels.FIELDS.STAT_LABEL_EG_PRODUCTS}
                      value={stat.label || ""}
                      onChange={(v: string) =>
                        updateItem("brand_highlight_stats", stat.id, "label", v)
                      }
                    />
                  </div>
                </div>
              ),
            )}
            {!(data.brand_highlight_stats || []).length && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {UiText.NO_STATS_TITLE}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {UiText.NO_STATS_DESC}
                </p>
              </div>
            )}
          </div>
        </div>
      </CmsSection>

      <CmsSection title={UILabels.SECTIONS.INTERACTIVE_HERO_OPTIONS_ENHANCED}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label={UILabels.FIELDS.BANNER_DISPLAY_TYPE}
            value={data?.[CmsDataKey.HERO_BANNER_TYPE] || "carousel"}
            onChange={(v: string) => set(CmsDataKey.HERO_BANNER_TYPE, v)}
            options={[
              {
                value: "carousel",
                label: UiText.BANNER_TYPES.CAROUSEL,
              },
              { value: "video", label: UiText.BANNER_TYPES.VIDEO },
            ]}
          />
          <InputField
            label={UILabels.FIELDS.VIDEO_BACKGROUND_URL_MP4_FORMAT}
            value={data?.[CmsDataKey.HERO_VIDEO_URL] || ""}
            onChange={(v: string) => set(CmsDataKey.HERO_VIDEO_URL, v)}
            mono
          />

          <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
            <h4 className="text-theme-caption font-bold text-gray-500 uppercase mb-3">
              {UiText.VIDEO_OVERLAY_CONTENT}
            </h4>
          </div>
          <InputField
            label={UILabels.FIELDS.VIDEO_HERO_EYEBROW__TAG}
            value={data?.[CmsDataKey.HERO_VIDEO_EYEBROW] || ""}
            onChange={(v: string) => set(CmsDataKey.HERO_VIDEO_EYEBROW, v)}
          />
          <InputField
            label={UILabels.FIELDS.VIDEO_HERO_BUTTON_TEXT}
            value={data?.[CmsDataKey.HERO_VIDEO_BTN_TEXT] || ""}
            onChange={(v: string) => set(CmsDataKey.HERO_VIDEO_BTN_TEXT, v)}
          />
          <InputField
            label={UILabels.FIELDS.VIDEO_HERO_TITLE}
            value={data?.[CmsDataKey.HERO_VIDEO_TITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.HERO_VIDEO_TITLE, v)}
          />
          <InputField
            label={UILabels.FIELDS.VIDEO_HERO_BUTTON_LINK_URL}
            value={data?.[CmsDataKey.HERO_VIDEO_BTN_LINK] || ""}
            onChange={(v: string) => set(CmsDataKey.HERO_VIDEO_BTN_LINK, v)}
            mono
          />
          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.VIDEO_HERO_DESCRIPTION}
              value={data?.[CmsDataKey.HERO_VIDEO_DESC] || ""}
              onChange={(v: string) => set(CmsDataKey.HERO_VIDEO_DESC, v)}
              textarea
            />
          </div>
        </div>
      </CmsSection>

      <CmsSection title={UILabels.SECTIONS.SHOPPABLE_LOOKBOOK_SECTION}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={UILabels.FIELDS.LOOKBOOK_SECTION_TITLE}
            value={data?.[CmsDataKey.LOOKBOOK_TITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.LOOKBOOK_TITLE, v)}
          />
          <InputField
            label={UILabels.FIELDS.LOOKBOOK_SUBTITLE__DESCRIPTION}
            value={data?.[CmsDataKey.LOOKBOOK_SUBTITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.LOOKBOOK_SUBTITLE, v)}
          />
          <div className="md:col-span-2">
            <ImageUploadField
              label={UILabels.FIELDS.MAIN_LOOKBOOK_IMAGE}
              value={data?.[CmsDataKey.LOOKBOOK_IMAGE_URL] || ""}
              onChange={(v: string) => set(CmsDataKey.LOOKBOOK_IMAGE_URL, v)}
              onAutoSave={makeAutoSave(CmsDataKey.LOOKBOOK_IMAGE_URL)}
            />
          </div>
          <div className="md:col-span-2">
            <ColorField
              label={
                UILabels.FIELDS
                  .SECTION_BACKGROUND_COLOR_FALLBACK_IF_NO_IMAGE_OR_TRANSPARENT
              }
              value={data?.[CmsDataKey.LOOKBOOK_BG_COLOR] || ""}
              onChange={(v: string) => set(CmsDataKey.LOOKBOOK_BG_COLOR, v)}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-gray-150 pt-6">
          {data?.[CmsDataKey.LOOKBOOK_IMAGE_URL] ? (
            <div className="mb-6 border border-gray-200 rounded-2xl p-4 bg-white shadow-sm">
              <h4 className="text-theme-caption font-bold text-gray-500 uppercase mb-2">
                {UiText.VISUAL_PREVIEW_TITLE}
              </h4>
              <p className="text-theme-tiny text-gray-400 mb-3">
                {UiText.VISUAL_PREVIEW_INSTRUCTIONS}
              </p>
              <div
                onClick={handleImageClick}
                className="relative max-w-74 max-h-74 aspect-[16/9] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden cursor-crosshair select-none group"
              >
                <img
                  src={data?.[CmsDataKey.LOOKBOOK_IMAGE_URL]}
                  alt={UiText.LOOKBOOK_MAP_ALT}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {(data?.[CmsDataKey.LOOKBOOK_HOTSPOTS] || []).map(
                  (spot: any, sIdx: number) => {
                    const isSelected = spot.id === selectedHotspotId;
                    return (
                      <div
                        key={spot.id || sIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHotspotId(spot.id);
                        }}
                        style={{
                          left: `${spot.x}%`,
                          top: `${spot.y}%`,
                        }}
                        className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-white flex items-center justify-center text-theme-tiny font-black shadow-md cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white scale-125 ring-2 ring-purple-400 ring-offset-1"
                            : "bg-black/60 text-white hover:bg-black/85"
                        }`}
                      >
                        {sIdx + 1}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-3">
                <MousePointerClick className="w-5 h-5 text-gray-400" />
              </div>
              <h5 className="text-sm font-semibold text-gray-700 mb-1">
                {UiText.LOOKBOOK_EMPTY_TITLE}
              </h5>
              <p className="text-xs text-gray-500 max-w-xs">
                {UiText.LOOKBOOK_EMPTY_DESC}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <h4 className="text-theme-caption font-bold text-gray-500 uppercase">
              Interactive Hotspots
            </h4>
            <AddBtn
              onClick={() => {
                const newId = Date.now();
                set(CmsDataKey.LOOKBOOK_HOTSPOTS, [
                  ...(data?.[CmsDataKey.LOOKBOOK_HOTSPOTS] || []),
                  {
                    id: newId,
                    x: 50,
                    y: 50,
                    productId: "",
                    product_id: "",
                  },
                ]);
                setSelectedHotspotId(newId);
              }}
              label={UILabels.FIELDS.ADD_HOTSPOT}
            />
          </div>
          <div className="space-y-3">
            {(data?.[CmsDataKey.LOOKBOOK_HOTSPOTS] || []).map(
              (hs: any, hIdx: number) => {
                const isSelected = hs.id === selectedHotspotId;
                return (
                  <div
                    key={hs.id || hIdx}
                    onClick={() => setSelectedHotspotId(hs.id)}
                    className={`flex flex-col gap-3 p-4 rounded-xl border relative cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-50/40 border-slate-300 ring-1 ring-purple-300 shadow-sm"
                        : "bg-gray-50 border-gray-150 hover:bg-gray-100/70"
                    }`}
                  >
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <span className="text-theme-tiny font-black bg-gray-200/80 text-gray-600 px-2 py-0.5 rounded-full">
                        #{hIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedHotspotId === hs.id) {
                            setSelectedHotspotId(null);
                          }
                          set(
                            "lookbook_hotspots",
                            data?.[CmsDataKey.LOOKBOOK_HOTSPOTS].filter(
                              (h: any) => h.id !== hs.id,
                            ),
                          );
                        }}
                        className="text-red-400 hover:text-red-650"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-theme-tiny font-bold text-gray-400 mb-1">
                          X Coord (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={hs.x}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            set(
                              "lookbook_hotspots",
                              data?.[CmsDataKey.LOOKBOOK_HOTSPOTS].map(
                                (h: any) =>
                                  h.id === hs.id
                                    ? {
                                        ...h,
                                        x: parseFloat(e.target.value) || 0,
                                      }
                                    : h,
                              ),
                            )
                          }
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-theme-caption focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-theme-tiny font-bold text-gray-400 mb-1">
                          Y Coord (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={hs.y}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            set(
                              "lookbook_hotspots",
                              data?.[CmsDataKey.LOOKBOOK_HOTSPOTS].map(
                                (h: any) =>
                                  h.id === hs.id
                                    ? {
                                        ...h,
                                        y: parseFloat(e.target.value) || 0,
                                      }
                                    : h,
                              ),
                            )
                          }
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-theme-caption focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-theme-tiny font-bold text-gray-400 mb-1">
                          Product
                        </label>
                        <select
                          value={hs.productId || hs.product_id || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const pId = e.target.value;
                            set(
                              "lookbook_hotspots",
                              data?.[CmsDataKey.LOOKBOOK_HOTSPOTS].map(
                                (h: any) =>
                                  h.id === hs.id
                                    ? {
                                        ...h,
                                        productId: pId,
                                        product_id: pId,
                                      }
                                    : h,
                              ),
                            );
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-theme-caption focus:outline-none"
                        >
                          <option value="">{UiText.SELECT_PRODUCT}</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {(hs.productId || hs.product_id) && (
                      <ProductPreviewCard
                        productId={hs.productId || hs.product_id}
                      />
                    )}
                  </div>
                );
              },
            )}
            {!(data?.[CmsDataKey.LOOKBOOK_HOTSPOTS] || []).length && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {UiText.NO_HOTSPOTS_TITLE}
                </p>
                <p className="text-xs text-gray-400">
                  {UiText.NO_HOTSPOTS_DESC}
                </p>
              </div>
            )}
          </div>
        </div>
      </CmsSection>

      <CmsSection title={UILabels.SECTIONS.SCARCITY__URGENCY_TIMER_BLOCK}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={UILabels.FIELDS.TIMER_HEADING_TITLE}
            value={data?.[CmsDataKey.SCARCITY_TIMER_TITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.SCARCITY_TIMER_TITLE, v)}
          />
          <InputField
            label={UILabels.FIELDS.EXPIRATION_DATE__TIME}
            value={toDatetimeLocal(
              data?.[CmsDataKey.SCARCITY_EXPIRES_AT] || "",
            )}
            onChange={(v: string) => set(CmsDataKey.SCARCITY_EXPIRES_AT, v)}
            type="datetime-local"
          />
          <InputField
            label={UILabels.FIELDS.CTA_ACTION_BUTTON_TEXT}
            value={data?.[CmsDataKey.SCARCITY_BTN_TEXT] || ""}
            onChange={(v: string) => set(CmsDataKey.SCARCITY_BTN_TEXT, v)}
          />
          <InputField
            label={UILabels.FIELDS.CTA_ACTION_BUTTON_LINK_URL}
            value={data?.[CmsDataKey.SCARCITY_BTN_LINK] || ""}
            onChange={(v: string) => set(CmsDataKey.SCARCITY_BTN_LINK, v)}
            mono
          />

          <div className="md:col-span-2">
            <InputField
              label={UILabels.FIELDS.MARKETING_ALERT_TEXT_MESSAGE}
              value={data?.[CmsDataKey.SCARCITY_ALERT_TEXT] || ""}
              onChange={(v: string) => set(CmsDataKey.SCARCITY_ALERT_TEXT, v)}
            />
          </div>

          <ColorField
            label={UILabels.FIELDS.ALERT_BAR_BACKGROUND_COLOR}
            value={data?.[CmsDataKey.SCARCITY_ALERT_BG]}
            onChange={(v: string) => set(CmsDataKey.SCARCITY_ALERT_BG, v)}
          />
          <ColorField
            label={UILabels.FIELDS.ALERT_BAR_TEXT_COLOR}
            value={data?.[CmsDataKey.SCARCITY_ALERT_TEXT_COLOR]}
            onChange={(v: string) =>
              set(CmsDataKey.SCARCITY_ALERT_TEXT_COLOR, v)
            }
          />
        </div>
      </CmsSection>

      <CmsSection title="Trust Strip Configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-2">
          <SelectField
            label="Grid Layout Columns"
            value={data?.[CmsDataKey.TRUST_STRIP_LAYOUT] || "4"}
            onChange={(v: string) => set(CmsDataKey.TRUST_STRIP_LAYOUT, v)}
            options={TRUST_STRIP_LAYOUT_OPTIONS}
          />
          <ColorField
            label="Background Color"
            value={data?.[CmsDataKey.TRUST_STRIP_BG_COLOR] || "#ffffff"}
            onChange={(v: string) => set(CmsDataKey.TRUST_STRIP_BG_COLOR, v)}
          />
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {UiText.TRUST_BADGE_STRIP}
            </h4>
            <AddBtn
              onClick={() =>
                set(CmsDataKey.SOCIAL_PROOF_BADGES, [
                  ...(data?.[CmsDataKey.SOCIAL_PROOF_BADGES] || []),
                  {
                    id: Date.now(),
                    icon: "security",
                    title: "",
                    desc: "",
                  },
                ])
              }
              label={UILabels.FIELDS.ADD_TRUST_BADGE}
            />
          </div>
          <div className="space-y-4">
            {(data?.[CmsDataKey.SOCIAL_PROOF_BADGES] || []).map(
              (bg: any, bIdx: number) => (
                <div
                  key={bg.id || bIdx}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group/badge hover:border-slate-300 transition-colors"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      set(
                        "social_proof_badges",
                        data?.[CmsDataKey.SOCIAL_PROOF_BADGES].filter(
                          (x: any) => x.id !== bg.id,
                        ),
                      )
                    }
                    className="absolute -right-2 -top-2 opacity-0 group-hover/badge:opacity-100 transition-opacity bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full h-8 w-8 shadow-sm border border-slate-200"
                  >
                    <Trash2 size={14} />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <IconPicker
                      label={UiText.SELECT_ICON}
                      value={bg.icon}
                      onChange={(v: string) =>
                        set(
                          "social_proof_badges",
                          data?.[CmsDataKey.SOCIAL_PROOF_BADGES].map(
                            (x: any) =>
                              x.id === bg.id ? { ...x, icon: v } : x,
                          ),
                        )
                      }
                    />
                    <InputField
                      label={UILabels.FIELDS.BADGE_TITLE}
                      value={bg.title}
                      onChange={(v: string) =>
                        set(
                          "social_proof_badges",
                          data?.[CmsDataKey.SOCIAL_PROOF_BADGES].map(
                            (x: any) =>
                              x.id === bg.id ? { ...x, title: v } : x,
                          ),
                        )
                      }
                    />
                    <InputField
                      label={UILabels.FIELDS.SHORT_DESCRIPTION}
                      value={bg.desc}
                      onChange={(v: string) =>
                        set(
                          "social_proof_badges",
                          data?.[CmsDataKey.SOCIAL_PROOF_BADGES].map(
                            (x: any) =>
                              x.id === bg.id ? { ...x, desc: v } : x,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </CmsSection>

      <CmsSection title={UILabels.SECTIONS.CURATED_DISCOVERY_PRODUCTS_SLIDER}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={UILabels.FIELDS.DISCOVERY_SECTION_HEADING}
            value={data?.[CmsDataKey.CURATED_TITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.CURATED_TITLE, v)}
          />
          <InputField
            label={UILabels.FIELDS.SUBTITLE__TAGLINE}
            value={data?.[CmsDataKey.CURATED_SUBTITLE] || ""}
            onChange={(v: string) => set(CmsDataKey.CURATED_SUBTITLE, v)}
          />

          <SelectField
            label={UILabels.FIELDS.CURATION_CATEGORY_TYPE}
            value={data?.[CmsDataKey.CURATED_TYPE] || "trending"}
            onChange={(v: string) => set(CmsDataKey.CURATED_TYPE, v)}
            options={[
              {
                value: "trending",
                label: UiText.CURATION_TYPES.TRENDING,
              },
              {
                value: "new_arrivals",
                label: UiText.CURATION_TYPES.NEW_ARRIVALS,
              },
              {
                value: "curated",
                label: UiText.CURATION_TYPES.CURATED,
              },
            ]}
          />

          <div>
            <label className="block text-theme-caption font-bold text-gray-500 mb-1.5 font-sans">
              Curated Custom Products
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(Array.isArray(data?.[CmsDataKey.CURATED_PRODUCT_IDS])
                ? data?.[CmsDataKey.CURATED_PRODUCT_IDS]
                : []
              ).map((productId: string) => {
                const p = products.find((x) => x.id === productId);
                return (
                  <div
                    key={productId}
                    className="flex items-center gap-1.5 bg-slate-50 text-slate-900 text-theme-caption font-bold px-3 py-1.5 rounded-full border border-purple-100 shadow-sm"
                  >
                    <span>{p ? p.name : productId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = (
                          data?.[CmsDataKey.CURATED_PRODUCT_IDS] || []
                        ).filter((id: string) => id !== productId);
                        set(CmsDataKey.CURATED_PRODUCT_IDS, filtered);
                      }}
                      className="text-purple-400 hover:text-purple-650 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {(!data?.[CmsDataKey.CURATED_PRODUCT_IDS] ||
                data?.[CmsDataKey.CURATED_PRODUCT_IDS].length === 0) && (
                <span className="text-theme-caption text-gray-400">
                  No custom products selected.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const currentIds = Array.isArray(
                    data?.[CmsDataKey.CURATED_PRODUCT_IDS],
                  )
                    ? data?.[CmsDataKey.CURATED_PRODUCT_IDS]
                    : [];
                  if (!currentIds.includes(val)) {
                    set(CmsDataKey.CURATED_PRODUCT_IDS, [...currentIds, val]);
                  }
                  e.target.value = "";
                }}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-theme-body-sm focus:outline-none focus:border-purple-400"
                defaultValue=""
              >
                <option value="" disabled>
                  {UiText.ADD_PRODUCT_TO_CURATED}
                </option>
                {products
                  .filter((p) => {
                    const currentIds = Array.isArray(
                      data?.[CmsDataKey.CURATED_PRODUCT_IDS],
                    )
                      ? data?.[CmsDataKey.CURATED_PRODUCT_IDS]
                      : [];
                    return !currentIds.includes(p.id);
                  })
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            <ColorField
              label={UILabels.FIELDS.SECTION_BACKGROUND_COLOR}
              value={data?.[CmsDataKey.CURATED_BG_COLOR] || ""}
              onChange={(v: string) => set(CmsDataKey.CURATED_BG_COLOR, v)}
            />
          </div>
        </div>
      </CmsSection>

      <CmsSection
        title="Custom Product Rows"
        action={
          <AddBtn
            onClick={() =>
              addItem(CmsDataKey.DYNAMIC_SECTIONS, initialSectionState)
            }
            label="Add Section"
          />
        }
      >
        <div className="space-y-4">
          {(data?.[CmsDataKey.DYNAMIC_SECTIONS] || []).map(
            (section: any, idx: number) => (
              <VendorSectionBuilder
                key={section.id || idx}
                initialData={section}
                categories={allCategories}
                onChange={(newSection) => {
                  const currentSections = data?.[CmsDataKey.DYNAMIC_SECTIONS] || [];
                  const nextArr = currentSections.map((i: any) =>
                    i.id === section.id ? { ...newSection, id: section.id } : i
                  );
                  // Prevent infinite updates by checking if something actually changed
                  if (JSON.stringify(currentSections) !== JSON.stringify(nextArr)) {
                    set(CmsDataKey.DYNAMIC_SECTIONS, nextArr);
                  }
                }}
                onRemove={() => removeItem(CmsDataKey.DYNAMIC_SECTIONS, section.id)}
              />
            ),
          )}
          {!(data?.[CmsDataKey.DYNAMIC_SECTIONS] || []).length && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3">
                <LayoutPanelLeft className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                No Custom Rows Yet
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Click "Add Section" to create customizable product rows based on category, price, or tags.
              </p>
            </div>
          )}
        </div>
      </CmsSection>
    </>
  );
};
