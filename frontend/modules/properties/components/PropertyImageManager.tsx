"use client";
import { useRef, useState, useEffect } from "react";
import { Upload, Star, Trash2 } from "lucide-react";
import { PropertyItem, PropertyImage as ImageRecord } from "../types";
import { propertiesApi } from "../api";
import { Button, Alert, Badge, Modal } from "@/shared/components/ui";
import { PropertyImage } from "@/shared/components/ui/PropertyImage";

type UploadItem = {
  file: File;
  state: "waiting" | "uploading" | "done" | "failed";
  error?: string;
};
export interface PropertyImageManagerProps {
  property: PropertyItem;
  onUpdate: (p: PropertyItem) => void;
  onClose: () => void;
  onBusyChange?: (busy: boolean) => void;
}
export function PropertyImageManager({
  property,
  onUpdate,
  onClose,
  onBusyChange,
}: PropertyImageManagerProps) {
  const [images, setImages] = useState<ImageRecord[]>(property.images || []),
    [queue, setQueue] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [drag, setDrag] = useState(false),
    [deleting, setDeleting] = useState<ImageRecord | null>(null);
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  function update(p: PropertyItem) {
    setImages(p.images || []);
    onUpdate(p);
  }
  async function upload(items: UploadItem[]) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    const next = items.map((item) => ({ ...item }));
    setQueue([...next]);
    for (let i = 0; i < next.length; i++) {
      if (next[i].state === "done") continue;
      next[i] = { ...next[i], state: "uploading", error: undefined };
      setQueue([...next]);
      try {
        const res = await propertiesApi.uploadImages(property.id, [
          next[i].file,
        ]);
        update(res.data);
        next[i] = { ...next[i], state: "done" };
      } catch (e) {
        next[i] = {
          ...next[i],
          state: "failed",
          error: e instanceof Error ? e.message : "Upload failed",
        };
      }
      setQueue([...next]);
    }
    pending.current = false;
    setBusy(false);
    if (input.current) input.current.value = "";
  }
  function files(selected: FileList | null) {
    if (!selected || busy) return;
    const chosen = Array.from(selected);
    setError("");
    if (images.length + chosen.length > 15) {
      setError(
        "A property can have up to 15 photos. Remove a photo or select fewer files.",
      );
      return;
    }
    if (
      chosen.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Choose JPEG, PNG, or WebP photos, each no larger than 5 MB.");
      if (input.current) input.current.value = "";
      return;
    }
    upload(chosen.map((file) => ({ file, state: "waiting" })));
  }
  async function cover(id: string) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      update((await propertiesApi.setPrimaryImage(property.id, id)).data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not change the cover photo.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      update((await propertiesApi.deleteImage(property.id, deleting.id)).data);
      setDeleting(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the photo.");
      setDeleting(null);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5" aria-busy={busy}>
      <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-600">
        <span>
          Photos <Badge variant="primary">{images.length} / 15</Badge>
        </span>
        <span>JPEG, PNG, WebP · up to 5 MB each</span>
      </div>
      {error && (
        <Alert variant="error" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}
      {images.length < 15 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            files(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center ${drag ? "bg-brand-50 border-brand-500" : "bg-slate-50 border-slate-300"}`}
        >
          <Upload
            aria-hidden="true"
            className="mx-auto mb-3 text-brand-600"
            size={30}
          />
          <p className="font-semibold text-slate-800 mb-2">
            Show the property at its best
          </p>
          <p className="text-sm text-slate-600 mb-4">
            Choose clear exterior, room, and floor-plan photos.
          </p>
          <Button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            Choose photos
          </Button>
          <input
            ref={input}
            id="property-photo-upload"
            aria-label="Upload property photos"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => files(e.target.files)}
          />
          <p className="text-xs text-slate-600 mt-3">
            Or drag and drop here. Choose a cover photo after uploading.
          </p>
        </div>
      )}
      {queue.length > 0 && (
        <div aria-live="polite" className="space-y-2">
          <p className="font-medium text-sm">
            {queue.filter((i) => i.state === "done").length} of {queue.length}{" "}
            photos uploaded
          </p>
          <progress
            className="w-full accent-brand-600"
            max={queue.length}
            value={queue.filter((i) => i.state === "done").length}
          />
          {queue.map((item, index) => (
            <div
              key={index}
              className="flex flex-wrap justify-between gap-1 text-sm"
            >
              <span className="truncate max-w-[65%]">{item.file.name}</span>
              <span
                className={
                  item.state === "failed" ? "text-rose-700" : "text-slate-600"
                }
              >
                {item.state === "done"
                  ? "Uploaded"
                  : item.state === "failed"
                    ? "Failed"
                    : item.state === "uploading"
                      ? "Uploading…"
                      : "Waiting"}
              </span>
              {item.error && (
                <p className="w-full text-xs text-rose-700">{item.error}</p>
              )}
            </div>
          ))}
          {queue.some((i) => i.state === "failed") && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => upload(queue)}
            >
              Retry failed photos
            </Button>
          )}
        </div>
      )}
      {images.length === 0 ? (
        <p className="p-6 border rounded-xl text-center text-sm text-slate-600">
          No photos yet. Add a clear cover photo before publishing.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`overflow-hidden border rounded-xl ${img.isPrimary ? "ring-2 ring-brand-500" : "border-slate-200"}`}
            >
              <PropertyImage
                src={img.url}
                alt={img.caption || `Property photo ${index + 1}`}
                className="h-28 w-full object-cover"
              />
              <div className="p-2 flex flex-wrap gap-2 justify-between items-center">
                {img.isPrimary ? (
                  <span className="text-xs font-semibold text-brand-700 inline-flex items-center gap-1">
                    <Star size={14} aria-hidden="true" />
                    Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => cover(img.id)}
                    className="text-xs font-semibold text-brand-700 px-1 py-2"
                  >
                    Make cover
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDeleting(img)}
                  className="p-2 text-rose-700 rounded-lg hover:bg-rose-50"
                  aria-label={`Delete photo ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end border-t pt-4">
        <Button disabled={busy} variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
      {deleting && (
        <Modal
          isOpen
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
          title="Delete this photo?"
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" isLoading={busy} onClick={remove}>
                Delete photo
              </Button>
            </>
          }
        >
          <PropertyImage
            src={deleting.url}
            alt="Photo selected for deletion"
            className="h-40 w-full object-cover rounded-xl"
          />
          <p className="text-sm text-slate-600 mt-3">
            This removes the photo from the listing. You can upload it again
            later.
          </p>
        </Modal>
      )}
    </div>
  );
}
