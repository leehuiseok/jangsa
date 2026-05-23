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
}

// 한국어 메뉴를 영어 설명으로 변환 — Runway는 영어 음식명에 훨씬 정확히 반응합니다.
const KOREAN_DISH_DESCRIPTIONS: { keyword: string; en: string }[] = [
  { keyword: "떡볶이", en: "tteokbokki — Korean spicy rice cakes in glossy red gochujang sauce, with fish cakes and scallions" },
  { keyword: "김밥", en: "gimbap — Korean seaweed rice roll filled with vegetables and egg, neatly sliced" },
  { keyword: "비빔밥", en: "bibimbap — Korean mixed rice bowl with assorted seasoned vegetables, beef, fried egg on top, and gochujang" },
  { keyword: "김치찌개", en: "kimchi-jjigae — Korean kimchi stew bubbling in a hot stone pot with pork and tofu" },
  { keyword: "된장찌개", en: "doenjang-jjigae — Korean soybean paste stew with tofu, zucchini, and mushrooms in a hot pot" },
  { keyword: "순두부", en: "sundubu-jjigae — Korean soft tofu stew, fiery red broth in a sizzling earthen pot with raw egg" },
  { keyword: "갈비", en: "galbi — Korean grilled marinated beef short ribs, glossy caramelized glaze on a hot grill" },
  { keyword: "삼겹살", en: "samgyeopsal — Korean grilled pork belly with crispy edges on a hot stone plate, lettuce wraps and ssamjang" },
  { keyword: "불고기", en: "bulgogi — Korean marinated thinly sliced beef sizzling with onions and sesame seeds" },
  { keyword: "치킨", en: "Korean fried chicken — crispy double-fried, glossy red-yellow gochujang glaze, sesame seeds" },
  { keyword: "라면", en: "ramyeon — Korean instant ramen noodles in spicy red broth with egg and scallions in a metal bowl" },
  { keyword: "냉면", en: "naengmyeon — Korean cold buckwheat noodles in icy broth with cucumber, pear, boiled egg" },
  { keyword: "칼국수", en: "kalguksu — Korean knife-cut noodle soup with anchovy broth, zucchini, dumplings" },
  { keyword: "짜장면", en: "jjajangmyeon — Korean-Chinese black bean sauce noodles topped with pork and cucumber julienne" },
  { keyword: "짬뽕", en: "jjamppong — Korean-Chinese spicy seafood noodle soup, vibrant red broth, mussels, squid, shrimp" },
  { keyword: "탕수육", en: "tangsuyuk — Korean-Chinese sweet and sour crispy pork, glossy translucent sauce" },
  { keyword: "만두", en: "mandu — Korean dumplings, golden crispy bottom, steam rising" },
  { keyword: "파스타", en: "Italian pasta, al-dente noodles twirled on a fork, glossy sauce, parmesan flakes" },
  { keyword: "피자", en: "wood-fired pizza, blistered crust, melted mozzarella, fresh basil" },
  { keyword: "스테이크", en: "perfectly seared steak, pink medium-rare interior, sizzling on a cast iron pan" },
  { keyword: "샐러드", en: "fresh salad bowl, crisp greens, vibrant vegetables, glistening dressing" },
  { keyword: "버거", en: "gourmet burger, juicy patty, melted cheese, fresh lettuce, brioche bun" },
  { keyword: "초밥", en: "sushi nigiri assortment, glossy fresh fish on rice, wasabi, soy sauce" },
  { keyword: "라멘", en: "Japanese ramen, rich broth, chashu pork, soft-boiled egg, scallions, in a deep bowl" },
  { keyword: "우동", en: "udon noodles in clear dashi broth, tempura on the side, scallions" },
  { keyword: "돈카츠", en: "tonkatsu — crispy panko-breaded pork cutlet sliced, with shredded cabbage and tonkatsu sauce" },
  { keyword: "케이크", en: "elegant slice of cake, glossy ganache, garnish, on a ceramic plate" },
  { keyword: "커피", en: "artisan latte with elaborate latte art in a ceramic cup on a wooden table" },
  { keyword: "빙수", en: "Korean bingsu — shaved ice mountain with sweet toppings, condensed milk drizzle" },
  { keyword: "마라탕", en: "malatang — spicy Sichuan numbing hotpot with skewered vegetables and meats in fiery red broth" },
];

function translateMenuToEnglish(signatureMenu: string): string {
  for (const m of KOREAN_DISH_DESCRIPTIONS) {
    if (signatureMenu.includes(m.keyword)) {
      return m.en;
    }
  }
  return signatureMenu;
}

export function buildImagePrompt(input: PromptInput): string {
  const menuEn = translateMenuToEnglish(input.signatureMenu);
  return [
    `IMPORTANT — Generate a photo specifically of: ${menuEn}.`,
    `This image MUST clearly depict ${input.signatureMenu} (${menuEn}) — not any other dish.`,
    `Use the reference image only for general food-photography style cues (lighting, framing, color grading), NOT for the dish identity.`,
    `Context: Instagram-ready hero shot for restaurant "${input.restaurantName}".`,
    input.mood ? `Mood: ${input.mood}.` : "",
    input.targetAudience ? `Audience: ${input.targetAudience}.` : "",
    `Styling: appetizing close-up, soft natural light, shallow depth of field, garnished plating, steam if hot.`,
    `Composition: centered hero shot, top-down or 3/4 angle, vibrant realistic colors, no text overlays, no logos, no watermarks.`,
    input.extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildVideoPrompt(input: PromptInput): string {
  const menuEn = translateMenuToEnglish(input.signatureMenu);
  return [
    `Short cinematic Instagram reel featuring ${menuEn}.`,
    `Slow push-in / parallax toward the dish, subtle steam rising if hot,`,
    input.mood ? `${input.mood} ambiance,` : "",
    `warm lighting, shallow focus, mouth-watering details, food-photography aesthetic.`,
    input.extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}
