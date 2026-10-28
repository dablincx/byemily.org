import type { Metadata } from "next";
import { IBM_Plex_Mono, Literata } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SITE_URL } from "@/lib/site";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "emily / dablincx",
    template: "%s · byemily.org",
  },
  description:
    "emilys personal site",
  keywords: [
    "emily",
    "dablincx",
    "byemily",
    "blog",
    "selfhosting",
    "sysadmin",
    "fullstack",
  ],
  authors: [{ name: "emily", url: SITE_URL }],
  creator: "emily",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "byemily.org",
    title: "emily / dablincx",
    description:
      "personal site of emily: backend, fullstack, selfhosting, sysadmin.",
  },
  twitter: {
    // Pages with a cover image switch to summary_large_image.
    card: "summary",
    title: "emily / dablincx",
    description:
      "personal site of emily: backend, fullstack, selfhosting, sysadmin.",
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/blog/rss.xml", title: "emily / dablincx, blog (RSS)" },
      ],
      "application/atom+xml": [
        { url: "/blog/atom.xml", title: "emily / dablincx, blog (Atom)" },
      ],
      "application/feed+json": [
        { url: "/blog/feed.json", title: "emily / dablincx, blog (JSON Feed)" },
      ],
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${literata.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col font-serif">
        <Nav />
        <main className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
