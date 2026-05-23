import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTask } from "@/lib/runway";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: pending } = await supabase
    .from("generations")
    .select("id, runway_task_id, status")
    .eq("user_id", user.id)
    .in("status", ["PENDING", "RUNNING", "THROTTLED"]);

  await Promise.all(
    (pending ?? []).map(async (g) => {
      if (!g.runway_task_id) return;
      try {
        const t = await getTask(g.runway_task_id);
        const update: Record<string, unknown> = { status: t.status };
        if (t.status === "SUCCEEDED" && t.output?.[0]) {
          update.output_url = t.output[0];
        }
        if (t.failure) {
          update.error_message = t.failure;
        }
        await supabase.from("generations").update(update).eq("id", g.id);
      } catch (e) {
        await supabase
          .from("generations")
          .update({
            status: "FAILED",
            error_message: e instanceof Error ? e.message : "동기화 실패",
          })
          .eq("id", g.id);
      }
    })
  );

  const { data: generations } = await supabase
    .from("generations")
    .select("id, type, prompt, status, output_url, runway_task_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ generations: generations ?? [] });
}
