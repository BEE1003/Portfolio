import { useState } from "react";
import { Film } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = {
  poster: string;
  videoUrl?: string | undefined;
  mediaType?: "image" | "youtube" | undefined;
  title: string;
  controls?: boolean;
  autoPlay?: boolean;
  className?: string;
};

/**
 * 播放專案影片；若影片檔尚未放入 public/videos/ 則自動退回靜態預覽圖。
 */
export function ProjectMedia({
  poster,
  videoUrl,
  mediaType,
  title,
  controls = false,
  autoPlay = false,
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const resolveUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
    const cleanPath = url.replace(/^\/+/, "");
    const base = import.meta.env.BASE_URL || "./";
    return `${base.replace(/\/+$/, "")}/${cleanPath}`;
  };

  const finalVideoUrl = resolveUrl(videoUrl);

  if (mediaType === "youtube" && finalVideoUrl) {
    const videoId = new URL(finalVideoUrl).searchParams.get("v");
    const start = new URL(finalVideoUrl).searchParams.get("t")?.replace(/\D/g, "");
    const embedUrl = videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0${start ? `&start=${start}` : ""}`
      : undefined;

    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          title={`${title} 遊戲影片`}
          className={`h-full w-full border-0 ${className}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }
  }

  if (mediaType === "image" && finalVideoUrl) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsImageExpanded(true)}
          title="點擊放大圖片"
          className={`flex h-full w-full cursor-zoom-in items-center justify-center bg-code-bg p-4 sm:p-6 ${className}`}
        >
          <img
            src={finalVideoUrl}
            alt={`${title} 遊戲畫面`}
            loading="lazy"
            className="block max-h-full max-w-full object-contain shadow-lg"
          />
        </button>

        <Dialog open={isImageExpanded} onOpenChange={setIsImageExpanded}>
          <DialogContent className="max-h-[94vh] max-w-[96vw] border-border/80 bg-code-bg/95 p-3 shadow-2xl backdrop-blur-md sm:p-5">
            <DialogTitle className="sr-only">{title} 圖片放大預覽</DialogTitle>
            <div className="flex max-h-[86vh] items-center justify-center overflow-auto">
              <img
                src={finalVideoUrl}
                alt={`${title} 圖片放大預覽`}
                className="h-auto max-h-[86vh] w-auto max-w-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const finalPosterUrl = resolveUrl(poster) ?? poster;

  if (!finalVideoUrl || failed) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={finalPosterUrl}
          alt={`${title} 遊戲畫面`}
          loading="lazy"
          width={1280}
          height={720}
          className="h-full w-full object-cover"
        />
        {controls && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-sm bg-background/80 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur">
            <Film className="h-3.5 w-3.5" />
            將影片放入 public/{videoUrl?.replace(/^\/+/, "") ?? "videos/demo.mp4"} 即會自動播放
          </div>
        )}
      </div>
    );
  }

  return (
    <video
      src={finalVideoUrl}
      poster={finalPosterUrl}
      controls={controls}
      autoPlay={autoPlay}
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
