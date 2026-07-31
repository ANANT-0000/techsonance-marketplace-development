"use client";
import { User, VendorUser } from "@/constants";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { logOut } from "@/lib/features/auth/authSlice";
import { SIDEBAR_FOOTER_TEXT } from "@/constants/commonText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDown, LogOut, Mail, Building } from "lucide-react";

export const UserMenu = ({
  user,
  role,
  expanded,
}: {
  user: Partial<User | VendorUser>;
  role: string;
  expanded: boolean;
}) => {
  const dispatch = useAppDispatch();
  const { isMobile, toggleSidebar } = useSidebar();

  const onLogout = () => {
    dispatch(logOut());
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-transparent hover:bg-white/[0.05] hover:text-white"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2ecc8a] to-[#1aab6d] text-white font-bold relative">
                {user.first_name?.[0] || "?"}
                {user.last_name?.[0] || ""}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-[2.5px] border-[#0f1117]" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight text-white">
                <span className="truncate font-semibold">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : "Unknown"}
                </span>
                <span className="truncate text-xs text-white/60">{role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-white/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-[#151821] border-white/[0.08] text-white"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 border-b border-white/[0.06]">
                <div className="h-10 w-10 shrink-0 rounded-[12px] bg-gradient-to-br from-[#2ecc8a] to-[#1aab6d] flex items-center justify-center text-[13px] font-bold text-white shadow-sm">
                  {user.first_name?.[0] || "?"}
                  {user.last_name?.[0] || ""}
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-white truncate leading-snug">
                    {user.first_name ? `${user.first_name} ${user.last_name || ""}` : "Unknown User"}
                  </p>
                  <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 mt-0.5 font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {SIDEBAR_FOOTER_TEXT.ACTIVE_WORKSPACE}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <div className="px-2 py-2">
              {user.email && (
                <div className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-white/70">
                  <Mail className="size-3.5 opacity-60" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {user.company_id && (
                <div className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-white/70">
                  <Building className="size-3.5 opacity-60" />
                  <span className="font-mono text-[11px] tracking-wide truncate">
                    {user.company_id}
                  </span>
                </div>
              )}
              {!user.company_id && (
                <div className="mt-1.5 p-2.5 rounded-[10px] bg-amber-500/10 border border-amber-500/20 flex gap-2.5 items-start">
                  <div className="flex-1">
                    <p className="text-[11.5px] font-medium text-amber-300 leading-tight mb-1">Workspace ID missing</p>
                    <p className="text-[10.5px] text-amber-200/70 leading-snug">Your session may be incomplete. Please sign out and log in again.</p>
                  </div>
                </div>
              )}
            </div>

            <DropdownMenuSeparator className="bg-white/[0.1]" />

            <DropdownMenuItem 
              onClick={onLogout}
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10 m-1 cursor-pointer"
            >
              <LogOut className="mr-2 size-4 opacity-80" />
              {SIDEBAR_FOOTER_TEXT.SIGN_OUT}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
