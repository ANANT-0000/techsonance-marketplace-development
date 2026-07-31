"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useHomepageData } from "@/hooks/useHomepageData";
import { useThemeData } from "@/hooks/useThemeData";
import { ProductCard } from "@/components/customer/ProductCard";
import { ShoppableLookbook } from "@/components/customer/homepage/ShoppableLookbook";
import { ScarcityBlock } from "@/components/customer/homepage/ScarcityBlock";
import { TestimonialSlider } from "@/components/customer/homepage/TestimonialSlider";
import { CuratedDiscovery } from "@/components/customer/homepage/CuratedDiscovery";
import { DynamicVendorSection } from "@/components/customer/homepage/DynamicVendorSection";
import AxiosAPI from "@/lib/axios";

import { LayoutSection, CmsDataKey } from "@/constants";
import { STOREFRONT_HOME_TEXT } from "@/constants/customerText";

import {
  InteractiveHero,
  SectionHeader,
  NewArrivalsDesktop,
  MobileNewArrivalCard,
  CategoryCard,
  MobileCategoryPill,
  TrustStrip,
  PromoBannerDesktop,
  NewsletterDesktop,
  PromoBannerMobile,
  TestimonialsDesktop,
  BrandHighlight,
  TestimonialsMobile,
} from "@/components/customer/homepage";
import StoreNotAvailable from "@/components/common/StoreNotAvailable";

import { Skeleton } from "@/components/ui/skeleton";

function Sk({
  w = "w-full",
  h = "h-4",
  rounded = "rounded",
  className = "",
}: {
  w?: string;
  h?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <Skeleton className={`${w} ${h} ${rounded} bg-gray-100 ${className}`} />
  );
}

function DraggableScrollContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onDragStart={(e) => e.preventDefault()}
      className={`flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
        isDragging
          ? "cursor-grabbing snap-none select-none"
          : "cursor-grab snap-x snap-mandatory select-none"
      } ${className || ""}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const {
    getField,
    banners,
    categories,
    heroSlides,
    isLoading,
    cmsContent,
    hasError,
  } = useHomepageData();
  const { themeData } = useThemeData();

  let layout: string[] = themeData?.homepage_layout || [
    LayoutSection.HERO,
    LayoutSection.TRUST_BADGES,
    LayoutSection.CATEGORIES,
    LayoutSection.DYNAMIC_SECTIONS,
    LayoutSection.NEW_ARRIVALS,
    LayoutSection.LOOKBOOK,
    LayoutSection.PROMO,
    LayoutSection.SCARCITY,
    LayoutSection.NEWSLETTER,
    LayoutSection.CURATED,
    LayoutSection.SOCIAL_PROOF,
  ];

  // Auto-inject DYNAMIC_SECTIONS for vendors who saved their layout before this feature existed
  if (!layout.includes(LayoutSection.DYNAMIC_SECTIONS)) {
    const catIndex = layout.indexOf(LayoutSection.CATEGORIES);
    if (catIndex > -1) {
      layout = [
        ...layout.slice(0, catIndex + 1),
        LayoutSection.DYNAMIC_SECTIONS,
        ...layout.slice(catIndex + 1),
      ];
    } else {
      layout = [...layout, LayoutSection.DYNAMIC_SECTIONS];
    }
  }

  const [products, setProducts] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  useEffect(() => {
    AxiosAPI.get("/v1/products/homepage?limit=8", {
      headers: { "x-suppress-toast": true },
    })
      .then((res) => {
        setProducts(res.data.data.slice(0, 4));
        setNewArrivals(res.data.data.slice(4, 7));
      })
      .catch(() => {
        setProducts([]);
        setNewArrivals([]);
      })
      .finally(() => setProductsLoading(false));
  }, []);

  if (!isLoading && !cmsContent && !hasError) {
    return <StoreNotAvailable />;
  }

  // ── Desktop Renderer ────────────────────────────────────────────────────────
  const renderDesktop = (key: string) => {
    switch (key) {
      case LayoutSection.HERO:
        return (
          <div key={LayoutSection.HERO}>
            {isLoading ? (
              <div className="w-full h-[60vh] bg-gray-100 animate-pulse" />
            ) : (
              <InteractiveHero
                banner_type={
                  getField(CmsDataKey.HERO_BANNER_TYPE) || "carousel"
                }
                video_url={getField(CmsDataKey.HERO_VIDEO_URL)}
                video_eyebrow={getField(CmsDataKey.HERO_VIDEO_EYEBROW)}
                video_title={getField(CmsDataKey.HERO_VIDEO_TITLE)}
                video_desc={getField(CmsDataKey.HERO_VIDEO_DESC)}
                video_btn_text={getField(CmsDataKey.HERO_VIDEO_BTN_TEXT)}
                video_btn_link={getField(CmsDataKey.HERO_VIDEO_BTN_LINK)}
                slides={heroSlides}
              />
            )}
          </div>
        );

      case LayoutSection.TRUST_BADGES:
        if (isLoading) {
          return (
            <div
              key={LayoutSection.TRUST_BADGES}
              className="w-full h-24 bg-gray-100 animate-pulse border-y border-gray-100"
            />
          );
        }
        // TrustStrip handles its own CMS→fallback logic internally
        return (
          <TrustStrip key={LayoutSection.TRUST_BADGES} getField={getField} />
        );

      case LayoutSection.LOOKBOOK:
        if (isLoading) {
          return (
            <div
              key={LayoutSection.LOOKBOOK}
              className="w-full h-[500px] bg-slate-50 animate-pulse rounded-3xl mx-auto max-w-screen-xl my-16"
            />
          );
        }
        // ShoppableLookbook renders IMAGE_PLACEHOLDER when no image is configured
        return (
          <ShoppableLookbook
            key={LayoutSection.LOOKBOOK}
            title={getField(CmsDataKey.LOOKBOOK_TITLE)}
            subtitle={getField(CmsDataKey.LOOKBOOK_SUBTITLE)}
            image_url={getField(CmsDataKey.LOOKBOOK_IMAGE_URL)}
            hotspots={getField(CmsDataKey.LOOKBOOK_HOTSPOTS)}
            bg_color={getField(CmsDataKey.LOOKBOOK_BG_COLOR)}
          />
        );

      case LayoutSection.SCARCITY: {
        const hasScarcity = !(
          !isLoading &&
          !getField(CmsDataKey.SCARCITY_TIMER_TITLE) &&
          !getField(CmsDataKey.SCARCITY_EXPIRES_AT)
        );

        if (!hasScarcity) {
          return (
            <section
              key={LayoutSection.SCARCITY}
              className="py-8 md:py-12 px-4 sm:px-6 lg:px-16 xl:px-24 bg-[#faf9f6]"
            >
              <div className="max-w-screen-xl mx-auto flex flex-col gap-6">
                <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6 shadow-sm opacity-60 pointer-events-none text-center md:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="w-14 h-14 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center shrink-0">
                      <span className="text-2xl">✦</span>
                    </div>
                    <div className="max-w-xs md:max-w-sm">
                      <h3 className="text-theme-tiny sm:text-theme-caption font-black text-stone-400 tracking-[0.25em] uppercase mb-1 sm:mb-2">
                        {STOREFRONT_HOME_TEXT.SPECIAL_OFFERS}
                      </h3>
                      <p className="text-theme-body-sm sm:text-theme-body text-stone-500 leading-relaxed">
                        {STOREFRONT_HOME_TEXT.PROMO_COMING_SOON}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return (
          <ScarcityBlock
            key={LayoutSection.SCARCITY}
            timer_title={getField(CmsDataKey.SCARCITY_TIMER_TITLE)}
            expires_at={getField(CmsDataKey.SCARCITY_EXPIRES_AT)}
            alert_text={getField(CmsDataKey.SCARCITY_ALERT_TEXT)}
            alert_bg={getField(CmsDataKey.SCARCITY_ALERT_BG)}
            alert_text_color={getField(CmsDataKey.SCARCITY_ALERT_TEXT_COLOR)}
            btn_text={getField(CmsDataKey.SCARCITY_BTN_TEXT)}
            btn_link={getField(CmsDataKey.SCARCITY_BTN_LINK)}
          />
        );
      }

      case LayoutSection.CURATED:
        return (
          <CuratedDiscovery
            key={LayoutSection.CURATED}
            title={getField(CmsDataKey.CURATED_TITLE)}
            subtitle={getField(CmsDataKey.CURATED_SUBTITLE)}
            type={getField(CmsDataKey.CURATED_TYPE)}
            product_ids={getField(CmsDataKey.CURATED_PRODUCT_IDS)}
            bg_color={getField(CmsDataKey.CURATED_BG_COLOR)}
          />
        );

      case LayoutSection.CATEGORIES:
        return (
          <section
            key={LayoutSection.CATEGORIES}
            className="py-20 px-6 lg:px-16 xl:px-24 bg-white"
          >
            <div className="max-w-screen-xl mx-auto select-none">
              <SectionHeader
                eyebrow="Browse by Category"
                title="Categories"
                href="/store"
              />
              <DraggableScrollContainer className="gap-5 pb-4">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start flex flex-col gap-3"
                      >
                        <div className="aspect-[3/4] w-full bg-gray-100 rounded-2xl animate-pulse pointer-events-none" />
                        <Sk w="w-2/3" h="h-3 pointer-events-none" />
                      </div>
                    ))
                  : categories.length === 0
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start flex flex-col gap-3 pointer-events-none"
                        >
                          <div
                            className="aspect-[3/4] w-full rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-100 flex items-center justify-center"
                            style={{ height: "20vh" }}
                          >
                            <span className="text-stone-300 text-4xl select-none">
                              ✦
                            </span>
                          </div>
                          <div className="w-2/3 h-3 bg-stone-100 rounded" />
                        </div>
                      ))
                    : categories.slice(0, 8).map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start pointer-events-none *:pointer-events-auto"
                        >
                          <CategoryCard
                            cat={cat}
                            idx={idx}
                            aspectRatio={
                              getField(
                                CmsDataKey.CATEGORY_ASPECT_RATIO_DESKTOP,
                              ) || "aspect-[3/4]"
                            }
                            borderRadius={
                              getField(
                                CmsDataKey.CATEGORY_BORDER_RADIUS_DESKTOP,
                              ) || "rounded-2xl"
                            }
                          />
                        </div>
                      ))}

                {/* Sparse Inventory Fallback for Categories */}
                {!isLoading &&
                  categories.length > 0 &&
                  categories.length < 4 &&
                  Array.from({ length: 4 - categories.length }).map((_, i) => (
                    <div
                      key={`fallback-${i}`}
                      className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start flex flex-col gap-3 pointer-events-none opacity-60"
                    >
                      <div
                        className="aspect-[3/4] w-full rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-100 border-dashed flex items-center justify-center flex-col gap-2"
                        style={{ height: "20vh" }}
                      >
                        <span className="text-stone-300 text-3xl select-none">
                          ✦
                        </span>
                        <span className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
                          {STOREFRONT_HOME_TEXT.COMING_SOON}
                        </span>
                      </div>
                    </div>
                  ))}
              </DraggableScrollContainer>
            </div>
          </section>
        );

      case LayoutSection.PRODUCTS:
        return (
          <section
            key={LayoutSection.PRODUCTS}
            className="py-20 px-6 lg:px-16 xl:px-24 bg-[#faf9f6]"
          >
            <div className="max-w-screen-xl mx-auto">
              <SectionHeader
                eyebrow="Hand-picked for You"
                title="Featured Masterpieces"
                href="/store"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                {productsLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col bg-white rounded-2xl p-4 gap-3"
                      >
                        <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                        <Sk w="w-1/3" h="h-2.5" />
                        <Sk w="w-3/4" h="h-4" />
                        <Sk w="w-1/4" h="h-5" />
                      </div>
                    ))
                  : products.length === 0
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col bg-white rounded-2xl p-4 gap-3 border border-stone-100"
                        >
                          <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl flex items-center justify-center">
                            <span className="text-stone-300 text-5xl select-none">
                              ✦
                            </span>
                          </div>
                          <div className="w-1/3 h-2.5 bg-stone-100 rounded" />
                          <div className="w-3/4 h-4 bg-stone-100 rounded" />
                          <div className="w-1/4 h-5 bg-stone-100 rounded" />
                        </div>
                      ))
                    : products.map((p, idx) => (
                        <ul key={p.id} className="list-none p-0 m-0 h-full">
                          <ProductCard product={p} idx={idx} />
                        </ul>
                      ))}

                {/* Sparse Inventory Fallback for Products */}
                {!productsLoading &&
                  products.length > 0 &&
                  products.length < 4 &&
                  Array.from({ length: 4 - products.length }).map((_, i) => (
                    <div
                      key={`fallback-${i}`}
                      className="flex flex-col bg-white rounded-2xl p-4 gap-3 border border-stone-100 border-dashed opacity-60 pointer-events-none h-full"
                    >
                      <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl flex flex-col items-center justify-center gap-2">
                        <span className="text-stone-300 text-4xl select-none">
                          ✦
                        </span>
                        <span className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
                          {STOREFRONT_HOME_TEXT.MORE_SOON}
                        </span>
                      </div>
                      <div className="w-1/3 h-2.5 bg-stone-100 rounded mt-2" />
                      <div className="w-3/4 h-4 bg-stone-100 rounded" />
                    </div>
                  ))}
              </div>
            </div>
          </section>
        );

      case LayoutSection.PROMO: {
        const imageUrl = getField(CmsDataKey.MIDDLE_BANNER_IMAGE_URL);
        return isLoading ? (
          <div
            key={LayoutSection.PROMO}
            className="w-full h-[52vh] bg-gray-100 animate-pulse"
          />
        ) : (
          <PromoBannerDesktop
            key={LayoutSection.PROMO}
            imageUrl={imageUrl}
            subtitle={getField(CmsDataKey.MIDDLE_BANNER_SUBTITLE)}
            title={getField(CmsDataKey.MIDDLE_BANNER_TITLE)}
            desc={getField(CmsDataKey.MIDDLE_BANNER_DESC)}
            btnText={getField(CmsDataKey.MIDDLE_BANNER_BTN_TEXT)}
          />
        );
      }

      case LayoutSection.NEW_ARRIVALS:
        return isLoading ? (
          <div
            key={LayoutSection.NEW_ARRIVALS}
            className="w-full h-[600px] bg-gray-100 animate-pulse mx-6 lg:mx-16 xl:mx-24 rounded-2xl my-20"
          />
        ) : (
          <NewArrivalsDesktop
            key={LayoutSection.NEW_ARRIVALS}
            getField={getField}
          />
        );

      case LayoutSection.NEWSLETTER:
        // NewsletterDesktop has full NEWSLETTER_DEFAULT fallbacks internally
        return (
          <NewsletterDesktop
            key={LayoutSection.NEWSLETTER}
            getField={getField}
          />
        );

      case LayoutSection.DYNAMIC_SECTIONS: {
        const sections = getField(CmsDataKey.DYNAMIC_SECTIONS) as any[];
        if (!sections || !Array.isArray(sections) || sections.length === 0)
          return null;
        return (
          <div key={LayoutSection.DYNAMIC_SECTIONS} className="w-full">
            {sections.map((sec, i) => (
              <DynamicVendorSection key={i} config={sec} />
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ── Mobile Renderer ─────────────────────────────────────────────────────────
  const renderMobile = (key: string) => {
    switch (key) {
      case LayoutSection.HERO:
        return (
          <div key={`m-${LayoutSection.HERO}`}>
            {isLoading ? (
              <div className="w-full h-[65vh] bg-gray-100 animate-pulse" />
            ) : (
              <InteractiveHero
                banner_type={
                  getField(CmsDataKey.HERO_BANNER_TYPE) || "carousel"
                }
                video_url={getField(CmsDataKey.HERO_VIDEO_URL)}
                video_eyebrow={getField(CmsDataKey.HERO_VIDEO_EYEBROW)}
                video_title={getField(CmsDataKey.HERO_VIDEO_TITLE)}
                video_desc={getField(CmsDataKey.HERO_VIDEO_DESC)}
                video_btn_text={getField(CmsDataKey.HERO_VIDEO_BTN_TEXT)}
                video_btn_link={getField(CmsDataKey.HERO_VIDEO_BTN_LINK)}
                slides={heroSlides}
              />
            )}
            <TrustStrip getField={getField} />
          </div>
        );

      case LayoutSection.LOOKBOOK:
        if (isLoading) {
          return (
            <div
              key={`m-${LayoutSection.LOOKBOOK}`}
              className="w-full h-[400px] bg-slate-50 animate-pulse rounded-3xl mx-4 my-8"
            />
          );
        }
        // ShoppableLookbook renders IMAGE_PLACEHOLDER when no image is configured
        return (
          <ShoppableLookbook
            key={`m-${LayoutSection.LOOKBOOK}`}
            title={getField(CmsDataKey.LOOKBOOK_TITLE)}
            subtitle={getField(CmsDataKey.LOOKBOOK_SUBTITLE)}
            image_url={getField(CmsDataKey.LOOKBOOK_IMAGE_URL)}
            hotspots={getField(CmsDataKey.LOOKBOOK_HOTSPOTS)}
            bg_color={getField(CmsDataKey.LOOKBOOK_BG_COLOR)}
          />
        );

      case LayoutSection.SCARCITY: {
        const hasScarcity = !(
          !isLoading &&
          !getField(CmsDataKey.SCARCITY_TIMER_TITLE) &&
          !getField(CmsDataKey.SCARCITY_EXPIRES_AT)
        );

        if (!hasScarcity) {
          return (
            <section
              key={`m-${LayoutSection.SCARCITY}`}
              className="py-6 px-4 bg-[#faf9f6]"
            >
              <div className="bg-white border border-stone-200 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm opacity-60 pointer-events-none text-center">
                <div className="w-12 h-12 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center shrink-0">
                  <span className="text-xl">✦</span>
                </div>
                <div>
                  <h3 className="text-theme-tiny font-black text-stone-400 tracking-[0.25em] uppercase mb-1">
                    {STOREFRONT_HOME_TEXT.SPECIAL_OFFERS}
                  </h3>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {STOREFRONT_HOME_TEXT.MOBILE_PROMO_COMING_SOON}
                  </p>
                </div>
              </div>
            </section>
          );
        }

        return (
          <ScarcityBlock
            key={`m-${LayoutSection.SCARCITY}`}
            timer_title={getField(CmsDataKey.SCARCITY_TIMER_TITLE)}
            expires_at={getField(CmsDataKey.SCARCITY_EXPIRES_AT)}
            alert_text={getField(CmsDataKey.SCARCITY_ALERT_TEXT)}
            alert_bg={getField(CmsDataKey.SCARCITY_ALERT_BG)}
            alert_text_color={getField(CmsDataKey.SCARCITY_ALERT_TEXT_COLOR)}
            btn_text={getField(CmsDataKey.SCARCITY_BTN_TEXT)}
            btn_link={getField(CmsDataKey.SCARCITY_BTN_LINK)}
          />
        );
      }

      case LayoutSection.SOCIAL_PROOF:
        // TestimonialSlider falls back to TESTIMONIALS_SLIDER_DEFAULT when no CMS testimonials
        return (
          <TestimonialSlider
            key={`m-${LayoutSection.SOCIAL_PROOF}`}
            title={getField(CmsDataKey.SOCIAL_PROOF_TITLE)}
            eyebrow={getField(CmsDataKey.SOCIAL_PROOF_EYEBROW)}
            testimonials={getField(CmsDataKey.SOCIAL_PROOF_TESTIMONIALS)}
            badges={getField(CmsDataKey.SOCIAL_PROOF_BADGES)}
          />
        );

      case LayoutSection.CURATED:
        return (
          <CuratedDiscovery
            key={`m-${LayoutSection.CURATED}`}
            title={getField(CmsDataKey.CURATED_TITLE)}
            subtitle={getField(CmsDataKey.CURATED_SUBTITLE)}
            type={getField(CmsDataKey.CURATED_TYPE)}
            product_ids={getField(CmsDataKey.CURATED_PRODUCT_IDS)}
            bg_color={getField(CmsDataKey.CURATED_BG_COLOR)}
          />
        );

      case LayoutSection.CATEGORIES:
        return (
          <section
            key={`m-${LayoutSection.CATEGORIES}`}
            className="pt-5 pb-4 px-4 bg-background"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-theme-caption-lg font-bold text-gray-900 uppercase tracking-widest">
                Explore
              </h2>
              <Link
                href="/store"
                className="text-theme-xxs font-semibold text-theme-primary flex items-center gap-0.5"
              >
                View All <ChevronRight size={12} />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => {
                    const aspect =
                      getField(CmsDataKey.CATEGORY_ASPECT_RATIO_MOBILE) ||
                      "aspect-square";
                    const radius =
                      getField(CmsDataKey.CATEGORY_BORDER_RADIUS_MOBILE) ||
                      "rounded-full";
                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-3.5 shrink-0 snap-start w-[84px] sm:w-[100px]"
                      >
                        <div
                          className={`w-full ${aspect} ${radius} bg-gray-100 animate-pulse`}
                        />
                        <div className="w-12 h-2.5 rounded bg-gray-100 animate-pulse" />
                      </div>
                    );
                  })
                : categories.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-2 shrink-0 snap-start"
                      >
                        <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-100 flex items-center justify-center">
                          <span className="text-stone-300 text-lg select-none">
                            ✦
                          </span>
                        </div>
                        <div className="w-12 h-2.5 rounded bg-stone-100" />
                      </div>
                    ))
                  : categories.slice(0, 8).map((cat, idx) => (
                      <div key={idx} className="snap-start">
                        <MobileCategoryPill
                          cat={cat}
                          aspectRatio={
                            getField(CmsDataKey.CATEGORY_ASPECT_RATIO_MOBILE) ||
                            "aspect-square"
                          }
                          borderRadius={
                            getField(
                              CmsDataKey.CATEGORY_BORDER_RADIUS_MOBILE,
                            ) || "rounded-full"
                          }
                        />
                      </div>
                    ))}

              {/* Sparse Inventory Fallback for Mobile Categories */}
              {!isLoading &&
                categories.length > 0 &&
                categories.length < 4 &&
                Array.from({ length: 4 - categories.length }).map((_, i) => {
                  const aspect =
                    getField(CmsDataKey.CATEGORY_ASPECT_RATIO_MOBILE) ||
                    "aspect-square";
                  const radius =
                    getField(CmsDataKey.CATEGORY_BORDER_RADIUS_MOBILE) ||
                    "rounded-full";
                  return (
                    <div
                      key={`fallback-m-${i}`}
                      className="flex flex-col items-center gap-3.5 shrink-0 snap-start opacity-60 pointer-events-none w-[84px] sm:w-[100px]"
                    >
                      <div
                        className={`w-full ${aspect} ${radius} bg-stone-50 border border-stone-200 border-dashed flex items-center justify-center`}
                      >
                        <span className="text-stone-300 text-xl select-none">
                          ✦
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                        {STOREFRONT_HOME_TEXT.COMING_SOON}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        );

      case LayoutSection.PRODUCTS:
        return (
          <section
            key={`m-${LayoutSection.PRODUCTS}`}
            className="py-6 px-4 bg-[#faf9f6]"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-theme-caption-lg font-bold text-gray-900 uppercase tracking-widest">
                Featured
              </h2>
              <Link
                href="/store"
                className="text-theme-xxs font-semibold text-theme-primary flex items-center gap-0.5"
              >
                See All <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {productsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col bg-white rounded-2xl p-3 gap-2"
                    >
                      <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                      <Sk w="w-3/4" h="h-3" />
                      <Sk w="w-1/3" h="h-4" />
                    </div>
                  ))
                : products.length === 0
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col bg-white rounded-2xl p-3 gap-2 border border-stone-100"
                      >
                        <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl flex items-center justify-center">
                          <span className="text-stone-300 text-3xl select-none">
                            ✦
                          </span>
                        </div>
                        <div className="w-3/4 h-3 bg-stone-100 rounded" />
                        <div className="w-1/3 h-4 bg-stone-100 rounded" />
                      </div>
                    ))
                  : products.slice(0, 4).map((p, idx) => (
                      <ul key={p.id} className="h-full list-none p-0 m-0">
                        <ProductCard product={p} idx={idx} />
                      </ul>
                    ))}

              {/* Sparse Inventory Fallback for Mobile Products */}
              {!productsLoading &&
                products.length > 0 &&
                products.length < 4 &&
                Array.from({
                  length:
                    (4 - products.length) % 2 !== 0
                      ? 4 -
                        products.length +
                        (products.length % 2 !== 0 ? 1 : 0)
                      : 4 - products.length,
                }).map((_, i) => (
                  <div
                    key={`fallback-m-${i}`}
                    className="flex flex-col bg-white rounded-2xl p-3 gap-2 border border-stone-200 border-dashed opacity-60 pointer-events-none"
                  >
                    <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl flex flex-col items-center justify-center gap-1">
                      <span className="text-stone-300 text-2xl select-none">
                        ✦
                      </span>
                      <span className="text-stone-400 text-[10px] font-semibold uppercase tracking-widest">
                        {STOREFRONT_HOME_TEXT.MORE_SOON}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        );

      case LayoutSection.PROMO: {
        const imageUrl = getField(CmsDataKey.MIDDLE_BANNER_IMAGE_URL);
        return isLoading ? (
          <div
            key={`m-${LayoutSection.PROMO}`}
            className="mx-4 my-6 h-44 bg-gray-100 rounded-2xl animate-pulse"
          />
        ) : (
          <PromoBannerMobile
            key={`m-${LayoutSection.PROMO}`}
            imageUrl={imageUrl}
            title={getField(CmsDataKey.MIDDLE_BANNER_TITLE)}
            desc={getField(CmsDataKey.MIDDLE_BANNER_DESC)}
            btnText={getField(CmsDataKey.MIDDLE_BANNER_BTN_TEXT)}
          />
        );
      }

      case LayoutSection.NEW_ARRIVALS:
        return isLoading ? (
          <div
            key={`m-${LayoutSection.NEW_ARRIVALS}`}
            className="w-full h-44 bg-gray-100 animate-pulse rounded-2xl mx-4 my-6"
          />
        ) : (
          <NewArrivalsDesktop
            key={`m-${LayoutSection.NEW_ARRIVALS}`}
            getField={getField}
          />
        );

      case LayoutSection.NEWSLETTER:
        // NewsletterDesktop has full NEWSLETTER_DEFAULT fallbacks internally
        return (
          <NewsletterDesktop
            key={`m-${LayoutSection.NEWSLETTER}`}
            getField={getField}
          />
        );

      case LayoutSection.DYNAMIC_SECTIONS: {
        const sections = getField(CmsDataKey.DYNAMIC_SECTIONS) as any[];
        if (!sections || !Array.isArray(sections) || sections.length === 0)
          return null;
        return (
          <div key={`m-${LayoutSection.DYNAMIC_SECTIONS}`} className="w-full">
            {sections.map((sec, i) => (
              <DynamicVendorSection key={i} config={sec} />
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* Full-page loader */}
      {/* {isPageLoading && <PageLoader />} */}

      {/* ── DESKTOP ─────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        {layout.map((key) => renderDesktop(key))}
        {/* BrandHighlight always renders — falls back to text-only layout when no image */}
        <BrandHighlight getField={getField} />
      </div>

      {/* ── MOBILE ──────────────────────────────────────────────────────────── */}
      <div className="block lg:hidden min-h-screen bg-background">
        {layout.map((key) => renderMobile(key))}
        {!layout.includes("social_proof") && (
          // TestimonialsMobile falls back to TESTIMONIALS_DEFAULT internally
          <TestimonialsMobile getField={getField} />
        )}
      </div>
    </div>
  );
}
