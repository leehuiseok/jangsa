import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Download, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white">
            <Camera className="h-5 w-5" />
          </span>
          장사한컷
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">로그인</Button>
          </Link>
          <Link href="/signup">
            <Button>회원가입</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> AI가 만들어주는 음식점 인스타 콘텐츠
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-stone-900 md:text-5xl">
              사장님의 한 마디면,
              <br />
              <span className="text-brand-500">한 컷</span>이 나옵니다.
            </h1>
            <p className="text-lg text-stone-600">
              메뉴와 분위기만 입력하세요. Runway AI가 인스타에 바로 올릴 수 있는
              사진과 짧은 영상을 만들어드립니다. 다운로드 후 인스타그램에
              업로드만 하면 끝.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">무료로 시작하기</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  이미 계정이 있어요
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 pt-4 text-sm text-stone-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> 사장님 정보는 안전하게 보호돼요
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" /> 결과물은 즉시 다운로드
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 -top-6 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
            <div className="absolute -bottom-10 -right-6 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { tag: "이미지", title: "시그니처 메뉴", emoji: "🍜" },
                { tag: "영상", title: "분위기 컷", emoji: "🍷" },
                { tag: "이미지", title: "디저트 클로즈업", emoji: "🍰" },
                { tag: "영상", title: "런치 프로모", emoji: "🥗" },
              ].map((card, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="grid h-full place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-amber-100 text-6xl">
                    {card.emoji}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500">
                      {card.tag}
                    </span>
                    <span className="text-sm font-semibold">{card.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "가게 정보 입력",
              desc: "상호, 메뉴, 분위기, 타겟 고객을 입력해주세요.",
            },
            {
              step: "02",
              title: "AI가 자동 생성",
              desc: "Runway 모델로 인스타용 이미지·영상을 만들어드려요.",
            },
            {
              step: "03",
              title: "다운로드 후 업로드",
              desc: "결과물을 다운로드해 직접 인스타그램에 올리세요.",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-stone-200 bg-white p-6">
              <span className="text-sm font-bold text-brand-500">{s.step}</span>
              <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-stone-500 md:flex-row">
          <p>© 2026 장사한컷</p>
          <p>Powered by Runway · Supabase · Vercel</p>
        </div>
      </footer>
    </main>
  );
}
