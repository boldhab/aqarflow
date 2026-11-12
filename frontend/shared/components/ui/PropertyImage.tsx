"use client";
import { ImgHTMLAttributes, useState } from "react";
import { ImageOff } from "lucide-react";
import { resolvePropertyImage } from "@/shared/lib";
export function PropertyImage({
  src,
  alt,
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = typeof src === "string" ? resolvePropertyImage(src) : "";
  if (!url || failed === url)
    return (
      <div
        role="img"
        aria-label={alt || "Photo unavailable"}
        className={`flex items-center justify-center bg-slate-100 text-slate-500 ${className || ""}`}
      >
        <span className="flex flex-col items-center gap-2">
          <ImageOff aria-hidden="true" size={24} />
          <span className="text-xs">Photo unavailable</span>
        </span>
      </div>
    );
  // Property uploads may live on the application's API host.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      {...props}
      src={url}
      alt={alt || ""}
      className={className}
      loading={props.loading || "lazy"}
      onError={() => setFailed(url)}
    />
  );
}
