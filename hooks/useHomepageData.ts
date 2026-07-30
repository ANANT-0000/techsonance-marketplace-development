import { CmsDataKey } from "@/constants/cms";
import { useState, useEffect, useCallback } from "react";
import AxiosAPI from "@/lib/axios";
import {
  getCachedData,
  cacheData,
  dispatchLocaleChange,
  subscribeLocaleChange,
} from "@/utils/cache";
import { HeroSlide, HomeCategories } from "@/utils/Types";

export function useHomepageData() {
  const [lang, setLangState] = useState<string>("en");
  const [cmsContent, setCmsContent] = useState<any>(null);
  const [banners, setBanners] = useState<string[]>([]);
  const [categories, setCategories] = useState<HomeCategories[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Initialize lang and subscribe to changes without polling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem(CmsDataKey.LANG_KEY) || "en";
      setLangState(savedLang);
    }
    const unsubscribe = subscribeLocaleChange((newLang) => {
      setLangState(newLang);
    });
    return unsubscribe;
  }, []);

  const setLang = useCallback((newLang: string) => {
    setLangState(newLang);
    dispatchLocaleChange(newLang);
  }, []);

  const fetchData = useCallback(async (currentLang: string) => {
    setIsLoading(true);
    setHasError(false);
    // Try finding in cache first
    const cachedCms = getCachedData(
      `${CmsDataKey.CMS_CACHE_KEY}_${currentLang}`,
    );
    if (cachedCms) {
      setCmsContent(cachedCms);
      if (
        Array.isArray(cachedCms.hero_slides) &&
        cachedCms.hero_slides.length > 0
      ) {
        setHeroSlides(cachedCms.hero_slides);
      }
      // If we have cache, we don't block loader for API fetch
      setIsLoading(false);
    }

    try {
      // 1. Fetch CMS Home Page content (fresh from API first)
      try {
        const cmsRes = await AxiosAPI.get(`/v1/cms/home?lang=${currentLang}`, {
          headers: { "x-suppress-toast": true },
        });
        const cmsRow = cmsRes.data?.data ?? cmsRes.data;
        const rawContent = cmsRow?.content;

        if (rawContent) {
          const parsedContent =
            typeof rawContent === "string"
              ? JSON.parse(rawContent)
              : rawContent;

          setCmsContent(parsedContent);
          if (
            Array.isArray(parsedContent.hero_slides) &&
            parsedContent.hero_slides.length > 0
          ) {
            setHeroSlides(parsedContent.hero_slides);
          }
          cacheData(
            `${CmsDataKey.CMS_CACHE_KEY}_${currentLang}`,
            parsedContent,
          );
        } else {
          if (!cmsContent) {
            const staleCached = localStorage.getItem(
              `${CmsDataKey.CMS_CACHE_KEY}_${currentLang}`,
            );
            if (staleCached) {
              try {
                const parsed = JSON.parse(staleCached);
                const val = parsed?.value ?? parsed;
                setCmsContent(val);
                if (
                  Array.isArray(val?.hero_slides) &&
                  val.hero_slides.length > 0
                ) {
                  setHeroSlides(val.hero_slides);
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        setHasError(true);
        if (!cmsContent) {
          const staleCached = localStorage.getItem(
            `${CmsDataKey.CMS_CACHE_KEY}_${currentLang}`,
          );
          if (staleCached) {
            try {
              const parsed = JSON.parse(staleCached);
              const val = parsed?.value ?? parsed;
              setCmsContent(val);
              if (
                Array.isArray(val?.hero_slides) &&
                val.hero_slides.length > 0
              ) {
                setHeroSlides(val.hero_slides);
              }
            } catch {}
          }
        }
      }

      // 2. Fetch Active Hero Banners
      try {
        const bannersRes = await AxiosAPI.get(
          "/v1/banners/active?placement=homepage_hero",
          { headers: { "x-suppress-toast": true } },
        );

        if (bannersRes.data && Array.isArray(bannersRes.data)) {
          const urls = bannersRes.data
            .map((b: any) => b.image_url)
            .filter(Boolean);
          if (urls.length > 0) {
            setBanners(urls);
            if (typeof window !== "undefined") {
              localStorage.setItem(
                CmsDataKey.BANNERS_CACHE_KEY,
                JSON.stringify(urls),
              );
            }
          }
        }
      } catch (err) {
        // Banners are non-critical — use defaults silently
        if (typeof window !== "undefined") {
          const cachedBanners = localStorage.getItem(
            CmsDataKey.BANNERS_CACHE_KEY,
          );
          if (cachedBanners) setBanners(JSON.parse(cachedBanners));
        }
      }

      // 3. Fetch Categories with Product Images
      try {
        const categoriesRes = await AxiosAPI.get(
          "/v1/categories/homepage?limit=8",
          { headers: { "x-suppress-toast": true } },
        );

        if (categoriesRes.data && Array.isArray(categoriesRes.data.data)) {
          const formatted = categoriesRes.data.data.map(
            (cat: HomeCategories) => ({
              name: cat.name,
              product_image: cat.product_image,
            }),
          );
          if (formatted.length > 0) {
            setCategories(formatted);
            if (typeof window !== "undefined") {
              localStorage.setItem(
                CmsDataKey.CATEGORIES_CACHE_KEY,
                JSON.stringify(formatted),
              );
            }
          }
        }
      } catch (err) {
        if (typeof window !== "undefined") {
          const cachedCategories = localStorage.getItem(
            CmsDataKey.CATEGORIES_CACHE_KEY,
          );
          if (cachedCategories) setCategories(JSON.parse(cachedCategories));
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(lang);
  }, [lang, fetchData]);

  // Helper function to resolve localized content with static fallbacks matching the Luxe Market and Kinetic screenshots
  const getField = useCallback(
    (key: string) => {
      if (
        cmsContent &&
        cmsContent[key] !== undefined &&
        cmsContent[key] !== null &&
        cmsContent[key] !== ""
      ) {
        return cmsContent[key];
      }
    },
    [cmsContent],
  );

  return {
    lang,
    setLang,
    getField,
    banners,
    categories,
    heroSlides,
    isLoading,
    cmsContent,
    hasError,
  };
}
