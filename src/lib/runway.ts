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
  cuisineType?: string;
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

// gen4_image는 reference 기반 모델이라 최소 1개 이미지가 필요합니다.
// 사장님이 별도 reference를 주지 않을 때 카테고리에 어울리는 무료 스톡 이미지를 사용.
const STOCK_REFERENCES: Record<string, string> = {
  "한식": "https://images.unsplash.com/photo-1583224964978-2257b960c3d3?w=1024&q=80",
  "중식": "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1024&q=80",
  "일식": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1024&q=80",
  "양식": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1024&q=80",
  "분식": "https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=1024&q=80",
  "카페/디저트": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1024&q=80",
  "주점/이자카야": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1024&q=80",
  "패스트푸드": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1024&q=80",
  "아시안": "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=1024&q=80",
  "퓨전": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1024&q=80",
};
const DEFAULT_REFERENCE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1024&q=80";

function pickStockReference(cuisineType?: string): { uri: string; tag: string } {
  const uri = (cuisineType && STOCK_REFERENCES[cuisineType]) || DEFAULT_REFERENCE;
  return { uri, tag: "food_style" };
}

interface CreateVideoOptions {
  promptImage: string;
  promptText?: string;
  ratio?: "16:9" | "9:16" | "1280:768" | "768:1280";
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
  const references =
    opts.referenceImages && opts.referenceImages.length > 0
      ? opts.referenceImages
      : [pickStockReference(opts.cuisineType)];

  const body: Record<string, unknown> = {
    promptText: opts.promptText,
    model: opts.model ?? "gen4_image",
    ratio: opts.ratio ?? "1080:1080",
    referenceImages: references,
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
      ratio: opts.ratio ?? "1280:768",
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
  storyConcept?: string;
}

// 한국어 메뉴를 영어 설명으로 변환 — Runway는 영어 음식명에 훨씬 정확히 반응합니다.
// promptText 1000자 한도 때문에 각 항목은 최대한 짧게.
const KOREAN_DISH_DESCRIPTIONS: { keyword: string; en: string }[] = [
  { keyword: "떡볶이", en: "Korean tteokbokki, spicy rice cakes in red gochujang sauce" },
  { keyword: "김밥", en: "Korean gimbap, seaweed rice roll, sliced" },
  { keyword: "비빔밥", en: "Korean bibimbap, mixed rice with vegetables and gochujang" },
  { keyword: "김치찌개", en: "Korean kimchi stew in hot stone pot" },
  { keyword: "된장찌개", en: "Korean doenjang stew with tofu, in hot pot" },
  { keyword: "순두부", en: "Korean sundubu jjigae, soft tofu stew, red broth" },
  { keyword: "갈비", en: "Korean galbi, grilled marinated short ribs" },
  { keyword: "삼겹살", en: "Korean samgyeopsal, grilled pork belly on hot plate" },
  { keyword: "불고기", en: "Korean bulgogi, marinated sliced beef sizzling" },
  { keyword: "치킨", en: "Korean fried chicken, crispy with gochujang glaze" },
  { keyword: "라면", en: "Korean ramyeon noodles in spicy red broth, egg" },
  { keyword: "냉면", en: "Korean naengmyeon, cold noodles in icy broth" },
  { keyword: "칼국수", en: "Korean kalguksu, knife-cut noodle soup" },
  { keyword: "짜장면", en: "Korean jjajangmyeon, black bean sauce noodles" },
  { keyword: "짬뽕", en: "Korean jjamppong, spicy seafood noodle soup" },
  { keyword: "탕수육", en: "Korean tangsuyuk, sweet and sour crispy pork" },
  { keyword: "만두", en: "Korean mandu dumplings, golden crispy" },
  { keyword: "파스타", en: "Italian pasta, glossy sauce, al-dente" },
  { keyword: "피자", en: "wood-fired pizza, melted mozzarella, basil" },
  { keyword: "스테이크", en: "seared steak, medium-rare, on cast iron pan" },
  { keyword: "샐러드", en: "fresh salad bowl, crisp greens" },
  { keyword: "버거", en: "gourmet burger, juicy patty, brioche bun" },
  { keyword: "초밥", en: "sushi nigiri assortment on rice" },
  { keyword: "라멘", en: "Japanese ramen, rich broth, chashu, egg" },
  { keyword: "우동", en: "udon noodles in dashi broth" },
  { keyword: "돈카츠", en: "tonkatsu, crispy panko pork cutlet" },
  { keyword: "케이크", en: "elegant cake slice, glossy ganache" },
  { keyword: "커피", en: "artisan latte with latte art, ceramic cup" },
  { keyword: "빙수", en: "Korean bingsu, shaved ice with toppings" },
  { keyword: "마라탕", en: "malatang, spicy Sichuan hotpot, red broth" },
];

function translateMenuToEnglish(signatureMenu: string): string {
  for (const m of KOREAN_DISH_DESCRIPTIONS) {
    if (signatureMenu.includes(m.keyword)) {
      return m.en;
    }
  }
  return signatureMenu;
}

const PROMPT_MAX = 990;

function trimToLimit(s: string, limit = PROMPT_MAX): string {
  if (s.length <= limit) return s;
  return s.slice(0, limit - 1).trimEnd() + "…";
}

export function buildImagePrompt(input: PromptInput): string {
  const menuEn = translateMenuToEnglish(input.signatureMenu);
  const prompt = [
    `Hero food photo of: ${menuEn}.`,
    `Must clearly depict ${input.signatureMenu}, not any other dish.`,
    `Reference is style-only (lighting, framing); do not copy its dish.`,
    `Instagram-ready shot for "${input.restaurantName}".`,
    input.mood ? `Mood: ${input.mood}.` : "",
    `Close-up, soft natural light, shallow DOF, garnished plating, steam if hot.`,
    `Top-down or 3/4 angle, vibrant realistic colors. No text, logos, watermarks.`,
    input.extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return trimToLimit(prompt);
}

export function buildVideoPrompt(input: PromptInput): string {
  const menuEn = translateMenuToEnglish(input.signatureMenu);
  const beat = input.storyConcept
    ? `Beat: ${input.storyConcept}.`
    : `Beat: a guest's quiet first bite, eyes softening — prejudice giving way to genuine appreciation.`;
  const prompt = [
    `Cinematic Korean-drama / Netflix-style short ad. Hero: ${menuEn}.`,
    `Setting: warm restaurant interior of "${input.restaurantName}".`,
    `Realistic 3D, shallow DOF, warm golden-hour grading, photoreal food textures (steam, glaze).`,
    `Camera: slow subtle push-in, single take, restrained handheld feel.`,
    `Mood: ${input.mood || "warm and intimate"}, restrained emotion, no fast cuts.`,
    beat,
    `Any people: realistic Korean, natural skin, restrained acting.`,
    `No text, no subtitles, no watermarks, no exaggerated expressions, no rapid motion.`,
    input.extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return trimToLimit(prompt);
}
