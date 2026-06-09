'use client';
import axios from 'axios';
import { useState as __useState, useEffect as __useEffect, useCallback as __useCallback } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from '@/components/dashboard/ui';


export default function SubscriptionsPage() {
  
  const fetchUrl = '/api/control/subscriptions';
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

  const subscriptions = data?.subscriptions || [];

  return (
    <div>
      <div className={"flex items-start justify-between mb-8"}>
        <div>
          <h1 className={"text-3xl font-extrabold text-text tracking-tight"}>Subscriptions</h1>
          <p className={"text-sm text-text-2 mt-1"}>{subscriptions.length} subscription records</p>
        </div>
      </div>

      <div className={"bg-white/5 border border-border rounded-2xl overflow-hidden"}>
        <div className={"flex items-center justify-between p-5 px-6 border-b border-border"}>
          <span className={"text-base font-bold text-text"}>All Subscriptions</span>
        </div>
        {subscriptions.length === 0 ? (
          <EmptyState icon="🔄" title="No subscriptions yet" />
        ) : (
          <div className={"overflow-x-auto"}>
            <table className={"w-full border-collapse table-custom"}>
              <thead>
                <tr>
                  <th>Tenant</th><th>Plan</th><th>Cycle</th>
                  <th>Price</th><th>Renews</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => {
                  const price = s.billing_cycle === 'yearly'
                    ? Number(s.yearly_price)
                    : Number(s.monthly_price);
                  return (
                    <tr key={s.subscription_id}>
                      <td>
                        <div className="font-semibold">{s.tenant_name}</div>
                        <div className="text-xs text-text-3">{s.slug}</div>
                      </td>
                      <td className="text-text-2">{s.plan_name}</td>
                      <td>
                        <span className="badge badge-primary text-[0.7rem]">{s.billing_cycle}</span>
                      </td>
                      <td className="font-bold">${price.toFixed(2)}</td>
                      <td className="text-xs text-text-3">
                        {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                      </td>
                      <td><StatusBadge status={s.status} /></td>
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
