import { useState, useCallback, useEffect, useRef } from "react";
import AxiosAPI from "@/lib/axios";
import toast from "react-hot-toast";
import { FileOrProductImage, ProductImage } from "@/utils/Types";
import { BASE_API_URL } from "@/constants";

export enum UploadStatus {
  IDLE = "idle",
  UPLOADING = "uploading",
  SUCCESS = "success",
  ERROR = "error",
}

export interface ManagedImage {
  id: string; // Temporary ID for the session or real ID from DB
  file?: File;
  previewUrl: string;
  cloudUrl?: string;
  status: UploadStatus;
  progress: number;
}

interface UseImageUploadManagerProps {
  token: string | null;
  maxSizeMB?: number;
  maxTotalSizeMB?: number;
  uploadEndpoint?: string;
  deleteEndpoint?: string;
  initialImages?: FileOrProductImage[];
  limit?: number;
}

export function useImageUploadManager({
  token,
  maxSizeMB = 5,
  maxTotalSizeMB = 20,
  uploadEndpoint = "/v1/upload-to-cloud/upload",
  deleteEndpoint = "/v1/upload-to-cloud/delete-image",
  initialImages = [],
  limit,
}: UseImageUploadManagerProps) {
  const [images, setImages] = useState<ManagedImage[]>(() => {
    // Initialize from existing images if any
    return initialImages.map((img: FileOrProductImage) => {
      if (img instanceof File) {
        return {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          file: img,
          previewUrl: URL.createObjectURL(img),
          status: UploadStatus.IDLE,
          progress: 0,
        };
      }
      return {
        id:
          img.id ||
          `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        previewUrl: img.image_url || "",
        cloudUrl: img.image_url || "",
        status: UploadStatus.SUCCESS,
        progress: 100,
      };
    });
  });

  const sessionImagesRef = useRef<Set<string>>(new Set());

  const handleUpload = useCallback(
    async (img: ManagedImage) => {
      if (!img.file || !token) return;

      setImages((prev) =>
        prev.map((i) =>
          i.id === img.id
            ? { ...i, status: UploadStatus.UPLOADING, progress: 0 }
            : i,
        ),
      );

      const formData = new FormData();
      formData.append("file", img.file);

      try {
        const res = await AxiosAPI.post(uploadEndpoint, formData, {
          headers: {
            "Content-Type": undefined,
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setImages((prev) =>
                prev.map((i) =>
                  i.id === img.id ? { ...i, progress: percentCompleted } : i,
                ),
              );
            }
          },
        });

        if (res.data?.data?.secure_url) {
          const secureUrl = res.data.data.secure_url;

          sessionImagesRef.current.add(secureUrl);
          setImages((prev) =>
            prev.map((i) =>
              i.id === img.id
                ? {
                    ...i,
                    status: UploadStatus.SUCCESS,
                    cloudUrl: secureUrl,
                    progress: 100,
                  }
                : i,
            ),
          );
        } else {
          throw new Error("Upload succeeded but no URL was returned.");
        }
      } catch (err: unknown) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? { ...i, status: UploadStatus.ERROR, progress: 0 }
              : i,
          ),
        );
        const errorMsg = err instanceof Error ? err.message : "Upload failed.";
        toast.error(errorMsg);
      }
    },
    [token, uploadEndpoint],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (limit && images.length + newFiles.length > limit) {
        toast.error(`You can only upload up to ${limit} file(s) here.`);
        return;
      }

      const oversizedFiles = newFiles.filter(
        (f) => f.size > maxSizeMB * 1024 * 1024,
      );
      if (oversizedFiles.length > 0) {
        const sizeStr =
          maxSizeMB < 1 ? `${maxSizeMB * 1000}KB` : `${maxSizeMB}MB`;
        toast.error(`Some files exceed the ${sizeStr} limit.`);
        return;
      }

      const currentTotal = images.reduce(
        (sum, i) => sum + (i.file?.size ?? 0),
        0,
      );
      const incomingTotal = newFiles.reduce((sum, f) => sum + f.size, 0);
      if (currentTotal + incomingTotal > maxTotalSizeMB * 1024 * 1024) {
        toast.error(`Total upload size can't exceed ${maxTotalSizeMB}MB.`);
        return;
      }

      const newManagedImages: ManagedImage[] = newFiles.map((file) => ({
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: UploadStatus.IDLE,
        progress: 0,
      }));

      setImages((prev) => [...prev, ...newManagedImages]);

      // Kick off upload for each new file
      newManagedImages.forEach((img) => {
        handleUpload(img);
      });
    },
    [limit, images, maxSizeMB, maxTotalSizeMB, handleUpload],
  );

  const removeImage = useCallback(
    async (id: string, deleteFromCloud = true) => {
      const imgToRemove = images.find((i) => i.id === id);
      if (!imgToRemove) return;

      if (imgToRemove.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imgToRemove.previewUrl);
      }

      setImages((prev) => prev.filter((i) => i.id !== id));

      if (deleteFromCloud && imgToRemove.cloudUrl && token) {
        // If it was uploaded in this session, remove from tracking set
        sessionImagesRef.current.delete(imgToRemove.cloudUrl);
        try {
          await AxiosAPI.delete(deleteEndpoint, {
            params: { url: imgToRemove.cloudUrl },
            headers: {
              Authorization: `Bearer ${token}`,
              "cleanup-token": "true",
            },
          });
        } catch {
          // Silently swallow delete errors
        }
      }
    },
    [images, deleteEndpoint, token],
  );

  const reorderImage = useCallback(
    (id: string, direction: "left" | "right") => {
      setImages((prev) => {
        const idx = prev.findIndex((i) => i.id === id);
        if (idx < 0) return prev;
        if (direction === "left" && idx === 0) return prev;
        if (direction === "right" && idx === prev.length - 1) return prev;

        const newImages = [...prev];
        const swapIdx = direction === "left" ? idx - 1 : idx + 1;
        [newImages[idx], newImages[swapIdx]] = [
          newImages[swapIdx],
          newImages[idx],
        ];
        return newImages;
      });
    },
    [],
  );

  const retryUpload = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (img && img.status === "error") {
        handleUpload(img);
      }
    },
    [images, handleUpload],
  );

  const cleanupSessionImages = useCallback(async () => {
    if (sessionImagesRef.current.size === 0 || !token) return;
    const urlsToDelete = Array.from(sessionImagesRef.current);

    for (const url of urlsToDelete) {
      try {
        fetch(
          `${BASE_API_URL}${deleteEndpoint}?url=${encodeURIComponent(url)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "cleanup-token": "true",
            },
            keepalive: true,
          },
        );
      } catch {
        // Silently swallow
      }
    }
    sessionImagesRef.current.clear();
  }, [deleteEndpoint, token]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupSessionImages();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [cleanupSessionImages]);

  const isBypassedRef = useRef(false);
  const bypassCleanup = useCallback(() => {
    isBypassedRef.current = true;
  }, []);

  useEffect(() => {
    return () => {
      if (!isBypassedRef.current) {
        cleanupSessionImages();
      }
    };
  }, [cleanupSessionImages]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    images,
    addFiles,
    removeImage,
    reorderImage,
    retryUpload,
    cleanupSessionImages,
    bypassCleanup,
    setImages,
  };
}
