"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Generation {
  id: string;
  type: "image" | "video";
  prompt: string;
  status: string;
  output_url: string | null;
  runway_task_id: string | null;
  created_at: string;
}

export function GalleryGrid({
  generations,
  highlightId,
}: {
  generations: Generation[];
  highlightId?: string;
}) {
  const [items, setItems] = useState(generations);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const pending = items.filter((g) => g.status === "PENDING" || g.status === "RUNNING" || g.status === "THROTTLED");

  useEffect(() => {
    if (pending.length === 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setPolling(false);
      return;
    }

    setPolling(true);
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/generations/sync", { method: "POST" });
      if (res.ok) {
        const { generations } = await res.json();
        setItems(generations);
      }
    }, 6000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pending.length]);

  async function handleDelete(id: string) {
    if (!confirm("이 콘텐츠를 삭제할까요?")) return;
    const res = await fetch(`/api/generations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((p) => p.filter((g) => g.id !== id));
    }
  }

  async function handleDownload(item: Generation) {
    if (!item.output_url) return;
    try {
      const res = await fetch(item.output_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = item.type === "video" ? "mp4" : "png";
      a.download = `jangsa-${item.id.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(item.output_url, "_blank");
    }
  }

  async function handleRefresh() {
    const res = await fetch("/api/generations/sync", { method: "POST" });
    if (res.ok) {
      const { generations } = await res.json();
      setItems(generations);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-16 text-center">
        <p className="text-stone-500">아직 만든 콘텐츠가 없어요.</p>
        <a
          href="/dashboard/generate"
          className="mt-3 inline-block font-semibold text-brand-600 hover:underline"
        >
          첫 콘텐츠 만들기 →
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {items.length}개 · {pending.length > 0 ? `${pending.length}개 생성 중` : "최신 상태"}
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          {polling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
          새로고침
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isHighlighted = highlightId === item.id;
          const isReady = item.status === "SUCCEEDED" && item.output_url;
          const isFailed = item.status === "FAILED" || item.status === "CANCELLED";
          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                isHighlighted ? "border-brand-500 ring-2 ring-brand-200" : "border-stone-200"
              }`}
            >
              <div className="relative aspect-square bg-stone-100">
                {isReady ? (
                  item.type === "video" ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video
                      src={item.output_url!}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.output_url!}
                      alt={item.prompt}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : isFailed ? (
                  <div className="grid h-full place-items-center text-sm text-red-500">
                    생성 실패
                  </div>
                ) : (
                  <div className="grid h-full place-items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                    <span className="text-xs text-stone-500">AI가 만드는 중…</span>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {item.type === "video" ? "VIDEO" : "IMAGE"}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <p className="line-clamp-2 text-sm text-stone-700">{item.prompt}</p>
                <p className="text-xs text-stone-400">{formatDate(item.created_at)}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!isReady}
                    onClick={() => handleDownload(item)}
                  >
                    <Download className="h-3.5 w-3.5" /> 다운로드
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
