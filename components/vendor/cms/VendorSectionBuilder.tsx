import React, { useReducer, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, LayoutTemplate, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SECTION_HIGHLIGHT_OPTIONS,
  SECTION_TIMEFRAME_OPTIONS,
  SECTION_PRICE_COLLATION_OPTIONS,
  SECTION_DISCOUNT_OPTIONS,
  SECTION_ROUTE_OPTIONS,
  SECTION_UI_FIELDS,
  SECTION_COLOR_FIELDS,
  SECTION_CTA_FIELDS,
} from "@/constants";

enum BuilderActionType {
  SET_FIELD = "SET_FIELD",
  SET_COLOR = "SET_COLOR",
  SET_CTA = "SET_CTA",
  SET_FILTER = "SET_FILTER",
}

export interface SectionConfigState {
  id?: string | number;
  title: string;
  description: string;
  position: number;
  colors: {
    backgroundColor: string;
    textColor: string;
    primaryColor: string;
  };
  cta: {
    text: string;
    queryParams: string;
    route: string;
  };
  filters: {
    categoryId: string | null;
    categoryCollation: string | null;
    priceMin: number | null;
    priceMax: number | null;
    priceCollation: string | null;
    discountMin: number | null;
    timeframe: string | null;
    highlights: string | null;
  };
}

type BuilderAction =
  | {
      type: BuilderActionType.SET_FIELD;
      payload: { field: keyof SectionConfigState; value: string | number };
    }
  | {
      type: BuilderActionType.SET_COLOR;
      payload: { field: string; value: string };
    }
  | {
      type: BuilderActionType.SET_CTA;
      payload: { field: string; value: string };
    }
  | {
      type: BuilderActionType.SET_FILTER;
      payload: {
        field: keyof SectionConfigState["filters"];
        value: string | number | null;
      };
    };

export const initialSectionState: SectionConfigState = {
  title: "",
  description: "",
  position: 1,
  colors: {
    backgroundColor: "#ffffff",
    textColor: "#000000",
    primaryColor: "#3b82f6",
  },
  cta: {
    text: "View All",
    queryParams: "",
    route: "store/c",
  },
  filters: {
    categoryId: null,
    categoryCollation: null,
    priceMin: null,
    priceMax: null,
    priceCollation: null,
    discountMin: null,
    timeframe: null,
    highlights: null,
  },
};

function builderReducer(
  state: SectionConfigState,
  action: BuilderAction,
): SectionConfigState {
  switch (action.type) {
    case BuilderActionType.SET_FIELD:
      return { ...state, [action.payload.field]: action.payload.value };
    case BuilderActionType.SET_COLOR:
      return {
        ...state,
        colors: {
          ...state.colors,
          [action.payload.field]: action.payload.value,
        },
      };
    case BuilderActionType.SET_CTA:
      return {
        ...state,
        cta: { ...state.cta, [action.payload.field]: action.payload.value },
      };
    case BuilderActionType.SET_FILTER: {
      const newFilters = {
        ...state.filters,
        [action.payload.field]: action.payload.value,
      };

      // Auto-generate query parameters when predefined configs are touched
      const params = new URLSearchParams();
      if (newFilters.categoryId) params.set("category", newFilters.categoryId);
      if (newFilters.highlights) params.set("highlight", newFilters.highlights);
      if (newFilters.timeframe) params.set("timeframe", newFilters.timeframe);
      if (newFilters.priceCollation)
        params.set("price", newFilters.priceCollation);
      if (newFilters.discountMin)
        params.set("discount", String(newFilters.discountMin));

      const queryStr = params.toString() ? `?${params.toString()}` : "";

      // We also auto-fill the Title if it's empty and they select a highlight
      let newTitle = state.title;
      if (
        !state.title &&
        action.payload.field === "highlights" &&
        action.payload.value
      ) {
        const option = SECTION_HIGHLIGHT_OPTIONS.find(
          (o) => o.value === action.payload.value,
        );
        if (option) newTitle = option.label;
      }

      return {
        ...state,
        title: newTitle,
        filters: newFilters,
        cta: { ...state.cta, queryParams: queryStr },
      };
    }
    default:
      return state;
  }
}

// ─── ColorPickerField ────────────────────────────────────────────────────────
// Isolated sub-component so color input changes ONLY update local state.
// The parent reducer (and its cascading useEffect → CMS re-render) is called
// onBlur — i.e. once, when the user releases the picker, not 60× per second.
interface ColorPickerFieldProps {
  fieldName: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
}

function ColorPickerField({
  fieldName,
  label,
  value,
  onCommit,
}: ColorPickerFieldProps) {
  const [localValue, setLocalValue] = useState(value);

  // Keep local value in sync if the parent resets the form externally.
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldName}>{label}</Label>
      <div className="flex gap-3">
        <Input
          type="color"
          id={fieldName}
          className="w-12 h-10 p-1 cursor-pointer"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onCommit(localValue)}
        />
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => onCommit(localValue)}
          className="flex-1 font-mono uppercase"
        />
      </div>
    </div>
  );
}

// ─── VendorSectionBuilder ─────────────────────────────────────────────────────
export function VendorSectionBuilder({
  initialData,
  onChange,
  onRemove,
  categories,
}: {
  initialData: SectionConfigState;
  onChange: (d: SectionConfigState) => void;
  onRemove: () => void;
  categories?: { id: string; name: string }[];
}) {
  const [state, dispatch] = useReducer(
    builderReducer,
    initialData || initialSectionState,
  );
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Sync state with parent CMS
  React.useEffect(() => {
    onChange(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm mb-6 overflow-hidden transition-all duration-300">
      {/* Premium Pill Header */}
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: state.colors.primaryColor || "#000000" }}
          >
            <LayoutTemplate size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {state.title || "Untitled Section"}
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              Position: {state.position} • Tag:{" "}
              {state.filters.highlights || "None"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50/30 space-y-8 animate-in slide-in-from-top-2 duration-300">
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle>Section Basics</CardTitle>
              <CardDescription>
                Set the name and colors for this product row.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {SECTION_UI_FIELDS.map((field) => (
                <div key={field.name} className="grid gap-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={
                        state[field.name as keyof SectionConfigState] as string
                      }
                      onChange={(e) =>
                        dispatch({
                          type: BuilderActionType.SET_FIELD,
                          payload: {
                            field: field.name as keyof SectionConfigState,
                            value: e.target.value,
                          },
                        })
                      }
                    />
                  ) : (
                    <Input
                      id={field.name}
                      placeholder={field.placeholder}
                      value={
                        state[field.name as keyof SectionConfigState] as string
                      }
                      onChange={(e) =>
                        dispatch({
                          type: BuilderActionType.SET_FIELD,
                          payload: {
                            field: field.name as keyof SectionConfigState,
                            value: e.target.value,
                          },
                        })
                      }
                    />
                  )}
                </div>
              ))}

              <div className="grid gap-2">
                <Label htmlFor="position">
                  Where on the page should this appear? (1 = Top)
                </Label>
                <Input
                  id="position"
                  type="number"
                  placeholder="1"
                  value={state.position}
                  onChange={(e) =>
                    dispatch({
                      type: BuilderActionType.SET_FIELD,
                      payload: {
                        field: "position",
                        value: Number(e.target.value),
                      },
                    })
                  }
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-"].includes(e.key))
                      e.preventDefault();
                  }}
                  onPaste={(e) => {
                    const pastedData = e.clipboardData.getData("Text");
                    if (/[eE+-]/.test(pastedData)) e.preventDefault();
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                {SECTION_COLOR_FIELDS.map((field) => (
                  <ColorPickerField
                    key={field.name}
                    fieldName={field.name}
                    label={field.label}
                    value={
                      state.colors[field.name as keyof typeof state.colors]
                    }
                    onCommit={(value) =>
                      dispatch({
                        type: BuilderActionType.SET_COLOR,
                        payload: { field: field.name, value },
                      })
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle>'View All' Button Settings</CardTitle>
              <CardDescription>
                Choose where customers are taken when they click to see more
                products.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>Where should the button go?</Label>
                <Select
                  value={state.cta.route}
                  onValueChange={(value) =>
                    dispatch({
                      type: BuilderActionType.SET_CTA,
                      payload: { field: "route", value },
                    })
                  }
                >
                  <SelectTrigger className="border-gray-200 shadow-sm rounded-lg focus:ring-primary/20">
                    <SelectValue placeholder="Select a destination" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-lg rounded-xl">
                    {SECTION_ROUTE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {SECTION_CTA_FIELDS.map((field) => (
                <div key={field.name} className="grid gap-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    placeholder={field.placeholder}
                    value={state.cta[field.name as keyof typeof state.cta]}
                    onChange={(e) =>
                      dispatch({
                        type: BuilderActionType.SET_CTA,
                        payload: { field: field.name, value: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader>
              <CardTitle>Which Products Should Show Here?</CardTitle>
              <CardDescription>
                Choose the rules for this section. The system will automatically
                pull in matching products for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label>Only show a specific Category?</Label>
                <Select
                  value={state.filters.categoryId || "all"}
                  onValueChange={(value) =>
                    dispatch({
                      type: BuilderActionType.SET_FILTER,
                      payload: {
                        field: "categoryId",
                        value: value === "all" ? "" : value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="border-gray-200 shadow-sm rounded-lg focus:ring-primary/20">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-lg rounded-xl">
                    <SelectItem value="all">
                      All Categories (None selected)
                    </SelectItem>
                    {(categories || []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Show special items?</Label>
                <Select
                  value={state.filters.highlights || ""}
                  onValueChange={(value) =>
                    dispatch({
                      type: BuilderActionType.SET_FILTER,
                      payload: { field: "highlights", value },
                    })
                  }
                >
                  <SelectTrigger className="border-gray-200 shadow-sm rounded-lg focus:ring-primary/20">
                    <SelectValue placeholder="Select a highlight" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-lg rounded-xl">
                    {SECTION_HIGHLIGHT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Only show newly added items?</Label>
                <Select
                  value={state.filters.timeframe || ""}
                  onValueChange={(value) =>
                    dispatch({
                      type: BuilderActionType.SET_FILTER,
                      payload: { field: "timeframe", value },
                    })
                  }
                >
                  <SelectTrigger className="border-gray-200 shadow-sm rounded-lg focus:ring-primary/20">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-lg rounded-xl">
                    {SECTION_TIMEFRAME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Only show items in a price range?</Label>
                <Select
                  value={state.filters.priceCollation || "all"}
                  onValueChange={(value) =>
                    dispatch({
                      type: BuilderActionType.SET_FILTER,
                      payload: {
                        field: "priceCollation",
                        value: value === "all" ? null : value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="border-gray-200 shadow-sm rounded-lg focus:ring-primary/20">
                    <SelectValue placeholder="Select a price range" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-lg rounded-xl">
                    <SelectItem value="all">All Prices (No filter)</SelectItem>
                    {SECTION_PRICE_COLLATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Only show items on sale?</Label>
                <Select
                  value={state.filters.discountMin?.toString() || "all"}
                  onValueChange={(value) =>
                    dispatch({
                      type: BuilderActionType.SET_FILTER,
                      payload: {
                        field: "discountMin",
                        value: value === "all" ? null : Number(value),
                      },
                    })
                  }
                >
                  <SelectTrigger className="border-gray-200 shadow-sm rounded-lg focus:ring-primary/20">
                    <SelectValue placeholder="Select discount" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-lg rounded-xl">
                    <SelectItem value="all">Any Price (No filter)</SelectItem>
                    {SECTION_DISCOUNT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
