import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Star, Calendar, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import UserProfileTabs from './UserProfileTabs';
import { Ad, Feedback } from '@/types';

async function getUser(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) return { title: 'Utente non trovato' };
  return { title: user.username };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  const ads: Ad[] = user.ads ?? [];
  const feedback: Feedback[] = user.feedbackReceived ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="flex-shrink-0">
            {user.pic ? (
              <Image
                src={user.pic}
                alt={user.username}
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center text-3xl font-bold text-brand">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{user.name || user.username}</h1>
              {user.isCompany ? (
                <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Azienda
                </span>
              ) : null}
            </div>
            <p className="text-gray-500 mb-2">@{user.username}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {user.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {user.city}
                </span>
              )}
              {user.dateJoin && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Iscritto il {new Date(user.dateJoin).toLocaleDateString('it-IT')}
                </span>
              )}
              {user.points !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {user.points} punti
                </span>
              )}
            </div>
          </div>

          <div>
            <Link href={`/messaggi?to=${user.id}`} className="btn-primary">
              Contatta
            </Link>
          </div>
        </div>
      </div>

      <UserProfileTabs ads={ads} feedback={feedback} userId={user.id} />
    </div>
  );
}
