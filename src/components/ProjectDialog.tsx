import { useEffect, useState } from "react";
import { Code2, Layers, Cpu, Monitor, FileCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ProjectMedia } from "@/components/ProjectMedia";
import type { Project } from "@/data/projects";

export function ProjectDialog({
  project,
  onOpenChange,
}: {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [fileIndex, setFileIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);

  // 切換專案時，分頁回到第一個
  useEffect(() => {
    setFileIndex(0);
    setVideoIndex(0);
  }, [project?.id]);

  const activeFile = project?.codeFiles[fileIndex] ?? project?.codeFiles[0];
  const activeVideo = project?.videoFiles?.[videoIndex] ?? project?.videoFiles?.[0];

  const hasRole = Boolean(project?.role && project.role.trim());

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-border/80 bg-popover/95 p-0 shadow-2xl backdrop-blur-md">
        {project && (
          <div className="flex flex-col">
            {/* 影片 / 圖片展示區 */}
            <div className="aspect-video w-full overflow-hidden bg-code-bg">
              <ProjectMedia
                key={activeVideo?.url ?? project.poster}
                poster={project.poster}
                videoUrl={activeVideo?.url}
                title={project.title}
                controls
                autoPlay
                className="h-full w-full"
              />
            </div>

            {/* 多影片切換清單 */}
            {project.videoFiles && project.videoFiles.length > 1 && (
              <div className="border-b border-border/80 bg-card/60 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2.5">
                    {project.videoFiles.map((video, i) => (
                      <button
                        key={video.url}
                        type="button"
                        onClick={() => setVideoIndex(i)}
                        aria-pressed={i === videoIndex}
                        className={`cursor-pointer rounded-lg border px-4 py-2 font-medium text-sm sm:text-base transition-all duration-150 ${
                          i === videoIndex
                            ? "border-primary bg-primary/20 font-semibold text-primary shadow-sm ring-1 ring-primary/40"
                            : "border-border/80 bg-card/80 text-foreground/80 hover:border-primary/50 hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        {video.name}
                      </button>
                    ))}
                  </div>
                  {activeVideo?.summary && (
                    <span className="text-xs sm:text-sm text-muted-foreground font-mono">
                      {activeVideo.summary}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 內容區塊 */}
            <div className="space-y-7 p-6 sm:p-8">
              {/* 標題與基本標籤 */}
              <DialogHeader className="space-y-2.5 text-left">
                {hasRole && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 px-3 py-1 font-mono text-sm font-medium text-primary"
                    >
                      {project.role.trim()}
                    </Badge>
                  </div>
                )}
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {project.title}
                </DialogTitle>
              </DialogHeader>

              {/* 規格資訊卡片 */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-card/40 p-5 font-mono sm:grid-cols-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span>引擎／架構</span>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-foreground">{project.engine}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span>目標平台</span>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    {project.platforms.join(" / ")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    <span>核心技術</span>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    {project.tags.join(", ")}
                  </p>
                </div>
              </div>

              {/* 專案詳細內容 */}
              <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-5 w-1.5 rounded-full bg-primary" />
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">專案詳細內容</h3>
                </div>
                <p className="text-base sm:text-[17px] leading-relaxed text-foreground/90 font-normal">
                  {project.overview}
                </p>
                <div className="rounded-xl border border-border/50 bg-card/30 p-5 sm:p-6">
                  <ul className="space-y-3">
                    {project.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3.5 text-base sm:text-[17px] leading-relaxed text-foreground/85">
                        <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* 程式碼片段 */}
              {project.codeFiles && project.codeFiles.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Code2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">程式碼片段</h3>
                  </div>

                  {/* 程式碼檔案切換 */}
                  {project.codeFiles.length > 1 && (
                    <div className="flex flex-wrap gap-2.5">
                      {project.codeFiles.map((file, i) => (
                        <button
                          key={file.name}
                          type="button"
                          onClick={() => setFileIndex(i)}
                          aria-pressed={i === fileIndex}
                          className={`cursor-pointer rounded-lg border px-3.5 py-2 font-mono text-sm sm:text-base transition-all ${
                            i === fileIndex
                              ? "border-primary bg-primary/20 font-semibold text-primary shadow-xs ring-1 ring-primary/40"
                              : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40 hover:bg-surface/50 hover:text-foreground"
                          }`}
                        >
                          {file.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeFile && (
                    <div className="space-y-2.5">
                      <div className="overflow-hidden rounded-xl border border-border/80 bg-code-bg shadow-inner">
                        <div className="flex items-center justify-between border-b border-border/80 bg-card/50 px-5 py-3">
                          <div className="flex items-center gap-2.5 font-mono text-sm sm:text-base text-muted-foreground">
                            <FileCode className="h-4 w-4 text-primary" />
                            <span className="text-foreground font-medium">{activeFile.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-border/80" />
                            <span className="h-3 w-3 rounded-full bg-border/80" />
                            <span className="h-3 w-3 rounded-full bg-border/80" />
                          </div>
                        </div>
                        <pre className="max-h-[460px] overflow-x-hidden overflow-y-auto p-5 sm:p-6 font-mono text-sm sm:text-[15px] leading-relaxed text-foreground/90 selection:bg-primary/30 whitespace-pre-wrap break-words">
                          <code>{activeFile.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* 專案標籤 */}
              <div className="flex flex-wrap gap-2.5 border-t border-border/60 pt-5">
                {project.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="font-mono text-xs sm:text-sm font-normal tracking-wide text-muted-foreground hover:text-foreground px-3 py-1"
                  >
                    #{t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
