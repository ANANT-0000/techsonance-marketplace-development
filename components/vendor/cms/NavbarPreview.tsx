"use client";

import React, { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { AnnouncementItem } from "@/utils/Types";
import { AnnouncementFeatureRenderer } from "@/components/customer/features/AnnouncementFeatureRegistry";

interface NavbarPreviewProps {
  itemsLeft: AnnouncementItem[];
  itemsRight: AnnouncementItem[];
  bgColor: string;
  textColor: string;
  textSize?: string;
  mobileAlignment?: string;
}

export function NavbarPreview({ itemsLeft, itemsRight, bgColor, textColor, textSize, mobileAlignment }: NavbarPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // Filtering logic: Only render items that include the current device in their visible_on array
  // We default to true if visible_on is missing (for legacy data)
  const activeLeft = itemsLeft.filter((item) => !item.visible_on || item.visible_on.includes(device));
  const activeRight = itemsRight.filter((item) => !item.visible_on || item.visible_on.includes(device));

  // We use bg-black/10 or bg-white/20 for highlighting to handle any background color.
  // Using a universal contrast highlight layer.
  const highlightClass = "ring-2 ring-white/50 ring-offset-1 rounded-sm px-1 bg-black/10 backdrop-brightness-75";

  return (
    <div className="flex flex-col gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50">
      {/* Device Toggle Switcher */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Live Preview</span>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`p-1.5 rounded-md transition-colors ${device === "desktop" ? "bg-slate-100 text-theme-primary" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Monitor size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`p-1.5 rounded-md transition-colors ${device === "mobile" ? "bg-slate-100 text-theme-primary" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Smartphone size={16} />
          </button>
        </div>
      </div>

      {/* Simulation Canvas */}
      <div className="flex justify-center w-full overflow-hidden bg-slate-200/50 rounded-lg p-4">
        <div
          className={`transition-all duration-300 ease-in-out border border-slate-300 rounded shadow-sm overflow-hidden bg-white ${
            device === "mobile" ? "w-[375px]" : "w-full max-w-4xl"
          }`}
        >
          {/* Mock Announcement Bar */}
          <div
            className={`w-full font-medium px-4 py-2 flex ${
              device === "mobile" 
                ? `flex-col gap-2 ${mobileAlignment === "left" ? "items-start" : mobileAlignment === "right" ? "items-end" : "items-center"}` 
                : "flex-row items-center justify-between"
            } ${textSize || "text-[11px] sm:text-xs"}`}
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {/* Left Items */}
            <div className={`flex items-center gap-3 ${device === "mobile" && mobileAlignment === "left" ? "justify-start w-full" : device === "mobile" && mobileAlignment === "right" ? "justify-end w-full" : device === "mobile" ? "justify-center flex-wrap" : ""}`}>
              {activeLeft.map((item) => (
                <div key={item.id} className={item.is_highlighted ? highlightClass : ""}>
                  {item.type === "feature" ? (
                    <AnnouncementFeatureRenderer featureKey={item.feature_key} label={item.label} />
                  ) : item.type === "link" ? (
                    <span className="hover:opacity-80 transition-opacity underline">{item.label}</span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Right Items */}
            <div className={`flex items-center gap-4 ${device === "mobile" && mobileAlignment === "left" ? "justify-start w-full" : device === "mobile" && mobileAlignment === "right" ? "justify-end w-full" : device === "mobile" ? "justify-center flex-wrap" : ""}`}>
              {activeRight.map((item) => (
                <div key={item.id} className={item.is_highlighted ? highlightClass : ""}>
                  {item.type === "feature" ? (
                    <AnnouncementFeatureRenderer featureKey={item.feature_key} label={item.label} />
                  ) : item.type === "link" ? (
                    <span className="hover:opacity-80 transition-opacity underline">{item.label}</span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Dummy Navbar Body for context */}
          <div className="h-12 bg-white flex items-center px-4 border-b border-slate-100">
             <div className="w-24 h-4 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
