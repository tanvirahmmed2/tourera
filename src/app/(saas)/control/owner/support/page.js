'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const STATUS_COLORS = {
  open: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
const PRIORITY_COLORS = {
  low: 'text-gray-400',
  normal: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

export default function ControlSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState({ ticket: null, replies: [] });
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const url = `/api/control/support${filterStatus ? `?status=${filterStatus}` : ''}`;
    try {
      const res = await axios.get(url, { withCredentials: true });
      setTickets(res.data.data.tickets || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicket = async (id) => {
    setSelected(id);
    try {
      const res = await axios.get(`/api/control/support?ticketId=${id}`, { withCredentials: true });
      setThread(res.data);
    } catch {
      // ignore
    }
    setReply('');
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await axios.post('/api/control/support', { ticket_id: selected, message: reply });
    setSending(false);
    setReply('');
    openTicket(selected);
  };

  const updateStatus = async (ticketId, status) => {
    await axios.patch('/api/control/support', { ticket_id: ticketId, status });
    fetchTickets();
    if (selected === ticketId) openTicket(ticketId);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">Support Tickets</h1>
          <p className="text-sm text-text-2 mt-1">Incoming support requests from tenant operators</p>
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setSelected(null); }}
          className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-[#8b5cf6]/50"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Ticket list */}
        <div className="w-[360px] shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-text-3 text-sm text-center py-12">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-text-3">
              <div className="text-5xl mb-3 opacity-40">🎫</div>
              <p className="font-medium text-text-2">No tickets found</p>
            </div>
          ) : tickets.map(t => (
            <button
              key={t.ticket_id}
              onClick={() => openTicket(t.ticket_id)}
              className={`text-left w-full p-4 rounded-xl border transition-all duration-150 ${
                selected === t.ticket_id
                  ? 'bg-[#8b5cf6]/15 border-[#8b5cf6]/40'
                  : 'bg-white/3 border-border hover:bg-white/6 hover:border-border-hover'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-text line-clamp-1">{t.subject}</span>
                <span className={`shrink-0 text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-[#c4b5fd] font-medium mb-1">🏢 {t.tenant_name}</div>
              <div className="flex items-center gap-3 text-xs text-text-3">
                <span className={`font-semibold ${PRIORITY_COLORS[t.priority]}`}>↑ {t.priority}</span>
                <span>💬 {t.reply_count} replies</span>
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Thread panel */}
        <div className="flex-1 bg-white/3 border border-border rounded-2xl flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-3">
              <div className="text-6xl mb-4 opacity-30">💬</div>
              <p className="text-lg font-medium text-text-2">Select a ticket to view</p>
            </div>
          ) : !thread.ticket ? (
            <div className="flex-1 flex items-center justify-center text-text-3 text-sm">Loading thread…</div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-5 border-b border-border flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-text mb-0.5">{thread.ticket.subject}</h2>
                  <div className="text-xs text-text-3">
                    <span className="text-[#c4b5fd] font-medium">{thread.ticket.tenant_name}</span>
                    {' · '}{new Date(thread.ticket.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[0.7rem] font-bold uppercase px-2 py-1 rounded-full border ${STATUS_COLORS[thread.ticket.status]}`}>
                    {thread.ticket.status.replace('_', ' ')}
                  </span>
                  <select
                    value={thread.ticket.status}
                    onChange={e => updateStatus(selected, e.target.value)}
                    className="bg-white/5 border border-border rounded-lg px-2 py-1 text-xs text-text focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {/* Original message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center text-sm shrink-0">🏢</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text">{thread.ticket.tenant_name}</span>
                      <span className="text-xs text-text-3">· Original</span>
                    </div>
                    <div className="bg-white/4 border border-border rounded-xl p-3 text-sm text-text-2 whitespace-pre-wrap">{thread.ticket.message}</div>
                  </div>
                </div>

                {thread.replies.map(r => (
                  <div key={r.reply_id} className={`flex gap-3 ${r.is_admin ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      r.is_admin ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/30' : 'bg-[#6366f1]/20 border border-[#6366f1]/30'
                    }`}>
                      {r.is_admin ? '⚡' : '🏢'}
                    </div>
                    <div className={`flex-1 ${r.is_admin ? 'items-end' : ''} flex flex-col`}>
                      <div className={`flex items-center gap-2 mb-1 ${r.is_admin ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-semibold text-text">{r.is_admin ? 'SaaS Admin' : (r.user_name || 'Tenant')}</span>
                        <span className="text-xs text-text-3">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div className={`max-w-[85%] rounded-xl p-3 text-sm whitespace-pre-wrap ${
                        r.is_admin
                          ? 'bg-[#8b5cf6]/15 border border-[#8b5cf6]/25 text-[#e9d5ff] self-end'
                          : 'bg-white/4 border border-border text-text-2'
                      }`}>
                        {r.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {thread.ticket.status !== 'closed' && (
                <div className="p-4 border-t border-border flex gap-3">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    rows={2}
                    className="flex-1 bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-3 resize-none focus:outline-none focus:border-[#8b5cf6]/50"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="px-5 py-2 rounded-xl bg-[#8b5cf6] text-white font-semibold text-sm hover:bg-[#7c3aed] transition disabled:opacity-40 disabled:cursor-not-allowed self-end"
                  >
                    {sending ? '…' : 'Reply'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
