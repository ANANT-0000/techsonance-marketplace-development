"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEFAULT_TRUST_BADGES, TRUST_STRIP_CONFIG } from "@/constants";

const IconMap: Record<string, React.ElementType> = {
  warranty: LucideIcons.ShieldCheck,
  gst: LucideIcons.FileText,
  delivery: LucideIcons.Truck,
  replacement: LucideIcons.RefreshCcw,

  // Map CMS options to custom graphic illustrations
  security: LucideIcons.ShieldCheck,
  shipping: LucideIcons.Truck,
  quality: LucideIcons.Award,
  support: LucideIcons.Headphones,
  default: LucideIcons.HelpCircle,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Helper normalizer
// ─────────────────────────────────────────────────────────────────────────────

function toIconKey(name: string): string {
  if (!/[_\s-]/.test(name)) {
    return name;
  }
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

const GridColsMap: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-2",
  "3": "grid-cols-2 md:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-4",
  "5": "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  "6": "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Main Strip Component
// ─────────────────────────────────────────────────────────────────────────────

export function TrustStrip({ getField }: { getField?: (k: string) => any }) {
  const cmsBadges = getField ? getField("social_proof_badges") : null;
  const layoutStyle = getField ? getField("trust_strip_layout") || "4" : "4";
  const bgColor = getField
    ? getField("trust_strip_bg_color") || "#ffffff"
    : "#ffffff";

  const gridClass = GridColsMap[layoutStyle] || "grid-cols-2 md:grid-cols-4";

  // Fall back to default badges if CMS configuration is missing or holds empty titles
  const hasValidCmsBadges =
    Array.isArray(cmsBadges) &&
    cmsBadges.length > 0 &&
    cmsBadges.some(
      (badge: any) => (badge.title || badge.label || "").trim() !== "",
    );

  const badgesToRender = hasValidCmsBadges ? cmsBadges : DEFAULT_TRUST_BADGES;
  const cols = parseInt(layoutStyle, 10) || 4;

  return (
    <section
      className={`trust-strip border-y border-gray-100 py-3.5 lg:py-6 transition-colors duration-300`}
      style={{
        backgroundColor: bgColor.startsWith("bg-") ? undefined : bgColor,
      }}
    >
      <div className="w-full px-4 lg:px-8 xl:px-12">
        <div className={`grid ${gridClass} gap-4 lg:gap-y-6 lg:gap-x-4`}>
          {badgesToRender.map((badge: any, index: number) => {
            const MappedIcon = IconMap[badge.icon];
            const iconKey = toIconKey(badge.icon || "");
            const FinalIconComponent =
              MappedIcon ||
              (LucideIcons as any)[iconKey] ||
              LucideIcons.HelpCircle;

            return (
              <Card
                key={badge.id || badge.title || badge.label || index}
                className="flex flex-col lg:flex-row items-center lg:items-start text-center lg:text-left gap-2 lg:gap-4 p-2 lg:p-4 shadow-none border-transparent bg-transparent hover:bg-slate-50/50 transition-colors duration-300"
              >
                {/* Visual Icon Box */}
                <div className="shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200 scale-[0.85] lg:scale-100 transition-transform text-slate-700">
                  <FinalIconComponent size={20} strokeWidth={1.5} />
                </div>

                {/* Text Content */}
                <div className="flex flex-col items-center lg:items-start flex-1 min-w-0 pt-1 lg:pt-0">
                  <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-bold text-gray-900 leading-tight mb-1">
                    {badge.title || badge.label}
                  </CardTitle>
                  <CardDescription className="text-[10px] lg:text-xs text-gray-500 flex flex-wrap items-center justify-center lg:justify-start gap-1 leading-relaxed">
                    <span>{badge.subtitle || badge.sub || badge.desc}</span>
                    {badge.showInfo && (
                      <LucideIcons.Info
                        size={TRUST_STRIP_CONFIG.INFO_ICON_SIZE}
                        className="text-gray-400 inline cursor-pointer hover:text-gray-700 transition-colors shrink-0"
                      />
                    )}
                  </CardDescription>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
