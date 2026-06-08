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

  const tenants = data?.data?.tenants || [];

  return (
    <div>
      <div className={"flex items-start justify-between mb-8"}>
        <div>
          <h1 className={"text-3xl font-extrabold text-text tracking-tight"}>Tenants</h1>
          <p className={"text-sm text-text-2 mt-1"}>{tenants.length} registered organisations</p>
        </div>
        <Link href="/control/manager/tenants/create" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50 btn-sm">+ New Tenant</Link>
      </div>

      <div className={"bg-white/5 border border-border rounded-2xl overflow-hidden"}>
        <div className={"flex items-center justify-between p-5 px-6 border-b border-border"}>
          <span className={"text-base font-bold text-text"}>All Tenants</span>
        </div>
        {tenants.length === 0 ? (
          <EmptyState icon="🏢" title="No tenants registered yet" />
        ) : (
          <div className={"overflow-x-auto"}>
            <table className={"w-full border-collapse table-custom"}>
              <thead>
                <tr>
                  <th>Organisation</th><th>Subdomain</th><th>Plan</th>
                  <th>Users</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.tenant_id}>
                    <td className="font-semibold">{t.name}</td>
                    <td>
                      <code className="text-xs text-primary-light bg-primary/10 px-2 py-0.5 rounded">
                        {t.slug}
                      </code>
                    </td>
                    <td className="text-text-2">{t.plan_name || '—'}</td>
                    <td className="text-text-2">{t.user_count}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-xs text-text-3">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link href={`/control/manager/tenants/${t.tenant_id}`} className="text-primary-light text-xs hover:underline">
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
