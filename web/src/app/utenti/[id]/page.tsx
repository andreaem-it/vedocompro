import { notFound } from 'next/navigation';
import { Star, MapPin, Calendar } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import Link from 'next/link';
import Image from 'next/image';

async function getProfile(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const avgRating = profile.feedbackReceived?.length
    ? profile.feedbackReceived.reduce((s: number, f: any) => s + f.vote, 0) / profile.feedbackReceived.length
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="card p-6 mb-6 flex items-center gap-6 flex-wrap">
        {profile.pic ? (
          <Image src={profile.pic} alt={profile.username} width={80} height={80} className="rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
            {profile.username[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <h1 className="mb-1">{profile.realname || profile.name}</h1>
          <p className="text-gray-500 mb-2">@{profile.username}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {profile.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Membro da {new Date(profile.dateJoin).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</span>
            {avgRating !== null && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {avgRating.toFixed(1)} ({profile.feedbackReceived.length} recensioni)
              </span>
            )}
          </div>
          {profile.isCompany ? <span className="badge bg-blue-100 text-blue-700 mt-2">Account aziendale</span> : null}
        </div>

        <Link href={`/messaggi?to=${profile.id}`} className="btn-primary">Invia messaggio</Link>
      </div>

      {/* Ads */}
      <h2 className="mb-4">Annunci pubblicati ({profile.ads?.filter((a: any) => a.published === 1).length ?? 0})</h2>
      {!profile.ads?.length ? (
        <div className="card p-12 text-center text-gray-500">Nessun annuncio pubblicato.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {profile.ads.filter((a: any) => a.published === 1).map((ad: any) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}

      {/* Feedback */}
      {profile.feedbackReceived?.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4">Recensioni ricevute</h2>
          <div className="space-y-4">
            {profile.feedbackReceived.map((f: any) => (
              <div key={f.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < f.vote ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <Link href={`/utenti/${f.fromUser.id}`} className="text-sm font-medium hover:text-brand">{f.fromUser.username}</Link>
                  <span className="text-xs text-gray-400">{new Date(f.datetime).toLocaleDateString('it-IT')}</span>
                </div>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
