"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Image as ImageIcon, Video } from "lucide-react";
import { ReferenceUploader } from "@/components/ReferenceUploader";

interface Profile {
  restaurant_name?: string | null;
  cuisine_type?: string | null;
  signature_menu?: string | null;
  mood?: string | null;
  target_audience?: string | null;
}

export function GenerateForm({ initialProfile }: { initialProfile: Profile | null }) {
  const router = useRouter();
  const [type, setType] = useState<"image" | "video">("image");
  const [form, setForm] = useState({
    restaurantName: initialProfile?.restaurant_name ?? "",
    cuisineType: initialProfile?.cuisine_type ?? "한식",
    signatureMenu: initialProfile?.signature_menu ?? "",
    mood: initialProfile?.mood ?? "따뜻하고 아늑한",
    targetAudience: initialProfile?.target_audience ?? "20-30대 직장인",
    extra: "",
    storyConcept: "",
    ratioImage: "1080:1080" as const,
    ratioVideo: "768:1280" as "768:1280" | "1280:768",
    durationVideo: 10 as 5 | 10,
    referenceImageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = type === "image" ? "/api/generate/image" : "/api/generate/video";
      const payload =
        type === "image"
          ? {
              restaurantName: form.restaurantName,
              cuisineType: form.cuisineType,
              signatureMenu: form.signatureMenu,
              mood: form.mood,
              targetAudience: form.targetAudience,
              extra: form.extra,
              ratio: form.ratioImage,
              referenceImageUrl: form.referenceImageUrl || undefined,
            }
          : {
              restaurantName: form.restaurantName,
              cuisineType: form.cuisineType,
              signatureMenu: form.signatureMenu,
              mood: form.mood,
              targetAudience: form.targetAudience,
              extra: form.extra,
              storyConcept: form.storyConcept,
              ratio: form.ratioVideo,
              duration: form.durationVideo,
              referenceImageUrl: form.referenceImageUrl || undefined,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "생성에 실패했습니다.");
      }

      router.push(`/dashboard/gallery?highlight=${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>가게 정보</CardTitle>
            <CardDescription>한 번 입력하면 자동으로 저장돼요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">가게 이름 *</Label>
              <Input
                id="restaurantName"
                value={form.restaurantName}
                onChange={(e) => update("restaurantName", e.target.value)}
                placeholder="예: 한컷한식당"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuisineType">음식 종류 *</Label>
              <Select
                id="cuisineType"
                value={form.cuisineType}
                onChange={(e) => update("cuisineType", e.target.value)}
              >
                <option>한식</option>
                <option>중식</option>
                <option>일식</option>
                <option>양식</option>
                <option>분식</option>
                <option>카페/디저트</option>
                <option>주점/이자카야</option>
                <option>패스트푸드</option>
                <option>아시안</option>
                <option>퓨전</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="signatureMenu">시그니처 메뉴 *</Label>
              <Input
                id="signatureMenu"
                value={form.signatureMenu}
                onChange={(e) => update("signatureMenu", e.target.value)}
                placeholder="예: 숯불 양념갈비, 트러플 크림 파스타"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mood">매장 분위기</Label>
              <Input
                id="mood"
                value={form.mood}
                onChange={(e) => update("mood", e.target.value)}
                placeholder="예: 따뜻하고 아늑한, 모던하고 세련된"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">타겟 고객</Label>
              <Input
                id="targetAudience"
                value={form.targetAudience}
                onChange={(e) => update("targetAudience", e.target.value)}
                placeholder="예: 20-30대 직장인, 가족 단위"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="extra">추가 요청 사항 (선택)</Label>
              <Textarea
                id="extra"
                value={form.extra}
                onChange={(e) => update("extra", e.target.value)}
                placeholder="예: 김이 모락모락 나는 느낌, 우드 톤 테이블, 노을빛 조명"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>콘텐츠 옵션</CardTitle>
            <CardDescription>인스타그램에 맞는 사이즈를 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("image")}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                  type === "image"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-stone-200 bg-white text-stone-600"
                }`}
              >
                <ImageIcon className="h-4 w-4" /> 이미지 (Gen-4)
              </button>
              <button
                type="button"
                onClick={() => setType("video")}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                  type === "video"
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-stone-200 bg-white text-stone-600"
                }`}
              >
                <Video className="h-4 w-4" /> 영상 (Gen-3 Turbo)
              </button>
            </div>

            {type === "image" ? (
              <div className="space-y-2">
                <Label>이미지 비율</Label>
                <Select
                  value={form.ratioImage}
                  onChange={(e) => update("ratioImage", e.target.value as typeof form.ratioImage)}
                >
                  <option value="1080:1080">정사각형 1:1 (피드용)</option>
                  <option value="1080:1920">세로 9:16 (스토리/릴스)</option>
                  <option value="1920:1080">가로 16:9 (배너)</option>
                  <option value="1080:1440">세로 4:5 (피드 권장)</option>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>영상 비율</Label>
                  <Select
                    value={form.ratioVideo}
                    onChange={(e) => update("ratioVideo", e.target.value as typeof form.ratioVideo)}
                  >
                    <option value="768:1280">세로 9:16 (릴스/스토리)</option>
                    <option value="1280:768">가로 16:9</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>영상 길이</Label>
                  <Select
                    value={String(form.durationVideo)}
                    onChange={(e) => update("durationVideo", Number(e.target.value) as 5 | 10)}
                  >
                    <option value="10">10초 (권장)</option>
                    <option value="5">5초</option>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {type === "video" && (
          <Card>
            <CardHeader>
              <CardTitle>스토리 컨셉 (선택)</CardTitle>
              <CardDescription>
                한국 드라마 / 넷플릭스 광고 톤은 기본 적용돼요. 특별한 장면이나 감정선이
                있으면 적어주세요. 비워두면 &quot;편견 → 진짜 가치 발견&quot; 기본 스토리로 생성됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.storyConcept}
                onChange={(e) => update("storyConcept", e.target.value)}
                placeholder={`예시:
- 단골 손님이 오랜만에 가게에 들러 첫 한 입에 미소짓는 장면
- 사장님이 새벽부터 재료를 손질하는 정성스러운 손`}
                rows={5}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>메뉴 사진 업로드 (선택)</CardTitle>
            <CardDescription>
              실제 메뉴 사진을 올리시면 AI가 그 사진의 음식 종류를 정확히 반영해 새 컷을 만들어드려요.
              비워두면 카테고리 기본 사진을 사용합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferenceUploader
              value={form.referenceImageUrl}
              onChange={(url) => update("referenceImageUrl", url)}
              disabled={loading}
              className="max-w-sm"
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-500" /> 생성 미리보기
            </CardTitle>
            <CardDescription>
              {type === "image"
                ? "Gen-4 Image · 평균 20-40초"
                : "Gen-3 Turbo · 평균 1-3분"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-stone-600">
              <li>✦ 가게: {form.restaurantName || "—"}</li>
              <li>✦ 메뉴: {form.signatureMenu || "—"}</li>
              <li>✦ 분위기: {form.mood || "—"}</li>
              <li>✦ 타입: {type === "image" ? "이미지" : "영상"}</li>
            </ul>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-4 w-full" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 생성 요청 중…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> 생성하기
                </>
              )}
            </Button>

            <p className="mt-3 text-center text-[11px] text-stone-400">
              생성 후 자동으로 갤러리에 저장됩니다.
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
