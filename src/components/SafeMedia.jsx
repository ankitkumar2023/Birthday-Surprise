import { useState } from "react";
import { ImageIcon, VideoIcon } from "lucide-react";

// If a media file hasn't been added yet, show a pretty placeholder that
// names the missing path instead of a broken-image icon.
export function Placeholder({ src, kind, className }) {
  const Icon = kind === "video" ? VideoIcon : ImageIcon;
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-linear-to-br from-blush-300/25 via-lilac-400/20 to-gold-300/20 p-4 text-center text-blush-100/80 ${className}`}
    >
      <Icon className="size-8" />
      <span className="text-xs break-all">Add {src}</span>
    </div>
  );
}

export function SafeImage({ src, alt = "", className = "", placeholderClassName = "aspect-4/5" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Placeholder src={src} kind="image" className={placeholderClassName} />;
  return (
    <img src={src} alt={alt} loading="lazy" draggable={false} onError={() => setFailed(true)} className={className} />
  );
}

export function SafeVideo({ src, poster, className = "", placeholderClassName = "aspect-video" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Placeholder src={src} kind="video" className={placeholderClassName} />;
  return (
    <video
      src={src}
      poster={poster}
      controls
      autoPlay
      playsInline
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
