import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  buildImagePrompt,
  buildVideoPrompt,
  createImageTask,
  createVideoTask,
  getTask,
} from "@/lib/runway";

const VideoRequestSchema = z.object({
  restaurantName: z.string().min(1).max(120),
  cuisineType: z.string().min(1).max(60),
  signatureMenu: z.string().min(1).max(200),
  mood: z.string().max(120).optional().default(""),
  targetAudience: z.string().max(120).optional().default(""),
  extra: z.string().max(500).optional().default(""),
  ratio: z.enum(["1280:720", "720:1280", "960:960"]).default("720:1280"),
  duration: z.union([z.literal(5), z.literal(10)]).default(5),
  referenceImageUrl: z.string().url().optional(),
});

async function waitForImage(taskId: string, maxMs = 90_000): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const t = await getTask(taskId);
    if (t.status === "SUCCEEDED" && t.output?.[0]) {
      return t.output[0];
    }
    if (t.status === "FAILED" || t.status === "CANCELLED") {
      throw new Error(t.failure ?? "이미지 생성 실패");
    }
    await new Promise((r) => setTimeout(r, 4_000));
  }
  throw new Error("이미지 생성이 너무 오래 걸려요. 다시 시도해주세요.");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = VideoRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "잘못된 입력입니다.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const videoPrompt = buildVideoPrompt(input);

  await supabase.from("profiles").upsert({
    id: user.id,
    restaurant_name: input.restaurantName,
    cuisine_type: input.cuisineType,
    signature_menu: input.signatureMenu,
    mood: input.mood,
    target_audience: input.targetAudience,
  });

  try {
    let promptImage = input.referenceImageUrl;
    if (!promptImage) {
      const imgRatio =
        input.ratio === "720:1280"
          ? "1080:1920"
          : input.ratio === "1280:720"
          ? "1920:1080"
          : "1080:1080";
      const imgTask = await createImageTask({
        promptText: buildImagePrompt(input),
        model: "gen4_image_turbo",
        ratio: imgRatio,
      });
      promptImage = await waitForImage(imgTask.id);
    }

    const videoTask = await createVideoTask({
      promptImage,
      promptText: videoPrompt,
      ratio: input.ratio,
      duration: input.duration,
      model: "gen3a_turbo",
    });

    const { data: row, error } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        type: "video",
        prompt: videoPrompt,
        runway_task_id: videoTask.id,
        status: "PENDING",
        meta: { ...input, sourceImage: promptImage },
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: row.id, taskId: videoTask.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Runway 호출 실패" },
      { status: 502 }
    );
  }
}
