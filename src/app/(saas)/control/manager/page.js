'use client';
import axios from 'axios';
import { useState as __useState, useEffect as __useEffect, useCallback as __useCallback } from 'react';
import Link from 'next/link';

import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from '@/components/dashboard/ui';

export default function ControlDashboard() {
  
  const fetchUrl = '/api/control/overview';
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

  const { stats = {}, recentTenants = [], recentPayments = [] } = data;

  const STAT_CARDS = [
    { icon: '🏢', label: 'Total Tenants', value: stats.totalTenants, trend: `${stats.activeTenants} active` },
    { icon: '👥', label: 'Total Users', value: stats.totalUsers?.toLocaleString(), trend: 'across all tenants' },
    { icon: '📝', label: 'Total Bookings', value: stats.totalBookings?.toLocaleString(), trend: 'all time' },
    { icon: '💰', label: 'Revenue (30d)', value: `$${Number(stats.monthlyRevenue || 0).toLocaleString()}`, trend: 'last 30 days' },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">
            Welcome back, {data.user?.name?.split(' ')[0] || 'Manager'} 👋
          </h1>
          <p className="text-sm text-text-3 mt-1.5 font-medium">Here's what's happening on your SaaS platform today.</p>
        </div>
        <Link 
          href="/control/tenants" 
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_12px_rgba(79,70,229,0.25)] active:scale-[0.98] inline-block"
        >
          Manage Tenants →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map((s) => (
          <div 
            key={s.label} 
            className="relative bg-white/5 border border-primary/20 rounded-2xl p-6 transition-all duration-300 hover:bg-primary/10 hover:-translate-y-0.5"
          >
            <div className="flex justify-between items-center gap-4 mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-3">{s.label}</div>
              <div className="text-xl filter drop-shadow-[0_4px_8px_rgba(139,92,246,0.08)]">{s.icon}</div>
            </div>
            <div className="text-2xl font-black text-text tracking-tight leading-none mb-2">{s.value}</div>
            <div className="text-[10px] font-bold text-primary tracking-wide">{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tenants */}
        <div className="bg-white/5 border border-border rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between p-5 px-6 border-b border-border">
            <span className="text-base font-bold text-text tracking-tight">Recent Tenants</span>
            <Link href="/control/tenants" className="text-xs text-primary hover:underline font-bold">View all →</Link>
          </div>
          {recentTenants.length === 0 ? (
            <EmptyState icon="🏢" title="No tenants yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-custom">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Plan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTenants.map((t) => (
                    <tr key={t.tenant_id}>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-text text-sm">{t.name}</div>
                        <div className="text-[10px] text-text-3 font-bold uppercase tracking-wider mt-0.5">{t.slug}</div>
                      </td>
                      <td className="text-text-2 text-sm font-bold">{t.plan_name || 'No Plan'}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white/5 border border-border rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between p-5 px-6 border-b border-border">
            <span className="text-base font-bold text-text tracking-tight">Recent Payments</span>
            <Link href="/control/payments" className="text-xs text-primary hover:underline font-bold">View all →</Link>
          </div>
          {recentPayments.length === 0 ? (
            <EmptyState icon="💰" title="No payments yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-custom">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.payment_id}>
                      <td className="font-bold text-text text-sm">{p.tenant_name}</td>
                      <td className="font-black text-success text-sm">
                        ${parseFloat(p.amount || 0).toFixed(2)}
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
    </div>
  );
}
