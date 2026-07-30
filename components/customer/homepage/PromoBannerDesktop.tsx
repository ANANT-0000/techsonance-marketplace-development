import { useImageColors } from "@/hooks/useImageColors";
import Image from "next/image";
import Link from "next/link";
import { PROMO_BANNER_TEXT } from "@/constants/customerText";

export function PromoBannerDesktop({
  imageUrl,
  subtitle,
  title,
  desc,
  btnText,
}: {
  imageUrl: string;
  subtitle: string;
  title: string;
  desc: string;
  btnText: string;
}) {
  const { bg: bgColor } = useImageColors(imageUrl);

  const displayTitle = title || PROMO_BANNER_TEXT.DEFAULT_TITLE;
  const displayDesc = desc || PROMO_BANNER_TEXT.DEFAULT_DESC;
  const displaySubtitle = subtitle || undefined;

  // When no image is configured, render a premium gradient-only banner
  if (!imageUrl) {
    return (
      <section className="promo_banner_desktop relative w-full h-[52vh] min-h-[340px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 transition-colors duration-500">
        {/* Decorative radial glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_70%_50%,rgba(99,102,241,0.18)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_300px_at_75%_40%,rgba(139,92,246,0.12)_0%,transparent_60%)] pointer-events-none" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-16 xl:px-24 w-full flex flex-col items-center text-center">
            <div className="max-w-2xl text-white flex flex-col items-center">
              {displaySubtitle && (
                <p className="text-theme-tiny font-bold uppercase tracking-[0.3em] text-white/50 mb-4">
                  {displaySubtitle}
                </p>
              )}
              <h2 className="text-theme-h2 lg:text-theme-h1 font-serif tracking-tight leading-[1.05] mb-4">
                {displayTitle}
              </h2>
              {displayDesc && (
                <p className="text-theme-body-sm text-white/60 font-light leading-relaxed mb-8 max-w-sm mx-auto">
                  {displayDesc}
                </p>
              )}
              <Link href="/store">
                <button className="bg-white text-black hover:bg-gray-100 transition-all duration-300 px-8 py-3 text-theme-xxs uppercase tracking-[0.2em] font-bold rounded-full">
                  {btnText || PROMO_BANNER_TEXT.SHOP_NOW}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{ background: bgColor }}
      className=" promo_banner_desktop relative w-full h-[52vh] min-h-[340px] overflow-hidden transition-colors duration-500"
    >
      <Image
        src={imageUrl}
        alt={displayTitle}
        fill
        className="object-contain"
        sizes="100vw"
        priority={true}
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-16 xl:px-24 w-full">
          <div className="max-w-lg text-white">
            {displaySubtitle && (
              <p className="text-theme-tiny font-bold uppercase tracking-[0.3em] text-white/70 mb-4">
                {displaySubtitle}
              </p>
            )}
            <h2 className="text-theme-h2 lg:text-theme-h1 font-serif tracking-tight leading-[1.05] mb-4">
              {displayTitle}
            </h2>
            {displayDesc && (
              <p className="text-theme-body-sm text-white/75 font-light leading-relaxed mb-8 max-w-sm">
                {displayDesc}
              </p>
            )}
            <Link href="/store">
              <button className="bg-white text-black hover:bg-gray-100 transition-all duration-300 px-8 py-3 text-theme-xxs uppercase tracking-[0.2em] font-bold">
                {btnText || PROMO_BANNER_TEXT.SHOP_NOW}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
