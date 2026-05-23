import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "장사한컷 - 사장님을 위한 인스타 마케팅",
  description:
    "음식점 사장님이 정보만 입력하면 인스타그램에 올릴 이미지·영상을 AI가 만들어드립니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
