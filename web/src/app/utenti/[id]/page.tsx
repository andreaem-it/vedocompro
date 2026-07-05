import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Star, Calendar, Building2, Award, FileText, ThumbsUp, ShieldCheck, BadgeCheck, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import UserProfileTabs from './UserProfileTabs';
import UserProfileActions from './UserProfileActions';
import { Ad, Feedback, UserTrustStats } from '@/types';

async function getUser(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) return { title: 'Utente non trovato' };

  const title = user.name || user.username;
  const description = `Profilo di ${user.name || user.username} su VedoCompro, il marketplace italiano per comprare e vendere online.`;

  return {
    title,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(user.pic ? { images: [{ url: user.pic }] } : {}),
    },
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  const ads: Ad[] = user.ads ?? [];
  const feedback: Feedback[] = user.feedbackReceived ?? [];
  const trustStats: UserTrustStats | undefined = user.trustStats;

  const totalFeedback = feedback.length;
  const positiveFeedback = feedback.filter((f) => f.positive === 1).length;
  const positivePercent = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : null;

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
                  <Building2 className="w-3 h-3" /> Azienda verificata
                </span>
              ) : null}
              {user.phoneVerified ? (
                <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Telefono verificato
                </span>
              ) : null}
              {user.isActive ? (
                <span className="badge bg-sky-100 text-sky-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Email verificata
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

            {/* Reputazione */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-600">
                <FileText className="w-4 h-4 text-brand" /> {ads.length} annunci pubblicati
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <ThumbsUp className="w-4 h-4 text-brand" /> {totalFeedback} feedback ricevuti
              </span>
              {positivePercent !== null && (
                <span className="flex items-center gap-1.5 font-medium text-green-600">
                  <Award className="w-4 h-4" /> {positivePercent}% positivi
                </span>
              )}
            </div>
          </div>

          <UserProfileActions userId={user.id} />
        </div>
      </div>

      {trustStats && (
        <div className="card p-5 mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" /> Trust score venditore
              </h2>
              <p className="text-sm text-gray-500">Basato su feedback verificati, vendite concluse e moderazione.</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand">{trustStats.score}/100</p>
              <p className="text-sm capitalize text-gray-500">{trustStats.level}</p>
            </div>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-brand" style={{ width: `${trustStats.score}%` }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-gray-500">Feedback positivi</p>
              <p className="font-semibold">{trustStats.positivePercent ?? '-'}%</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-gray-500">Feedback verificati</p>
              <p className="font-semibold">{trustStats.verifiedFeedback}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-gray-500">Vendite concluse</p>
              <p className="font-semibold">{trustStats.completedSales}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-gray-500">Segnalazioni confermate</p>
              <p className="font-semibold flex items-center gap-1">
                {trustStats.resolvedReports > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                {trustStats.resolvedReports}
              </p>
            </div>
          </div>

          {trustStats.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {trustStats.badges.map((badge) => (
                <span key={badge} className="badge bg-green-50 text-green-700 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <UserProfileTabs ads={ads} feedback={feedback} userId={user.id} />
    </div>
  );
}
