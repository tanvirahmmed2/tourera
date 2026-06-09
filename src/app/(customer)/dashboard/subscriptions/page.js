'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/dashboard/ui';

export default function SubscriptionsPage() {
  const [purchases, setPurchases] = useState([]);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customer/subscriptions', { withCredentials: true });
      if (res.data.success) {
        setPurchases(res.data.data.purchases || []);
        setBaseUrl(res.data.data.baseUrl || 'http://localhost:3000');
      } else {
        throw new Error(res.data.message || 'Failed to load subscriptions');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        window.location.href = '/login';
        return;
      }
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;


  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Subscriptions & Purchases</h1>
        <p className="text-text-3 text-sm mt-1">Track your pending workspace requests and active subscriptions</p>
      </div>

      {purchases.length === 0 ? (
        <EmptyState icon="🔄" title="No Subscriptions Found" subtitle="You do not have any purchases or subscriptions yet." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider">Purchase History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Workspace / Tenant</th>
                  <th className="px-6 py-4 font-semibold">Package</th>
                  <th className="px-6 py-4 font-semibold">Purchase Status</th>
                  <th className="px-6 py-4 font-semibold">Subscription Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(p => (
                  <tr key={p.purchase_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {p.tenant_id ? (
                        <>
                          <div className="font-bold text-slate-800">{p.tenant_name}</div>
                          <div className="text-slate-500 text-xs mt-0.5"><code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold tracking-tight">{p.tenant_slug}</code></div>
                          <div className="text-slate-400 text-[10px] mt-1 uppercase">ID: {p.tenant_id}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-slate-800">{p.requested_name}</div>
                          <div className="text-slate-500 text-xs mt-0.5"><code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold tracking-tight">{p.requested_slug}</code></div>
                          <div className="text-slate-400 text-[10px] mt-1 uppercase">Pending Workspace</div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{p.plan_name}</div>
                      <div className="text-slate-500 text-xs mt-0.5 font-medium">${p.amount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-block ${
                        p.purchase_status === 'paid' ? 'bg-green-100 text-green-700' :
                        p.purchase_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.purchase_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.subscription_status ? (
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-block ${
                          p.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.subscription_status}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
