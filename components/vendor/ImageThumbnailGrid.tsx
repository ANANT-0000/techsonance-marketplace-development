import { DynamicIcon } from "lucide-react/dynamic";
import { ManagedImage, UploadStatus } from "@/hooks/useImageUploadManager";
import { IMAGE_THUMBNAIL_GRID_TEXT } from "@/constants/vendorText";

export enum ReorderDirection {
  LEFT = "left",
  RIGHT = "right",
}

interface ImageThumbnailGridProps {
  images: ManagedImage[];
  onRemove: (id: string) => void;
  onReorder: (id: string, direction: ReorderDirection) => void;
  onRetry: (id: string) => void;
  isMainProduct?: boolean;
}

export function ImageThumbnailGrid({
  images,
  onRemove,
  onReorder,
  onRetry,
  isMainProduct = false,
}: ImageThumbnailGridProps) {
  if (images.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200/60">
      {images.map((img, i) => (
        <li
          key={img.id}
          className="relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm w-24 h-24 group/preview flex-shrink-0"
        >
          {img.previewUrl && (
            <img
              src={img.previewUrl}
              alt={`preview-${i}`}
              className={`w-full h-full object-cover transition-opacity ${
                img.status === UploadStatus.UPLOADING ? "opacity-50 blur-sm" : ""
              } ${img.status === UploadStatus.ERROR ? "opacity-40 grayscale" : ""}`}
            />
          )}

          {/* Status Overlay */}
          {img.status === UploadStatus.UPLOADING && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
              <DynamicIcon
                fallback={() => <span />}
                name="loader-2"
                className="animate-spin text-white mb-1"
                size={20}
              />
              <div className="w-3/4 bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${img.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {img.status === UploadStatus.ERROR && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40">
              <DynamicIcon
                fallback={() => <span />}
                name="alert-circle"
                className="text-white mb-1"
                size={20}
              />
              <span className="text-[10px] text-white font-medium">{IMAGE_THUMBNAIL_GRID_TEXT.STATUS.FAILED}</span>
            </div>
          )}

          {img.status === UploadStatus.SUCCESS && (
            <div className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full p-0.5 shadow-sm group-hover/preview:opacity-0 transition-opacity duration-200">
              <DynamicIcon fallback={() => <span />} name="check" size={12} />
            </div>
          )}

          {/* Order Badge (for main products) */}
          {isMainProduct && (
            <div className="absolute top-0 left-0 bg-indigo-500/90 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-md z-10 shadow-sm pointer-events-none">
              {i === 0 ? IMAGE_THUMBNAIL_GRID_TEXT.LABELS.MAIN_IMAGE : IMAGE_THUMBNAIL_GRID_TEXT.LABELS.GALLERY(i)}
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {img.status === UploadStatus.ERROR ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRetry(img.id);
                }}
                className="p-1.5 bg-blue-500 text-white hover:bg-blue-600 transition rounded-full shadow-sm"
                title={IMAGE_THUMBNAIL_GRID_TEXT.TOOLTIPS.RETRY}
              >
                <DynamicIcon
                  fallback={() => <span />}
                  name="refresh-cw"
                  size={14}
                />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onReorder(img.id, ReorderDirection.LEFT);
                  }}
                  disabled={i === 0}
                  className="p-1 text-white hover:text-indigo-300 disabled:opacity-30 transition"
                  title={IMAGE_THUMBNAIL_GRID_TEXT.TOOLTIPS.MOVE_LEFT}
                >
                  <DynamicIcon
                    fallback={() => <span />}
                    name="arrow-left"
                    size={16}
                  />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onReorder(img.id, ReorderDirection.RIGHT);
                  }}
                  disabled={i === images.length - 1}
                  className="p-1 text-white hover:text-indigo-300 disabled:opacity-30 transition"
                  title={IMAGE_THUMBNAIL_GRID_TEXT.TOOLTIPS.MOVE_RIGHT}
                >
                  <DynamicIcon
                    fallback={() => <span />}
                    name="arrow-right"
                    size={16}
                  />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onRemove(img.id);
              }}
              className="p-1.5 bg-red-500 text-white hover:bg-red-600 transition rounded-full shadow-sm absolute top-1.5 right-1.5"
              title={IMAGE_THUMBNAIL_GRID_TEXT.TOOLTIPS.REMOVE}
            >
              <DynamicIcon fallback={() => <span />} name="x" size={12} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
