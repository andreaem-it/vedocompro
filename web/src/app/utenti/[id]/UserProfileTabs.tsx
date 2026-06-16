'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import Link from 'next/link';
import AdCard from '@/components/ads/AdCard';
import { feedbackApi } from '@/lib/api';
import { Ad, Feedback } from '@/types';

interface Props {
  ads: Ad[];
  feedback: Feedback[];
  userId: number;
  currentUserId?: number;
}

export default function UserProfileTabs({ ads, feedback, userId, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<'annunci' | 'feedback'>('annunci');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [positive, setPositive] = useState<1 | 0>(1);
  const [vote, setVote] = useState(5);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const canLeaveFeedback = !!currentUserId && currentUserId !== userId;

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await feedbackApi.giveFeedback(userId, { vote, description, positive });
      setSubmitted(true);
      setShowFeedbackForm(false);
    } catch {
      setError('Errore durante l\'invio del feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('annunci')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'annunci' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Annunci ({ads.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'feedback' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Feedback ({feedback.length})
        </button>
      </div>

      {activeTab === 'annunci' && (
        <div>
          {ads.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">Nessun annuncio pubblicato</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div>
          {canLeaveFeedback && !submitted && (
            <div className="mb-6">
              {!showFeedbackForm ? (
                <button onClick={() => setShowFeedbackForm(true)} className="btn-primary text-sm">
                  Lascia feedback
                </button>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="card p-5 space-y-4">
                  <h3 className="font-medium">Lascia un feedback</h3>

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="positive"
                        checked={positive === 1}
                        onChange={() => setPositive(1)}
                        className="accent-green-600"
                      />
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Positivo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="positive"
                        checked={positive === 0}
                        onChange={() => setPositive(0)}
                        className="accent-red-600"
                      />
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Negativo</span>
                    </label>
                  </div>

                  <div>
                    <label className="label">Voto</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVote(v)}
                          className="p-0.5"
                        >
                          <Star className={`w-6 h-6 ${v <= vote ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Descrizione</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="Racconta la tua esperienza..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" disabled={submitting} className="btn-primary text-sm">
                      {submitting ? 'Invio...' : 'Invia feedback'}
                    </button>
                    <button type="button" onClick={() => setShowFeedbackForm(false)} className="btn-secondary text-sm">
                      Annulla
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {submitted && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Feedback inviato con successo!
            </div>
          )}

          {feedback.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">Nessun feedback ricevuto</div>
          ) : (
            <div className="space-y-4">
              {feedback.map((fb) => (
                <div key={fb.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {fb.positive === 1 ? (
                        <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <ThumbsDown className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <div>
                        <Link href={`/utenti/${fb.fromUser.id}`} className="text-sm font-medium hover:text-brand">
                          @{fb.fromUser.username}
                        </Link>
                        {fb.description && <p className="text-sm text-gray-600 mt-1">{fb.description}</p>}
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < fb.vote ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(fb.datetime).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
