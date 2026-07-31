"use client";
import { getClientCompanyId } from "@/utils/getCompanyId";
import React, { useState, useReducer, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CMS_NAVBAR_TAB_TEXT } from "@/constants/vendorText";
import {
  CMS_NAVBAR_TEXT_SIZES,
  CMS_NAVBAR_ALIGNMENTS,
  ALIGNMENT_OPTIONS,
  LINKS_ALIGNMENT_OPTIONS,
  POSITION_OPTIONS,
  CMS_NAVBAR_ITEM_TYPES,
  UTILITY_ICONS,
} from "@/constants";
import {
  Plus,
  Trash2,
  LayoutPanelLeft,
  ShoppingCart,
  User,
  Link as LinkIcon,
  Heart,
  GripVertical,
} from "lucide-react";
import { SessionErrorCard } from "../SessionErrorCard";
import { CmsSection } from "./Section";
import { InputField } from "./InputField";
import { SelectField } from "./SelectField";
import { ImageUploadField } from "./ImageUploadField";
import AxiosAPI from "@/lib/axios";
import {
  upsertNavbarMenu,
  createNavbarItem,
  fetchVendorActiveProducts,
  fetchNavbarTemplates,
  fetchProductFilters,
  reorderNavbarItems,
} from "@/utils/vendorApiClient";
import { authToken } from "@/utils/authToken";
import { dispatchNavbarChange } from "@/utils/cache";
import toast from "react-hot-toast";
import {
  NavMenuLogoAlignment,
  NavMenuLinksAlignment,
  NavMenuPosition,
  SiteMap,
  AnnouncementItem,
  type UpsertNavMenuPayload,
  type NavbarData,
  type L1Item,
  type CatOption,
  type NavbarTemplate,
  type ProductFilter,
} from "@/utils/Types";
import { PageType } from "@/app/vendor/cms/page";
import { ReorderableList } from "../../common/subscriptions/SharedUI";
import { CmsNavbarConfig } from "@/constants";
import { ANNOUNCEMENT_FEATURES } from "@/components/customer/features/AnnouncementFeatureRegistry";
import { NavbarPreview } from "./NavbarPreview";
import { L1ItemEditor } from "./L1ItemEditor";
import { Toggle } from "./Toggle";
import { SaveBtn } from "./SaveBtn";

// ─── Searchable Category Picker ───────────────────────────────────────────────
/** Inline searchable picker for root category — replaces the plain <SelectField> */

interface CmsNavbarState {
  data: NavbarData | null;
  loading: boolean;
  products: { id: string; name: string }[];
  settings: UpsertNavMenuPayload;
  savingSettings: boolean;
  items: L1Item[];
  addingItem: boolean;
  categories: CatOption[];
  templates: NavbarTemplate[];
  filters: ProductFilter[];
  siteMaps: SiteMap[];
  mapsLoading: boolean;
}

// ─── State Management ─────────────────────────────────────────────────────────

const initialState: CmsNavbarState = {
  data: null,
  loading: true,
  products: [],
  settings: {},
  savingSettings: false,
  items: [],
  addingItem: false,
  categories: [],
  templates: [],
  filters: [],
  siteMaps: [],
  mapsLoading: true,
};

enum ActionType {
  SET_LOADING = "SET_LOADING",
  SET_MAPS_LOADING = "SET_MAPS_LOADING",
  SET_INITIAL_DATA = "SET_INITIAL_DATA",
  PATCH_SETTINGS = "PATCH_SETTINGS",
  SET_SAVING_SETTINGS = "SET_SAVING_SETTINGS",
  SET_ADDING_ITEM = "SET_ADDING_ITEM",

  ADD_ITEM = "ADD_ITEM",
  SET_ITEMS = "SET_ITEMS",
  SAVE_ITEM = "SAVE_ITEM",
  DELETE_ITEM = "DELETE_ITEM",
}

type NavbarAction =
  | { type: ActionType.SET_LOADING; payload: boolean }
  | { type: ActionType.SET_MAPS_LOADING; payload: boolean }
  | {
      type: ActionType.SET_INITIAL_DATA;
      payload: Omit<
        CmsNavbarState,
        "loading" | "savingSettings" | "addingItem" | "mapsLoading"
      >;
    }
  | {
      type: ActionType.PATCH_SETTINGS;
      payload: { field: keyof UpsertNavMenuPayload; value: unknown };
    }
  | { type: ActionType.SET_SAVING_SETTINGS; payload: boolean }
  | { type: ActionType.SET_ADDING_ITEM; payload: boolean }
  | { type: ActionType.ADD_ITEM; payload: L1Item }
  | { type: ActionType.SET_ITEMS; payload: L1Item[] }
  | { type: ActionType.SAVE_ITEM; payload: L1Item }
  | { type: ActionType.DELETE_ITEM; payload: string };

function reducer(state: CmsNavbarState, action: NavbarAction): CmsNavbarState {
  switch (action.type) {
    case ActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionType.SET_MAPS_LOADING:
      return { ...state, mapsLoading: action.payload };
    case ActionType.SET_INITIAL_DATA:
      return {
        ...state,
        data: action.payload.data,
        settings: action.payload.settings,
        items: action.payload.items,
        categories: action.payload.categories,
        products: action.payload.products,
        templates: action.payload.templates,
        filters: action.payload.filters,
      };
    case ActionType.PATCH_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.field]: action.payload.value,
        },
      };
    case ActionType.SET_SAVING_SETTINGS:
      return { ...state, savingSettings: action.payload };
    case ActionType.SET_ADDING_ITEM:
      return { ...state, addingItem: action.payload };
    case ActionType.ADD_ITEM:
      return { ...state, items: [...state.items, action.payload] };
    case ActionType.SET_ITEMS:
      return { ...state, items: action.payload };
    case ActionType.SAVE_ITEM:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        ),
      };
    case ActionType.DELETE_ITEM:
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AnnouncementItemBuilderProps {
  title: string;
  items: AnnouncementItem[];
  siteMaps: SiteMap[];
  onChange: (items: AnnouncementItem[]) => void;
}

function AnnouncementItemBuilder({
  title,
  items,
  siteMaps,
  onChange,
}: AnnouncementItemBuilderProps) {
  const addItem = () => {
    const newItem: AnnouncementItem = {
      id: Math.random().toString(36).substring(2, 11),
      type: "text",
      label: "New Item",
      visible_on: ["desktop", "mobile"],
      is_highlighted: false,
    };
    onChange([...items, newItem]);
  };
  const updateItem = <K extends keyof AnnouncementItem>(
    id: string,
    key: K,
    val: AnnouncementItem[K] | boolean,
  ) => {
    onChange(items.map((i) => (i.id === id ? { ...i, [key]: val } : i)));
  };
  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const toggleVisibility = (id: string, device: "desktop" | "mobile") => {
    onChange(
      items.map((i) => {
        if (i.id !== id) return i;
        const current = i.visible_on || ["desktop", "mobile"];
        const updated = current.includes(device)
          ? current.filter((d) => d !== device)
          : [...current, device];
        // Prevent unchecking both (require at least one)
        return { ...i, visible_on: updated.length === 0 ? [device] : updated };
      }),
    );
  };

  return (
    <div className="space-y-2 border border-stone-200 rounded-lg p-3 bg-stone-50/50">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold text-stone-700">{title}</label>
        <button
          type="button"
          onClick={addItem}
          className="text-xs text-theme-primary hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      {items.map((item, idx: number) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 p-2 border border-stone-200 rounded bg-white"
        >
          <div className="flex items-center gap-2">
            <select
              value={item.type}
              onChange={(e) =>
                updateItem(
                  item.id,
                  "type",
                  e.target.value as AnnouncementItem["type"],
                )
              }
              className="text-xs border border-stone-200 rounded p-1"
            >
              {CMS_NAVBAR_ITEM_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Label"
              value={item.label}
              onChange={(e) => updateItem(item.id, "label", e.target.value)}
              className="flex-1 text-xs border border-stone-200 rounded p-1"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {item.type === "link" && (
            <select
              value={item.target_route || ""}
              onChange={(e) =>
                updateItem(item.id, "target_route", e.target.value)
              }
              className="text-xs border border-stone-200 rounded p-1 w-full"
            >
              <option value="">{CMS_NAVBAR_TAB_TEXT.SELECT_ROUTE}</option>
              {siteMaps.map((sm) => (
                <option key={sm.key} value={sm.key}>
                  {sm.label} ({sm.base_path})
                </option>
              ))}
            </select>
          )}
          {item.type === "feature" && (
            <select
              value={item.feature_key || ""}
              onChange={(e) =>
                updateItem(item.id, "feature_key", e.target.value)
              }
              className="text-xs border border-stone-200 rounded p-1 w-full"
            >
              <option value="">{CMS_NAVBAR_TAB_TEXT.SELECT_FEATURE}</option>
              {ANNOUNCEMENT_FEATURES.map((feat) => (
                <option key={feat.key} value={feat.key}>
                  {feat.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-1">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(item.visible_on || ["desktop", "mobile"]).includes(
                    "desktop",
                  )}
                  onChange={() => toggleVisibility(item.id, "desktop")}
                  className="rounded text-theme-primary focus:ring-theme-primary/20"
                />
                {CMS_NAVBAR_TAB_TEXT.SHOW_DESKTOP}
              </label>
              <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(item.visible_on || ["desktop", "mobile"]).includes(
                    "mobile",
                  )}
                  onChange={() => toggleVisibility(item.id, "mobile")}
                  className="rounded text-theme-primary focus:ring-theme-primary/20"
                />
                {CMS_NAVBAR_TAB_TEXT.SHOW_MOBILE}
              </label>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={item.is_highlighted || false}
                onChange={(e) =>
                  updateItem(item.id, "is_highlighted", e.target.checked)
                }
                className="rounded text-blue-500 focus:ring-blue-500/20"
              />
              {CMS_NAVBAR_TAB_TEXT.HIGHLIGHT}
            </label>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-xs text-stone-400">
          {CMS_NAVBAR_TAB_TEXT.NO_ITEMS}
        </div>
      )}
    </div>
  );
}

export interface CmsNavbarTabProps {
  registerSave?: (page: PageType, saveFn: () => Promise<void>) => void;
  registerDiscard?: (page: PageType, discardFn: () => void) => void;
  setDirty?: (page: PageType, isDirty: boolean) => void;
}

export function CmsNavbarTab({
  registerSave,
  registerDiscard,
  setDirty,
}: CmsNavbarTabProps) {
  const companyId = getClientCompanyId();

  const token = authToken();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [sessionError, setSessionError] = useState(false);

  // ── Data load ────────────────────────────────────────────────────────────
  const {
    data: fetchedData,
    isLoading: queryLoading,
    isError,
  } = useQuery({
    queryKey: ["cmsNavbar", companyId],
    queryFn: async () => {
      if (!token || !companyId) throw new Error("No session");
      const [navRes, catRes, siteMapRes, prodRes, tmplRes, filtRes] =
        await Promise.all([
          AxiosAPI.get("/v1/navbar").catch(() => null),
          AxiosAPI.get("/v1/categories?limit=500").catch(() => null),
          AxiosAPI.get("/v1/site-maps").catch(() => null),
          fetchVendorActiveProducts(token, companyId).catch(() => null),
          fetchNavbarTemplates(token).catch(() => null),
          fetchProductFilters(token, companyId).catch(() => null),
        ]);
      return { navRes, catRes, siteMapRes, prodRes, tmplRes, filtRes };
    },
    enabled: !!token && !!companyId,
  });

  useEffect(() => {
    if (isError) {
      toast.error(CmsNavbarConfig.ERROR_LOAD_DATA);
      dispatch({ type: ActionType.SET_LOADING, payload: false });
      return;
    }
    if (fetchedData) {
      const { navRes, catRes, siteMapRes, prodRes, tmplRes, filtRes } =
        fetchedData;
      const d: NavbarData | null = navRes?.data?.data ?? navRes?.data ?? null;
      const setts: UpsertNavMenuPayload = d?.settings ?? {};
      const itms: L1Item[] = d?.navigationItems ?? [];
      const siteMapsList: SiteMap[] = Array.isArray(siteMapRes?.data?.data)
        ? siteMapRes.data.data
        : Array.isArray(siteMapRes?.data)
          ? siteMapRes.data
          : [];
      const cats: CatOption[] = Array.isArray(catRes?.data?.data)
        ? catRes.data.data
        : Array.isArray(catRes?.data)
          ? catRes.data
          : [];
      const prodList = Array.isArray(prodRes?.data?.data)
        ? prodRes.data.data
        : Array.isArray(prodRes?.data)
          ? prodRes.data
          : [];
      const prods = prodList.map((p: any) => ({ id: p.id, name: p.name }));
      const tmpls = Array.isArray(tmplRes?.data?.data)
        ? tmplRes.data.data
        : Array.isArray(tmplRes?.data)
          ? tmplRes.data
          : [];
      const filts = Array.isArray(filtRes?.data?.data)
        ? filtRes.data.data
        : Array.isArray(filtRes?.data)
          ? filtRes.data
          : [];

      dispatch({
        type: ActionType.SET_INITIAL_DATA,
        payload: {
          data: d,
          settings: setts,
          siteMaps: siteMapsList,
          items: itms,
          categories: cats,
          products: prods,
          templates: tmpls,
          filters: filts,
        },
      });
      dispatch({ type: ActionType.SET_MAPS_LOADING, payload: false });
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  }, [fetchedData, isError]);

  // ── Patch helpers ────────────────────────────────────────────────────────────
  const patchSettings = (field: keyof UpsertNavMenuPayload, val: unknown) =>
    dispatch({
      type: ActionType.PATCH_SETTINGS,
      payload: { field, value: val },
    });

  // ── Save scalar settings ────────────────────────────────────────────────────
  const saveSettings = async () => {
    if (!token || !companyId) {
      toast.error("No session found");
      return;
    }
    dispatch({ type: ActionType.SET_SAVING_SETTINGS, payload: true });
    try {
      const res = await upsertNavbarMenu(state.settings, token, companyId);
      if (res?.success === false) {
        throw new Error(res?.message || "Failed to save settings");
      }
      toast.success(CMS_NAVBAR_TAB_TEXT.SAVE_SUCCESS);
      dispatchNavbarChange();
      setDirty?.(PageType.NAVBAR, false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || CMS_NAVBAR_TAB_TEXT.SAVE_FAILED);
      } else {
        toast.error(CMS_NAVBAR_TAB_TEXT.SAVE_FAILED);
      }
    } finally {
      dispatch({ type: ActionType.SET_SAVING_SETTINGS, payload: false });
    }
    dispatchNavbarChange();
    setDirty?.(PageType.NAVBAR, false);
  };

  useEffect(() => {
    if (registerSave) registerSave(PageType.NAVBAR, saveSettings);
    if (registerDiscard) {
      registerDiscard(PageType.NAVBAR, () => {
        // Discard is simple: just re-trigger load effect by resetting data
        // For now, we can just reload the window if we don't want to re-fetch manually
        window.location.reload();
      });
    }
  }, [registerSave, registerDiscard, saveSettings]);

  const makeAutoSave = async (newUrl: string) => {
    if (!token || !companyId) {
      setSessionError(true);
      return;
    }
    setDirty?.(PageType.NAVBAR, true);
    const updatedSettings = { ...state.settings, logo_src: newUrl };
    dispatch({
      type: ActionType.PATCH_SETTINGS,
      payload: { field: "logo_src", value: newUrl },
    });
    try {
      const res = await upsertNavbarMenu(updatedSettings, token, companyId);
      if (res?.success === false)
        toast.error(res?.message || CmsNavbarConfig.ERROR_SAVE_SETTINGS);
      else toast.success("Logo saved.");
    } catch {
      toast.error(CmsNavbarConfig.ERROR_SAVE_SETTINGS);
    }
  };

  // ── Add a new L1 item ───────────────────────────────────────────────────────
  const addL1Item = async () => {
    if (!token || !companyId) {
      setSessionError(true);
      return;
    }
    if (!state.data?.menu_id) {
      toast.error("Save your settings first to unlock navigation links.");
      return;
    }
    dispatch({ type: ActionType.SET_ADDING_ITEM, payload: true });
    try {
      const res = await createNavbarItem(
        {
          menu_id: state.data.menu_id,
          label: "New Link",
          nav_item_id: state.templates[0]?.id || "",
          has_mega_menu: false,
          sort_order: state.items.length,
          meta: {},
        },
        token,
        companyId,
      );
      dispatch({ type: ActionType.SET_ADDING_ITEM, payload: false });

      // if (res?.success === false) {
      //   toast.error(res?.message || CmsNavbarConfig.ERROR_ADD_LINK);

      //   return;
      // }

      const newItem = res?.data?.data || res?.data;
      if (newItem?.id) {
        toast.success(CmsNavbarConfig.SUCCESS_ADD_LINK);
        dispatch({
          type: ActionType.ADD_ITEM,
          payload: newItem as L1Item,
        });
        dispatchNavbarChange();
      } else {
        toast.error("Link was not created — please retry.");
      }
    } catch (err) {
      console.error(err);
      dispatch({ type: ActionType.SET_ADDING_ITEM, payload: false });
      toast.error(CmsNavbarConfig.ERROR_ADD_LINK);
    }
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (sessionError) {
    return <SessionErrorCard />;
  }

  if (state.loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-stone-100/80 rounded-2xl" />
        <div className="h-24 bg-stone-100/80 rounded-2xl" />
        <div className="h-24 bg-stone-100/80 rounded-2xl" />
        <div className="h-24 bg-stone-100/80 rounded-2xl" />
      </div>
    );
  }

  // ─── Empty state (no menu_id yet) ──────────────────────────────────────────
  const menuId = state.data?.menu_id;
  return (
    <div className="space-y-6">
      {/* ── 1. Logo & Branding ──────────────────────────────────────────────── */}
      <CmsSection
        title={CMS_NAVBAR_TAB_TEXT.LOGO_BRANDING}
        action={
          <SaveBtn
            onClick={saveSettings}
            saving={state.savingSettings}
            label={CMS_NAVBAR_TAB_TEXT.SAVE_SETTINGS}
          />
        }
      >
        <div className="space-y-4">
          <ImageUploadField
            label={CMS_NAVBAR_TAB_TEXT.LOGO_IMAGE}
            value={state.settings.logo_src || ""}
            onChange={(v: string) => patchSettings("logo_src", v)}
            onAutoSave={makeAutoSave}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={CMS_NAVBAR_TAB_TEXT.LOGO_ALT}
              value={state.settings.logo_alt || ""}
              onChange={(v: string) => patchSettings("logo_alt", v)}
            />
            <SelectField
              label={CMS_NAVBAR_TAB_TEXT.LOGO_ALIGN}
              value={state.settings.logo_alignment || NavMenuLogoAlignment.LEFT}
              onChange={(v: string) =>
                patchSettings("logo_alignment", v as any)
              }
              options={ALIGNMENT_OPTIONS}
            />
            <SelectField
              label={CMS_NAVBAR_TAB_TEXT.LINKS_ALIGN}
              value={
                state.settings.links_alignment || NavMenuLinksAlignment.LEFT
              }
              onChange={(v: string) =>
                patchSettings("links_alignment", v as any)
              }
              options={LINKS_ALIGNMENT_OPTIONS}
            />
          </div>
        </div>
      </CmsSection>

      {/* ── 2. Behavior ─────────────────────────────────────────────────────── */}
      <CmsSection title={CMS_NAVBAR_TAB_TEXT.NAV_BEHAVIOR}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label={CMS_NAVBAR_TAB_TEXT.SCROLL_BEHAVIOR}
            value={state.settings.position || NavMenuPosition.STICKY}
            onChange={(v: string) => patchSettings("position", v as any)}
            options={POSITION_OPTIONS}
          />
          <div className="pt-3 space-y-1 divide-y divide-stone-100">
            <Toggle
              label={CMS_NAVBAR_TAB_TEXT.SHOW_SHADOW}
              value={state.settings.show_shadow ?? true}
              onChange={(v) => patchSettings("show_shadow", v)}
            />
            <Toggle
              label={CMS_NAVBAR_TAB_TEXT.SHOW_BORDER}
              value={state.settings.show_border ?? true}
              onChange={(v) => patchSettings("show_border", v)}
            />
          </div>
        </div>
      </CmsSection>

      {/* ── 3. Search Bar ───────────────────────────────────────────────────── */}
      <CmsSection title={CMS_NAVBAR_TAB_TEXT.SEARCH_BAR}>
        <Toggle
          label={CMS_NAVBAR_TAB_TEXT.SHOW_SEARCH}
          value={state.settings.search_visible ?? true}
          onChange={(v) => patchSettings("search_visible", v)}
        />
        {state.settings.search_visible !== false && (
          <div className="pt-3">
            <InputField
              label={CMS_NAVBAR_TAB_TEXT.PLACEHOLDER_TEXT}
              value={state.settings.search_placeholder || ""}
              onChange={(v: string) => patchSettings("search_placeholder", v)}
            />
          </div>
        )}
      </CmsSection>

      {/* ── 4. Announcement Bar ─────────────────────────────────────────────── */}
      <CmsSection title={CMS_NAVBAR_TAB_TEXT.ANNOUNCEMENT_BAR}>
        <Toggle
          label={CMS_NAVBAR_TAB_TEXT.SHOW_ANNOUNCEMENT}
          value={state.settings.announcement_visible ?? false}
          onChange={(v) => patchSettings("announcement_visible", v)}
        />
        {state.settings.announcement_visible && (
          <div className="pt-3 space-y-6">
            <NavbarPreview
              itemsLeft={state.settings.announcement_items_left || []}
              itemsRight={state.settings.announcement_items_right || []}
              bgColor={state.settings.announcement_bg_color || "#f8f9fa"}
              textColor={state.settings.announcement_text_color || "#475569"}
              textSize={state.settings.announcement_text_size}
              mobileAlignment={state.settings.announcement_mobile_alignment}
            />
            <AnnouncementItemBuilder
              title={CMS_NAVBAR_TAB_TEXT.LEFT_ITEMS}
              items={state.settings.announcement_items_left || []}
              siteMaps={state.siteMaps}
              onChange={(items: any) =>
                patchSettings("announcement_items_left", items)
              }
            />
            <AnnouncementItemBuilder
              title={CMS_NAVBAR_TAB_TEXT.RIGHT_ITEMS}
              items={state.settings.announcement_items_right || []}
              siteMaps={state.siteMaps}
              onChange={(items: any) =>
                patchSettings("announcement_items_right", items)
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  {CMS_NAVBAR_TAB_TEXT.BG_COLOR}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={state.settings.announcement_bg_color || "#f8f9fa"}
                    onChange={(e) =>
                      patchSettings("announcement_bg_color", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={state.settings.announcement_bg_color || "#f8f9fa"}
                    onChange={(e) =>
                      patchSettings("announcement_bg_color", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  {CMS_NAVBAR_TAB_TEXT.TEXT_COLOR}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={state.settings.announcement_text_color || "#475569"}
                    onChange={(e) =>
                      patchSettings("announcement_text_color", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={state.settings.announcement_text_color || "#475569"}
                    onChange={(e) =>
                      patchSettings("announcement_text_color", e.target.value)
                    }
                    className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  {CMS_NAVBAR_TAB_TEXT.TEXT_SIZE}
                </label>
                <select
                  value={
                    state.settings.announcement_text_size ||
                    "text-[11px] sm:text-xs"
                  }
                  onChange={(e) =>
                    patchSettings("announcement_text_size", e.target.value)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg"
                >
                  {CMS_NAVBAR_TEXT_SIZES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  {CMS_NAVBAR_TAB_TEXT.MOBILE_ALIGN}
                </label>
                <select
                  value={
                    state.settings.announcement_mobile_alignment || "center"
                  }
                  onChange={(e) =>
                    patchSettings(
                      "announcement_mobile_alignment",
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg"
                >
                  {CMS_NAVBAR_ALIGNMENTS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </CmsSection>

      {/* ── Section 5: Utility Icons ── */}
      <CmsSection title={CMS_NAVBAR_TAB_TEXT.UTILITY_ICONS}>
        <div className="divide-y divide-stone-100 space-y-1">
          {UTILITY_ICONS.map(({ id, icon: Icon, label, stateKey }) => (
            <div key={id} className="flex items-center gap-3 py-1">
              <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-stone-500" />
              </div>
              <div className="flex-1">
                <Toggle
                  label={label}
                  value={(state.settings[stateKey] as boolean) ?? true}
                  onChange={(v) => patchSettings(stateKey, v)}
                />
              </div>
            </div>
          ))}
        </div>
      </CmsSection>

      {/* ── 6. Navigation Items (L1) ────────────────────────────────────────── */}
      <CmsSection
        title={`${CMS_NAVBAR_TAB_TEXT.NAV_LINKS} (${state.items.length})`}
        action={
          menuId ? (
            <button
              type="button"
              onClick={addL1Item}
              disabled={state.addingItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {state.addingItem ? "Adding…" : CMS_NAVBAR_TAB_TEXT.ADD_LINK}
            </button>
          ) : undefined
        }
      >
        {!menuId && (
          <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/60">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <LayoutPanelLeft className="w-5 h-5 text-amber-800" />
            </div>
            <p className="text-sm font-medium text-stone-700">
              {CMS_NAVBAR_TAB_TEXT.EMPTY_NAV_LINKS_TITLE}
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-[280px] mx-auto">
              {CMS_NAVBAR_TAB_TEXT.EMPTY_NAV_LINKS_DESC}
            </p>
            <button
              type="button"
              onClick={saveSettings}
              disabled={state.savingSettings}
              className="mt-4 px-5 py-2.5 bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              {state.savingSettings ? "Saving…" : "Save Settings & Unlock"}
            </button>
          </div>
        )}

        {menuId && state.items.length === 0 && (
          <div className="text-center py-12 px-6 border border-dashed border-stone-200 rounded-2xl bg-stone-50/60">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-amber-800" />
            </div>
            <p className="text-sm font-medium text-stone-700">
              {CMS_NAVBAR_TAB_TEXT.NO_LINKS_TITLE}
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-[280px] mx-auto">
              {CMS_NAVBAR_TAB_TEXT.NO_LINKS_SUBTITLE}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <ReorderableList
            items={state.items}
            getKey={(item) => item.id}
            onReorder={async (nextItems) => {
              dispatch({ type: ActionType.SET_ITEMS, payload: nextItems });
              if (!menuId || !token || !companyId) {
                toast.error(
                  "Your session needs to be refreshed before this order can be saved. Please log in again.",
                );
                return;
              }

              const payload = nextItems.map((item, idx) => ({
                id: item.id,
                sort_order: idx,
              }));

              const toastId = toast.loading("Reordering links...");
              const res = await reorderNavbarItems(payload, token, companyId);
              toast.dismiss(toastId);

              if (res.success) {
                toast.success("Links reordered successfully");
              } else {
                toast.error("Failed to reorder links");
              }
            }}
          >
            {({ item, dragHandleProps }) => (
              <div className="flex gap-2">
                <div
                  className="mt-4 pt-2 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
                  {...dragHandleProps}
                >
                  <GripVertical className="w-5 h-5 text-stone-400" />
                </div>
                <div className="flex-1">
                  <L1ItemEditor
                    item={item}
                    categories={state.categories}
                    templates={state.templates}
                    filters={state.filters}
                    mapsLoading={state.mapsLoading}
                    menuId={menuId!}
                    token={token!}
                    companyId={companyId!}
                    onSaved={(updated) =>
                      dispatch({ type: ActionType.SAVE_ITEM, payload: updated })
                    }
                    onDeleted={(id) =>
                      dispatch({ type: ActionType.DELETE_ITEM, payload: id })
                    }
                    products={state.products}
                  />
                </div>
              </div>
            )}
          </ReorderableList>
        </div>
      </CmsSection>
    </div>
  );
}
