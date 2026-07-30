"use client";
import { ProductImage } from "@/utils/Types";
import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState, useMemo } from "react";
import { VARIANT_IMG_GRID_TEXT } from "@/constants/vendorText";

export const VariantImgGrid = ({
  variantImages
}: {
  variantImages: ProductImage[]
}) => {
  // Use the first image ID as default, or null if empty
  const [selectedId, setSelectedId] = useState<string | null>(variantImages?.[0]?.id || null);

  // Memoize the active image to avoid repeated .find() calls on every render
  const activeImage = useMemo(() =>
    variantImages?.find((img) => img.id === selectedId) || variantImages?.[0],
    [selectedId, variantImages]
  );

  if (!variantImages || variantImages.length === 0) {
    return (
      <div className="flex flex-col h-48 w-full items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <ImageOff className="text-slate-200 w-8 h-8 mb-2" strokeWidth={1.5} />
        <span className="text-theme-tiny font-medium text-slate-400">{VARIANT_IMG_GRID_TEXT.EMPTY_TEXT}</span>
      </div>
    );
  }

  return (
    <div className="flex h-48 w-full gap-3 bg-slate-50/50 p-2.5 rounded-2xl overflow-hidden border border-slate-100/50">
      {variantImages.length > 1 && (
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide no-scrollbar">
          {variantImages.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelectedId(img.id)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 ${selectedId === img.id ? "border-slate-800 shadow-sm opacity-100" : "border-transparent opacity-60 hover:opacity-100 hover:scale-95"
                }`}
            >
              <Image
                src={img.image_url}
                alt={img?.alt_text || VARIANT_IMG_GRID_TEXT.ALT_TEXT}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}


      <div className="relative flex-1 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100/80 transition-all duration-300">
        {activeImage ? (
          <Image
            src={activeImage.image_url}
            alt={activeImage?.alt_text || VARIANT_IMG_GRID_TEXT.ALT_TEXT}
            fill
            priority
            className="object-contain p-2 transition-opacity duration-300 ease-in-out"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="text-slate-200" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
};