import { Heart, ShoppingCart, User } from "lucide-react";
import { CmsDataKey } from "./cms.constant";
import { CMS_NAVBAR_TAB_TEXT, CMS_FILTERS_TAB_TEXT } from "./vendorText";
import {
  NavMenuLogoAlignment,
  NavMenuLinksAlignment,
  NavMenuPosition,
  FilterRuleType,
  FilterRuleOperator,
  type UpsertNavMenuPayload,
} from "@/utils/Types";

export const getCategorySelectConfigs = (
  data: any,
  set: (k: string, v: any) => void,
) => [
  {
    label: "Desktop Card Aspect Ratio",
    value: data?.[CmsDataKey.CATEGORY_ASPECT_RATIO_DESKTOP] || "aspect-[3/4]",
    onChange: (v: string) => set(CmsDataKey.CATEGORY_ASPECT_RATIO_DESKTOP, v),
    options: CATEGORY_ASPECT_RATIO_OPTIONS,
  },
  {
    label: "Mobile Card Aspect Ratio",
    value: data?.[CmsDataKey.CATEGORY_ASPECT_RATIO_MOBILE] || "aspect-square",
    onChange: (v: string) => set(CmsDataKey.CATEGORY_ASPECT_RATIO_MOBILE, v),
    options: CATEGORY_ASPECT_RATIO_OPTIONS,
  },
  {
    label: "Desktop Card Border Radius",
    value: data?.[CmsDataKey.CATEGORY_BORDER_RADIUS_DESKTOP] || "rounded-2xl",
    onChange: (v: string) => set(CmsDataKey.CATEGORY_BORDER_RADIUS_DESKTOP, v),
    options: CATEGORY_BORDER_RADIUS_OPTIONS,
  },
  {
    label: "Mobile Card Border Radius",
    value: data?.[CmsDataKey.CATEGORY_BORDER_RADIUS_MOBILE] || "rounded-2xl",
    onChange: (v: string) => set(CmsDataKey.CATEGORY_BORDER_RADIUS_MOBILE, v),
    options: CATEGORY_BORDER_RADIUS_OPTIONS,
  },
];

export const CMS_NAVBAR_TEXT_SIZES = [
  {
    value: "text-[10px] sm:text-[11px]",
    label: CMS_NAVBAR_TAB_TEXT.TEXT_SIZE_XS,
  },
  { value: "text-[11px] sm:text-xs", label: CMS_NAVBAR_TAB_TEXT.TEXT_SIZE_SM },
  { value: "text-xs sm:text-sm", label: CMS_NAVBAR_TAB_TEXT.TEXT_SIZE_MD },
  { value: "text-sm sm:text-base", label: CMS_NAVBAR_TAB_TEXT.TEXT_SIZE_LG },
];

export const CMS_NAVBAR_ALIGNMENTS = [
  { value: "left", label: CMS_NAVBAR_TAB_TEXT.ALIGN_LEFT_OPT },
  { value: "center", label: CMS_NAVBAR_TAB_TEXT.ALIGN_CENTER_OPT },
  { value: "right", label: CMS_NAVBAR_TAB_TEXT.ALIGN_RIGHT_OPT },
];

export const ALIGNMENT_OPTIONS = [
  { value: NavMenuLogoAlignment.LEFT, label: CMS_NAVBAR_TAB_TEXT.ALIGN_LEFT },
  {
    value: NavMenuLogoAlignment.CENTER,
    label: CMS_NAVBAR_TAB_TEXT.ALIGN_CENTER,
  },
];

export const LINKS_ALIGNMENT_OPTIONS = [
  { value: NavMenuLinksAlignment.LEFT, label: CMS_NAVBAR_TAB_TEXT.ALIGN_LEFT },
  {
    value: NavMenuLinksAlignment.CENTER,
    label: CMS_NAVBAR_TAB_TEXT.ALIGN_CENTER,
  },
  {
    value: NavMenuLinksAlignment.RIGHT,
    label: CMS_NAVBAR_TAB_TEXT.ALIGN_RIGHT,
  },
];

export const POSITION_OPTIONS = [
  { value: NavMenuPosition.STICKY, label: CMS_NAVBAR_TAB_TEXT.STICKY },
  { value: NavMenuPosition.RELATIVE, label: CMS_NAVBAR_TAB_TEXT.STATIC },
];

export const CMS_NAVBAR_ITEM_TYPES = [
  { value: "text", label: CMS_NAVBAR_TAB_TEXT.TYPES.TEXT },
  { value: "link", label: CMS_NAVBAR_TAB_TEXT.TYPES.LINK },
  { value: "feature", label: CMS_NAVBAR_TAB_TEXT.TYPES.FEATURE },
];
export const CATEGORY_ASPECT_RATIO_OPTIONS = [
  { value: "aspect-[3/4]", label: "Portrait (3:4)" },
  { value: "aspect-square", label: "Square (1:1)" },
  { value: "aspect-[4/3]", label: "Landscape (4:3)" },
  { value: "aspect-[16/9]", label: "Wide (16:9)" },
  { value: "aspect-auto", label: "Auto" },
];

export const CATEGORY_BORDER_RADIUS_OPTIONS = [
  { value: "rounded-none", label: "None (Square)" },
  { value: "rounded-md", label: "Small" },
  { value: "rounded-2xl", label: "Large" },
  { value: "rounded-full", label: "Pill / Circle" },
];

export const CATEGORY_SELECT_CONFIGS = [
  {
    label: "Desktop Card Aspect Ratio",
    dataKey: CmsDataKey.CATEGORY_ASPECT_RATIO_DESKTOP,
    default: "aspect-[3/4]",
    options: CATEGORY_ASPECT_RATIO_OPTIONS,
  },
  {
    label: "Mobile Card Aspect Ratio",
    dataKey: CmsDataKey.CATEGORY_ASPECT_RATIO_MOBILE,
    default: "aspect-square",
    options: CATEGORY_ASPECT_RATIO_OPTIONS,
  },
  {
    label: "Desktop Card Border Radius",
    dataKey: CmsDataKey.CATEGORY_BORDER_RADIUS_DESKTOP,
    default: "rounded-2xl",
    options: CATEGORY_BORDER_RADIUS_OPTIONS,
  },
  {
    label: "Mobile Card Border Radius",
    dataKey: CmsDataKey.CATEGORY_BORDER_RADIUS_MOBILE,
    default: "rounded-2xl",
    options: CATEGORY_BORDER_RADIUS_OPTIONS,
  },
];

export const CMS_FILTER_LOGICAL_OPERATORS = [
  { value: "AND", label: CMS_FILTERS_TAB_TEXT.AND },
  { value: "OR", label: CMS_FILTERS_TAB_TEXT.OR },
];

export const CMS_FILTER_FIELDS = [
  {
    value: FilterRuleType.CATEGORY,
    label: CMS_FILTERS_TAB_TEXT.FIELDS.CATEGORY,
  },
  { value: FilterRuleType.PRICE, label: CMS_FILTERS_TAB_TEXT.FIELDS.PRICE },
  { value: FilterRuleType.CREATED_AT, label: CMS_FILTERS_TAB_TEXT.FIELDS.DATE },
  {
    value: FilterRuleType.DISCOUNT,
    label: CMS_FILTERS_TAB_TEXT.FIELDS.DISCOUNT,
  },
  { value: FilterRuleType.SEARCH, label: CMS_FILTERS_TAB_TEXT.FIELDS.SEARCH },
];

export const CMS_FILTER_OPS_CATEGORY = [
  { value: FilterRuleOperator.IN, label: CMS_FILTERS_TAB_TEXT.OPS.IN },
  { value: FilterRuleOperator.EQ, label: CMS_FILTERS_TAB_TEXT.OPS.EQ },
];

export const CMS_FILTER_OPS_PRICE = [
  { value: FilterRuleOperator.LT, label: CMS_FILTERS_TAB_TEXT.OPS.LT },
  { value: FilterRuleOperator.LTE, label: CMS_FILTERS_TAB_TEXT.OPS.LTE },
  { value: FilterRuleOperator.GT, label: CMS_FILTERS_TAB_TEXT.OPS.GT },
  { value: FilterRuleOperator.GTE, label: CMS_FILTERS_TAB_TEXT.OPS.GTE },
  { value: FilterRuleOperator.EQ, label: CMS_FILTERS_TAB_TEXT.OPS.EQUALS },
];

export const CMS_FILTER_OPS_SEARCH = [
  {
    value: FilterRuleOperator.CONTAINS,
    label: CMS_FILTERS_TAB_TEXT.OPS.CONTAINS,
  },
];

export const CMS_FILTER_OPS_DATE = [
  {
    value: FilterRuleOperator.WITHIN_DAYS,
    label: CMS_FILTERS_TAB_TEXT.OPS.WITHIN,
  },
  {
    value: FilterRuleOperator.OLDER_THAN_DAYS,
    label: CMS_FILTERS_TAB_TEXT.OPS.OLDER,
  },
];
export const UTILITY_ICONS = [
  {
    id: "account",
    icon: User,
    label: CMS_NAVBAR_TAB_TEXT.ACCOUNT,
    stateKey: "show_account" as keyof UpsertNavMenuPayload,
  },
  {
    id: "wishlist",
    icon: Heart,
    label: CMS_NAVBAR_TAB_TEXT.WISHLIST,
    stateKey: "show_wishlist" as keyof UpsertNavMenuPayload,
  },
  {
    id: "cart",
    icon: ShoppingCart,
    label: CMS_NAVBAR_TAB_TEXT.CART,
    stateKey: "show_cart" as keyof UpsertNavMenuPayload,
  },
];

export const TRUST_STRIP_LAYOUT_OPTIONS = [
  { value: "1", label: "1 Column (List view)" },
  { value: "2", label: "2 Columns (e.g. 2x2 Grid for 4 badges)" },
  { value: "3", label: "3 Columns" },
  { value: "4", label: "4 Columns (Default 1x4 Grid)" },
  { value: "5", label: "5 Columns" },
  { value: "6", label: "6 Columns" },
];
