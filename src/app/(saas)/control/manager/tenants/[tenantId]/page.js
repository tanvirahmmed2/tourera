'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/dashboard/ui';

export default function TenantDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { tenantId } = unwrappedParams;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    axios.get(`/api/control/tenants/${tenantId}`)
      .then((res) => {
        const d = res.data;
        if (d.data?.tenant) { 
          setData(d.data.tenant); 
          setEditStatus(d.data.tenant.status); 
        }
        else setError(d.message || 'Tenant not found');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load tenant'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function updateStatus() {
    setSaving(true);
    setError('');
    try {
      await axios.patch(`/api/control/tenants/${tenantId}`, { status: editStatus });
      setData((d) => ({ ...d, status: editStatus }));
      alert('Status updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error && !data) return <ErrorMessage message={error} onRetry={() => router.back()} />;

  const tenant = data;
  const activeSub = tenant?.subscriptions?.find(s => s.status === 'active') || tenant?.subscriptions?.[0] || null;
  const primaryDomain = tenant?.domains?.find(d => d.is_primary) || tenant?.domains?.[0] || null;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">{tenant.name}</h1>
          <p className="text-sm text-text-2 mt-1">
            <code className="text-primary-light font-bold">tourbin.com/{tenant.slug}</code>
            {' · '} Joined {new Date(tenant.created_at).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={tenant.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Core Stats */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-bold text-text-3 uppercase tracking-wider mb-4">Workspace Summary</div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-2 text-sm font-medium">Internal ID</span>
              <span className="text-text font-bold text-sm">#{tenant.tenant_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-2 text-sm font-medium">Registered Users</span>
              <span className="text-text font-bold text-sm">{tenant.users?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-2 text-sm font-medium">Total Revenue</span>
              <span className="text-text font-bold text-sm">৳{tenant.invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0}</span>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-bold text-text-3 uppercase tracking-wider mb-4">Active Subscription</div>
          {activeSub ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-2 text-sm font-medium">Package</span>
                <span className="text-text font-bold text-sm bg-primary/10 text-primary-light px-2 py-0.5 rounded-md">{activeSub.package_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-2 text-sm font-medium">Status</span>
                <StatusBadge status={activeSub.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-2 text-sm font-medium">Expires On</span>
                <span className="text-text font-bold text-sm">{activeSub.end_date ? new Date(activeSub.end_date).toLocaleDateString() : 'Lifetime'}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-3 font-medium text-center py-4">No active subscription</div>
          )}
        </div>

        {/* Website & Domain Config */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-bold text-text-3 uppercase tracking-wider mb-4">Website Config</div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-2 text-sm font-medium">Primary Domain</span>
              <span className="text-text font-bold text-sm">{primaryDomain?.domain || 'Not configured'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-2 text-sm font-medium">Domain Verified</span>
              <span className="text-text font-bold text-sm">{primaryDomain?.verified ? '✅ Yes' : '❌ No'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-2 text-sm font-medium">Hero Title</span>
              <span className="text-text font-bold text-sm truncate max-w-[150px]">{tenant.website?.hero_title || 'Default'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* User Roster */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border bg-slate-50">
            <span className="text-sm font-bold text-text uppercase tracking-wider">Workspace Users</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-bold text-text-2">Name</th>
                  <th className="px-5 py-3 font-bold text-text-2">Email</th>
                  <th className="px-5 py-3 font-bold text-text-2">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenant.users?.length === 0 ? (
                  <tr><td colSpan="3" className="p-5 text-center text-text-3">No users found.</td></tr>
                ) : (
                  tenant.users?.map(u => (
                    <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-text">{u.name}</td>
                      <td className="px-5 py-3 text-text-2">{u.email}</td>
                      <td className="px-5 py-3"><span className="uppercase text-[10px] tracking-wider font-extrabold bg-slate-100 px-2 py-1 rounded-md text-slate-600">{u.role}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border bg-slate-50">
            <span className="text-sm font-bold text-text uppercase tracking-wider">Billing & Invoices</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-bold text-text-2">Invoice #</th>
                  <th className="px-5 py-3 font-bold text-text-2">Date</th>
                  <th className="px-5 py-3 font-bold text-text-2">Amount</th>
                  <th className="px-5 py-3 font-bold text-text-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenant.invoices?.length === 0 ? (
                  <tr><td colSpan="4" className="p-5 text-center text-text-3">No invoices generated yet.</td></tr>
                ) : (
                  tenant.invoices?.map(inv => (
                    <tr key={inv.invoice_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-text font-mono">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-text-2">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3 font-bold text-text">৳{inv.amount}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Change Status */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 px-6 border-b border-border bg-slate-50">
          <span className="text-sm font-bold text-text uppercase tracking-wider">Danger Zone: Workspace Status</span>
        </div>
        <div className="p-6 flex items-center gap-4 bg-red-50/20">
          <select
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-text focus:outline-none focus:border-primary/50 w-[200px]"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
          <button 
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-50" 
            onClick={updateStatus} 
            disabled={saving || editStatus === tenant.status}
          >
            {saving ? 'Saving...' : 'Force Update Status'}
          </button>
          {error && <span className="text-danger text-sm font-bold">{error}</span>}
        </div>
      </div>
    </div>
  );
}
