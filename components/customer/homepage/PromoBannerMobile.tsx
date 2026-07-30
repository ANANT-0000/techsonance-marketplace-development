import { useImageColors } from "@/hooks/useImageColors";
import Link from "next/link";
import Image from "next/image";
import { PROMO_BANNER_TEXT } from "@/constants/customerText";
import { IMAGE_PLACEHOLDER } from "@/constants";

export function PromoBannerMobile({
  imageUrl,
  title,
  desc,
  btnText,
}: {
  imageUrl: string;
  title: string;
  desc: string;
  btnText: string;
}) {
  const displayTitle = title || PROMO_BANNER_TEXT.DEFAULT_TITLE;
  const displayDesc = desc || undefined;
  const { bg: bgColor } = useImageColors(imageUrl);

  if (!imageUrl) {
    return (
      <section className="promo_banner_mobile mx-4 my-6 rounded-2xl overflow-hidden relative h-48 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 transition-colors duration-500 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_70%_50%,rgba(99,102,241,0.18)_0%,transparent_70%)] pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h3 className="text-theme-body md:text-theme-h6 font-bold text-white leading-tight mb-2 font-serif">
            {displayTitle}
          </h3>
          {displayDesc && (
            <p className="text-theme-caption text-white/70 mb-5 line-clamp-2 max-w-[240px]">
              {displayDesc}
            </p>
          )}
          <Link href="/store">
            <button className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-full">
              {btnText || PROMO_BANNER_TEXT.SHOP_NOW}
            </button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{ background: bgColor }}
      className="promo_banner_mobile mx-4 my-6 rounded-2xl overflow-hidden relative h-44 transition-colors duration-500"
    >
      <Image
        src={imageUrl || IMAGE_PLACEHOLDER}
        alt={title}
        fill
        className="object-contain"
        sizes="(max-width: 768px) calc(100vw - 32px)"
        priority={true}
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
      <div className="absolute inset-0 flex flex-col justify-center px-5">
        <h3 className="text-theme-h6 font-bold text-white leading-tight mb-1">
          {displayTitle}
        </h3>
        {displayDesc && (
          <p className="text-theme-xxs text-white/70 mb-4 line-clamp-2">
            {displayDesc}
          </p>
        )}
        <Link href="/store">
          <button className="self-start bg-white text-black text-theme-tiny font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl">
            {btnText || PROMO_BANNER_TEXT.SHOP_NOW}
          </button>
        </Link>
      </div>
    </section>
  );
}
