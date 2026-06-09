'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSpinner } from '@/components/dashboard/ui';

export default function ManagerReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get('/api/control/reviews', { withCredentials: true });
      setReviews(res.data.data.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/control/reviews/${id}`, { is_approved: !currentStatus }, { withCredentials: true });
      fetchReviews();
    } catch (err) {
      alert('Failed to update approval status');
    }
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review forever?')) return;
    try {
      await axios.delete(`/api/control/reviews/${id}`, { withCredentials: true });
      fetchReviews();
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const submitReply = async (id) => {
    try {
      await axios.patch(`/api/control/reviews/${id}`, { reply: replyText }, { withCredentials: true });
      setReplyingTo(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      alert('Failed to save reply');
    }
  };

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Reviews</h1>

      <div className="grid gap-4">
        {reviews.map(r => (
          <div key={r.review_id} className="bg-white/5 rounded-2xl border border-border p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-bold text-lg">{r.reviewer_name}</div>
                <div className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                {r.is_approved ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase tracking-wider">Approved</span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold uppercase tracking-wider">Pending</span>
                )}
              </div>
              <p className="text-text-2 mb-4">{r.comment}</p>
              
              {r.reply && (
                <div className="bg-white/5 border border-border rounded-xl p-4 mt-2">
                  <div className="text-xs font-bold text-text-3 uppercase tracking-wider mb-1">Your Reply:</div>
                  <p className="text-sm text-text-2">{r.reply}</p>
                </div>
              )}

              {replyingTo === r.review_id && (
                <div className="mt-4 flex flex-col gap-2">
                  <textarea 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)}
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
                    placeholder="Write a public reply..."
                  />
                  <div className="flex gap-2">
                    <button onClick={() => submitReply(r.review_id)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">Save Reply</button>
                    <button onClick={() => setReplyingTo(null)} className="px-4 py-2 bg-white/10 text-text rounded-lg text-sm font-semibold hover:bg-white/20">Cancel</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 justify-center">
              <button 
                onClick={() => toggleApproval(r.review_id, r.is_approved)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${r.is_approved ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                {r.is_approved ? 'Unapprove' : 'Approve'}
              </button>
              {!r.reply && !replyingTo && (
                <button 
                  onClick={() => { setReplyingTo(r.review_id); setReplyText(''); }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100"
                >
                  Reply
                </button>
              )}
              <button 
                onClick={() => deleteReview(r.review_id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-12 text-text-2 bg-white/5 rounded-2xl border border-border">
            No reviews submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}
