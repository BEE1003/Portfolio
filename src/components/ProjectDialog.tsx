import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [copied, setCopied] = useState(false);

  // 切換專案時，分頁回到第一個
  useEffect(() => {
    setFileIndex(0);
    setVideoIndex(0);
    setCopied(false);
  }, [project?.id]);

  const activeFile = project?.codeFiles[fileIndex] ?? project?.codeFiles[0];
  const activeVideo = project?.videoFiles?.[videoIndex] ?? project?.videoFiles?.[0];

  const copy = async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-border bg-popover p-0">
        {project && (
          <div>
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

            {project.videoFiles && project.videoFiles.length > 1 && (
              <div className="border-b border-border bg-card px-6 py-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="font-mono text-xs text-muted-foreground">VIDEO CLIPS</span>
                  {activeVideo?.summary && (
                    <span className="text-xs text-muted-foreground">{activeVideo.summary}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.videoFiles.map((video, i) => (
                    <button
                      key={video.url}
                      type="button"
                      onClick={() => setVideoIndex(i)}
                      aria-pressed={i === videoIndex}
                      className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
                        i === videoIndex
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {video.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-8 p-6 sm:p-8">
              <DialogHeader className="space-y-3 text-left">
                <p className="section-label">
                  {project.year}{project.role ? ` · ${project.role}` : ""}
                </p>
                <DialogTitle className="text-3xl">{project.title}</DialogTitle>
                <p className="text-muted-foreground">{project.tagline}</p>
              </DialogHeader>

              <dl className="grid gap-4 border-y border-border py-4 font-mono text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">ENGINE</dt>
                  <dd className="mt-1 text-foreground">{project.engine}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">PLATFORM</dt>
                  <dd className="mt-1 text-foreground">{project.platforms.join(" / ")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">STACK</dt>
                  <dd className="mt-1 text-foreground">{project.tags.join(", ")}</dd>
                </div>
              </dl>

              <section className="space-y-3">
                <h3 className="text-lg">專案詳細內容</h3>
                <p className="leading-relaxed text-muted-foreground">{project.overview}</p>
                <ul className="space-y-2 pt-2">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-primary" />
                      {h}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg">程式碼片段</h3>
                  <Button variant="outline" size="sm" onClick={copy} className="font-mono text-xs">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "已複製" : "複製"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {project.codeFiles.map((file, i) => (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => {
                        setFileIndex(i);
                        setCopied(false);
                      }}
                      aria-pressed={i === fileIndex}
                      className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
                        i === fileIndex
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>

                {activeFile && (
                  <>
                    <p className="text-sm text-muted-foreground">{activeFile.summary}</p>
                    <div className="overflow-hidden border border-border bg-code-bg">
                      <div className="flex items-center gap-2 border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {activeFile.name}
                      </div>
                      <pre className="max-h-[420px] overflow-auto p-4 font-mono text-[13px] leading-relaxed text-foreground/90">
                        <code>{activeFile.code}</code>
                      </pre>
                    </div>
                  </>
                )}
              </section>

              <div className="flex flex-wrap gap-2">
                {project.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="font-mono text-[11px]">
                    {t}
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
