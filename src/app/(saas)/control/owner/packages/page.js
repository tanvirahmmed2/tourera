'use client';
import axios from 'axios';
import { useState as __useState, useEffect as __useEffect, useCallback as __useCallback } from 'react';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/dashboard/ui';


export default function PackagesPage() {
  
  const fetchUrl = '/api/control/packages';
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

  const packages = data?.packages || [];

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">Packages</h1>
          <p className="text-sm text-text-2 mt-1">SaaS subscription plans offered to tenants</p>
        </div>
      </div>

      {packages.length === 0 ? (
        <EmptyState icon="📦" title="No packages defined yet" subtitle="Add packages via the ts_packages table." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pkg) => {
            const features = (() => {
              try { return typeof pkg.features === 'string' ? JSON.parse(pkg.features) : (pkg.features || []); }
              catch { return []; }
            })();

            return (
              <div key={pkg.package_id} className="bg-white/5 border border-primary/20 rounded-2xl p-7 flex flex-col gap-5 transition-all hover:bg-primary/10 hover:-translate-y-0.5">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-text">{pkg.name}</h3>
                  <span className="badge badge-primary">{pkg.subscriber_count} tenants</span>
                </div>
                <p className="text-sm text-text-2 min-h-[40px]">{pkg.description}</p>
                <div className="flex gap-6">
                  <div>
                    <div className="text-[0.7rem] text-text-3 uppercase tracking-[0.06em] mb-0.5">Monthly</div>
                    <div className="text-2xl font-extrabold text-text">${Number(pkg.monthly_price).toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-[0.7rem] text-text-3 uppercase tracking-[0.06em] mb-0.5">Yearly</div>
                    <div className="text-2xl font-extrabold text-success">${Number(pkg.yearly_price).toFixed(0)}</div>
                  </div>
                </div>
                {features.length > 0 && (
                  <ul className="list-none flex flex-col gap-2">
                    {features.slice(0, 5).map((f, i) => (
                      <li key={i} className="text-[0.8125rem] text-text-2 flex gap-2 items-start">
                        <span className="text-success shrink-0 mt-0.5">✓</span> {f.name || f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
