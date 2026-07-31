"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useAppSelector } from "@/hooks/reduxHooks";
import { RootState } from "@/lib/store";
import { NavLinkType } from "@/utils/Types";
import { UserMenu } from "./SidebarFooter";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import React, { useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const RESERVED_KEYS = new Set(["icon", "section", "divider"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLabel(linkObj: NavLinkType): string {
  return Object.keys(linkObj).find((k) => !RESERVED_KEYS.has(k)) ?? "";
}

function getRouteValue(linkObj: NavLinkType): string | null {
  const key = getLabel(linkObj);
  const val = linkObj[key];
  return val === undefined || val === null ? null : String(val);
}

function getHref(basePath: string, linkObj: NavLinkType): string {
  const val = getRouteValue(linkObj);
  return val == null ? basePath : `${basePath}/${val}`;
}

function getIcon(linkObj: NavLinkType): IconName {
  return (linkObj.icon as IconName) ?? "circle";
}

function getSection(linkObj: NavLinkType): string | undefined {
  return linkObj.section as string | undefined;
}

function hasDivider(linkObj: NavLinkType): boolean {
  return !!linkObj.divider;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type SidebarProps = {
  basePath?: string;
  NAV_LINKS: NavLinkType[];
  id?: string | number;
  user?: {
    name: string;
    role: string;
    initials: string;
  };
};

export function Sidebar({ basePath = "", NAV_LINKS }: SidebarProps) {
  const { role, user } = useAppSelector((state: RootState) => state.auth);
  const path = usePathname();
  const { state, toggleSidebar, setOpen } = useSidebar();
  const expanded = state === "expanded";
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      // Close if click is outside Sidebar AND outside InnerSideBar
      if (
        expanded &&
        !target.closest(".inner_sidebar") &&
        !target.closest('[data-sidebar="sidebar"]') &&
        !target.closest('[data-slot="sidebar-gap"]')
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, setOpen]);

  // Build render list with section headers inserted
  type RenderItem =
    | { kind: "section"; label: string }
    | { kind: "divider" }
    | { kind: "link"; linkObj: NavLinkType };

  const renderList: RenderItem[] = [];
  let lastSection = "";

  NAV_LINKS.forEach((linkObj) => {
    if (hasDivider(linkObj)) {
      renderList.push({ kind: "divider" });
    }

    const section = getSection(linkObj);
    if (section && section !== lastSection) {
      renderList.push({ kind: "section", label: section });
      lastSection = section;
    }

    renderList.push({ kind: "link", linkObj });
  });

  return (
    <ShadcnSidebar 
      collapsible="icon" 
      onClick={() => {
        if (!expanded) {
          toggleSidebar();
        }
      }}
      className={`dark border-r border-white/[0.07] overflow-hidden ${!expanded ? "cursor-pointer" : ""}`}
    >
      <SidebarHeader className="py-4 border-b border-white/[0.07]">
        <button
          className={`flex items-center overflow-hidden w-full transition-all ${expanded ? "justify-between" : "justify-center"}`}
          onClick={toggleSidebar}
        >
          {expanded && (
            <div className="h-[30px] w-[30px] shrink-0 rounded-[10px] bg-gradient-to-br from-[#4f8ef7] to-[#7c5cfc] flex items-center justify-center text-theme-xxs font-bold text-white shadow-md shadow-indigo-500/20">
              TS
            </div>
          )}
          <span
            className={`block rounded-[10px] p-1 text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-all duration-200`}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <DynamicIcon
              name={!expanded ? "panel-left-open" : "panel-left-close"}
              size={20}
            />
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar">
        {renderList.length === 0 ? (
          <div className="px-3 py-8 text-center mt-4">
            <div className="flex flex-col items-center gap-3 opacity-60">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                <DynamicIcon name="layout-dashboard" size={20} className="text-white/50" />
              </div>
              {expanded && (
                <p className="text-theme-caption text-white/60 leading-relaxed font-medium px-2">
                  Your navigation is empty.<br />Add modules to get started.
                </p>
              )}
            </div>
          </div>
        ) : (
          <SidebarGroup>
            <SidebarMenu>
              {renderList.map((item, i) => {
                if (item.kind === "divider") {
                  return <li key={`div-${i}`} className="mx-1 my-1.5 h-px bg-white/[0.07]" aria-hidden="true" />;
                }
                
                if (item.kind === "section") {
                  return (
                    <SidebarGroupLabel key={`sec-${i}`} className="text-white/85 mt-4 text-theme-tiny font-semibold uppercase tracking-[0.08em]">
                      {item.label}
                    </SidebarGroupLabel>
                  );
                }

                const { linkObj } = item;
                const label = getLabel(linkObj);
                const icon = getIcon(linkObj);
                const href = getHref(basePath, linkObj);
                const isActive = href.length > 0 && (path === href || path.startsWith(href + "/"));

                return (
                  <SidebarMenuItem key={`link-${i}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className={`relative flex items-center h-auto overflow-hidden py-3 select-none rounded-[10px] transition-all duration-200 ease-out ${
                        isActive
                          ? "bg-[#4f8ef7]/[0.12] text-[#4f8ef7] hover:bg-[#4f8ef7]/[0.18] hover:text-[#4f8ef7]"
                          : "text-white/60 hover:bg-white/[0.06] hover:text-white/95"
                      }`}
                    >
                      <Link href={href}>
                        {isActive && <span className="absolute left-0 top-[22%] h-[56%] w-[3px] rounded-r-[3px] bg-[#4f8ef7]" />}
                        <DynamicIcon name={icon} />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.07] pt-2 pb-2">
        {user ? (
          <UserMenu user={user} role={role} expanded={expanded} />
        ) : (
          expanded ? (
            <div className="px-3">
              <div className="p-3.5 bg-red-500/[0.08] border border-red-500/20 rounded-[14px] text-center shadow-sm">
                <p className="text-[13px] font-semibold text-red-400/90 mb-1.5">Session Expired</p>
                <p className="text-[11.5px] text-white/60 mb-3.5 leading-snug">Please log in again to securely continue your session.</p>
                <Link href="/vendor/login" className="inline-flex w-full justify-center items-center gap-2 rounded-[10px] bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-[12.5px] font-medium text-red-300 transition-all duration-200 border border-red-500/20 shadow-sm hover:shadow-md hover:border-red-500/30">
                  Log in
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/vendor/login" className="mx-auto flex h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-red-500/[0.08] border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:border-red-500/30 transition-all duration-200 shadow-sm hover:shadow-md" title="Session Expired - Log in">
              <DynamicIcon name="log-in" size={20} />
            </Link>
          )
        )}
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
