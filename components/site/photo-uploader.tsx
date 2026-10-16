"use client";

import { useRef, useState } from "react";
import { Images, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB (serverless request-body safe)
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface PhotoUploaderProps {
  /** uploaded photo urls (site-local /uploads/…) */
  value: string[];
  onChange: (urls: string[]) => void;
  /** maximum number of photos allowed */
  max?: number;
  disabled?: boolean;
  /** id + label wiring for a11y */
  id: string;
  label?: string;
}

/**
 * Multi-photo uploader for the community forms: hidden file input +
 * "Add Photos" button, sequential uploads to /api/upload with per-file
 * spinner placeholders and removable thumbnails. Styled for dark
 * royal-panel cards.
 */
export function PhotoUploader({
  value,
  onChange,
  max = 6,
  disabled = false,
  id,
  label = "Add Photos",
}: PhotoUploaderProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const keyRef = useRef(0);
  const [queue, setQueue] = useState<{ key: number; name: string }[]>([]);
  const uploading = queue.length > 0;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const room = max - value.length;
    if (room <= 0) {
      toast({
        title: "Photo limit reached",
        description: `You can attach up to ${max} photos.`,
        variant: "destructive",
      });
      return;
    }

    const files = Array.from(fileList);
    const selected = files.slice(0, room);
    if (files.length > room) {
      toast({
        title: "Photo limit",
        description: `Only ${room} more photo${room === 1 ? "" : "s"} could be selected (max ${max}).`,
      });
    }

    // placeholders with a spinner, one per queued file
    const entries = selected.map((file) => ({ key: keyRef.current++, name: file.name }));
    setQueue((q) => [...q, ...entries]);

    let combined = [...value];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      const entry = entries[i];
      try {
        if (!ALLOWED_TYPES.has(file.type)) {
          toast({
            title: "Unsupported file",
            description: `"${file.name}" is not a JPG, PNG or WebP image.`,
            variant: "destructive",
          });
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          toast({
            title: "File too large",
            description: `"${file.name}" is larger than 6 MB.`,
            variant: "destructive",
          });
          continue;
        }

        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data: { success?: boolean; url?: string; error?: string } = await res.json();
        if (!res.ok || !data.success || !data.url) {
          throw new Error(data.error ?? "Upload failed");
        }
        combined = [...combined, data.url];
        onChange(combined);
      } catch (err) {
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : `"${file.name}" could not be uploaded.`,
          variant: "destructive",
        });
      } finally {
        setQueue((q) => q.filter((e) => e.key !== entry.key));
      }
    }
  }

  const full = value.length >= max;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        aria-label="Choose photos to upload"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || uploading || full}
        onClick={() => inputRef.current?.click()}
        className="h-11 rounded-xl border-white/25 bg-white/10 text-cream hover:bg-white/20 hover:text-white font-semibold"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Images className="h-4 w-4" />}
        {full ? `Photos (${value.length}/${max})` : `${label} (${value.length}/${max})`}
      </Button>

      {(value.length > 0 || queue.length > 0) && (
        <div className="flex flex-wrap gap-2.5">
          {value.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative h-20 w-28 overflow-hidden rounded-xl border border-white/20 group"
            >
              <img
                src={url}
                alt={`Attached photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                disabled={disabled || uploading}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-forest-deep/80 text-white hover:bg-brick transition-colors"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
          {queue.map((entry) => (
            <div
              key={entry.key}
              className="h-20 w-28 rounded-xl border border-white/20 bg-white/10 flex flex-col items-center justify-center gap-1.5"
              aria-label={`Uploading ${entry.name}`}
            >
              <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden="true" />
              <span className="text-[10px] text-sage/70 max-w-24 truncate px-1">{entry.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
