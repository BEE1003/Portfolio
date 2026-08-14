import { useState } from "react";
import { Film } from "lucide-react";

type Props = {
  poster: string;
  videoUrl?: string | undefined;
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
  title,
  controls = false,
  autoPlay = false,
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!videoUrl || failed) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={poster}
          alt={`${title} 遊戲畫面`}
          loading="lazy"
          width={1280}
          height={720}
          className="h-full w-full object-cover"
        />
        {controls && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-sm bg-background/80 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur">
            <Film className="h-3.5 w-3.5" />
            將影片放入 public{videoUrl ?? "/videos/demo.mp4"} 即會自動播放
          </div>
        )}
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      poster={poster}
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
