# 장사한컷 (Jangsa Han Cut)

음식점 사장님이 가게 정보만 입력하면 **Runway AI**가 인스타그램용 이미지와 짧은 영상을 만들어 다운로드해주는 웹 서비스입니다.

> Stack: Next.js 15 (App Router) · Supabase (Auth/DB) · Runway API · Tailwind CSS · Vercel

## 빠른 시작

### 1. Supabase 프로젝트 생성

1. https://supabase.com/dashboard 에서 새 프로젝트를 만듭니다.
2. **Project Settings → API**에서 다음 값을 복사합니다.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
3. **SQL Editor**를 열어 `supabase/migrations/0001_init.sql`의 내용을 그대로 실행합니다.
4. (선택) **Authentication → Providers → Email**에서 "Confirm email"을 끄면 로그인 즉시 가능.

### 2. Runway API 키 발급

1. https://dev.runwayml.com/ 가입 후 API 키를 발급받습니다.
2. `.env.local`의 `RUNWAYML_API_SECRET`에 입력합니다.

### 3. 환경 변수 설정

`.env.local`을 채워주세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RUNWAYML_API_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속.

## Vercel 배포

1. 이 디렉토리를 GitHub에 push 합니다.
2. https://vercel.com/new 에서 import.
3. **Environment Variables**에 위 4가지 값을 모두 등록합니다.
4. Deploy 클릭. 끝.
5. 배포 후 도메인을 Supabase **Authentication → URL Configuration**에 추가하세요.
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

또는 CLI:

```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add RUNWAYML_API_SECRET
npx vercel --prod
```

## 주요 흐름

```
회원가입/로그인 ─▶ 대시보드 ─▶ 정보 입력 ─▶ Runway 호출
                                       │
                                       ├─ Image: text_to_image (gen4_image)
                                       └─ Video: text_to_image → image_to_video (gen3a_turbo)
                                       
폴링(6초)으로 상태 동기화 ─▶ 갤러리에서 다운로드(인스타 직접 업로드 X)
```

## 폴더 구조

```
src/
├─ app/
│  ├─ (landing) page.tsx, layout.tsx
│  ├─ login/, signup/
│  ├─ auth/{callback,signout}
│  ├─ dashboard/{page,generate,gallery}
│  └─ api/
│     ├─ generate/{image,video}
│     └─ generations/{[id], sync}
├─ components/ui/ (Button, Input, Card 등)
├─ lib/
│  ├─ supabase/{client,server,middleware}.ts
│  └─ runway.ts
└─ middleware.ts (세션 갱신 + 보호 라우트)
supabase/migrations/0001_init.sql
```

## 참고
- 다운로드만 제공 — 인스타그램 직접 업로드는 하지 않습니다.
- 모든 사용자 데이터는 Supabase RLS로 격리됩니다.
- Runway 비용은 사용량만큼 과금되므로 운영 시 quota 관리를 권장합니다.
