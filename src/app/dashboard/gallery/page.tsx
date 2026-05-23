import { createClient } from "@/lib/supabase/server";
import { GalleryGrid } from "./GalleryGrid";

interface Search {
  highlight?: string;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select("id, type, prompt, status, output_url, runway_task_id, created_at")
    .order("created_at", { ascending: false });

  const { highlight } = await searchParams;

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-stone-900">내 갤러리</h1>
        <p className="mt-2 text-stone-600">
          마음에 드는 콘텐츠를 다운로드해 인스타그램에 올려보세요.
        </p>
      </header>

      <GalleryGrid generations={data ?? []} highlightId={highlight} />
    </main>
  );
}
