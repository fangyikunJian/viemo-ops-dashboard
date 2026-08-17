import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * Typefaces.
 *
 * IBM Plex, not the usual choices, and the reasoning is worth recording
 * because "which font" is the single largest lever on whether an interface
 * looks considered or defaulted.
 *
 * Ruled out first: `system-ui`, which is what an interface wears when nobody
 * chose anything; Geist, which is what `create-next-app` ships by default and
 * therefore what every scaffolded Next.js project already looks like; and
 * Inter, which is the most-used font on the web and reads as the safe default
 * it is.
 *
 * Plex was drawn for IBM's enterprise software, and it shows in exactly the
 * way this product wants: flat terminals, a slightly narrow set width that
 * survives dense rows, and letterforms with enough character — the double-storey
 * `g`, the angled `a` — to look drawn rather than generated.
 *
 * Plex Mono carries every figure. In a tool whose whole argument is a number
 * ("5 relationships need contact"), giving the numbers their own voice is not
 * decoration: monospaced digits align down a column by construction, and the
 * contrast between the two faces tells the reader which parts of a row are data.
 *
 * `next/font/google` downloads and self-hosts these at build time. The running
 * application makes no request to Google, so there is no third-party call at
 * runtime and no layout shift while a font loads.
 */
const sans = IBM_Plex_Sans({
  variable: "--font-sans-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Viemo Studio Operations",
    template: "%s · Viemo Studio Operations",
  },
  description:
    "Business relationships and project work for The Viemo Studio, in one operational picture.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      className={`${sans.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
