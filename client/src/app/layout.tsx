import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth/AuthProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://devzoku.app"),
  title: {
    default: "DevZoku - Hackathon Collaboration Platform | celersneha",
    template: "%s | DevZoku",
  },
  description:
    "DevZoku: Hackathon collaboration platform for connecting, collaborating, and growing with fellow developers. Find teammates, join hackathons, and build amazing projects together. Created by celersneha (Sneha Sharma).",
  keywords: [
    "devzoku",
    "celersneha",
    "sneha sharma",
    "hackathon platform",
    "developer collaboration",
    "team building",
    "hackathon team finder",
    "programming platform",
    "coding community",
    "software development",
    "hackathon organizer",
    "developer tools",
    "tech community",
    "coding competition",
    "open source",
    "portfolio",
    "snehasharma.me",
    "hackathon networking",
    "developer matching",
    "coding events",
    "tech meetups",
    "programming contests",
    "startup hackathons",
    "innovation platform",
  ],
  authors: [{ name: "celersneha", url: "https://www.snehasharma.me" }],
  creator: "celersneha",
  publisher: "DevZoku",
  verification: {
    google: "XYvXrge8z5D23yKHBoH49IHbk1UqcuB877wNjXxATw4",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://devzoku.app",
    siteName: "DevZoku - Hackathon Collaboration Platform",
    title: "DevZoku - Hackathon Collaboration Platform | celersneha",
    description:
      "DevZoku: Hackathon collaboration platform for connecting, collaborating, and growing with fellow developers. Find teammates, join hackathons, and build amazing projects together. Created by celersneha (Sneha Sharma).",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DevZoku - Hackathon Collaboration Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@devzoku",
    creator: "@celersneha",
    title: "DevZoku - Hackathon Collaboration Platform | celersneha",
    description:
      "Premier hackathon collaboration platform for developers. Find teammates, join hackathons, and build amazing projects together.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://devzoku.app",
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://devzoku.app/#webapp",
      name: "DevZoku",
      url: "https://devzoku.app",
      description:
        "Hackathon collaboration platform for developers to find teammates and join coding competitions",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web Browser",
      creator: {
        "@type": "Person",
        "@id": "https://devzoku.app/#creator",
        name: "Sneha Sharma",
        alternateName: "celersneha",
        url: "https://www.snehasharma.me",
        sameAs: [
          "https://github.com/celersneha",
          "https://linkedin.com/in/celersneha",
          "https://twitter.com/celersneha",
        ],
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        "Hackathon team formation",
        "Developer collaboration",
        "Event organization",
        "Skill-based matching",
        "Project showcase",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://devzoku.app/#website",
      url: "https://devzoku.app",
      name: "DevZoku - Hackathon Collaboration Platform",
      description:
        "Platform for developers to collaborate on hackathons and coding competitions",
      publisher: {
        "@id": "https://devzoku.app/#creator",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://devzoku.app/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://devzoku.app/#organization",
      name: "DevZoku",
      url: "https://devzoku.app",
      logo: "https://devzoku.app/devzoku_logos/favicon.ico",
      description:
        "Hackathon collaboration platform connecting developers worldwide",
      founder: {
        "@id": "https://devzoku.app/#creator",
      },
      sameAs: [
        "https://github.com/celersneha/devzoku",
        "https://twitter.com/celersneha",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/devzoku_logos/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/devzoku_logos/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/devzoku_logos/apple-touch-icon.png"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href="https://devzoku.app" />

        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="application-name" content="DevZoku" />
        <meta name="apple-mobile-web-app-title" content="DevZoku" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col `}
      >
        <AuthProvider>
          <Toaster />
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F8FBFD] via-[#FAFCFD] to-[#FFFFFF] relative overflow-hidden">
            <main className="flex-1 mb-3 relative z-10">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
