'use client';
import axios from 'axios';
import { useState as __useState, useEffect as __useEffect, useCallback as __useCallback } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/dashboard/ui';

export default function ControlAnalyticsPage() {
  
  const fetchUrl = '/api/control/analytics';
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

  const { metrics = {}, tenantGrowth = [] } = data;

  const METRICS = [
    { icon: '🏢', label: 'Active Tenants',  value: metrics.active_tenants   || 0, sub: `+${metrics.new_tenants_30d || 0} this month` },
    { icon: '📝', label: 'Bookings (30d)',   value: metrics.bookings_30d     || 0 },
    { icon: '🗺️', label: 'Active Tours',     value: metrics.active_tours     || 0 },
    { icon: '💰', label: 'Total Revenue',    value: `$${Number(metrics.total_revenue || 0).toLocaleString()}` },
    { icon: '📅', label: 'Revenue (30d)',    value: `$${Number(metrics.revenue_30d   || 0).toLocaleString()}` },
    { icon: '📈', label: 'MRR',             value: `$${Number(metrics.revenue_30d   || 0).toLocaleString()}` },
  ];

  const maxCount = Math.max(...tenantGrowth.map((r) => parseInt(r.count) || 0), 1);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">Platform Analytics</h1>
          <p className="text-xs text-text-3 mt-1.5 uppercase tracking-wider font-bold font-sans">Metrics overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
        {METRICS.map((m) => (
          <div 
            key={m.label} 
            className="relative bg-white/5 border border-primary/20 rounded-2xl p-6 transition-all duration-300 hover:bg-primary/10 hover:-translate-y-0.5"
          >
            <div className="flex justify-between items-center gap-4 mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-3">{m.label}</div>
              <div className="text-xl filter drop-shadow-[0_4px_8px_rgba(99,102,241,0.08)]">{m.icon}</div>
            </div>
            <div className="text-2xl font-black text-text tracking-tight leading-none mb-2">{m.value}</div>
            {m.sub && <div className="text-[10px] font-bold text-success tracking-wide">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Tenant Growth */}
      <div className="bg-white/5 border border-border rounded-3xl overflow-hidden">
        <div className="p-5 px-6 border-b border-border">
          <span className="text-base font-bold text-text tracking-tight">Tenant Growth (last 6 months)</span>
        </div>
        {tenantGrowth.length === 0 ? (
          <EmptyState icon="📊" title="No growth data yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-custom">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>New Tenants</th>
                  <th className="min-w-[200px]">Visual</th>
                </tr>
              </thead>
              <tbody>
                {tenantGrowth.map((row) => {
                  const pct = (parseInt(row.count) / maxCount) * 100;
                  return (
                    <tr key={row.month}>
                      <td className="font-bold text-text text-sm">
                        {new Date(row.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="font-black text-text text-sm">{row.count}</td>
                      <td>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden w-full max-w-md">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
