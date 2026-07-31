"use client";
import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import {
  Save,
  Loader2,
  Globe,
  Languages,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AxiosAPI from "@/lib/axios";
import { authToken } from "@/utils/authToken";
import { getClientCompanyId } from "@/utils/getCompanyId";
import { SessionErrorCard } from "@/components/vendor/SessionErrorCard";
import { BrandingTab } from "@/components/vendor/BrandingTab";
import { CmsDataKey } from "@/constants";
import { UiText } from "@/constants/ui-text";
import { CmsHomeTab } from "@/components/vendor/cms/CmsHomeTab";
import { CmsFooterTab } from "@/components/vendor/cms/CmsFooterTab";
import { CmsStoreTab } from "@/components/vendor/cms/CmsStoreTab";
import { CmsAboutTab } from "@/components/vendor/cms/CmsAboutTab";
import { CmsContactTab } from "@/components/vendor/cms/CmsContactTab";
import { CmsNavbarTab } from "@/components/vendor/cms/CmsNavbarTab";
import { CmsFiltersTab } from "@/components/vendor/cms/CmsFiltersTab";

export enum PageType {
  HOME = "home",
  NAVBAR = "navbar",
  FOOTER = "footer",
  ABOUT = "about",
  CONTACT = "contact",
  STORE = "store",
  THEME = "theme",
  FILTERS = "filters",
}

export enum LangType {
  EN = "en",
  ES = "es",
}

export enum MoveDirection {
  UP = "up",
  DOWN = "down",
}

export type CmsDataPayload = Record<string, any>;

interface CmsState {
  page: PageType;
  lang: LangType;
  loading: boolean;
  saving: boolean;
  msg: { text: string; ok: boolean } | null;
  data: Record<string, CmsDataPayload>;
  dirty: Record<string, boolean>;
}

export enum CmsActionType {
  SET_PAGE = "SET_PAGE",
  SET_LANG = "SET_LANG",
  FETCH_START = "FETCH_START",
  FETCH_SUCCESS = "FETCH_SUCCESS",
  FETCH_FAILURE = "FETCH_FAILURE",
  SAVE_START = "SAVE_START",
  SAVE_SUCCESS = "SAVE_SUCCESS",
  SAVE_FAILURE = "SAVE_FAILURE",
  SET_DATA_FIELD = "SET_DATA_FIELD",
  SET_DIRTY = "SET_DIRTY",
  CLEAR_MESSAGE = "CLEAR_MESSAGE",
}

type CmsAction =
  | { type: CmsActionType.SET_PAGE; payload: PageType }
  | { type: CmsActionType.SET_LANG; payload: LangType }
  | { type: CmsActionType.FETCH_START }
  | {
      type: CmsActionType.FETCH_SUCCESS;
      payload: { key: string; data: CmsDataPayload };
    }
  | { type: CmsActionType.FETCH_FAILURE; payload: string }
  | { type: CmsActionType.SAVE_START }
  | { type: CmsActionType.SAVE_SUCCESS; payload: string }
  | { type: CmsActionType.SAVE_FAILURE; payload: string }
  | {
      type: CmsActionType.SET_DATA_FIELD;
      payload: { key: string; field: string; val: any };
    }
  | { type: CmsActionType.SET_DIRTY; payload: { key: string; dirty: boolean } }
  | { type: CmsActionType.CLEAR_MESSAGE };

const initialState: CmsState = {
  page: PageType.HOME,
  lang: LangType.EN,
  loading: false,
  saving: false,
  msg: null,
  data: {},
  dirty: {},
};

function cmsReducer(state: CmsState, action: CmsAction): CmsState {
  switch (action.type) {
    case CmsActionType.SET_PAGE:
      return { ...state, page: action.payload, msg: null };
    case CmsActionType.SET_LANG:
      return { ...state, lang: action.payload, msg: null };
    case CmsActionType.FETCH_START:
      return { ...state, loading: true, msg: null };
    case CmsActionType.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        data: { ...state.data, [action.payload.key]: action.payload.data },
        dirty: { ...state.dirty, [action.payload.key]: false },
      };
    case CmsActionType.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        msg: { text: action.payload, ok: false },
      };
    case CmsActionType.SAVE_START:
      return { ...state, saving: true, msg: null };
    case CmsActionType.SAVE_SUCCESS:
      return {
        ...state,
        saving: false,
        msg: { text: action.payload, ok: true },
      };
    case CmsActionType.SAVE_FAILURE:
      return {
        ...state,
        saving: false,
        msg: { text: action.payload, ok: false },
      };
    case CmsActionType.SET_DATA_FIELD:
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload.key]: {
            ...(state.data[action.payload.key] || {}),
            [action.payload.field]: action.payload.val,
          },
        },
        dirty: { ...state.dirty, [action.payload.key]: true },
      };
    case CmsActionType.SET_DIRTY:
      return {
        ...state,
        dirty: { ...state.dirty, [action.payload.key]: action.payload.dirty },
      };
    case CmsActionType.CLEAR_MESSAGE:
      return { ...state, msg: null };
    default:
      return state;
  }
}

const PAGES: PageType[] = [
  PageType.HOME,
  PageType.NAVBAR,
  PageType.FOOTER,
  PageType.ABOUT,
  PageType.CONTACT,
  PageType.STORE,
  PageType.THEME,
  PageType.FILTERS,
];

const PAGE_LABELS: Record<PageType, string> = {
  [PageType.HOME]: "Home Page",
  [PageType.NAVBAR]: "Navbar",
  [PageType.FOOTER]: "Footer",
  [PageType.ABOUT]: "About Us",
  [PageType.CONTACT]: "Contact",
  [PageType.STORE]: "Promotions & Marketing",
  [PageType.THEME]: "Storefront Theme & Layout",
  [PageType.FILTERS]: "Product Filters",
};

// ── Slide Query Picker ─────────────────────────────────────────────────────
// Fetches real categories + product names from the server and presents them
// as clickable tag chips.  No typing = no typos.  Vendor just clicks.

interface CmsManagementPageProps {
  labels?: typeof UiText;
}

export default function CmsManagementPage({
  labels = UiText,
}: CmsManagementPageProps) {
  const companyId = getClientCompanyId();
  const token = authToken();
  const [state, dispatch] = useReducer(cmsReducer, initialState);
  const { page, lang, loading, saving, msg, data, dirty } = state;

  const [mountedTabs, setMountedTabs] = useState<Set<PageType>>(
    new Set([page]),
  );
  const customHandlers = useRef<
    Record<string, { save?: () => Promise<void>; discard?: () => void }>
  >({});

  useEffect(() => {
    setMountedTabs((prev) => new Set(prev).add(page));
  }, [page]);

  const dataKey = `${page}_${lang}`;
  const currentData = data[dataKey] || {};
  const isDirty = dirty[page] || dirty[dataKey] || false;

  const [selectedHotspotId, setSelectedHotspotId] = useState<any>(null);

  const load = async (forceRefetch = false) => {
    if (
      page === PageType.THEME ||
      page === PageType.NAVBAR ||
      page === PageType.FILTERS
    ) {
      // Handled locally by custom tabs
      return;
    }
    const dKey = `${page}_${lang}`;
    if (!forceRefetch && data[dKey]) {
      return; // Use existing draft
    }
    dispatch({ type: CmsActionType.FETCH_START });
    try {
      const res = await AxiosAPI.get(`/v1/cms/${page}?lang=${lang}`);
      const cmsRow = res.data?.data ?? res.data;
      const raw = cmsRow?.content;
      let parsed = typeof raw === "string" ? JSON.parse(raw) : (raw ?? {});
      dispatch({
        type: CmsActionType.FETCH_SUCCESS,
        payload: { key: dKey, data: parsed },
      });
    } catch {
      dispatch({
        type: CmsActionType.FETCH_SUCCESS,
        payload: { key: dKey, data: {} },
      });
    }
  };

  useEffect(() => {
    load();
  }, [page, lang]);

  const set = (field: string, val: any) =>
    dispatch({
      type: CmsActionType.SET_DATA_FIELD,
      payload: { key: dataKey, field, val },
    });

  const saveDataNow = async (overrides?: { field: string; val: any }) => {
    const dKey = `${page}_${lang}`;
    const finalData = overrides
      ? { ...currentData, [overrides.field]: overrides.val }
      : currentData;
    const payload = {
      page_content_type: page,
      language: lang,
      title: `${PAGE_LABELS[page]} (${lang.toUpperCase()})`,
      content: JSON.stringify(finalData),
      seo_meta: {},
    };
    await AxiosAPI.post("/v1/cms", payload);
    dispatch({
      type: CmsActionType.SET_DIRTY,
      payload: { key: dKey, dirty: false },
    });
    localStorage.removeItem(`techsonance_cms_${page}_${lang}`);
    localStorage.removeItem(`techsonance_cms_${page}`);
  };

  const makeAutoSave =
    (field: string) =>
    async (newUrl: string): Promise<void> => {
      await saveDataNow({ field, val: newUrl });
    };

  const save = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (customHandlers.current[page]?.save) {
      dispatch({ type: CmsActionType.SAVE_START });
      try {
        await customHandlers.current[page].save!();
        dispatch({
          type: CmsActionType.SAVE_SUCCESS,
          payload: labels.SAVE_SUCCESS,
        });
        dispatch({
          type: CmsActionType.SET_DIRTY,
          payload: { key: page, dirty: false },
        });
      } catch (err: any) {
        dispatch({
          type: CmsActionType.SAVE_FAILURE,
          payload: `${labels.SAVE_FAILED_PREFIX}${err?.message || labels.TRY_AGAIN}`,
        });
      }
      return;
    }
    dispatch({ type: CmsActionType.SAVE_START });
    try {
      await saveDataNow();
      dispatch({
        type: CmsActionType.SAVE_SUCCESS,
        payload: labels.SAVE_SUCCESS,
      });
    } catch (err: any) {
      dispatch({
        type: CmsActionType.SAVE_FAILURE,
        payload: `${labels.SAVE_FAILED_PREFIX}${err?.response?.data?.message || labels.TRY_AGAIN}`,
      });
    }
  };

  const discardChanges = () => {
    if (customHandlers.current[page]?.discard) {
      customHandlers.current[page].discard!();
      dispatch({
        type: CmsActionType.SET_DIRTY,
        payload: { key: page, dirty: false },
      });
      return;
    }
    load(true);
  };

  const addItem = (field: string, template: any) => {
    const nextArr = [
      ...(currentData[field] || []),
      { id: Date.now(), ...template },
    ];
    set(field, nextArr);
  };

  const removeItem = (field: string, id: any) => {
    const nextArr = (currentData[field] || []).filter((i: any) => i.id !== id);
    set(field, nextArr);
  };

  const updateItem = (field: string, id: any, prop: string, val: any) => {
    const nextArr = (currentData[field] || []).map((i: any) =>
      i.id === id ? { ...i, [prop]: val } : i,
    );
    set(field, nextArr);
  };

  const registerSaveHandler = useCallback(
    (p: PageType, handler: () => Promise<void>) => {
      if (!customHandlers.current[p]) customHandlers.current[p] = {};
      customHandlers.current[p].save = handler;
    },
    [],
  );

  const registerDiscardHandler = useCallback(
    (p: PageType, handler: () => void) => {
      if (!customHandlers.current[p]) customHandlers.current[p] = {};
      customHandlers.current[p].discard = handler;
    },
    [],
  );

  const setCustomDirty = useCallback((p: PageType, isDirty: boolean) => {
    dispatch({
      type: CmsActionType.SET_DIRTY,
      payload: { key: p, dirty: isDirty },
    });
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    if (selectedHotspotId !== null && selectedHotspotId !== undefined) {
      const updated = (currentData?.[CmsDataKey.LOOKBOOK_HOTSPOTS] || []).map(
        (h: any) =>
          h.id === selectedHotspotId ? { ...h, x: clampedX, y: clampedY } : h,
      );
      set(CmsDataKey.LOOKBOOK_HOTSPOTS, updated);
    } else {
      const newId = Date.now();
      const newHotspot = {
        id: newId,
        x: clampedX,
        y: clampedY,
        productId: "",
        product_id: "",
      };
      set(CmsDataKey.LOOKBOOK_HOTSPOTS, [
        ...(currentData?.[CmsDataKey.LOOKBOOK_HOTSPOTS] || []),
        newHotspot,
      ]);
      setSelectedHotspotId(newId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 min-w-0 bg-gray-50/50 p-6 lg:p-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-theme-h4 font-bold text-gray-900">
            {labels.TITLE}
          </h1>
          <p className="text-theme-caption text-gray-400 mt-1 uppercase tracking-wider">
            {labels.SUBTITLE}
          </p>
        </div>
      </div>
      {/* Tab + Lang selectors */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-5 mb-8 flex flex-col gap-4 sticky top-0 z-50">
        
        {/* Header Row: Label & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-theme-caption font-bold text-gray-400 uppercase">
            {labels.PAGE_SECTION}
          </p>
          <div className="flex items-center gap-3">
            {isDirty && (
              <button
                type="button"
                onClick={discardChanges}
                disabled={saving || loading}
                className="px-4 py-2 text-theme-caption font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                Discard Changes
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={!isDirty || saving || loading}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold text-theme-body-sm px-6 py-2 rounded-xl shadow transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? labels.SAVING : labels.SAVE_CHANGES}
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex flex-wrap gap-1.5">
          {PAGES.map((p) => (
            <button
              key={p}
              onClick={() =>
                dispatch({ type: CmsActionType.SET_PAGE, payload: p })
              }
              className={`px-4 py-1.5 text-theme-caption font-bold rounded-lg border transition-all ${page === p ? "bg-slate-900 text-white border-slate-900" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-slate-400"}`}
            >
              {PAGE_LABELS[p]}
              {(dirty[p] || dirty[`${p}_${lang}`]) && (
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block ml-2 animate-pulse" />
              )}
            </button>
          ))}
        </div>

      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl mb-6 border text-theme-body-sm font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
        >
          <CheckCircle size={18} /> {msg.text}
        </div>
      )}

      {!token || !companyId ? (
        <div className="mt-8">
          <SessionErrorCard />
        </div>
      ) : (
        <div className="relative pb-20">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-gray-50/50 backdrop-blur-[2px] rounded-2xl p-20 flex items-center justify-center"
            >
              <Loader2 size={36} className="animate-spin text-slate-900" />
            </motion.div>
          )}

          {mountedTabs.has(PageType.THEME) && (
            <div
              className={page === PageType.THEME ? "block space-y-6" : "hidden"}
            >
              <BrandingTab
                registerSave={registerSaveHandler}
                registerDiscard={registerDiscardHandler}
                setDirty={setCustomDirty}
              />
            </div>
          )}

          {mountedTabs.has(PageType.NAVBAR) && (
            <div
              className={
                page === PageType.NAVBAR ? "block space-y-6" : "hidden"
              }
            >
              <CmsNavbarTab
                registerSave={registerSaveHandler}
                registerDiscard={registerDiscardHandler}
                setDirty={setCustomDirty}
              />
            </div>
          )}

          {mountedTabs.has(PageType.FILTERS) && (
            <div
              className={
                page === PageType.FILTERS ? "block space-y-6" : "hidden"
              }
            >
              <CmsFiltersTab
                registerSave={registerSaveHandler}
                registerDiscard={registerDiscardHandler}
                setDirty={setCustomDirty}
              />
            </div>
          )}

          <form
            onSubmit={save}
            className={
              page !== PageType.THEME &&
              page !== PageType.NAVBAR &&
              page !== PageType.FILTERS
                ? "block space-y-8"
                : "hidden"
            }
          >
            {page === PageType.HOME && (
              <CmsHomeTab
                data={currentData}
                set={set}
                removeItem={removeItem}
                addItem={addItem}
                updateItem={updateItem}
                makeAutoSave={makeAutoSave}
                handleImageClick={handleImageClick}
                selectedHotspotId={selectedHotspotId}
                setSelectedHotspotId={setSelectedHotspotId}
              />
            )}

            {page === PageType.FOOTER && (
              <CmsFooterTab data={currentData} addItem={addItem} set={set} />
            )}

            {page === PageType.ABOUT && (
              <CmsAboutTab
                data={currentData}
                addItem={addItem}
                set={set}
                removeItem={removeItem}
                updateItem={updateItem}
                makeAutoSave={makeAutoSave}
              />
            )}

            {page === PageType.CONTACT && (
              <CmsContactTab
                data={currentData}
                addItem={addItem}
                set={set}
                removeItem={removeItem}
                updateItem={updateItem}
                makeAutoSave={makeAutoSave}
              />
            )}

            {page === PageType.STORE && (
              <CmsStoreTab
                set={set}
                data={currentData}
                makeAutoSave={makeAutoSave}
              />
            )}
          </form>
        </div>
      )}
    </motion.div>
  );
}
