import { Image, Info, UploadCloud } from "lucide-react";
import { PRODUCT_FORM_TEXT } from "@/constants/vendorText";
import { ImageThumbnailGrid } from "@/components/vendor/ImageThumbnailGrid";
import React from "react";
import { useImageUploadManager } from "@/hooks/useImageUploadManager";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { ProductFormValuesType } from "@/utils/validation";

interface MediaAssetsSectionProps {
  productUpload: ReturnType<typeof useImageUploadManager>;
  featureUpload: ReturnType<typeof useImageUploadManager>;
  setDeletedImgs: React.Dispatch<React.SetStateAction<string[]>>;
}

export const MediaAssetsSection = ({
  productUpload,
  featureUpload,
  setDeletedImgs,
}: MediaAssetsSectionProps) => {
  const { control } = useFormContext<ProductFormValuesType>();
  const MAX_FILE_SIZE_MB = 0.4;
  const MAX_TOTAL_SIZE_MB = 20;

  return (
    <div className="section">
      <div className="section_header">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Image
            size={16}
            className="text-indigo-500"
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
            {PRODUCT_FORM_TEXT.SECTIONS.MEDIA}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload product images and feature/specification media
          </p>
        </div>
      </div>

      {/* Global Media Guideline Banner */}
      <div className="px-6 pt-5 pb-2">
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex gap-3 items-start">
          <Info
            size={15}
            className="text-indigo-500 mt-0.5 shrink-0"
          />
          <div className="flex-1">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-semibold">{PRODUCT_FORM_TEXT.MEDIA_GUIDE.TITLE}</span>{" "}
              {PRODUCT_FORM_TEXT.MEDIA_GUIDE.DESC}
            </p>
            <p className="text-xs text-indigo-600 leading-relaxed mt-1">
              {PRODUCT_FORM_TEXT.MEDIA_GUIDE.IMPORTANT_NOTE}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRODUCT_FORM_TEXT.FILE_UPLOAD_LABELS.map(
          ({ label, fieldName, limit, hint }: { label: string; fieldName: string; limit: number; hint: string }) => {
            const manager =
              fieldName === "productMedia" ? productUpload : featureUpload;
            const fileCount = manager.images.length;

            return (
              <FormField
                key={fieldName}
                control={control}
                name={fieldName as import("react-hook-form").Path<ProductFormValuesType>}
                render={() => (
                  <FormItem className="border border-slate-100 rounded-2xl p-5 bg-white flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.04)] min-w-0">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <h3 className="text-sm font-semibold text-slate-700 truncate">{label}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Live file count badge */}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all duration-200 ${
                              fileCount >= limit
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : fileCount > 0
                                ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                                : "text-slate-500 bg-slate-100 border-slate-200"
                            }`}
                          >
                            {fileCount} / {limit} {limit === 1 ? "file" : "files"}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{hint}</p>
                      <FormMessage className="text-xs mt-1" />
                    </div>

                    {/* Upload area */}
                    <FormControl>
                      <label className={`w-full overflow-hidden flex flex-col items-center justify-center py-6 px-4 border border-dashed border-indigo-200 rounded-xl transition-all duration-200 ease-out shadow-sm ${
                        fileCount >= limit 
                          ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 grayscale" 
                          : "cursor-pointer hover:bg-indigo-50/70 hover:border-indigo-300 bg-indigo-50/30 group hover:shadow-[0_4px_14px_rgba(99,102,241,0.08)]"
                      }`}>
                        <input
                          type="file"
                          disabled={fileCount >= limit}
                          multiple={limit > 1}
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              manager.addFiles(Array.from(e.target.files));
                            }
                            e.target.value = "";
                          }}
                        />
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2.5 shadow-sm border border-indigo-50 group-hover:scale-105 transition-transform duration-200 ease-out">
                          <UploadCloud
                            size={20}
                            className="text-indigo-400 group-hover:text-indigo-500 transition-colors"
                          />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 group-hover:text-indigo-700 transition-colors text-center">
                          {PRODUCT_FORM_TEXT.MEDIA_GUIDE.BROWSE}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                          <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 text-center">
                            {PRODUCT_FORM_TEXT.MEDIA_GUIDE.MAX_PER_IMAGE(MAX_FILE_SIZE_MB)}
                          </span>
                          <span className="text-[10px] font-semibold tracking-wide text-indigo-400 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/60 text-center">
                            {PRODUCT_FORM_TEXT.MEDIA_GUIDE.MAX_TOTAL(MAX_TOTAL_SIZE_MB)}
                          </span>
                        </div>
                      </label>
                    </FormControl>

                    {/* Preview list */}
                    <ImageThumbnailGrid
                      images={manager.images}
                      onRemove={(id: string) => {
                        manager.removeImage(id);
                        if (!id.startsWith("temp-")) {
                          setDeletedImgs((prev) => [...prev, id]);
                        }
                      }}
                      onReorder={manager.reorderImage}
                      onRetry={manager.retryUpload}
                      isMainProduct={fieldName === "productMedia"}
                    />
                  </FormItem>
                )}
              />
            );
          },
        )}
      </div>
    </div>
  );
};
