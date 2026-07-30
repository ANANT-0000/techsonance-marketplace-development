"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ProductCard } from "../ProductCard";
import AxiosAPI from "@/lib/axios";
import { fetchHomepageProducts } from "@/utils/commonAPiClient";
import { CURATED_DISCOVERY_TEXT } from "@/constants/customerText";

export enum CuratedType {
  TRENDING = "trending",
  NEW_ARRIVALS = "new_arrivals",
  CURATED = "curated",
}

export interface CuratedDiscoveryProps {
  title?: string;
  subtitle?: string;
  type?: CuratedType;
  product_ids?: string[];
  bg_color?: string;
}

const getProducts = async (type: CuratedType) => {
  try {
    const res = await fetchHomepageProducts(4);
    if (res && res.data) {
      return res.data;
    }
    return [];
  } catch (error) {
    return [];
  }
};
function SkeletonCard() {
  return (
    <div className="min-w-[240px] sm:min-w-[280px] flex flex-col bg-white border border-gray-100 rounded-2xl p-4 gap-3 animate-pulse shadow-sm">
      <div className="aspect-square bg-gray-100 rounded-xl" />
      <div className="w-1/3 h-3 bg-gray-100 rounded" />
      <div className="w-3/4 h-4 bg-gray-100 rounded" />
      <div className="w-1/4 h-5 bg-gray-100 rounded mt-auto" />
    </div>
  );
}

import { CURATED_DISCOVERY_DEFAULTS } from "@/constants/storefront";

export function CuratedDiscovery({
  title,
  subtitle,
  type,
  product_ids,
  bg_color,
}: CuratedDiscoveryProps) {
  const displayTitle = title ?? CURATED_DISCOVERY_DEFAULTS.title;
  const displaySubtitle = subtitle ?? CURATED_DISCOVERY_DEFAULTS.subtitle;
  const displayType = type ?? CuratedType.TRENDING;
  const displayProductIds = product_ids ?? [];

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getProducts(displayType).then((res) => {
      setProducts(res);
      setLoading(false);
    });
  }, [displayType]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const offset = clientWidth * 0.75;
    const target =
      direction === "left" ? scrollLeft - offset : scrollLeft + offset;
    scrollRef.current.scrollTo({ left: target, behavior: "smooth" });
  };
  // Note: empty state is handled inside the render below (styled UI, not null)

  return (
    <section
      className="curated_desktop py-16 px-6 lg:px-16 xl:px-24"
      style={{ background: bg_color || "rgba(248, 250, 252, 0.5)" }}
    >
      <div className="max-w-screen-xl mx-auto flex flex-col gap-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 text-theme-tiny font-bold tracking-[0.25em] text-theme-primary uppercase mb-2">
              <Sparkles size={12} /> {CURATED_DISCOVERY_TEXT.LIVE_CURATION}
            </span>
            <h2 className="text-theme-h3 font-serif tracking-tight text-gray-900 leading-tight">
              {displayTitle}
            </h2>
            <p className="text-theme-caption text-gray-400 mt-2 max-w-lg">
              {displaySubtitle}
            </p>
          </div>

          {/* Navigation Controls */}
          {products.length > 0 && (
            <div className="flex gap-2 self-end sm:self-auto">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Products List Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4 pr-4 items-stretch"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))
          ) : products.length === 0 ? (
            <div className="w-full text-center py-16 px-6 bg-white border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 opacity-80 shadow-sm max-w-2xl mx-auto my-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                <span className="text-3xl text-slate-300">✦</span>
              </div>
              <h3 className="text-theme-h5 font-bold text-slate-900">
                {CURATED_DISCOVERY_TEXT.CURATION_IN_PROGRESS}
              </h3>
              <p className="text-theme-body-sm text-slate-500 max-w-sm leading-relaxed">
                {CURATED_DISCOVERY_TEXT.CURATION_DESC}
              </p>
              <Link
                href="/store"
                className="mt-4 bg-slate-900 text-white hover:bg-slate-800 transition-colors px-6 py-2.5 text-theme-xxs font-bold uppercase tracking-widest rounded-xl"
              >
                {CURATED_DISCOVERY_TEXT.VIEW_ALL}
              </Link>
            </div>
          ) : (
            products &&
            products.length > 0 &&
            products.map((p, idx) => {
              let p_idx = 1;
              p_idx = p_idx + 1;
              return (
                <div key={idx} className=" snap-start h-full">
                  <ul className="list-none p-0 m-0 h-full">
                    <ProductCard product={p} idx={p_idx} />
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
