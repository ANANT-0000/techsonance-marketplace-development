"use client";

import { useQuery } from "@tanstack/react-query";
import { StorefrontProduct as Product } from "@/utils/StorefrontTypes";
import { fetchOnSaleProducts } from "@/utils/commonAPiClient";
import { ProductCarousel } from "./ProductCarousel";
import {
  ON_SALE_PRODUCTS_TEXT,
  PRODUCT_ERROR_TEXT,
  PRODUCT_WIDGET_EMPTY_TEXT,
} from "@/constants/customerText";
import { motion } from "motion/react";
import { Loader2, PackageOpen } from "lucide-react";

export function OnSaleProducts() {
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["onsale-products"],
    queryFn: () => fetchOnSaleProducts(8),
  });

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center border-t border-gray-100">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return null;
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 lg:py-12 border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {ON_SALE_PRODUCTS_TEXT.TITLE}
          </h2>
        </motion.div>

        <ProductCarousel products={products} />
      </div>
    </section>
  );
}
