import Link from "next/link";
import { Camera, LogOut, Sparkles, Images } from "lucide-react";

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            <Camera className="h-4 w-4" />
          </span>
          장사한컷
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/dashboard/generate"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
          >
            <Sparkles className="h-4 w-4" /> 새로 만들기
          </Link>
          <Link
            href="/dashboard/gallery"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
          >
            <Images className="h-4 w-4" /> 내 갤러리
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-stone-500 md:inline">{email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
            >
              <LogOut className="h-3.5 w-3.5" /> 로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
