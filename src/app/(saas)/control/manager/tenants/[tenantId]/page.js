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
  
  const [editWebsiteStatus, setEditWebsiteStatus] = useState('');
  const [editDomain, setEditDomain] = useState('');

  useEffect(() => {
    axios.get(`/api/control/tenants/${tenantId}`, { withCredentials: true })
      .then((res) => {
        const d = res.data;
        if (d.data?.tenant) { 
          setData(d.data.tenant); 
          setEditStatus(d.data.tenant.status); 
          setEditWebsiteStatus(d.data.tenant.website?.status || 'development');
          const pDomain = d.data.tenant.domains?.find(dom => dom.is_primary) || d.data.tenant.domains?.[0] || null;
          setEditDomain(pDomain?.domain || '');
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

  const [savingConfig, setSavingConfig] = useState(false);
  async function saveConfig() {
    setSavingConfig(true);
    setError('');
    try {
      await axios.patch(`/api/control/tenants/${tenantId}`, { 
        website_status: editWebsiteStatus, 
        primary_domain: editDomain 
      });
      // Update local state without full reload
      setData((d) => ({
        ...d,
        website: { ...d.website, status: editWebsiteStatus },
        domains: d.domains.map(dom => dom.is_primary ? { ...dom, domain: editDomain } : dom).concat(
          !d.domains.some(dom => dom.is_primary) && editDomain ? [{ domain: editDomain, is_primary: true }] : []
        )
      }));
      alert('Configuration saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSavingConfig(false);
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
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
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
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
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
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
          <div className="text-sm font-bold text-text-3 uppercase tracking-wider mb-4">Website Config</div>
          <div className="space-y-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-2 text-xs font-bold uppercase tracking-wider">Website Status</label>
              <select 
                value={editWebsiteStatus}
                onChange={(e) => setEditWebsiteStatus(e.target.value)}
                className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-bold text-text focus:outline-none focus:border-primary/50"
              >
                <option value="development">Development</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-text-2 text-xs font-bold uppercase tracking-wider">Primary Domain</label>
              <input 
                type="text"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                placeholder="e.g. www.example.com"
                className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm font-medium text-text focus:outline-none focus:border-primary/50"
              />
            </div>
            
            <div className="pt-2">
              <button 
                onClick={saveConfig}
                disabled={savingConfig}
                className="w-full py-2 bg-primary/10 text-primary-light font-bold text-sm rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* User Roster */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
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
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
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
      <div className="bg-white border border-red-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 px-6 border-b border-red-100 bg-red-50/50">
          <span className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Danger Zone: Workspace Status
          </span>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white">
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
            className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:hover:shadow-none" 
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
