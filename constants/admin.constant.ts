import { NavLinkType } from "@/utils/Types";

export const ADMIN_NAV_LINKS: NavLinkType[] = [
  { Dashboard: null, icon: "layout-dashboard", section: "Main" },
  { "Role Management": "role", icon: "user-cog", section: "Main" },
  { Vendor: "vendorManagement", icon: "building", section: "Main" },
  { Subscriptions: "subscriptions", icon: "credit-card", section: "Main" },
  {
    "Access Denials": "subscriptions/denials",
    icon: "shield-off",
    section: "Main",
  },
  { Analytics: "auditLog", icon: "chart-column-stacked", section: "Main" },
  { "Landing Page CMS": "cms/landing-page", icon: "monitor", section: "Main" },
  { "Site Maps": "site-maps", icon: "map", section: "Main" },
  { "Support Tickets": "supportTickets", icon: "headset", section: "Support" },
  { Settings: "settings", icon: "settings", divider: true },
];
