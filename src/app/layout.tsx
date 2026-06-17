import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fork - live the decision before you make it",
  description:
    "A financial life simulator. Say one sentence, and live both futures of a real decision - a move, an offer, a fork - with your real numbers, before you choose.",
  openGraph: {
    title: "Fork - live the decision before you make it",
    description: "Two futures, your real numbers. Live both, then choose.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fork - live the decision before you make it",
    description: "Two futures, your real numbers. Live both, then choose.",
  },
};

export const viewport = {
  themeColor: "#f7f4ee",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(apiKey){
            (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
            v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
            o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
            y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
            z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
          })('cc47d62f-c957-4437-9b47-dd58efeea94b');
          pendo.initialize({ visitor: { id: '' } });
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
