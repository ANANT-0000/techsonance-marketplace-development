import { COLOR_LIGHT_GRAY, COLOR_WHITE, IMAGE_PLACEHOLDER } from "@/constants";
import { HomeCategories } from "@/utils/Types";
import Image from "next/image";
import Link from "next/link";

export function MobileCategoryPill({
  cat,
  aspectRatio = "aspect-square",
  borderRadius = "rounded-full",
}: {
  cat: HomeCategories;
  aspectRatio?: string;
  borderRadius?: string;
}) {
  return (
    <Link
      href={`/store?category=${encodeURIComponent(cat.name)}`}
      className="flex flex-col items-center gap-3.5 shrink-0 w-[84px] sm:w-[100px] group active:scale-95 transition-transform"
    >
      <div
        style={{ background: COLOR_WHITE }}
        className={`relative w-full ${aspectRatio} ${borderRadius} overflow-hidden border-2 border-white shadow-md group-hover:shadow-lg group-hover:ring-2 group-hover:ring-theme-primary/30 transition-all duration-300 flex-shrink-0`}
      >
        <Image
          src={cat.product_image || IMAGE_PLACEHOLDER}
          alt={cat.name}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      <span className="text-theme-tiny font-semibold text-gray-600 text-center leading-tight capitalize line-clamp-2 group-hover:text-theme-primary transition-colors">
        {cat.name}
      </span>
    </Link>
  );
}
