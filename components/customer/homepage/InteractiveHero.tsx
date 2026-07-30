"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useImageColors } from "@/hooks/useImageColors";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COLOR_WHITE_MUTED,
  COLOR_SLATE_MUTED,
  COLOR_SLATE_DARK,
} from "@/constants/storefront";
import { COLOR_WHITE, IMAGE_PLACEHOLDER } from "@/constants";
import {
  HeroBannerType,
  HeroBgStyle,
  HeroLayout,
  HeroSlide,
} from "@/utils/Types";

// ─── Hero Slide Placeholder ───────────────────────────────────────────────────
// Professional image-slot placeholder rendered inside the carousel for every
// slide that has no image_url configured. Same absolute-inset-0 footprint as
// the real <Image>, so layout never shifts.
function HeroSlidePlaceholder() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-stone-50">
      {/* Subtle dot-grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.35) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Soft centre radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_45%,rgba(255,255,255,0.75)_0%,transparent_75%)]" />
      {/* Centred frame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-44 h-44 lg:w-64 lg:h-64 flex-shrink-0">
          {/* Dashed border frame */}
          <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-slate-300/70 bg-white/30" />
          {/* Corner accent marks */}
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-slate-400/50 rounded-tl-md" />
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-slate-400/50 rounded-tr-md" />
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-slate-400/50 rounded-bl-md" />
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-slate-400/50 rounded-br-md" />
          {/* Image icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="10"
                width="44"
                height="32"
                rx="4"
                stroke="#94a3b8"
                strokeWidth="1.75"
                fill="none"
              />
              <path
                d="M4 32l12-11 9 9 7-6 12 9"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <circle
                cx="18"
                cy="22"
                r="3.5"
                stroke="#94a3b8"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        }}
      />
    </div>
  );
}

function getTextColorForBg(colorStr: string) {
  if (!colorStr) return COLOR_WHITE;

  let r = 255;
  let g = 255;
  let b = 255;

  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    r = parseInt(rgbMatch[1], 10);
    g = parseInt(rgbMatch[2], 10);
    b = parseInt(rgbMatch[3], 10);
  } else if (colorStr.startsWith("#")) {
    const hex = colorStr.replace("#", "");
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }

  // Calculate relative luminance: Y = 0.299R + 0.587G + 0.114B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? COLOR_SLATE_DARK : COLOR_WHITE;
}

export interface InteractiveHeroProps {
  banner_type?: HeroBannerType | string;
  video_url?: string;
  video_eyebrow?: string;
  video_title?: string;
  video_desc?: string;
  video_btn_text?: string;
  video_btn_link?: string;
  slides: HeroSlide[];
}

export function InteractiveHero({
  banner_type,
  video_url,
  video_eyebrow,
  video_title,
  video_desc,
  video_btn_text,
  video_btn_link,
  slides,
}: InteractiveHeroProps) {
  const displayBannerType = banner_type ?? HeroBannerType.CAROUSEL;
  const displaySlides = slides ?? [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-play timer for carousel
  useEffect(() => {
    if (
      displayBannerType !== HeroBannerType.CAROUSEL ||
      displaySlides.length <= 1
    )
      return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % displaySlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displayBannerType, displaySlides.length]);

  const handlePrev = () => {
    if (displaySlides.length <= 1) return;
    setCurrentIdx(
      (prev) => (prev - 1 + displaySlides.length) % displaySlides.length,
    );
  };

  const handleNext = () => {
    if (displaySlides.length <= 1) return;
    setCurrentIdx((prev) => (prev + 1) % displaySlides.length);
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Fallback to carousel or simple image if slide list is empty
  const activeSlides =
    displaySlides.length > 0
      ? displaySlides
      : [
          {
            image_url: undefined,
            mobile_image_url: undefined,
            title: undefined,
            subtitle: undefined,
            btn_text: undefined,
            btn_link: undefined,
            layout: HeroLayout.CENTER_OVERLAY,
            bg_style: HeroBgStyle.GRADIENT,
          },
        ];

  const currentSlide = activeSlides[currentIdx];
  const activeSlideImage = currentSlide?.image_url;
  const bgColor = currentSlide?.bg_color
    ? currentSlide.bg_color
    : useImageColors(activeSlideImage).bg;

  // Background style selection
  const bgStyleValue = currentSlide?.bg_style || HeroBgStyle.GRADIENT;
  const isCustomBg = bgStyleValue === "custom";
  const isGradient = bgStyleValue === HeroBgStyle.GRADIENT;
  // Neutral warm fallback so section never goes dark when no image/bg_color is set
  const finalBg = isCustomBg || bgColor || "#f8f7f4";

  // Layout selection
  const layoutStyle = currentSlide?.layout || HeroLayout.CENTER_OVERLAY;
  const isOverlay = layoutStyle === HeroLayout.CENTER_OVERLAY;

  // Text color contrast check
  const textColor = getTextColorForBg(bgColor as string);
  const subtitleColor =
    textColor === COLOR_WHITE ? COLOR_WHITE_MUTED : COLOR_SLATE_MUTED;
  const btnClass =
    textColor === COLOR_WHITE
      ? "bg-white text-black hover:bg-slate-100"
      : "bg-slate-900 text-white hover:bg-slate-800";

  const eyebrow = video_eyebrow;
  const title = video_title;
  const desc = video_desc;
  const btnText = video_btn_text;
  const btnLink = video_btn_link;

  // Video render helper
  if (displayBannerType === HeroBannerType.VIDEO && video_url) {
    return (
      <section className="relative w-full h-full  min-h-[450px] bg-slate-950 overflow-hidden">
        {/* Background Video */}
        <video
          ref={videoRef}
          src={video_url}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* Video Overlay Layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

        {/* Floating Controls */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <button
            onClick={toggleVideoPlay}
            className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:bg-black/60 transition-all hover:scale-105 active:scale-95"
            aria-label={isVideoPlaying ? "Pause video" : "Play video"}
          >
            {isVideoPlaying ? (
              <Pause size={15} />
            ) : (
              <Play size={15} className="ml-0.5" />
            )}
          </button>
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:bg-black/60 transition-all hover:scale-105 active:scale-95"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>

        {/* Text Overlay Content */}
        <div className="absolute inset-0 flex items-center z-10">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-16 xl:px-24 w-full">
            <div className="max-w-2xl text-white">
              {eyebrow && (
                <span className="inline-block text-theme-tiny font-bold tracking-[0.25em] text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-6">
                  {eyebrow}
                </span>
              )}
              {title && (
                <h1 className="text-theme-h2 sm:text-theme-h1 lg:text-6xl font-serif tracking-tight leading-[1.1] mb-6">
                  {title}
                </h1>
              )}
              {desc && (
                <p className="text-theme-body sm:text-theme-h6 text-white/80 font-light leading-relaxed mb-8 max-w-lg">
                  {desc}
                </p>
              )}
              {btnText && (
                <Link href={btnLink || "/store"}>
                  <button className="bg-white text-black hover:bg-slate-100 transition-all duration-300 px-8 py-3.5 text-theme-caption uppercase tracking-[0.2em] font-bold rounded-xl shadow-lg hover:shadow-white/10 hover:-translate-y-0.5">
                    {btnText}
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isMobile) {
    return (
      <section className="w-full px-2 lg:px-4 xl:px-6 py-6 max-w-screen mx-auto">
        <div
          style={{ background: finalBg as string }}
          className="relative w-full aspect-[3/4] min-h-[450px] h-auto  rounded-[2rem] overflow-hidden group transition-colors duration-700 shadow-xl"
        >
          {/* Slides Carousel container */}
          <div className="relative w-full h-full">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                {isOverlay ? (
                  /* Overlay layout */
                  <div className="relative w-full h-full">
                    {currentSlide.mobile_image_url ? (
                      <Image
                        src={currentSlide.mobile_image_url}
                        alt={currentSlide.title || "Mobile Banner"}
                        fill
                        priority
                        loading="eager"
                        className="object-cover object-center"
                        sizes="100vw"
                      />
                    ) : currentSlide.image_url &&
                      currentSlide.image_url !== "" ? (
                      <Image
                        src={currentSlide.image_url}
                        alt={currentSlide.title || "Banner"}
                        fill
                        priority
                        loading="eager"
                        className="object-cover object-center"
                        sizes="100vw"
                      />
                    ) : (
                      <HeroSlidePlaceholder />
                    )}

                    <div className="absolute inset-0 flex items-center">
                      <div className="max-w-screen-xl mx-auto px-6 lg:px-16 xl:px-24 w-full">
                        <div style={{ color: textColor }} className="max-w-2xl">
                          {currentSlide.subtitle && (
                            <motion.p
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2, duration: 0.5 }}
                              className="text-theme-body-sm sm:text-theme-h6 font-bold uppercase tracking-[0.3em] mb-4"
                              style={{ color: subtitleColor }}
                            >
                              {currentSlide.subtitle}
                            </motion.p>
                          )}

                          <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-theme-h3 sm:text-theme-h1 lg:text-6xl font-serif tracking-tight leading-[1.1] mb-6"
                          >
                            {currentSlide.title}
                          </motion.h1>

                          {currentSlide.btn_text && (
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4, duration: 0.5 }}
                            >
                              <Link href={currentSlide.btn_link || "/store"}>
                                <button
                                  className={`hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-8 py-3.5 text-theme-body sm:text-theme-h6 uppercase tracking-[0.2em] font-bold rounded-xl shadow-lg cursor-pointer ${btnClass}`}
                                >
                                  {currentSlide.btn_text}
                                </button>
                              </Link>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Split layouts (left-content-right-image or right-content-left-image) */
                  <div className="w-full h-full flex flex-col items-center justify-between relative">
                    <div className="w-full flex items-center px-6 py-8 order-2">
                      <div
                        style={{ color: textColor }}
                        className="max-w-2xl w-full"
                      >
                        {currentSlide.subtitle && (
                          <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-theme-tiny font-bold uppercase tracking-[0.3em] mb-4"
                            style={{ color: subtitleColor }}
                          >
                            {currentSlide.subtitle}
                          </motion.p>
                        )}
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="text-theme-h2 font-serif tracking-tight leading-[1.15] mb-6"
                        >
                          {currentSlide.title}
                        </motion.h1>
                        {currentSlide.btn_text && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                          >
                            <Link href={currentSlide.btn_link || "/store"}>
                              <button
                                className={`hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-8 py-3.5 text-theme-xxs uppercase tracking-[0.2em] font-bold rounded-xl shadow-lg cursor-pointer ${btnClass}`}
                              >
                                {currentSlide.btn_text}
                              </button>
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-[45vh] relative order-1">
                      {currentSlide.mobile_image_url ? (
                        <Image
                          src={currentSlide.mobile_image_url}
                          alt={currentSlide.title || "Banner"}
                          fill
                          priority
                          loading="eager"
                          className="object-contain p-4 rounded-4xl"
                          sizes="100vw"
                        />
                      ) : currentSlide.image_url ? (
                        <Image
                          src={currentSlide.image_url}
                          alt={currentSlide.title || "Banner"}
                          fill
                          priority
                          loading="eager"
                          className="object-contain p-4 rounded-4xl"
                          sizes="100vw"
                        />
                      ) : (
                        <HeroSlidePlaceholder />
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {activeSlides.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/25 backdrop-blur-md text-white border border-white/5 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-xl bg-black/25 backdrop-blur-md text-white border border-white/5 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
                {activeSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentIdx === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-2 lg:px-4 xl:px-6 py-6 max-w-screen mx-auto hidden sm:block">
      <div
        style={{ background: finalBg as string }}
        className="relative w-full h-[100dvh]  min-h-[50dvh] rounded-[2rem] overflow-hidden group transition-colors duration-700 shadow-xl"
      >
        {/* Slides Carousel container */}
        <div className="relative w-full h-full">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {isOverlay ? (
                /* Overlay layout */
                <div className="relative w-full h-full">
                  {currentSlide.mobile_image_url && isMobile ? (
                    <Image
                      src={currentSlide.mobile_image_url}
                      alt={currentSlide.title || "Mobile Banner"}
                      fill
                      priority
                      loading="eager"
                      className="object-contain object-center"
                      sizes="100vw"
                    />
                  ) : currentSlide.image_url &&
                    currentSlide.image_url !== "" ? (
                    <Image
                      src={currentSlide.image_url}
                      alt={currentSlide.title || "Banner"}
                      fill
                      priority
                      loading="eager"
                      className="object-cover object-top"
                      sizes="100vw"
                    />
                  ) : (
                    // Styled placeholder fills the exact same slot as the real image
                    <HeroSlidePlaceholder />
                  )}

                  <div className="absolute inset-0 flex items-center">
                    <div className="max-w-screen-xl mx-auto px-6 lg:px-16 xl:px-24 w-full">
                      <div style={{ color: textColor }} className="max-w-2xl">
                        {currentSlide.subtitle && (
                          <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-theme-body-sm sm:text-theme-h6 font-bold uppercase tracking-[0.3em] mb-4"
                            style={{ color: subtitleColor }}
                          >
                            {currentSlide.subtitle}
                          </motion.p>
                        )}

                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="text-theme-h3 sm:text-theme-h1 lg:text-6xl font-serif tracking-tight leading-[1.1] mb-6"
                        >
                          {currentSlide.title}
                        </motion.h1>

                        {currentSlide.btn_text && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                          >
                            <Link href={currentSlide.btn_link || "/store"}>
                              <button
                                className={`hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-8 py-3.5 text-theme-body sm:text-theme-h6 uppercase tracking-[0.2em] font-bold rounded-xl shadow-lg cursor-pointer ${btnClass}`}
                              >
                                {currentSlide.btn_text}
                              </button>
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Split layouts (left-content-right-image or right-content-left-image) */
                <div className="w-full h-full flex flex-col lg:flex-row items-center justify-between relative">
                  {/* Text content container */}
                  <div
                    className={`w-full lg:w-1/2 flex items-center px-6 lg:px-16 xl:px-24 py-8 lg:py-0 ${
                      layoutStyle === HeroLayout.LEFT_CONTENT_RIGHT_IMAGE
                        ? "order-2 lg:order-1"
                        : "order-2"
                    }`}
                  >
                    <div
                      style={{ color: textColor }}
                      className="max-w-2xl w-full"
                    >
                      {currentSlide.subtitle && (
                        <motion.p
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="text-theme-tiny sm:text-theme-caption font-bold uppercase tracking-[0.3em] mb-4"
                          style={{ color: subtitleColor }}
                        >
                          {currentSlide.subtitle}
                        </motion.p>
                      )}

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-theme-h2 sm:text-theme-h1 lg:text-theme-h1 font-serif tracking-tight leading-[1.15] mb-6"
                      >
                        {currentSlide.title}
                      </motion.h1>

                      {currentSlide.btn_text && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          <Link href={currentSlide.btn_link || "/store"}>
                            <button
                              className={`hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-8 py-3.5 text-theme-xxs uppercase tracking-[0.2em] font-bold rounded-xl shadow-lg cursor-pointer ${btnClass}`}
                            >
                              {currentSlide.btn_text}
                            </button>
                          </Link>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Image container */}
                  <div
                    className={`w-full lg:w-1/2 h-[35vh] lg:h-full relative ${
                      layoutStyle === HeroLayout.LEFT_CONTENT_RIGHT_IMAGE
                        ? "order-1 lg:order-2"
                        : "order-1"
                    }`}
                  >
                    {currentSlide.mobile_image_url && isMobile ? (
                      <Image
                        src={currentSlide.mobile_image_url}
                        alt={currentSlide.title || "Mobile Banner"}
                        fill
                        priority
                        loading="eager"
                        className="object-contain p-4 lg:p-8 rounded-4xl"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    ) : currentSlide.image_url ? (
                      <Image
                        src={currentSlide.image_url}
                        alt={currentSlide.title || "Banner"}
                        fill
                        priority
                        loading="eager"
                        className="object-contain p-4 lg:p-8 rounded-4xl"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    ) : (
                      // Styled placeholder fills the exact same slot as the real image
                      <HeroSlidePlaceholder />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-xl bg-black/25 backdrop-blur-md text-white border border-white/5 hover:bg-black/55 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-xl bg-black/25 backdrop-blur-md text-white border border-white/5 hover:bg-black/55 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIdx === idx
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
