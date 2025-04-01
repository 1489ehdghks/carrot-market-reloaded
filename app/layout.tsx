import "./globals.css";
import { Inter, Outfit, Montserrat, Poppins, Noto_Sans } from "next/font/google";
import Providers from "./providers";

// Inter 폰트 정의 (본문용)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Outfit 폰트 정의 (헤드라인용)
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

// Montserrat 폰트 정의 (헤드라인 대체용)
const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
});

const notoSans = Noto_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans'
});

export const metadata = {
  title: "Lumi AI | 이미지 생성 플랫폼",
  description:
    "강력한 AI 기술을 활용한 이미지 생성 플랫폼. 당신의 아이디어를 멋진 이미지로 변환하세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${outfit.variable} ${montserrat.variable} ${poppins.variable} ${notoSans.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0D0D0D" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}