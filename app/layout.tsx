import type { Metadata } from "next";
import { Roboto, Oswald, Noto_Sans_KR,Cairo } from "next/font/google";
import "./globals.css";
import Providers from "./providers"

// font-thin        // font-weight: 100
// font-extralight  // font-weight: 200
// font-light      // font-weight: 300
// font-normal     // font-weight: 400
// font-medium     // font-weight: 500
// font-semibold   // font-weight: 600
// font-bold       // font-weight: 700
// font-extrabold  // font-weight: 800
// font-black      // font-weight: 900


const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["200","400", "500", "700"],
  style: ["normal"],
  variable: "--font-oswald",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "700", "900"],
  style: ["normal"],
  variable: "--font-notoSansKR",
});

const cairo = Cairo({ 
  subsets: ['latin'],
  weight: ['200', '400', '500', '700'],
  style: ["normal"],
  variable: "--font-cairo",
})

export const metadata: Metadata = {
  title: {
    template: "%s | LUMI",
    default: "LUMI",
  },
  description: "Sell and buy all the things!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body 
      className={`${roboto.variable} ${oswald.variable} ${notoSansKR.variable} ${cairo.variable} bg-neutral-900 text-white mx-auto`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}