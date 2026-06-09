'use client';
import axios from 'axios';
import { useState as __useState, useEffect as __useEffect, useCallback as __useCallback } from 'react';
import Link from 'next/link';

import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from '@/components/dashboard/ui';


export default function TenantsPage() {
  
  const fetchUrl = '/api/control/tenants';
  const [data, setData] = __useState(null);
  const [loading, setLoading] = __useState(true);
  const [error, setError] = __useState(null);

  const fetchData = __useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(fetchUrl, { withCredentials: true });
      setData(res.data);
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

  const tenants = data?.tenants || [];

  return (
    <div>
      <div className={"flex items-start justify-between mb-8"}>
        <div>
          <h1 className={"text-3xl font-extrabold text-text tracking-tight"}>Tenants</h1>
          <p className={"text-sm text-text-2 mt-1"}>{tenants.length} registered organisations</p>
        </div>
        <Link href="/control/tenants/create" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50 btn-sm">+ New Tenant</Link>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 px-6 border-b border-border bg-slate-50">
          <span className="text-sm font-bold text-text uppercase tracking-wider">All Tenants</span>
        </div>
        {tenants.length === 0 ? (
          <EmptyState icon="🏢" title="No tenants registered yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-text-2">Organisation</th>
                  <th className="px-6 py-4 font-bold text-text-2">Subdomain</th>
                  <th className="px-6 py-4 font-bold text-text-2">Plan</th>
                  <th className="px-6 py-4 font-bold text-text-2">Users</th>
                  <th className="px-6 py-4 font-bold text-text-2">Status</th>
                  <th className="px-6 py-4 font-bold text-text-2">Joined</th>
                  <th className="px-6 py-4 font-bold text-text-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text">{t.name}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md font-bold tracking-tight">
                        {t.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-text-2 font-medium">{t.plan_name || '—'}</td>
                    <td className="px-6 py-4 text-text-2 font-bold">{t.user_count}</td>
                    <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-6 py-4 text-xs text-text-3 font-medium">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/control/owner/tenants/${t.tenant_id}`} className="inline-flex items-center justify-center px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-colors">
                        Manage →
                      </Link>
                    </td>
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
