'use client';
import axios from 'axios';
import { useState as __useState, useEffect as __useEffect, useCallback as __useCallback } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from '@/components/dashboard/ui';


export default function ControlPaymentsPage() {
  
  const fetchUrl = '/api/control/payments';
  const [data, setData] = __useState(null);
  const [loading, setLoading] = __useState(true);
  const [error, setError] = __useState(null);

  const fetchData = __useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(fetchUrl, { withCredentials: true });
      setData(res.data.data || res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        window.location.href = '/login';
        return;
      }
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  __useEffect(() => { fetchData(); }, [fetchData]);
  const refetch = fetchData;


  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  const { stats = {}, payments = [] } = data;

  return (
    <div>
      <div className={"flex items-start justify-between mb-8"}>
        <div>
          <h1 className={"text-3xl font-extrabold text-text tracking-tight"}>Payments</h1>
          <p className={"text-sm text-text-2 mt-1"}>SaaS subscription payment history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-7">
        {[
          { icon: '💰', label: 'Total Collected', value: `$${Number(stats.total_collected || 0).toLocaleString()}` },
          { icon: '📅', label: 'Last 30 Days',    value: `$${Number(stats.last_30d       || 0).toLocaleString()}` },
          { icon: '⏳', label: 'Pending',          value: stats.pending_count  || 0 },
          { icon: '🧾', label: 'Transactions',     value: stats.total_count    || 0 },
        ].map((s) => (
          <div key={s.label} className={"bg-white/5 border border-primary/20 rounded-2xl p-5 transition-all hover:bg-primary/10 hover:-translate-y-0.5"}>
            <div className={"text-2xl mb-3"}>{s.icon}</div>
            <div className={"text-xs font-semibold uppercase tracking-wider text-text-3 mb-1.5"}>{s.label}</div>
            <div className={"text-3xl font-extrabold text-text tracking-tight leading-none mb-2"}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={"bg-white/5 border border-border rounded-2xl overflow-hidden"}>
        <div className={"flex items-center justify-between p-5 px-6 border-b border-border"}>
          <span className={"text-base font-bold text-text"}>Transaction History</span>
        </div>
        {payments.length === 0 ? (
          <EmptyState icon="💳" title="No payment records yet" />
        ) : (
          <div className={"overflow-x-auto"}>
            <table className={"w-full border-collapse table-custom"}>
              <thead>
                <tr><th>Tenant</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td>
                      <div className="font-semibold">{p.tenant_name}</div>
                      <div className="text-xs text-text-3">{p.slug}</div>
                    </td>
                    <td className={`font-bold ${p.status === 'paid' ? 'text-success' : ''}`}>
                      ${Number(p.amount || 0).toFixed(2)}
                    </td>
                    <td className="text-text-2 text-sm">{p.payment_method || '—'}</td>
                    <td className="text-xs text-text-3">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
