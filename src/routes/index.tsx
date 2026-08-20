import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Mail, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";
import { projects, type Project } from "@/data/projects";
import { ProjectMedia } from "@/components/ProjectMedia";
import { ProjectDialog } from "@/components/ProjectDialog";
import { Avatar } from "@/components/Avatar";
import avatarImg from "@/assets/avatar.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "黃大峰 | Unity 遊戲工程師作品集" },
      {
        name: "description",
        content:
          "Unity 工程師黃大峰的作品集：VR 多人連線元宇宙、WebGL 網頁遊戲、UDP 展場工具與 AR/VR 產品提案，含影片與程式碼。",
      },
      { property: "og:title", content: "黃大峰 | Unity 遊戲工程師作品集" },
      {
        property: "og:description",
        content: "VR 多人連線、WebGL 網頁遊戲、展場互動與 AR/VR 原型開發，附影片與實作程式碼。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

export function Index() {
  const [active, setActive] = useState<Project | null>(null);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <a href="#top" className="font-mono text-xs sm:text-sm font-semibold tracking-[0.2em] text-foreground">
            TF.HUANG
          </a>
          <div className="flex items-center gap-4 sm:gap-8 font-mono text-xs sm:text-sm text-foreground/80">
            <a href="#about" className="transition-colors hover:text-foreground">
              ABOUT
            </a>
            <a href="#work" className="transition-colors hover:text-foreground">
              WORK
            </a>
            <a href="#contact" className="transition-colors hover:text-foreground">
              CONTACT
            </a>
          </div>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 sm:px-6 pt-16 pb-16 text-center">
          <div className="mx-auto max-w-2xl">
            <Avatar src={avatarImg} alt="黃大峰" fallback="黃" size="xl" />
            <p className="section-label mt-10 text-sm sm:text-base tracking-[0.25em]">Unity Engineer</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              黃大峰
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
              Unity 工程師，具 VR / AR、WebGL 網頁遊戲、多人連線與後台 API 串接開發經驗，
              熟悉 Android APK 打包與 Git 版控。下方每個專案都附上實機影片與實作細節。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="cursor-pointer font-mono text-base sm:text-lg tracking-wider px-8 py-6 hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <a href="#work">檢視作品集</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="cursor-pointer font-mono text-base sm:text-lg tracking-wider px-8 py-6"
              >
                <a href="#contact">聯絡我</a>
              </Button>
            </div>
            <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-border pt-8 font-mono">
              {[
                ["VR / AR / WebGL", "專案類型"],
                ["C# · Unity3D", "主要技術"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="text-xs sm:text-sm text-muted-foreground">{k}</dt>
                  <dd className="mt-1.5 text-base sm:text-lg font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Experience */}
        <section id="about" className="border-t border-border py-20">
          <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="section-label">Experience</p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">經歷</h2>
              <ol className="mt-8 space-y-8 border-l border-border pl-6">
                <li className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
                  <p className="font-mono text-xs sm:text-sm text-muted-foreground">2024/8 – 2026/5</p>
                  <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground">Unity 工程師 · 愛吠的狗娛樂股份有限公司</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-muted-foreground">
                    負責多個跨平台專案的核心架構設計與功能開發，涵蓋多人連線 VR、WebGL 網頁遊戲、
                    展場互動、商務原型（POC）以及既有專案的重構與錯誤修復。
                  </p>
                </li>
                <li className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
                  <p className="font-mono text-xs sm:text-sm text-muted-foreground">2022/9 – 2023/6</p>
                  <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground">遊戲程式 · 畢業專題「太空狗狗GO!」</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-muted-foreground">
                    負責程式設計與關卡設計，帶領 4 人團隊重新定位遊戲方向，
                    加入解謎機關與傳送門、引力裝置，獲得競賽第三名。
                  </p>
                </li>
                <li className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
                  <p className="font-mono text-xs sm:text-sm text-muted-foreground">2019/9 – 2023/6</p>
                  <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground">南臺科技大學 · 多媒體與電腦娛樂科學系</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-muted-foreground">大學畢業</p>
                </li>
              </ol>
            </div>

            <div>
              <p className="section-label">Skills &amp; Certifications</p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">技術與認證</h2>
              <ul className="mt-8 space-y-3.5 text-sm sm:text-base text-muted-foreground">
                {[
                  "VR、AR 專案開發經驗",
                  "WebGL 網頁遊戲、HTML 交互技術開發經驗",
                  "多人連線專案開發經驗",
                  "後台 API 串接開發經驗",
                  "Android 手機／平板 APK 開發經驗",
                  "Git 版本控制管理技術經驗",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-primary rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {[
                  ["Unity 程式設計師認證", "wxNVD-2FNY"],
                  ["Unity 藝術設計師認證", "wXUWX-48H4"],
                ].map(([name, meta]) => (
                  <div key={name} className="border border-border/80 bg-card p-4 rounded-lg">
                    <p className="text-sm sm:text-base font-semibold text-foreground">{name}</p>
                    <p className="mt-1 font-mono text-xs sm:text-sm text-muted-foreground">{meta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Work */}
        <section id="work" className="border-t border-border py-20">
          <div className="mx-auto max-w-5xl px-6">
            <p className="section-label">Selected Work</p>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">作品集</h2>
            <p className="mt-3 max-w-lg text-sm sm:text-base text-muted-foreground">
              點擊任一專案，觀看實機影片與技術重點。
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {projects.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(p)}
                  className={`group relative overflow-hidden border border-border bg-card/90 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/90 hover:bg-card hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_70%,transparent),0_0_22px_color-mix(in_oklab,var(--primary)_38%,transparent),0_0_56px_color-mix(in_oklab,var(--primary)_26%,transparent)] rounded-lg ${
                    i === 0 ? "md:col-span-2" : ""
                  }`}
                >
                  <div className={`overflow-hidden ${i === 0 ? "aspect-video md:aspect-[21/9]" : "aspect-video"}`}>
                    <ProjectMedia
                      poster={p.poster}
                      videoUrl={p.videoFiles?.[0]?.url}
                      title={p.title}
                      autoPlay
                      className="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">{p.title}</h3>
                      </div>
                      <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-muted-foreground">{p.tagline}</p>
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {p.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="font-mono text-xs px-2.5 py-0.5">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="border-t border-border py-20">
          <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-2">
            <div>
              <p className="section-label">Get in touch</p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">聯絡我</h2>
              <ul className="mt-8 space-y-4 font-mono text-sm sm:text-base">
                <li className="inline-flex items-center gap-3 text-muted-foreground select-text">
                  <Mail className="h-4.5 w-4.5 text-primary" /> bee881003@gmail.com
                </li>
              </ul>
            </div>

            <form
              ref={formRef}
              className="space-y-4 border border-border bg-card/95 p-6 rounded-xl shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
              onSubmit={async (e) => {
                e.preventDefault();
                if (sendStatus === "sending") return;
                setSendStatus("sending");
                try {
                  await emailjs.sendForm(
                    "service_pcu5bbr",
                    "template_azkkbt1",
                    formRef.current!,
                    { publicKey: "3PzDvOGNA0Gxrm-_s" }
                  );
                  setSendStatus("success");
                  formRef.current?.reset();
                  setTimeout(() => setSendStatus("idle"), 4000);
                } catch {
                  setSendStatus("error");
                  setTimeout(() => setSendStatus("idle"), 4000);
                }
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="font-mono text-xs sm:text-sm font-medium text-muted-foreground">
                    NAME
                  </label>
                  <Input id="name" name="from_name" required placeholder="你的名字" className="text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="font-mono text-xs sm:text-sm font-medium text-muted-foreground">
                    EMAIL
                  </label>
                  <Input id="email" name="from_email" type="email" required placeholder="you@studio.com" className="text-sm sm:text-base" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="font-mono text-xs sm:text-sm font-medium text-muted-foreground">
                  MESSAGE
                </label>
                <Textarea id="message" name="message" required rows={6} placeholder="想聊聊的內容…" className="text-sm sm:text-base" />
              </div>
              <Button
                type="submit"
                disabled={sendStatus === "sending" || sendStatus === "success"}
                className="w-full cursor-pointer font-mono text-sm tracking-wider py-2.5 flex items-center justify-center gap-2"
              >
                {sendStatus === "idle" && <><Send className="h-4 w-4" />送出訊息</>}
                {sendStatus === "sending" && <><Loader2 className="h-4 w-4 animate-spin" />傳送中…</>}
                {sendStatus === "success" && <><CheckCircle className="h-4 w-4" />已送出！</>}
                {sendStatus === "error" && <><XCircle className="h-4 w-4" />傳送失敗，請再試一次</>}
              </Button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 font-mono text-xs sm:text-sm text-muted-foreground">
          Huang Ta-Feng — Unity Engineer.
        </div>
      </footer>

      <ProjectDialog project={active} onOpenChange={(open) => !open && setActive(null)} />
    </div>
  );
}
