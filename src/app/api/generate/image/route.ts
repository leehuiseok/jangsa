import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildImagePrompt, createImageTask } from "@/lib/runway";

const ImageRequestSchema = z.object({
  restaurantName: z.string().min(1).max(120),
  cuisineType: z.string().min(1).max(60),
  signatureMenu: z.string().min(1).max(200),
  mood: z.string().max(120).optional().default(""),
  targetAudience: z.string().max(120).optional().default(""),
  extra: z.string().max(500).optional().default(""),
  ratio: z
    .enum(["1080:1080", "1080:1920", "1920:1080", "1080:1440", "1440:1080", "1024:1024"])
    .default("1080:1080"),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = ImageRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "잘못된 입력입니다.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const prompt = buildImagePrompt(input);

  await supabase.from("profiles").upsert({
    id: user.id,
    restaurant_name: input.restaurantName,
    cuisine_type: input.cuisineType,
    signature_menu: input.signatureMenu,
    mood: input.mood,
    target_audience: input.targetAudience,
  });

  let task;
  try {
    task = await createImageTask({
      promptText: prompt,
      ratio: input.ratio,
      model: "gen4_image",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Runway 호출 실패" },
      { status: 502 }
    );
  }

  const { data: row, error } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      type: "image",
      prompt,
      runway_task_id: task.id,
      status: "PENDING",
      meta: input,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: row.id, taskId: task.id });
}
