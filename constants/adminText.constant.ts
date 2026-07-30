export const ASSIGN_SECTION_TEXT = {
  ASSIGN_PERMISSION_TITLE: "Assign Permission to Role",
  SELECT_ROLE: "Select role",
  SELECT_PERMISSION: "Select permission",
  ASSIGNING: "Assigning...",
  ASSIGN: "Assign",
  CURRENT_ASSIGNMENTS: "Current Assignments",
  NO_PERMISSIONS_ASSIGNED: "No permissions assigned",
  NO_ASSIGNMENTS_FOUND: "No assignments found",
};

export const DASHBOARD_CHART_TEXT = {
  WEEK_1: "Week 1",
  WEEK_2: "Week 2",
  WEEK_3: "Week 3",
  WEEK_4: "Week 4",
  JANUARY: "January",
  FEBRUARY: "February",
  MARCH: "March",
  APRIL: "April",
  MAY: "May",
  JUNE: "June",
  VENDORS: "Vendors",
  VENDOR_GROWTH: "Vendor Growth",
  LAST_30_DAYS: "Last 30 days",
  LAST_6_MONTHS: "Last 6 months",
  LAST_1_YEAR: "Last 1 year",
};

export const DOCUMENT_CARD_TEXT = {
  PDF: "PDF",
  FILE: "File",
};

export const DOCUMENT_MODAL_TEXT = {
  OPEN_ORIGINAL: "Open Original",
  PREVIEW_NOT_AVAILABLE: "Preview not available for this file type.",
  OPEN_FILE: "Open file ↗",
};

export const DOCUMENT_SECTION_TEXT = {
  NO_DOCUMENTS_SUBMITTED: "No documents submitted",
  SUBMITTED_DOCUMENTS: "Submitted Documents",
  CLICK_TO_PREVIEW: "Click any document to preview",
};

export const FORM_NAV_ROW_TEXT = {
  PREVIOUS: "Previous",
  CONTINUE: "Continue",
};

export const NAVBAR_TEXT = {
  SEARCH_SYSTEM: "Search system...",
  ACTIVE_WORKSPACE: "Active workspace",
  LOGOUT: "Logout",
};

export const PERMISSIONS_TEXT = {
  DELETE: "Delete",
  PERMISSIONS_TITLE: "Permissions",
  ADD: "Add",
  LOADING: "Loading permissions...",
  NO_PERMISSIONS_YET: "No permissions yet.",
};

export const ROLES_TEXT = {
  DELETE: "Delete",
  ROLES_TITLE: "Roles",
  ADD: "Add",
  LOADING: "Loading roles...",
  NO_ROLES_FOUND: "No roles found. Start by adding one!",
};

export const VENDOR_CREATED_TOAST_TEXT = {
  TITLE: "Vendor Created!",
  DESCRIPTION_SUFFIX:
    " has been registered. Credentials will be sent to their email after review.",
  SUCCESS_MSG: "Registration submitted successfully",
};

export const ADMIN_LOGIN_TEXT = {
  STEP_VALIDATING: "Validating credentials",
  STEP_PERMISSIONS: "Checking access permissions",
  STEP_INITIALISING: "Initialising admin session",
  TITLE: "System Administration",
  SUBTITLE: "Restricted access — authorised personnel only",
  ID_LABEL: "Admin ID / Email",
  ID_PLACEHOLDER: "admin@company.com",
  PASS_LABEL: "Secure Key / Password",
  HIDE_PASS: "Hide password",
  SHOW_PASS: "Show password",
  BTN_AUTH: "→ Authenticate",
  MONITOR_MSG: "All access attempts are logged and monitored",
  LOADING_TITLE: "Verifying identity",
  LOADING_SUBTITLE: "Please wait…",
  SUCCESS_TITLE: "Access granted",
  SUCCESS_SUBTITLE: "Identity verified. Taking you to the admin panel…",
  REDIRECT_PREFIX: "Redirecting in ",
  REDIRECT_SUFFIX: "s",
  ERROR_TITLE: "Access denied",
  ERROR_DEFAULT_MSG: "Invalid credentials or insufficient permissions.",
  NETWORK_ERROR_MSG: "Network error. Please try again.",
  STORAGE_ERROR_MSG: "Please enable local storage to sign in.",
  BTN_TRY_AGAIN: "Try again",
  BTN_GO_NOW: "Go now",
};

export const SUBSCRIBATION_TEXT = {
  PAGE_TITLE: "Plan & Subscription Workspace",
  PAGE_DESCRIPTION:
    "Configure plan pricing tier options, access features, and manage active vendor subscription lifecycles.",
  SECTION_CMS_TITLE: "Plan Pricing & Features",
  SECTION_CMS_SUBTITLE:
    "Configure standard plans, pricing levels, and access features.",
  SECTION_LIFECYCLE_TITLE: "Active Vendor Subscriptions",
  SECTION_LIFECYCLE_SUBTITLE:
    "Track, upgrade, extend, or cancel vendor subscription periods.",

  SEARCH_PLACEHOLDER: "Search by company name or store link...",
  NEW_PLAN_PLACEHOLDER: "Plan name (e.g., starter, pro)...",
  FILTER_STATUS_LABEL: "Filter by Status",
  FILTER_ALL_STATUS: "All Statuses",

  TABLE_HEADERS: {
    COMPANY_NAME: "Company Name",
    DOMAIN: "Store Domain",
    CURRENT_PLAN: "Current Plan",
    STATUS: "Subscription Status",
    TRIAL_ENDS: "Trial Ends",
    PERIOD_ENDS: "Period Ends",
    DATE_CREATED: "Subscription Start Date",
    ACTIONS: "Actions",
  },

  STATUS_LABELS: {
    trial: "Trial Mode",
    active: "Active",
    expired: "Expired",
    cancelled: "Cancelled",
    grace_period: "Grace Period",
  },

  ACTIONS: {
    MANAGE: "Manage",
    VIEW: "View Details",
    REFRESH: "Refresh",
    SAVING: "Saving changes...",
    LOADING: "Loading data...",
    NO_DATA: "No vendor subscriptions found matching your filters.",
    EDIT_TITLE: "Manage Vendor Subscription",
    EDIT_DESC:
      "Upgrade or downgrade plan levels, adjust status, and change trial or billing cycle dates.",
    COMPANY_LABEL: "Company",
    DOMAIN_LABEL: "Store Domain",
    PLAN_LABEL: "Subscription Plan",
    STATUS_LABEL: "Subscription Status",
    TRIAL_START: "Trial Start Date & Time",
    TRIAL_END: "Trial End Date & Time",
    PERIOD_START: "Billing Cycle Start",
    PERIOD_END: "Billing Cycle End",
    GRACE_END: "Grace Period End Date & Time",
    CANCELLED_AT: "Cancellation Date & Time",
    SAVE_BTN: "Save Changes",
    CANCEL_BTN: "Cancel",
    SUCCESS_UPDATE: "Vendor subscription updated successfully!",
    FAILED_UPDATE: "Failed to update vendor subscription.",
    FETCH_ERROR: "Failed to load vendor subscriptions.",
    FEATURE_KEY_LABEL: "Feature Name / Identifier",
    FEATURE_KEY_PLACEHOLDER: "e.g., maximum-products-allowed",
    PLAN_DESC_LABEL: "Plan Description",
    PLAN_DESC_SUBTITLE:
      "A short, merchant-friendly summary displayed on the landing page pricing cards.",
    PLAN_DESC_PLACEHOLDER:
      "e.g. For individuals and small businesses getting started with their own branded store.",
    PREVIEW_TITLE: "Storefront Card Preview (Approximate)",
  },
  CMS_EDITOR: {
    UNSAVED_CHANGES: "Unsaved changes",
    SAVE_DRAFT_BTN: "Save Draft",
    PUBLISH_LIVE_BTN: "Publish Live",
    UNPUBLISH_BTN: "Unpublish",
    CONFLICT_BANNER_TEXT:
      "Another admin has updated this plan. Please discard your changes and reload to see the latest version.",
    DISCARD_RELOAD_BTN: "Discard & Reload",
    PUBLISH_ERROR_PREFIX:
      "Cannot publish. The following feature keys are undefined:",
    DISMISS_BTN: "Dismiss",
    PRICING_TITLE: "Pricing Tier Intervals",
    ADD_PRICE_BTN: "Add Price",
    LABEL_INTERVAL: "Interval",
    LABEL_CURRENCY: "Currency",
    LABEL_AMOUNT: "Amount",
    NO_PRICES: "No prices yet — add at least one before saving.",
    FEATURES_TITLE: "Feature Flags & Limits",
    FEATURES_SUBTITLE: "Order here is the order they appear on cards.",
    ADD_FEATURE_BTN: "Add Feature",
    LABEL_FEATURE_KEY: "Feature Key",
    LABEL_BEHAVIOR: "Behavior",
    LABEL_VALUE: "Value",
    NO_FEATURES: "No feature flags on this plan yet.",
    PREVIEW_NO_FEATURES: "No visible feature flags yet.",
    TOGGLE_ENABLED: "Yes (Enabled)",
    TOGGLE_DISABLED: "No (Disabled)",
    BEHAVIOR_TOGGLE: "Toggle Switch (Yes/No)",
    BEHAVIOR_TEXT: "Text / Limit Value",
    FEATURE_VALUE_PLACEHOLDER: "e.g., 50, Unlimited, Premium...",
    PREVIEW_DEFAULT_DESC: "For growing businesses.",
    MONTHLY_LABEL: "/mo",
    BILLED_ANNUALLY_LABEL: "billed annually",
  },
  CATALOG: {
    TITLE: "Features Catalog",
    SUBTITLE:
      "Manage global feature keys, display names, and value types enforced by the quota system.",
    ADD_BTN: "Add Feature Definition",
    TABLE_HEADERS: {
      KEY: "Feature Key / Identifier",
      DISPLAY_NAME: "Display Name",
      VALUE_TYPE: "Value Type",
      ENFORCEMENT: "Enforcement Mode",
      STATUS: "Status",
      ACTIONS: "Actions",
    },
    MODAL_CREATE_TITLE: "Create Feature Definition",
    MODAL_EDIT_TITLE: "Edit Feature Definition",
    LABEL_KEY: "Feature Key (e.g. max_products)",
    LABEL_DISPLAY: "Display Name (e.g. Maximum Products Allowed)",
    LABEL_DESC: "Description",
    LABEL_VALUE_TYPE: "Value Type",
    LABEL_ENFORCEMENT: "Enforcement Mode",
    LABEL_ACTIVE: "Is Active / Enforced",
    PLACEHOLDER_KEY: "e.g., max_products_allowed",
    PLACEHOLDER_DISPLAY: "e.g., Maximum Products Allowed",
    PLACEHOLDER_DESC: "Describe what this feature limits or enables...",
    SAVE_BTN: "Save Feature",
    CANCEL_BTN: "Cancel",
    DELETE_BTN: "Delete",
    CONFIRM_DELETE:
      "Are you sure you want to delete this feature definition? This will remove all associated plan feature limits.",
    SUCCESS_CREATE: "Feature definition created successfully!",
    FAILED_CREATE: "Failed to create feature definition.",
    SUCCESS_UPDATE: "Feature definition updated successfully!",
    FAILED_UPDATE: "Failed to update feature definition.",
    SUCCESS_DELETE: "Feature definition deleted successfully!",
    FAILED_DELETE: "Failed to delete feature definition.",
    FETCH_ERROR: "Failed to load feature definitions.",
  },
};
export const SITE_MAPS_TEXT = {
  PAGE_TITLE: "Router Mappings",
  PAGE_DESCRIPTION: "Manage dynamic routing prefixes across the application.",
  LOADING_TEXT: "Loading router mappings...",
  ERROR_TITLE: "Failed to load mappings",
  ERROR_DESC_DEFAULT:
    "There was an unexpected issue loading your router mappings.",
  TRY_AGAIN: "Try Again",
  NO_MAPPINGS_TITLE: "No router mappings found",
  NO_MAPPINGS_DESC:
    "You don't have any custom routes configured yet. Add your first mapping to get started with custom paths.",
  ADD_FIRST_MAPPING: "Add First Mapping",
  ADD_MAPPING: "Add Mapping",
  SYSTEM_TAG: "System",
  EMPTY_QUERY_PARAM: "—",
  CONFIRM_DELETE: "Are you sure you want to delete the mapping for ",
  SUCCESS_CREATE: "Router mapping created successfully.",
  SUCCESS_UPDATE: "Router mapping updated successfully.",
  SUCCESS_DELETE: "Router mapping deleted successfully.",
  ERROR_CREATE: "Failed to create router mapping.",
  ERROR_UPDATE: "Failed to update router mapping.",
  ERROR_DELETE: "Failed to delete router mapping.",
  MODAL_EDIT_TITLE: "Edit Router Mapping",
  MODAL_ADD_TITLE: "Add Router Mapping",
  MODAL_EDIT_DESC: "Modify the properties of this mapping.",
  MODAL_ADD_DESC: "Create a new site route mapped to your storefront.",
  MODAL_SYSTEM_WARNING:
    "This is a system mapping. Its unique Key cannot be modified to prevent breaking core features, but you can change its label and path.",
  LABEL_KEY: "Unique Key",
  LABEL_DISPLAY_LABEL: "Display Label",
  LABEL_BASE_PATH: "Base Path",
  LABEL_QUERY_PARAM: "Default Query Param (Optional)",
  DESC_QUERY_PARAM:
    "The search parameter appended to the URL for dynamic routes.",
  PLACEHOLDER_KEY: "e.g., store, blog, faq",
  PLACEHOLDER_LABEL: "e.g., Store / Shop",
  PLACEHOLDER_BASE_PATH: "e.g., /store/product",
  PLACEHOLDER_QUERY_PARAM: "e.g., category",
  BTN_CANCEL: "Cancel",
  BTN_SAVING: "Saving...",
  BTN_SAVE: "Save Mapping",
  SESSION_EXPIRED_TITLE: "Session Expired",
  SESSION_EXPIRED_DESC:
    "Your session needs to be refreshed to manage site mappings. Please log in again to continue.",
  LOG_IN_AGAIN: "Log In Again",
};

export const FILTER_RULES_TEXT = {
  TITLE: "Product Filters & Collections",
  SUBTITLE: "Manage dynamic product collections and filter rules for your storefront.",
  ADD_FILTER_BTN: "Create New Filter",
  MODAL_CREATE_TITLE: "Create Product Filter",
  MODAL_EDIT_TITLE: "Edit Product Filter",
  LABEL_FILTER_NAME: "Filter Name",
  PLACEHOLDER_FILTER_NAME: "e.g., Summer Sale 2026",
  LABEL_RULES: "Rules",
  ADD_RULE_BTN: "Add Rule",
  SELECT_TYPE: "Select Type",
  SELECT_OPERATOR: "Select Operator",
  VALUE_PLACEHOLDER: "Enter value...",
  SAVE_BTN: "Save Filter",
  CANCEL_BTN: "Cancel",
  DELETE_BTN: "Delete Filter",
  CONFIRM_DELETE: "Are you sure you want to delete this filter? Any navigation links using it will be broken.",
  SUCCESS_CREATE: "Filter created successfully!",
  FAILED_CREATE: "Failed to create filter.",
  SUCCESS_UPDATE: "Filter updated successfully!",
  FAILED_UPDATE: "Failed to update filter.",
  SUCCESS_DELETE: "Filter deleted successfully!",
  FAILED_DELETE: "Failed to delete filter.",
  FETCH_ERROR: "Failed to load filters.",
  NO_FILTERS_FOUND: "No product filters found. Create one to power your dynamic collections!"
};
