'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSpinner } from '@/components/dashboard/ui';

const STATUS_COLORS = {
  open: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const PRIORITY_COLORS = {
  low: 'text-slate-400',
  normal: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export default function CustomerSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState({ ticket: null, replies: [] });
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [formData, setFormData] = useState({ subject: '', message: '', priority: 'normal' });

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/customer/support');
      setTickets(res.data.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (id) => {
    setSelected(id);
    try {
      const res = await axios.get(`/api/customer/support?ticketId=${id}`);
      setThread(res.data);
    } catch {
      // ignore
    }
    setReplyMessage('');
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) return;
    setSending(true);
    await axios.post('/api/customer/support', { ticket_id: selected, reply_message: replyMessage });
    setSending(false);
    setReplyMessage('');
    openTicket(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post('/api/customer/support', formData);
      setFormData({ subject: '', message: '', priority: 'normal' });
      fetchTickets();
      setSelected(null); // Reset view to list
    } catch (err) {
      alert('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex gap-6">
      {/* Left Sidebar: Ticket List & New Ticket Button */}
      <div className="w-[380px] shrink-0 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Support</h1>
          <button 
            onClick={() => setSelected('new')}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition"
          >
            + New Ticket
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
              No support tickets found.
            </div>
          ) : (
            tickets.map(t => (
              <button
                key={t.ticket_id}
                onClick={() => openTicket(t.ticket_id)}
                className={`text-left w-full p-4 rounded-xl border transition-all duration-150 ${
                  selected === t.ticket_id
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-slate-800 line-clamp-1">{t.subject}</span>
                  <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className={`${PRIORITY_COLORS[t.priority]}`}>↑ {t.priority}</span>
                  <span>💬 {t.reply_count} replies</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Thread View or Create Form */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {!selected ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
             <div className="text-5xl mb-4 opacity-50">💬</div>
             <p className="font-medium">Select a ticket to view the conversation</p>
           </div>
        ) : selected === 'new' ? (
           <div className="p-8 flex-1 overflow-y-auto">
             <h2 className="text-2xl font-bold mb-6 text-slate-800">Open a New Ticket</h2>
             <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                 <input 
                   required 
                   value={formData.subject} 
                   onChange={e => setFormData({...formData, subject: e.target.value})} 
                   placeholder="Brief description of the issue"
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-slate-800" 
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                 <select 
                   value={formData.priority} 
                   onChange={e => setFormData({...formData, priority: e.target.value})} 
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-slate-800"
                 >
                   <option value="low">Low</option>
                   <option value="normal">Normal</option>
                   <option value="high">High</option>
                   <option value="urgent">Urgent</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</label>
                 <textarea 
                   required 
                   rows={6} 
                   value={formData.message} 
                   onChange={e => setFormData({...formData, message: e.target.value})} 
                   placeholder="Describe your issue in detail..."
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-slate-800 resize-none" 
                 />
               </div>
               <button disabled={creating} type="submit" className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 transition disabled:opacity-50">
                 {creating ? 'Submitting...' : 'Submit Ticket'}
               </button>
             </form>
           </div>
        ) : !thread.ticket ? (
           <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium">Loading thread…</div>
        ) : (
           <>
             {/* Thread Header */}
             <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
               <div>
                 <h2 className="text-xl font-bold text-slate-800 mb-1">{thread.ticket.subject}</h2>
                 <div className="text-xs text-slate-500 font-medium">
                   Created on {new Date(thread.ticket.created_at).toLocaleString()}
                 </div>
               </div>
               <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border ${STATUS_COLORS[thread.ticket.status]}`}>
                 {thread.ticket.status.replace('_', ' ')}
               </span>
             </div>

             {/* Message Thread */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
               {/* Original Message */}
               <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0">Me</div>
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1.5">
                     <span className="text-sm font-bold text-slate-800">Me</span>
                     <span className="text-xs text-slate-400 font-medium">Original</span>
                   </div>
                   <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-none p-4 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                     {thread.ticket.message}
                   </div>
                 </div>
               </div>

               {/* Replies */}
               {thread.replies.map(r => (
                 <div key={r.reply_id} className={`flex gap-4 ${r.is_admin ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                     r.is_admin ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                   }`}>
                     {r.is_admin ? 'T' : 'Me'}
                   </div>
                   <div className={`flex-1 flex flex-col ${r.is_admin ? 'items-end' : ''}`}>
                     <div className={`flex items-center gap-2 mb-1.5 ${r.is_admin ? 'flex-row-reverse' : ''}`}>
                       <span className="text-sm font-bold text-slate-800">{r.is_admin ? 'Tourbin Support' : (r.user_name || 'Me')}</span>
                       <span className="text-xs text-slate-400 font-medium">{new Date(r.created_at).toLocaleString()}</span>
                     </div>
                     <div className={`max-w-[85%] rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                       r.is_admin
                         ? 'bg-primary text-white rounded-tr-none'
                         : 'bg-white border border-slate-200 text-slate-600 rounded-tl-none'
                     }`}>
                       {r.message}
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             {/* Reply Input Box */}
             {thread.ticket.status !== 'closed' && (
               <div className="p-4 border-t border-slate-200 bg-white">
                 <div className="flex gap-3">
                   <textarea
                     value={replyMessage}
                     onChange={e => setReplyMessage(e.target.value)}
                     placeholder="Type your reply to support..."
                     rows={1}
                     className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[50px] max-h-[150px]"
                   />
                   <button
                     onClick={sendReply}
                     disabled={sending || !replyMessage.trim()}
                     className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-50 self-end h-[50px]"
                   >
                     {sending ? '...' : 'Reply'}
                   </button>
                 </div>
               </div>
             )}
           </>
        )}
      </div>
    </div>
  );
}
