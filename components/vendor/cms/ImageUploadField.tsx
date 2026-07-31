import { UiText } from "@/constants/ui-text";
import AxiosAPI from "@/lib/axios";
import { authToken } from "@/utils/authToken";
import { AlertCircle, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
export async function deleteCloudinaryAsset(url: string): Promise<void> {
  try {
    await AxiosAPI.delete("/v1/upload-to-cloud/delete-image", {
      params: { url: url },
    });
  } catch {
    // Silently swallow — stale asset cleanup is non-critical
  }
}
export function ImageUploadField({
  label,
  value,
  onChange,
  onAutoSave,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onAutoSave?: (newUrl: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const token = authToken();

  // Show "✓ Auto-saved" confirmation for 3 seconds after upload
  const flashAutoSaved = () => {
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(UiText.SIZE_LIMIT_ERROR);
      return;
    }

    setUploading(true);
    setError(null);

    // If there is already an image, queue its Cloudinary deletion (replace flow)
    const oldUrl = value;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Get upload signature from backend
      const sigRes = await AxiosAPI.get("/v1/upload-to-cloud/signature", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { timestamp, signature, cloudName, apiKey } = sigRes.data?.data || sigRes.data;

      if (!signature || !cloudName || !apiKey) {
        throw new Error("Failed to get upload signature from server.");
      }

      // 2. Upload directly to Cloudinary
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("timestamp", timestamp.toString());
      cloudinaryFormData.append("signature", signature);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: cloudinaryFormData,
      });

      if (!cloudinaryRes.ok) {
        throw new Error(UiText.UPLOAD_FAILED);
      }

      const cloudinaryData = await cloudinaryRes.json();

      if (cloudinaryData.secure_url) {
        const newUrl = cloudinaryData.secure_url;

        // 1. Delete old asset from Cloudinary (non-blocking, via our backend)
        if (oldUrl) {
          deleteCloudinaryAsset(oldUrl);
        }

        // 2. Update local state with new URL
        onChange(newUrl);

        // 3. Auto-save to backend so this URL survives a reload
        if (onAutoSave) {
          try {
            await onAutoSave(newUrl);
            flashAutoSaved();
          } catch {
            // Auto-save failed silently; vendor can still click Save manually
          }
        }
      } else {
        throw new Error("Upload succeeded but no URL returned from Cloudinary.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || UiText.UPLOAD_FAILED);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    setRemoving(true);
    setError(null);
    const urlToDelete = value;

    // Clear local state immediately for snappy UX
    onChange("");

    // Delete from Cloudinary in the background
    await deleteCloudinaryAsset(urlToDelete);

    // Auto-save the cleared state so it persists on reload
    if (onAutoSave) {
      try {
        await onAutoSave("");
        flashAutoSaved();
      } catch {
        // silent
      }
    }
    setRemoving(false);
  };

  return (
    <div className="group">
      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-stone-900">
        {label}
      </label>
      <div className="flex items-center gap-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-stone-300 min-w-0 group-focus-within:ring-[3px] group-focus-within:ring-amber-800/15 group-focus-within:border-amber-800/40">
        {/* Preview thumbnail with Remove button */}
        {value ? (
          <div className="relative w-14 h-14 rounded-xl overflow-visible shrink-0 group/img">
            <img
              src={value}
              alt={UiText.PREVIEW}
              className="w-14 h-14 object-cover rounded-xl border border-stone-200 bg-white shadow-sm transition-transform duration-300 group-hover/img:scale-105"
            />
            {/* Remove ✕ button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing || uploading}
              title={UiText.REMOVE_IMAGE}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 disabled:opacity-50 hover:scale-110"
            >
              {removing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <X size={12} strokeWidth={3} />
              )}
            </button>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center bg-stone-50 text-stone-400 shrink-0 transition-colors duration-300 group-hover:border-amber-800/40 group-hover:text-amber-800 group-hover:bg-amber-50/40">
            <ImageIcon size={20} className="opacity-75" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <label className="inline-flex items-center gap-2 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-stone-300 rounded-xl px-4 py-2 text-[13px] font-semibold cursor-pointer transition-all self-start shadow-sm active:scale-95">
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin text-amber-800" />
                <span>{UiText.UPLOADING}</span>
              </>
            ) : (
              <>
                <Upload
                  size={14}
                  className="text-stone-500 group-hover:text-stone-900 transition-colors"
                />
                <span>{UiText.UPLOAD_IMAGE}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading || removing}
              className="hidden"
            />
          </label>
          {error && (
            <p className="flex items-center gap-1.5 text-[12px] text-red-600 mt-2 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg self-start">
              <AlertCircle size={12} className="shrink-0" />
              {error}
            </p>
          )}
          {!error && autoSaved && (
            <p className="text-[12px] text-emerald-700 mt-2 font-semibold">
              ✓ {UiText.AUTO_SAVED}
            </p>
          )}
          {!error && !autoSaved && value && (
            <p
              className="text-[12px] text-emerald-700 mt-2 font-medium truncate opacity-75"
              title={value}
            >
              ✓ {UiText.CLOUDINARY_ATTACHED}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
