import { Metadata } from 'next';
import AdDetailContent from './AdDetailContent';

// Fetch server-side senza token: va bene solo per i metadata SEO degli annunci pubblicati
// (i meta tag di un annuncio in moderazione restano generici, non c'è nulla da indicizzare).
async function getAdForMetadata(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ad = await getAdForMetadata(id);
  if (!ad) return { title: 'Annuncio' };

  const title = ad.name;
  const description = ad.description?.slice(0, 160);
  const photoUrl = ad.photos?.[0]?.url;
  const video = ad.videos?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(photoUrl ? { images: [{ url: photoUrl }] } : {}),
      ...(video?.filename
        ? { videos: [{ url: video.filename, width: 450, height: 250 }] }
        : {}),
    },
  };
}

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdDetailContent id={id} />;
}
