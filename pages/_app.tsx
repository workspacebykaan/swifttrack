import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SwiftTrack | Freelancer Finansal Yönetim Paneli</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Freelancerlar için ücretsiz Açık Beta gelir, gider, kârlılık ve proje bütçesi takip aracı." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SwiftTrack | Finansal Durumunu Kontrol Altına Al 🚀" />
        <meta property="og:description" content="Projelerinin bütçelerini, maliyetlerini ve yaklaşan teslim tarihlerini güvenle takip et. Şu an tamamen ücretsiz!" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SwiftTrack | Freelancer Finansal Takip Sistemi" />
        <meta name="twitter:description" content="Projelerinin bütçelerini, maliyetlerini ve yaklaşan teslim tarihlerini güvenle takip et. Erken erişime katıl!" />
      </Head>

      <Component {...pageProps} />

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
        }}
      />
      <Analytics />
    </>
  );
}
