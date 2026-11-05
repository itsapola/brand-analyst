import "./globals.css";

export const metadata = {
  title: "Brand Intelligence Toolkit | Ashley Pola",
  description:
    "A structured, evidence-led audit of homepage clarity, positioning, differentiation, trust, and conversion — built for strategic review, not generic AI commentary.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Brand Intelligence Toolkit",
    description:
      "A structured, evidence-led audit of homepage clarity, positioning, differentiation, trust, and conversion.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<script dangerouslySetInnerHTML={{ __html: "window.addEventListener('load',function(){if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('svg').forEach(function(s){s.pauseAnimations&&s.pauseAnimations()})}})" }} /></body>
    </html>
  );
}
