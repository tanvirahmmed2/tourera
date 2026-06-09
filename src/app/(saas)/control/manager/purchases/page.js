'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LoadingSpinner, ErrorMessage } from '@/components/dashboard/ui';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/control/purchases', { withCredentials: true });
      setPurchases(res.data.data.purchases || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleApprove = async (purchaseId) => {
    if (!confirm('Are you sure you want to approve this purchase? This will automatically provision a new tenant workspace.')) return;
    setApproving(purchaseId);
    try {
      await axios.post(`/api/control/purchases/${purchaseId}/approve`, {}, { withCredentials: true });
      alert('Purchase approved and tenant provisioned successfully!');
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve purchase');
    } finally {
      setApproving(null);
    }
  };

  const handleDecline = async (purchaseId) => {
    if (!confirm('Are you sure you want to decline this purchase? It will be marked as cancelled.')) return;
    setDeclining(purchaseId);
    try {
      await axios.patch(`/api/control/purchases/${purchaseId}`, { status: 'cancelled' }, { withCredentials: true });
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline purchase');
    } finally {
      setDeclining(null);
    }
  };

  const handleDelete = async (purchaseId) => {
    if (!confirm('Are you sure you want to permanently delete this purchase record? This cannot be undone.')) return;
    setDeleting(purchaseId);
    try {
      await axios.delete(`/api/control/purchases/${purchaseId}`, { withCredentials: true });
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete purchase');
    } finally {
      setDeleting(null);
    }
  };

  if (loading && purchases.length === 0) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight">Purchase Requests</h1>
          <p className="text-sm text-text-2 mt-0.5">Approve pending purchases to activate new SaaS tenants.</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchPurchases} />}

      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold text-text-2">Date</th>
                <th className="px-6 py-4 font-bold text-text-2">User</th>
                <th className="px-6 py-4 font-bold text-text-2">Requested Workspace</th>
                <th className="px-6 py-4 font-bold text-text-2">Package</th>
                <th className="px-6 py-4 font-bold text-text-2">Payment Details</th>
                <th className="px-6 py-4 font-bold text-text-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-3">No purchases found.</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.purchase_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-text-2">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text">{p.user_name || 'Unknown'}</div>
                      <div className="text-xs text-text-3">{p.user_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text">{p.requested_tenant_name}</div>
                      {p.note && (
                        <div className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded mt-1 border border-amber-200 inline-block">{p.note}</div>
                      )}
                      {p.requested_custom_domain ? (
                        <div className="text-xs text-text-3 font-mono">{p.requested_custom_domain}</div>
                      ) : (
                        <div className="text-xs text-text-3 font-mono">tourbin.com/{p.requested_tenant_slug}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text">
                        {p.package_name || `Package #${p.package_id}`}
                      </div>
                      <div className="text-xs text-text-2 mt-0.5">
                        {p.duration_months} Month{p.duration_months > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                          p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {p.status}
                        </span>
                        <span className="font-bold text-text">৳{p.amount}</span>
                      </div>
                      <div className="text-xs text-text-3 mt-1 uppercase tracking-widest">{p.payment_method}: {p.transaction_id}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {p.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(p.purchase_id)}
                            disabled={approving === p.purchase_id || declining === p.purchase_id || deleting === p.purchase_id}
                            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                          >
                            {approving === p.purchase_id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDecline(p.purchase_id)}
                            disabled={approving === p.purchase_id || declining === p.purchase_id || deleting === p.purchase_id}
                            className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-all shadow-sm"
                          >
                            {declining === p.purchase_id ? 'Declining...' : 'Decline'}
                          </button>
                        </>
                      )}
                      {p.status === 'paid' && (
                        <span className="text-xs font-bold text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-lg">Active</span>
                      )}
                      {p.status === 'cancelled' && (
                        <span className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-lg">Declined</span>
                      )}
                      
                      <button
                        onClick={() => handleDelete(p.purchase_id)}
                        disabled={approving === p.purchase_id || declining === p.purchase_id || deleting === p.purchase_id}
                        className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all shadow-sm ml-2"
                      >
                        {deleting === p.purchase_id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
