import { createClient } from "@/lib/supabase/server";
import { GenerateForm } from "./GenerateForm";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("restaurant_name, cuisine_type, signature_menu, mood, target_audience")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-stone-900">새 콘텐츠 만들기</h1>
        <p className="mt-2 text-stone-600">
          가게 정보를 입력하면 AI가 인스타에 바로 올릴 이미지/영상을 만들어드려요.
        </p>
      </header>

      <GenerateForm initialProfile={profile ?? null} />
    </main>
  );
}
