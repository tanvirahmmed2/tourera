'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/dashboard/ui';


export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const router = useRouter();

  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    axios.get(`/api/control/tenants/${tenantId}`, { withCredentials: true })
      .then((res) => {
        const d = res.data;
        if (d.tenant) { setData(d); setEditStatus(d.tenant.status); }
        else setError(d.error || 'Tenant not found');
      })
      .catch(() => setError('Failed to load tenant'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function updateStatus() {
    setSaving(true);
    setError('');
    try {
      const res = await axios.patch(`/api/control/tenants/${tenantId}`, { status: editStatus });
      setData((d) => ({ ...d, tenant: { ...d.tenant, status: res.data.data.tenant.status } }));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error && !data) return <ErrorMessage message={error} onRetry={() => router.back()} />;

  const { tenant, stats } = data;

  return (
    <div>
      <div className={"flex items-start justify-between mb-8"}>
        <div>
          <h1 className={"text-3xl font-extrabold text-text tracking-tight"}>{tenant.name}</h1>
          <p className="text-sm text-text-2 mt-1">
            <code className="text-primary-light">{tenant.slug}</code>
            {' · '}{tenant.plan_name || 'No Plan'}
          </p>
        </div>
        <StatusBadge status={tenant.status} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[
          { icon: '👥', label: 'Users',    value: stats?.users    || 0 },
          { icon: '🗺️', label: 'Tours',    value: stats?.tours    || 0 },
          { icon: '📝', label: 'Bookings', value: stats?.bookings || 0 },
        ].map((s) => (
          <div key={s.label} className={"bg-white/5 border border-primary/20 rounded-2xl p-5 transition-all hover:bg-primary/10 hover:-translate-y-0.5"}>
            <div className={"text-2xl mb-3"}>{s.icon}</div>
            <div className={"text-xs font-semibold uppercase tracking-wider text-text-3 mb-1.5"}>{s.label}</div>
            <div className={"text-3xl font-extrabold text-text tracking-tight leading-none mb-2"}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tenant Details */}
      <div className="bg-white/5 border border-primary/20 rounded-2xl p-6 transition-all hover:bg-primary/10 hover:-translate-y-0.5 mb-6">
        <div className={"flex items-center justify-between pb-5 border-b border-border mb-5"}>
          <span className={"text-base font-bold text-text"}>Tenant Information</span>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {[
            { label: 'Tenant ID',           value: tenant.tenant_id },
            { label: 'Slug',                value: tenant.slug },
            { label: 'Plan',                value: tenant.plan_name || 'None' },
            { label: 'Subscription Status', value: tenant.sub_status || 'None' },
            { label: 'Billing Cycle',       value: tenant.billing_cycle || '—' },
            { label: 'Period End',          value: tenant.current_period_end ? new Date(tenant.current_period_end).toLocaleDateString() : '—' },
            { label: 'Created',             value: new Date(tenant.created_at).toLocaleDateString() },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[0.7rem] text-text-3 font-bold uppercase tracking-[0.06em] mb-1">
                {item.label}
              </div>
              <div className="text-[0.9375rem] text-text font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Status */}
      <div className="bg-transparent border border-red-900/50 rounded-2xl p-6 transition-all">
        <div className={"flex items-center justify-between pb-5 border-b border-border mb-5"}>
          <span className={"text-base font-bold text-text"}>Change Status</span>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="bg-transparent border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-text focus:outline-none focus:border-primary/50 max-w-[200px]"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button 
            className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:hover:shadow-none" 
            onClick={updateStatus} 
            disabled={saving || editStatus === tenant.status}
          >
            {saving ? 'Saving…' : 'Update Status'}
          </button>
          {error && <span className="text-danger text-sm">{error}</span>}
        </div>
      </div>
    </div>
  );
}
