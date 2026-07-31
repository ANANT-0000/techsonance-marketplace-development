"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import AxiosAPI from "@/lib/axios";
import { ProductCarousel } from "../ProductCarousel";
import Link from "next/link";
import { StorefrontProduct } from "@/utils/StorefrontTypes";

export interface DynamicSectionConfig {
  title: string;
  description: string;
  position: number;
  colors: {
    backgroundColor: string;
    textColor: string;
    primaryColor: string;
  };
  cta: {
    text: string;
    route: string;
    queryParams: string;
  };
}

export function DynamicVendorSection({
  config,
}: {
  config: DynamicSectionConfig;
}) {
  // We use TanStack Query here to handle caching, loading states, and refetching
  // gracefully without relying on raw useEffect as per AGENTS.md rules.
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery<StorefrontProduct[]>({
    queryKey: ["dynamic-section", config.cta.queryParams],
    queryFn: async () => {
      // Since the Vendor Builder already constructs the query parameters string
      // (e.g. ?category=T-Shirts&timeframe=last_7_days) we can just append it.
      const queryStr = config.cta.queryParams || "";
      const separator = queryStr.includes("?") ? "&" : "?";
      const response = await AxiosAPI.get(
        `/v1/products/dynamic${queryStr}${separator}limit=12`,
      );
      return response.data?.data?.products ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Strict Rendering Order: Loading -> Data OR Loading -> Error
  if (isLoading) {
    return (
      <section
        className="py-16 px-4 md:px-8 w-full transition-colors duration-500"
        style={{
          backgroundColor: config.colors?.backgroundColor || "#ffffff",
          color: config.colors?.textColor || "#000000",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-10 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-3 w-full max-w-2xl">
              <div className="w-2/3 md:w-1/3 h-10 bg-current opacity-10 rounded-lg"></div>
              <div className="w-5/6 md:w-1/2 h-5 bg-current opacity-10 rounded-lg"></div>
            </div>
            <div className="w-32 h-12 bg-current opacity-10 rounded-full"></div>
          </div>

          {/* Carousel Skeleton */}
          <div className="w-full flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[240px] md:w-[280px] flex flex-col gap-4"
              >
                <div className="w-full aspect-square md:aspect-[4/5] bg-current opacity-5 rounded-2xl"></div>
                <div className="flex flex-col gap-2 px-1">
                  <div className="w-3/4 h-4 bg-current opacity-10 rounded-md"></div>
                  <div className="w-1/2 h-3 bg-current opacity-10 rounded-md"></div>
                  <div className="w-1/3 h-5 bg-current opacity-10 rounded-md mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return null;
  }

  // Graceful fallback if no products match the vendor's strict filters
  if (!products || products.length === 0) {
    return null;
  }

  const { title, description, colors, cta } = config;

  // We rely on inline styles specifically for the colors, as these are raw hex codes
  // provided by the vendor from the Section Builder configuration.
  return (
    <section
      className="py-16 px-4 md:px-8 w-full transition-colors duration-500"
      style={{
        backgroundColor: colors?.backgroundColor || "#ffffff",
        color: colors?.textColor || "#000000",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-2xl">
            {title && (
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="opacity-80 text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {cta?.text && cta?.route && (
            <Link
              href={`${cta.route}${cta.queryParams}`}
              className="inline-flex items-center justify-center px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
              style={{
                backgroundColor: colors?.primaryColor || "#000000",
                color: "#ffffff", // Assuming high contrast text for primary CTA buttons
              }}
            >
              {cta.text}
            </Link>
          )}
        </div>

        {/* Dynamic Carousel rendering the filtered results */}
        <div className="w-full">
          <ProductCarousel products={products} />
        </div>
      </div>
    </section>
  );
}
