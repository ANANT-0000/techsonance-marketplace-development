import React, { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

// Get all valid icon names from lucide-react (deduplicated)
const ALL_ICONS = Object.keys(LucideIcons).filter((key) => {
  return (
    key === key.charAt(0).toUpperCase() + key.slice(1) && // Starts with uppercase (Component)
    !key.endsWith("Icon") && // Prevent duplicated 'HomeIcon'
    !key.startsWith("Lucide") && // Prevent duplicated 'LucideHome'
    key !== "createLucideIcon" &&
    key !== "Icon" &&
    key !== "LucideProps" &&
    key !== "Default"
  );
});

const SEARCH_ALIASES: Record<string, string[]> = {
  home: ["house"],
  security: ["shield", "lock", "key"],
  quality: ["star", "award", "medal", "badge", "check", "thumbs"],
  support: ["headset", "lifebuoy", "phone", "message", "help", "info"],
  warranty: ["shield", "check", "badge", "award", "file"],
  shipping: ["truck", "package", "box", "plane", "send"],
  delivery: ["truck", "package", "box", "plane", "send"],
  replacement: ["refresh", "rotate", "arrow", "exchange"],
  gst: ["file", "receipt", "document", "percent", "landmark", "banknote"],
  cart: ["shopping", "bag", "basket"],
  user: ["person", "account", "profile"],
  star: ["star", "award"],
  web: ["globe", "monitor", "browser"],
};

export function IconPicker({
  value,
  onChange,
  label = "Select Icon"
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    
    // Expand query with aliases if they exist
    const aliases = SEARCH_ALIASES[query] || [];
    
    const matches = ALL_ICONS.filter(icon => {
      const lowerIcon = icon.toLowerCase();
      // Basic search + check if any alias is in the icon name
      if (lowerIcon.includes(query)) return true;
      if (aliases.some(alias => lowerIcon.includes(alias))) return true;
      return false;
    });

    // Sort by relevance
    matches.sort((a, b) => {
      const lowerA = a.toLowerCase();
      const lowerB = b.toLowerCase();
      if (lowerA === query) return -1;
      if (lowerB === query) return 1;
      if (lowerA.startsWith(query) && !lowerB.startsWith(query)) return -1;
      if (lowerB.startsWith(query) && !lowerA.startsWith(query)) return 1;
      return lowerA.length - lowerB.length; // Shorter names (more exact) first
    });

    // Limit to 60 icons to prevent rendering lag
    return matches.slice(0, 60);
  }, [search]);

  // Convert the current value (e.g. 'security' or 'shield') to a valid Lucide icon name to preview it
  const currentIconKey = value ? value.split(/[-_\s]+/).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join("") : "";
  const CurrentIcon = (LucideIcons as any)[currentIconKey] || LucideIcons.HelpCircle;

  return (
    <div className="min-w-0 flex flex-col group">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-slate-900">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 h-[46px] text-[15px] shadow-sm font-normal text-slate-900 hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-[3px] focus:ring-slate-900/10 focus:border-slate-900 transition-all duration-300 ease-out"
          >
            <div className="flex items-center gap-2 truncate">
              <CurrentIcon size={18} className="text-slate-700 shrink-0" />
              <span className="truncate">{value || "Select icon..."}</span>
            </div>
            <LucideIcons.ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search all icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 shadow-none"
            />
          </div>
          <ScrollArea className="h-72 p-2">
            {filteredIcons.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No icons found.</p>
            ) : (
              <div className="grid grid-cols-4 gap-1">
                {filteredIcons.map((iconName) => {
                  const Icon = (LucideIcons as any)[iconName];
                  if (!Icon) return null;
                  return (
                    <Button
                      key={iconName}
                      variant="ghost"
                      className={`h-14 w-full p-1 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-100 ${
                        value?.toLowerCase() === iconName.toLowerCase() ? "bg-accent border-slate-200 border" : "border border-transparent"
                      }`}
                      onClick={() => {
                        onChange(iconName);
                        setOpen(false);
                      }}
                      title={iconName}
                    >
                      <Icon size={20} className="shrink-0 text-slate-700" />
                      <span className="text-[9px] leading-none text-center w-full overflow-hidden text-ellipsis whitespace-nowrap px-0.5 text-slate-500">
                        {iconName}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
            {filteredIcons.length === 60 && (
              <p className="text-center text-[10px] text-slate-400 mt-2 mb-1">
                Showing top 60 results. Type to refine search.
              </p>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
