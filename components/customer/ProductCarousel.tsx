"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StorefrontProduct as Product } from "@/utils/StorefrontTypes";
import { ProductCard } from "./ProductCard";

interface ProductCarouselProps {
  products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 2,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 3 },
      "(min-width: 1024px)": { slidesToScroll: 4 },
    },
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!products || products.length === 0) return null;

  return (
    <div className="relative group">
      <div
        className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0"
        ref={emblaRef}
      >
        <div className="flex -ml-4 md:-ml-6 lg:-ml-8 touch-pan-y">
          {Array.isArray(products) &&
            products.map((product: Product, idx: number) => (
              <div
                key={product.id}
                className="flex-none pl-4 md:pl-6 lg:pl-8 w-[65%] sm:w-1/2 md:w-1/3 lg:w-1/4"
              >
                <ProductCard product={product} idx={idx} />
              </div>
            ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
        className={`hidden md:flex absolute top-1/2 -left-4 -translate-y-1/2 z-10 bg-white shadow-lg border border-gray-100 rounded-full p-2 transition-all duration-200 hover:scale-110 active:scale-95 items-center justify-center ${
          prevBtnDisabled ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
        aria-label="Previous products"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      <button
        onClick={scrollNext}
        disabled={nextBtnDisabled}
        className={`hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 bg-white shadow-lg border border-gray-100 rounded-full p-2 transition-all duration-200 hover:scale-110 active:scale-95 items-center justify-center ${
          nextBtnDisabled ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
        aria-label="Next products"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}
