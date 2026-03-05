// pages/_app.js
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>JamiiAI — Tanzania AI Community</title>
        <meta name="description" content="Community ya kwanza ya AI Tanzania. Hire AI developers, shiriki, shindana kwenye changamoto." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0A0F1C; color: #DCE6F0; font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #F5A623; border-radius: 2px; }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
