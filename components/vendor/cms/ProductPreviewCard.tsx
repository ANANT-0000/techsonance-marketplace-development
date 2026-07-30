"use client";
import { UiText } from "@/constants/ui-text";
import AxiosAPI from "@/lib/axios";
import { useEffect, useState } from "react";

export const ProductPreviewCard = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }
    let active = true;
    setLoading(true);
    AxiosAPI.get(`/v1/products/${productId}`)
      .then((res) => {
        if (active) {
          setProduct(res.data?.data ?? res.data);
        }
      })
      .catch(() => {
        if (active) setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="text-theme-tiny text-slate-400 mt-1 animate-pulse">
        {UiText.LOADING_PREVIEW}
      </div>
    );
  }

  if (!product) return null;

  const imageUrl =
    product.variants?.[0]?.images?.[0]?.image_url ??
    product.images?.[0]?.image_url ??
    "";
  const price = product.base_price ?? product.basePrice ?? 0;

  return (
    <div className="flex items-center gap-3 mt-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm animate-fadeIn min-w-0">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={product.name}
          className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm shrink-0"
        />
      )}
      <div className="text-theme-tiny leading-tight text-slate-500">
        <span className="font-bold text-slate-700 block truncate">
          {product.name}
        </span>
        <span>₹{Number(price).toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
};
