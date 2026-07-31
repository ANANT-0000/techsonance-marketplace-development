import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Package, Plus, Sparkles, Tag, Trash2, ClipboardPaste, ChevronDown, ChevronUp } from "lucide-react";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ProductFormValuesType } from "@/utils/validation";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export const GeneralInformationSection = () => {
  const { control, getValues } = useFormContext<ProductFormValuesType>();
  const [isFeaturesCollapsed, setIsFeaturesCollapsed] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number | null>(null);
  
  const [isAttributesCollapsed, setIsAttributesCollapsed] = useState(false);
  const [activeAttributeIndex, setActiveAttributeIndex] = useState<number | null>(null);

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
    update: updateFeature,
  } = useFieldArray({ control, name: "features" });

  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
    update: updateAttribute,
  } = useFieldArray({ control, name: "attributes" });

  const handleSmartPasteFeatures = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast.error("Clipboard is empty");
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      const parsedItems: {title: string, description: string}[] = [];
      const hasTabs = lines.some(line => line.includes('\t'));
      const hasColons = lines.some(line => line.includes(':'));
      
      if (hasTabs) {
        lines.forEach(line => {
           const parts = line.split('\t');
           parsedItems.push({ title: parts[0].trim(), description: parts.slice(1).join(' ').trim() });
        });
      } else if (hasColons) {
        lines.forEach(line => {
           const parts = line.split(':');
           if (parts.length >= 2) {
             parsedItems.push({ title: parts[0].trim(), description: parts.slice(1).join(':').trim() });
           } else {
             parsedItems.push({ title: line.trim(), description: "" });
           }
        });
      } else {
        for (let i = 0; i < lines.length; i += 2) {
          parsedItems.push({ title: lines[i], description: lines[i + 1] || "" });
        }
      }

      const current = getValues("features") || [];
      const hasEmptyFirst = current.length === 1 && !current[0].title && !current[0].description;

      parsedItems.forEach((item, idx) => {
        if (hasEmptyFirst && idx === 0) {
          updateFeature(0, item);
        } else {
          appendFeature(item);
        }
      });

      toast.success(`Smart pasted ${parsedItems.length} features!`);
    } catch (err) {
      toast.error("Clipboard access denied or empty");
    }
  };

  const handleSmartPasteAttributes = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast.error("Clipboard is empty");
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      const parsedItems: {name: string, value: string}[] = [];
      const hasTabs = lines.some(line => line.includes('\t'));
      const hasColons = lines.some(line => line.includes(':'));
      
      if (hasTabs) {
        lines.forEach(line => {
           const parts = line.split('\t');
           parsedItems.push({ name: parts[0].trim(), value: parts.slice(1).join(' ').trim() });
        });
      } else if (hasColons) {
        lines.forEach(line => {
           const parts = line.split(':');
           if (parts.length >= 2) {
             parsedItems.push({ name: parts[0].trim(), value: parts.slice(1).join(':').trim() });
           } else {
             parsedItems.push({ name: line.trim(), value: "" });
           }
        });
      } else {
        for (let i = 0; i < lines.length; i += 2) {
          parsedItems.push({ name: lines[i], value: lines[i + 1] || "" });
        }
      }

      const current = getValues("attributes") || [];
      const hasEmptyFirst = current.length === 1 && !current[0].name && !current[0].value;

      parsedItems.forEach((item, idx) => {
        if (hasEmptyFirst && idx === 0) {
          updateAttribute(0, item);
        } else {
          appendAttribute(item);
        }
      });

      toast.success(`Smart pasted ${parsedItems.length} attributes!`);
    } catch (err) {
      toast.error("Clipboard access denied or empty");
    }
  };

  return (
    <div
      className="bg-white border border-slate-100 rounded-3xl mb-6 overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)]"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
    >
      {/* Section Header */}
      <div
        className="px-6 py-4 border-b border-slate-100 flex items-center gap-3"
        style={{
          background: "linear-gradient(to right, rgba(248,250,252,0.8), #ffffff)",
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Package size={16} className="text-indigo-500" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
          {PRODUCT_FORM_TEXT.SECTIONS.GENERAL}
        </h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Dynamic general fields (productName, description) */}
        {PRODUCT_FORM_TEXT.GENERAL_FIELDS.map((field, idx: number) => (
          <FormField
            key={idx}
            control={control}
            name={field.name as import("react-hook-form").Path<ProductFormValuesType>}
            render={({ field: hookField }) => (
              <FormItem>
                <FormLabel>
                  {field.label} <span className="text-red-400 normal-case">*</span>
                </FormLabel>
                <FormControl>
                  {field.type === "textarea" ? (
                    <Textarea
                      rows={4}
                      className="resize-none"
                      placeholder={field.placeholder}
                      {...hookField}
                      value={typeof hookField.value === 'string' ? hookField.value : ''}
                    />
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      {...hookField}
                      value={typeof hookField.value === 'string' ? hookField.value : ''}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        {/* ── Features ───────────────────────────────────────────── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {PRODUCT_FORM_TEXT.SECTIONS.FEATURES}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Highlight the key selling points of your product
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSmartPasteFeatures}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700"
              >
                <ClipboardPaste size={13} />
                Smart Paste
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendFeature({ title: "", description: "" })}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700"
              >
                <Plus size={13} />
                {PRODUCT_FORM_TEXT.ACTIONS.ADD_FEATURE}
              </Button>
            </div>
          </div>

          {featureFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Sparkles size={18} />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.FEATURES_TITLE}
              </h4>
              <p className="text-xs text-slate-400 max-w-[260px] mb-4">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.FEATURES_DESC}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => appendFeature({ title: "", description: "" })}
                className="text-xs font-semibold text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100 hover:text-amber-700 flex items-center gap-1.5"
              >
                <Plus size={13} />
                {PRODUCT_FORM_TEXT.EMPTY_STATES.FEATURES_BTN}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
              <div 
                className="hidden sm:flex items-center px-4 py-3 bg-slate-100/50 border-b border-slate-200 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsFeaturesCollapsed(!isFeaturesCollapsed)}
              >
                <div className="flex gap-3 flex-1">
                  <div className="w-1/3">{PRODUCT_FORM_TEXT.LABELS.FEAT_TITLE}</div>
                  <div className="flex-1">{PRODUCT_FORM_TEXT.LABELS.DETAILS}</div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100/80 text-indigo-600 shadow-sm border border-indigo-200 hover:bg-indigo-200 transition-colors ml-4">
                  <span className="text-[11px] font-bold tracking-wide uppercase">
                    {isFeaturesCollapsed ? "Expand" : "Collapse"}
                  </span>
                  {isFeaturesCollapsed ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronUp size={14} strokeWidth={2.5} />}
                </div>
              </div>
              <div className="flex flex-col p-2 gap-2">
                {isFeaturesCollapsed && featureFields.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 pb-0">
                    {featureFields.map((field, index) => {
                      const title = getValues(`features.${index}.title`) || `Feature ${index + 1}`;
                      const isActive = activeFeatureIndex === index;
                      return (
                        <button
                          key={`pill-${field.id}`}
                          type="button"
                          onClick={() => setActiveFeatureIndex(isActive ? null : index)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors max-w-[150px] truncate ${
                            isActive 
                              ? "bg-indigo-100 border-indigo-200 text-indigo-700" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                          title={title}
                        >
                          {title}
                        </button>
                      );
                    })}
                  </div>
                )}

                {featureFields.map((field, index) => {
                  if (isFeaturesCollapsed && activeFeatureIndex !== index) return null;

                  return (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row gap-3 items-start sm:items-start p-2 rounded-lg bg-white border border-slate-200/60 shadow-sm group hover:border-indigo-300 transition-colors"
                  >
                    <div className="w-full sm:w-1/3">
                      <FormField
                        control={control}
                        name={`features.${index}.title`}
                        render={({ field: hookField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input className="h-9 text-sm font-medium" placeholder={PRODUCT_FORM_TEXT.LABELS.FEAT_TITLE_PH} {...hookField} value={typeof hookField.value === 'string' ? hookField.value : ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <FormField
                        control={control}
                        name={`features.${index}.description`}
                        render={({ field: hookField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input className="h-9 text-sm" placeholder={PRODUCT_FORM_TEXT.LABELS.FEAT_DESC_PH} {...hookField} value={typeof hookField.value === 'string' ? hookField.value : ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeature(index)}
                      className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>

        {/* ── Attributes ─────────────────────────────────────────── */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {PRODUCT_FORM_TEXT.SECTIONS.ATTRIBUTES}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Specify color, size, material and other variants
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSmartPasteAttributes}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700"
              >
                <ClipboardPaste size={13} />
                Smart Paste
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendAttribute({ name: "", value: "" })}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700"
              >
                <Plus size={13} />
                {PRODUCT_FORM_TEXT.ACTIONS.ADD_ATTRIBUTE}
              </Button>
            </div>
          </div>

          {attributeFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Tag size={18} />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_TITLE}
              </h4>
              <p className="text-xs text-slate-400 max-w-[260px] mb-4">
                {PRODUCT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_DESC}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => appendAttribute({ name: "", value: "" })}
                className="text-xs font-semibold text-violet-600 bg-violet-50 border-violet-100 hover:bg-violet-100 hover:text-violet-700 flex items-center gap-1.5"
              >
                <Plus size={13} />
                {PRODUCT_FORM_TEXT.EMPTY_STATES.ATTRIBUTES_BTN}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
              <div 
                className="hidden sm:flex items-center px-4 py-3 bg-slate-100/50 border-b border-slate-200 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsAttributesCollapsed(!isAttributesCollapsed)}
              >
                <div className="flex gap-3 flex-1">
                  <div className="w-1/3">{PRODUCT_FORM_TEXT.LABELS.ATTR_TITLE}</div>
                  <div className="flex-1">{PRODUCT_FORM_TEXT.LABELS.DETAILS}</div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-100/80 text-violet-600 shadow-sm border border-violet-200 hover:bg-violet-200 transition-colors ml-4">
                  <span className="text-[11px] font-bold tracking-wide uppercase">
                    {isAttributesCollapsed ? "Expand" : "Collapse"}
                  </span>
                  {isAttributesCollapsed ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronUp size={14} strokeWidth={2.5} />}
                </div>
              </div>
              <div className="flex flex-col p-2 gap-2">
                {isAttributesCollapsed && attributeFields.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 pb-0">
                    {attributeFields.map((field, index) => {
                      const name = getValues(`attributes.${index}.name`) || `Attribute ${index + 1}`;
                      const isActive = activeAttributeIndex === index;
                      return (
                        <button
                          key={`pill-${field.id}`}
                          type="button"
                          onClick={() => setActiveAttributeIndex(isActive ? null : index)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors max-w-[150px] truncate ${
                            isActive 
                              ? "bg-violet-100 border-violet-200 text-violet-700" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                          title={name}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {attributeFields.map((field, index) => {
                  if (isAttributesCollapsed && activeAttributeIndex !== index) return null;

                  return (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row gap-3 items-start sm:items-start p-2 rounded-lg bg-white border border-slate-200/60 shadow-sm group hover:border-violet-300 transition-colors"
                  >
                    <div className="w-full sm:w-1/3">
                      <FormField
                        control={control}
                        name={`attributes.${index}.name`}
                        render={({ field: hookField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input className="h-9 text-sm font-medium" placeholder={PRODUCT_FORM_TEXT.LABELS.ATTR_TITLE_PH} {...hookField} value={typeof hookField.value === 'string' ? hookField.value : ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <FormField
                        control={control}
                        name={`attributes.${index}.value`}
                        render={({ field: hookField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input className="h-9 text-sm" placeholder={PRODUCT_FORM_TEXT.LABELS.ATTR_DESC_PH} {...hookField} value={typeof hookField.value === 'string' ? hookField.value : ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttribute(index)}
                      className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
