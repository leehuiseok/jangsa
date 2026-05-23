"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (publicUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ReferenceUploader({ value, onChange, disabled, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("JPG / PNG / WebP 형식만 업로드할 수 있어요.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("10MB 이하 파일만 업로드 가능합니다.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setError("로그인이 필요합니다.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("references")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (upErr) {
      setError(`업로드 실패: ${upErr.message}`);
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from("references").getPublicUrl(path);
    onChange(pub.publicUrl);
    setUploading(false);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    onChange("");
    setError(null);
  }

  if (value) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="reference" className="aspect-square w-full object-cover" />
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="제거"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-emerald-600">
          ✅ 업로드 완료 — 이 사진을 기준으로 결과물이 생성됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-stone-50/50 text-center transition",
          dragOver
            ? "border-brand-500 bg-brand-50"
            : "border-stone-300 hover:border-brand-400 hover:bg-stone-50",
          (disabled || uploading) && "cursor-not-allowed opacity-60"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            <p className="text-xs text-stone-500">업로드 중…</p>
          </>
        ) : (
          <>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700">
                메뉴 사진 업로드
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                클릭하거나 드래그 · JPG/PNG/WebP · 최대 10MB
              </p>
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onPick}
        disabled={disabled || uploading}
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      <p className="text-[11px] text-stone-400">
        <ImageIcon className="mr-1 inline h-3 w-3" />
        사장님 실제 메뉴 사진을 올리시면 훨씬 정확한 결과물이 나옵니다.
      </p>
    </div>
  );
}
