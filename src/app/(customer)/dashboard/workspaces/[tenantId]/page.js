'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorMessage } from '@/components/dashboard/ui';

export default function WorkspaceManagementPage() {
  const { tenantId } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    tagline: '',
    sociallink: '',
    email: '',
    phone: '',
    hero_title: '',
    hero_subtitle: ''
  });

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewData, setRenewData] = useState({ duration_months: 1, transaction_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/customer/workspaces/${tenantId}`, { withCredentials: true });
      if (res.data.success) {
        setData(res.data.data);
        const website = res.data.data.website || {};
        setFormData({
          name: website.name || '',
          address: website.address || '',
          tagline: website.tagline || '',
          sociallink: website.sociallink || '',
          email: website.website_email || '',
          phone: website.phone || '',
          hero_title: website.hero_title || '',
          hero_subtitle: website.hero_subtitle || ''
        });
      } else {
        throw new Error(res.data.message || 'Failed to load workspace details');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push('/dashboard');
        return;
      }
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [tenantId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.patch(`/api/customer/workspaces/${tenantId}`, formData, { withCredentials: true });
      if (res.data.success) {
        alert('Website information updated successfully!');
        fetchData();
      } else {
        throw new Error(res.data.message || 'Failed to update website');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update website');
    } finally {
      setSaving(false);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    setRenewing(true);
    try {
      const res = await axios.post(`/api/customer/workspaces/${tenantId}/renew`, renewData, { withCredentials: true });
      if (res.data.success) {
        alert('Renewal request submitted successfully! It will be reviewed shortly.');
        setShowRenewModal(false);
        setRenewData({ duration_months: 1, transaction_id: '' });
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit renewal');
    } finally {
      setRenewing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!data || !data.tenant) return null;

  const { tenant, domains, subscription, baseUrl } = data;

  const primaryDomain = domains?.find(d => d.is_primary)?.domain || tenant.slug;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="px-4 py-2 text-sm font-bold text-text-2 bg-white border border-border rounded-xl hover:bg-slate-50 transition-colors">
          ← Back to Workspaces
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-text">Manage Workspace: {tenant.name}</h1>
          <p className="text-text-3 text-sm mt-1">View details and configure website settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Overview Panel */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Workspace Info</h2>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase text-text-3 font-bold">Status</div>
              <div className="text-sm font-medium text-text mt-1">
                <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                  {tenant.status}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-text-3 font-bold">Base URL</div>
              <div className="text-sm font-bold text-slate-700 mt-1"><code className="bg-slate-100 px-1.5 py-0.5 rounded">{primaryDomain}</code></div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-text-3 font-bold">Created</div>
              <div className="text-sm font-medium text-text mt-1">{new Date(tenant.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Subscription Panel */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider">Subscription</h2>
            {subscription && (
              <div className="flex gap-2 items-center">
                <Link 
                  href={`/dashboard/workspaces/${tenantId}/upgrade`}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Change Plan
                </Link>
                <button 
                  onClick={() => setShowRenewModal(!showRenewModal)}
                  className="text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-wider bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  {showRenewModal ? 'Cancel' : 'Renew'}
                </button>
              </div>
            )}
          </div>
          {subscription ? (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase text-text-3 font-bold">Active Plan</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{subscription.plan_name}</div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-[10px] uppercase text-text-3 font-bold">Status</div>
                  <div className="text-sm font-medium text-success mt-1 capitalize font-bold">{subscription.status}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-text-3 font-bold">Price</div>
                  <div className="text-sm font-bold text-text mt-1">${subscription.monthly_price}/mo</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-text-3 font-bold">Renewal Date</div>
                <div className="text-sm font-medium text-text mt-1">{new Date(subscription.end_date).toLocaleDateString()}</div>
              </div>

              {showRenewModal && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-3 mb-3">Renew Workspace</h3>
                  <form onSubmit={handleRenewSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-3 uppercase tracking-wider mb-1">Duration</label>
                      <select 
                        value={renewData.duration_months} 
                        onChange={e => setRenewData({...renewData, duration_months: parseInt(e.target.value)})}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none transition-colors"
                      >
                        <option value={1}>1 Month (৳{Number(subscription.monthly_price).toFixed(0)})</option>
                        <option value={3}>3 Months (৳{(Number(subscription.monthly_price) * 3).toFixed(0)})</option>
                        <option value={6}>6 Months (৳{(Number(subscription.monthly_price) * 6).toFixed(0)})</option>
                        <option value={12}>1 Year (৳{(Number(subscription.monthly_price) * 12).toFixed(0)})</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-3 uppercase tracking-wider mb-1">bKash TrxID</label>
                      <input 
                        type="text" 
                        required 
                        value={renewData.transaction_id}
                        onChange={e => setRenewData({...renewData, transaction_id: e.target.value})}
                        placeholder="e.g. 8N17XXXX"
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none uppercase font-mono transition-colors"
                      />
                      <div className="text-[10px] text-text-3 mt-1.5 leading-relaxed">
                        Please send <strong className="text-text">৳{(Number(subscription.monthly_price) * renewData.duration_months).toFixed(0)}</strong> to <strong className="text-text">017XXXXXXXX</strong> via bKash.
                      </div>
                    </div>
                    <button type="submit" disabled={renewing} className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2 shadow-sm">
                      {renewing ? 'Submitting...' : 'Submit Renewal'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">No active subscription found.</div>
          )}
        </div>

        {/* Domains Panel */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Domains</h2>
          {domains && domains.length > 0 ? (
            <ul className="space-y-3">
              {domains.map(d => (
                <li key={d.domain_id} className="text-sm flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    {d.domain}
                    {d.is_primary && <span className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Primary</span>}
                  </div>
                  <div className="text-xs font-medium">
                    {d.verified ? <span className="text-success">Verified</span> : <span className="text-amber-600">Unverified</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500 italic">No custom domains configured.</div>
          )}
        </div>

      </div>

      {/* Website Configuration Form */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-text">Website Configuration</h2>
          <p className="text-sm text-text-2 mt-1">Update the public-facing details for this tenant's website.</p>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Company / Website Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="My Tour Company" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Tagline</label>
              <input type="text" name="tagline" value={formData.tagline} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="Best tours in town!" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Public Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="contact@example.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Public Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="+1 555-0123" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Business Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="123 Tour Street..."></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-2 mb-1.5">Social Media Link</label>
            <input type="text" name="sociallink" value={formData.sociallink} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="https://instagram.com/..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
             <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Hero Title</label>
              <input type="text" name="hero_title" value={formData.hero_title} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="Welcome to..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-2 mb-1.5">Hero Subtitle</label>
              <input type="text" name="hero_subtitle" value={formData.hero_subtitle} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="Book your adventure today" />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
}
