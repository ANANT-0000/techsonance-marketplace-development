"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { WishListBtn } from "./WishListBtn";
import { AddToCart } from "./AddToCart";
import { BuyBtn } from "./BuyBtn";
import { BuyBtnMode } from "@/utils/Types";
import { StorefrontProduct } from "@/utils/StorefrontTypes";
import { formatCurrency, resolveDisplayPrice } from "@/lib/utils";
import { useThemeData } from "@/hooks/useThemeData";
import { useImageColors } from "@/hooks/useImageColors";
import { PRODUCT_CARD_TEXT } from "@/constants/customerText";
import { IMAGE_PLACEHOLDER } from "@/constants";

export function ProductCard({
  product,
  idx,
}: {
  product: StorefrontProduct;
  idx: number;
}) {
  const { themeData } = useThemeData();
  const primaryImage =
    product.variants?.[0]?.images?.[0]?.image_url ?? IMAGE_PLACEHOLDER;
  const variantId = product.variants?.[0]?.id ?? "";
  const { bg: bgColor, solidBg } = useImageColors(primaryImage);

  const pricing = resolveDisplayPrice(product);

  const isGlass = themeData.card_style === "glassmorphic";
  const cardCls = isGlass
    ? "bg-white/45 backdrop-blur-lg border border-white/60 shadow-[0_8px_32px_0_rgba(15,23,42,0.06)] hover:shadow-xl hover:bg-white/55"
    : "bg-white border border-gray-100 hover:shadow-lg";

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (idx + 1) * 0.06, duration: 0.35, ease: "easeOut" }}
      className={`group flex flex-col overflow-hidden transition-all duration-300 relative h-full rounded-[var(--radius)] ${cardCls} shadow`}
    >
      <Link href={`/store/${product.id}`} className="absolute inset-0 z-10" />
      <div className="relative aspect-square md:aspect-[4/5] overflow-hidden transition-colors duration-500">
        <div className="relative z-20">
          <WishListBtn
            productVariantId={variantId}
            styles="absolute md:top-3 top-2 md:right-3 right-2 md:w-9 md:h-9 w-7 h-7 bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center rounded-full text-gray-600 hover:text-red-500 transition-colors"
          />
        </div>
        <div className="block w-full h-full p-3 md:p-4 pointer-events-none relative z-0">
          <div className="relative w-full h-full">
            <Image
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain group-hover:scale-105 transition-transform duration-500 rounded-xl"
              src={primaryImage}
              alt={product.name?.trim() || "Product image"}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
        {/* Seamless Edge Blending Overlay */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-500" />
      </div>

      <div
        className={`p-3 md:p-4 flex flex-col flex-grow ${isGlass ? "bg-transparent" : "bg-white"}`}
      >
        <div className="mb-1 text-[10px] md:text-xxs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {product.categories?.find((c) => c.is_primary)?.name || product.categories?.[0]?.name || PRODUCT_CARD_TEXT.CATEGORY_FALLBACK}
        </div>
        <div className="block pointer-events-none relative z-0">
          <h3 className="font-semibold text-gray-900 text-xs sm:text-theme-body-sm md:text-theme-body leading-tight mb-2 md:mb-3 line-clamp-2">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto">
          <div className="flex items-end justify-between">
            <div>
              <span className="font-bold text-gray-900 text-theme-body-sm sm:text-theme-body md:text-theme-h6">
                ₹{formatCurrency(pricing.price)}
              </span>
              {pricing.hasDiscount && (
                <span className="text-xxs sm:text-theme-caption line-through text-gray-400 ml-1.5 font-medium">
                  ₹{formatCurrency(pricing.mrp)}
                </span>
              )}
            </div>
          </div>

          {/* Always-Visible Action Buttons (Mobile Stacked Pill Style) */}
          {variantId && (
            <div className="hidden lg:flex xl:flex mt-3 pt-3 justify-between items-center border-t border-gray-100 gap-2.5 w-full relative z-20">
              <AddToCart
                productVariantId={variantId}
                productVariant={product.variants?.[0]}
                styles="w-full h-10 rounded-full bg-theme-primary border border-gray-200 hover:bg-theme-secondary text-theme-primary-foreground transition-colors cursor-pointer"
              />
              <BuyBtn
                id={variantId}
                mode={BuyBtnMode.QUICK_BUY}
                styles="w-full h-10 bg-black border border-gray-200 hover:bg-black/90 rounded-full flex items-center justify-center text-white font-semibold text-theme-caption sm:text-theme-body-sm transition-colors cursor-pointer"
                iconStyles="text-white"
              />
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
