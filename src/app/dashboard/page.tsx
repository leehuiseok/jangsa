import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Images, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recent } = await supabase
    .from("generations")
    .select("id, type, prompt, status, output_url, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_name")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold text-stone-900">
          안녕하세요, {profile?.restaurant_name ?? "사장님"} 👋
        </h1>
        <p className="mt-2 text-stone-600">
          오늘은 어떤 한 컷을 만들어볼까요?
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-500" /> 새로 만들기
            </CardTitle>
            <CardDescription>
              메뉴와 분위기를 입력하면 AI가 인스타용 콘텐츠를 만들어드려요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/generate">
              <Button className="w-full">
                생성 시작 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-5 w-5 text-brand-500" /> 내 갤러리
            </CardTitle>
            <CardDescription>
              지금까지 만든 콘텐츠를 모아보고 다운로드하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/gallery">
              <Button variant="outline" className="w-full">
                갤러리 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">최근 생성한 콘텐츠</h2>
          <Link href="/dashboard/gallery" className="text-sm font-semibold text-brand-600 hover:underline">
            전체 보기
          </Link>
        </div>

        {!recent || recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center text-stone-500">
            아직 만든 콘텐츠가 없어요. 첫 한 컷을 만들어보세요!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {recent.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="aspect-square bg-stone-100">
                  {g.status === "SUCCEEDED" && g.output_url ? (
                    g.type === "video" ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={g.output_url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.output_url} alt="" className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-stone-400">
                      {g.status === "FAILED" ? "생성 실패" : "생성 중…"}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-xs text-stone-600">{g.prompt}</p>
                  <p className="mt-1 text-[11px] text-stone-400">{formatDate(g.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
