import React, { useEffect } from "react";
import { BRAND_LOGO, ProfileSidebarLink } from "@/constants";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useThemeData } from "@/hooks/useThemeData";
import { logOut } from "@/lib/features/auth/authSlice";
import { ChevronRight, X } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function MobileSideDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentPath = usePathname();
  const { themeData } = useThemeData();

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const logoUrl = themeData.logo_url || themeData.logo_dark_url || BRAND_LOGO;

  const handleLinkClick = (path: string) => {
    onClose();
    if (path === "/logout") {
      dispatch(logOut());
      router.push("/");
    } else {
      router.push(path);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 flex flex-col bg-card border-r border-border shadow-2xl overflow-hidden [&>button]:hidden gap-0"
      >
        <SheetHeader className="text-left px-5 py-4 border-b border-border flex flex-row items-center justify-between shrink-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Link href="/" className="flex flex-col text-left" onClick={onClose}>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="brand logo"
                className="h-8 object-contain rounded-2xl"
              />
            )}
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 hide-scrollbar">
          {ProfileSidebarLink.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  link.isDanger
                    ? "text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                    : isActive
                      ? "bg-rose-800 dark:bg-rose-900 text-white shadow-sm"
                      : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <DynamicIcon
                    name={link.icon as IconName}
                    size={16}
                    className={
                      link.isDanger
                        ? "text-rose-600"
                        : isActive
                          ? "text-white"
                          : "text-muted-foreground"
                    }
                  />
                  <span>{link.name}</span>
                </div>
                <ChevronRight
                  size={12}
                  className={
                    link.isDanger
                      ? "text-rose-500"
                      : isActive
                        ? "text-white"
                        : "text-muted-foreground/50"
                  }
                />
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
