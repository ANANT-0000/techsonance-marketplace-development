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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";

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
  // const [imgAspect, setImgAspect] = useState<number>(4 / 5);

  const pricing = resolveDisplayPrice(product);

  const isGlass = themeData.card_style === "glassmorphic";
  const cardCls = isGlass
    ? "bg-white/45 backdrop-blur-lg border-white/60 shadow-[0_8px_32px_0_rgba(15,23,42,0.06)] hover:shadow-xl hover:bg-white/55"
    : "bg-white border-gray-100 hover:shadow-md";

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (idx + 1) * 0.06, duration: 0.35, ease: "easeOut" }}
      className="h-full"
    >
      <Card
        className={`group flex flex-col overflow-hidden transition-all duration-300 relative h-full rounded-[var(--radius)] p-0 gap-0 border ${cardCls}`}
      >
        <Link href={`/store/${product.id}`} className="absolute inset-0 z-10" />

        <div 
          style={{ background: bgColor || "#ffffff" }}
          className="relative w-full aspect-square md:aspect-[4/5] overflow-hidden transition-colors duration-500"
        >
          <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
            <WishListBtn
              productVariantId={variantId}
              styles="w-7 h-7 md:w-9 md:h-9 bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center rounded-full text-gray-600 hover:text-red-500 transition-colors"
            />
          </div>
          <div className="absolute inset-0 p-2 md:p-4 pointer-events-none z-0">
            <Image
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain group-hover:scale-[1.03] transition-transform duration-700"
              src={primaryImage}
              alt={product.name?.trim() || "Product image"}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none transition-all duration-500" />
        </div>

        <CardContent
          className={`p-3 md:p-4 px-3 md:px-4 flex flex-col flex-grow ${isGlass ? "bg-transparent" : "bg-white"}`}
        >
          <div className="mb-1 text-[10px] md:text-xxs font-semibold text-gray-400 uppercase tracking-wider truncate relative z-20">
            {product.categories?.find((c) => c.is_primary)?.name ||
              product.categories?.[0]?.name ||
              PRODUCT_CARD_TEXT.CATEGORY_FALLBACK}
          </div>
          <div className="block pointer-events-none relative z-0">
            <h3 className="font-semibold text-gray-900 text-xs sm:text-theme-body-sm md:text-theme-body leading-tight mb-2 md:mb-3 line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
          </div>

          <div className="mt-auto pt-1 relative z-20">
            <span className="font-bold text-gray-900 text-theme-body-sm sm:text-theme-body md:text-theme-h6">
              ₹{formatCurrency(pricing.price)}
            </span>
            {pricing.hasDiscount && (
              <span className="text-xxs sm:text-theme-caption line-through text-gray-400 ml-1.5 font-medium">
                ₹{formatCurrency(pricing.mrp)}
              </span>
            )}
          </div>
        </CardContent>

        {variantId && (
          <CardFooter className="p-3 md:p-4 pt-0 px-3 md:px-4 z-20 hidden lg:flex xl:flex justify-between items-center gap-2.5 w-full">
            <AddToCart
              productVariantId={variantId}
              productVariant={product.variants?.[0]}
              styles="flex-1 h-10 rounded-full bg-theme-primary hover:bg-theme-secondary text-theme-primary-foreground transition-colors cursor-pointer border border-gray-100 shadow-sm"
            />
            <BuyBtn
              id={variantId}
              mode={BuyBtnMode.QUICK_BUY}
              styles="flex-1 h-10 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold text-theme-caption sm:text-theme-body-sm transition-colors cursor-pointer border border-gray-900 shadow-sm"
              iconStyles="text-white w-4 h-4 mr-1.5"
            />
          </CardFooter>
        )}
      </Card>
    </motion.li>
  );
}
