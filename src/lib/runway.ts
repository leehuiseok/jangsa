const RUNWAY_BASE_URL = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

export type RunwayTaskStatus =
  | "PENDING"
  | "THROTTLED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export interface RunwayTask {
  id: string;
  status: RunwayTaskStatus;
  createdAt: string;
  output?: string[];
  failure?: string;
  failureCode?: string;
  progress?: number;
}

interface CreateImageOptions {
  promptText: string;
  ratio?:
    | "1920:1080"
    | "1080:1920"
    | "1024:1024"
    | "1360:768"
    | "1080:1080"
    | "1168:880"
    | "1440:1080"
    | "1080:1440"
    | "1808:768"
    | "2112:912";
  model?: "gen4_image" | "gen4_image_turbo";
  referenceImages?: { uri: string; tag?: string }[];
}

interface CreateVideoOptions {
  promptImage: string;
  promptText?: string;
  ratio?: "1280:720" | "720:1280" | "1104:832" | "832:1104" | "960:960" | "1584:672";
  duration?: 5 | 10;
  model?: "gen3a_turbo" | "gen4_turbo";
}

async function runwayFetch<T>(path: string, init: RequestInit): Promise<T> {
  const apiKey = process.env.RUNWAYML_API_SECRET;
  if (!apiKey) {
    throw new Error("RUNWAYML_API_SECRET is not configured");
  }

  const res = await fetch(`${RUNWAY_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": RUNWAY_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Runway API error (${res.status}): ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export async function createImageTask(opts: CreateImageOptions): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    promptText: opts.promptText,
    model: opts.model ?? "gen4_image",
    ratio: opts.ratio ?? "1080:1080",
    referenceImages: opts.referenceImages ?? [],
  };
  return runwayFetch<{ id: string }>("/text_to_image", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createVideoTask(opts: CreateVideoOptions): Promise<{ id: string }> {
  return runwayFetch<{ id: string }>("/image_to_video", {
    method: "POST",
    body: JSON.stringify({
      promptImage: opts.promptImage,
      promptText: opts.promptText,
      model: opts.model ?? "gen3a_turbo",
      ratio: opts.ratio ?? "1280:720",
      duration: opts.duration ?? 5,
    }),
  });
}

export async function getTask(id: string): Promise<RunwayTask> {
  return runwayFetch<RunwayTask>(`/tasks/${id}`, { method: "GET" });
}

interface PromptInput {
  restaurantName: string;
  cuisineType: string;
  signatureMenu: string;
  mood: string;
  targetAudience?: string;
  extra?: string;
}

export function buildImagePrompt(input: PromptInput): string {
  const parts = [
    `Professional Instagram-ready food photography for a Korean restaurant called "${input.restaurantName}".`,
    `Cuisine: ${input.cuisineType}.`,
    `Featured menu: ${input.signatureMenu}.`,
    `Visual mood: ${input.mood}.`,
    input.targetAudience ? `Target customer: ${input.targetAudience}.` : "",
    `Styling: appetizing close-up, soft natural light, shallow depth of field, rich textures, steam if applicable, garnished plating.`,
    `Composition: centered hero shot, top-down or 3/4 angle, vibrant but realistic colors, no text overlays, no logos.`,
    input.extra ?? "",
  ];
  return parts.filter(Boolean).join(" ");
}

export function buildVideoPrompt(input: PromptInput): string {
  return [
    `Short cinematic Instagram reel for "${input.restaurantName}".`,
    `Slow push-in toward ${input.signatureMenu}, subtle steam rising, gentle parallax,`,
    `${input.mood} ambiance, warm lighting, shallow focus, mouth-watering details.`,
    input.extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}
