"use client";

import React, { useState } from "react";
import { ChevronDown, Moon, Sun } from "lucide-react";

// List of all features the vendor can attach to an announcement item.
export const ANNOUNCEMENT_FEATURES = [
  { key: "currency_selector", name: "Currency Selector" },
  { key: "language_selector", name: "Language Selector" },
  { key: "theme_toggle", name: "Dark Mode Toggle" },
];

// --- Mock Feature Components --- //
// In the future, these can be wired up to Redux or next-intl.

function CurrencySelector({ label }: { label: string }) {
  const [currency, setCurrency] = useState(label || "USD");
  const options = ["USD", "EUR", "GBP"];
  return (
    <div className="relative group cursor-pointer flex items-center gap-1 hover:opacity-80 transition-opacity">
      <span className="uppercase">{currency}</span>
      <ChevronDown
        size={12}
        className="opacity-70 group-hover:rotate-180 transition-transform"
      />
      <div className="absolute top-full right-0 mt-1 hidden group-hover:flex flex-col bg-white text-slate-800 shadow-lg border border-slate-200 rounded-lg overflow-hidden z-[100] min-w-[100px] text-left">
        {options.map((opt) => (
          <div
            key={opt}
            onClick={() => setCurrency(opt)}
            className="px-4 py-2 hover:bg-slate-100 text-xs font-medium !text-slate-800 text-left w-full text-nowrap"
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
}

function LanguageSelector({ label }: { label: string }) {
  const [lang, setLang] = useState(label || "EN");
  const options = ["EN", "FR", "ES"];
  return (
    <div className="relative group cursor-pointer flex items-center gap-1 hover:opacity-80 transition-opacity">
      <span className="uppercase">{lang}</span>
      <ChevronDown
        size={12}
        className="opacity-70 group-hover:rotate-180 transition-transform"
      />
      <div className="absolute top-full right-0 mt-1 hidden group-hover:flex flex-col bg-white text-slate-800 shadow-lg border border-slate-200 rounded-lg overflow-hidden z-[100] min-w-[100px] text-left">
        {options.map((opt) => (
          <div
            key={opt}
            onClick={() => setLang(opt)}
            className="px-4 py-2 hover:bg-slate-100 text-xs font-medium !text-slate-800 text-left w-full text-nowrap"
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);
  return (
    <button
      onClick={() => setDark(!dark)}
      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
    >
      {dark ? <Moon size={12} /> : <Sun size={12} />}
      <span>{label || (dark ? "Dark" : "Light")}</span>
    </button>
  );
}

// --- Registry Map --- //

const FEATURE_COMPONENTS: Record<string, React.FC<{ label: string }>> = {
  currency_selector: CurrencySelector,
  language_selector: LanguageSelector,
  theme_toggle: ThemeToggle,
};

export function AnnouncementFeatureRenderer({
  featureKey,
  label,
}: {
  featureKey?: string;
  label: string;
}) {
  if (!featureKey) return <span>{label}</span>;

  const Component = FEATURE_COMPONENTS[featureKey];
  if (!Component) {
    return <span>{label}</span>;
  }

  return <Component label={label} />;
}

export function getDeviceVisibilityClasses(
  visible_on: string[] = ["desktop", "mobile"],
): string {
  if (!visible_on || visible_on.length === 0) return "flex";

  const showDesktop = visible_on.includes("desktop");
  const showMobile = visible_on.includes("mobile");

  if (showDesktop && showMobile) return "flex";
  if (showDesktop && !showMobile) return "hidden sm:flex";
  if (!showDesktop && showMobile) return "flex sm:hidden";
  return "hidden";
}
