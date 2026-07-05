import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VedoCompro',
    short_name: 'VedoCompro',
    description: 'Il marketplace italiano per comprare e vendere online.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#4396c1',
    theme_color: '#4396c1',
    icons: [
      { src: '/android-chrome-36x36.png', sizes: '36x36', type: 'image/png' },
      { src: '/android-chrome-48x48.png', sizes: '48x48', type: 'image/png' },
      { src: '/android-chrome-72x72.png', sizes: '72x72', type: 'image/png' },
      { src: '/android-chrome-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/android-chrome-144x144.png', sizes: '144x144', type: 'image/png' },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-256x256.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
