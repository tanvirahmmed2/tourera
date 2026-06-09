'use client';

import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorMessage } from '@/components/dashboard/ui';

export default function CheckoutPage({ params }) {
  const router = useRouter();
  const { packageId } = use(params);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    customDomain: '',
    transactionId: '',
    durationMonths: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [existingWorkspaces, setExistingWorkspaces] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch package details from public API
        const res = await axios.get('/api/public/packages');
        const allPackages = res.data?.data?.packages || [];
        const found = allPackages.find(p => p.package_id.toString() === packageId);
        
        if (!found) {
          setError("Package not found");
        } else {
          setPkg(found);
          
          // Check if user already owns this package
          try {
            const workspaceRes = await axios.get('/api/customer/workspaces', { withCredentials: true });
            if (workspaceRes.data.success) {
              const userWorkspaces = workspaceRes.data.data.workspaces || [];
              const matchingWorkspaces = userWorkspaces.filter(w => w.package_id === parseInt(packageId));
              setExistingWorkspaces(matchingWorkspaces);
            }
          } catch (e) {
            // Ignore if not logged in
          }
        }
      } catch (err) {
        setError("Failed to load package data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [packageId]);

  const slugify = (text) => text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(false);

    try {
      const companySlug = slugify(formData.companyName);
      await axios.post('/api/checkout', {
        packageId: pkg.package_id,
        requested_tenant_name: formData.companyName,
        requested_tenant_slug: companySlug,
        requested_custom_domain: formData.customDomain,
        transaction_id: formData.transactionId,
        duration_months: formData.durationMonths
      }, { withCredentials: true });

      alert('Purchase request submitted successfully! Our team will verify the payment and activate your workspace.');
      router.push('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError(true);
      } else {
        alert(err.response?.data?.message || 'Failed to submit purchase request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-32"><LoadingSpinner /></div>;
  if (error || !pkg) return <div className="py-32 max-w-xl mx-auto"><ErrorMessage message={error} /></div>;

  const totalAmount = (Number(pkg.monthly_price) * formData.durationMonths) + Number(pkg.setup_fee || 0);

  return (
    <div className="py-16 bg-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-text mb-8 text-center">Complete Your Purchase</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Checkout Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Company Details</h2>
            
            {authError && (
              <div className="mb-6 p-4 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-semibold">
                You must be logged in to make a purchase. 
                <button onClick={() => router.push('/login')} className="ml-2 underline font-bold">Login</button> or 
                <button onClick={() => router.push('/register')} className="ml-2 underline font-bold">Register</button>
              </div>
            )}

            {existingWorkspaces.length > 0 ? (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <h3 className="text-lg font-bold text-blue-900 mb-2">You already own this package!</h3>
                <p className="text-sm text-blue-800 mb-6 leading-relaxed">
                  You have {existingWorkspaces.length} active workspace(s) using the <strong>{pkg.name}</strong> plan. Would you like to renew an existing workspace instead of creating a new one?
                </p>
                <div className="flex flex-col gap-3">
                  {existingWorkspaces.map(w => (
                    <div key={w.tenant_id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                      <div>
                        <div className="font-bold text-slate-800">{w.tenant_name}</div>
                        <div className="text-xs text-slate-500 mt-1 font-mono">{w.primary_domain || `${w.slug}.disibin.com`}</div>
                      </div>
                      <Link href={`/dashboard/workspaces/${w.tenant_id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                        Renew Workspace
                      </Link>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-blue-200/60 text-center">
                  <p className="text-xs text-blue-700 mb-3">Or do you want to create another separate workspace on this plan?</p>
                  <button onClick={() => setExistingWorkspaces([])} className="text-sm text-blue-600 font-bold hover:underline">
                    Continue to Purchase New Workspace
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-bold text-text-2 mb-2">Company Name</label>
                <input 
                  type="text" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. Dream Travels Ltd."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-text-2 mb-2">Custom Domain Name</label>
                  <input 
                    type="text" 
                    name="customDomain" 
                    value={formData.customDomain} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="e.g. www.dreamtravels.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-2 mb-2">Subscription Duration</label>
                  <select 
                    name="durationMonths" 
                    value={formData.durationMonths} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value={1}>1 Month (Monthly)</option>
                    <option value={3}>3 Months (Quarterly)</option>
                    <option value={6}>6 Months (Semi-Annual)</option>
                    <option value={12}>12 Months (Annual)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-border">
                <h2 className="text-xl font-bold mb-4">Payment Verification</h2>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                  <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                    Please send <strong>৳{totalAmount.toFixed(0)}</strong> via bKash to our merchant number: <strong className="text-lg">017XXXXXXXX</strong>. <br/>
                    After sending, enter the TrxID below to confirm your purchase.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-2 mb-2">bKash Transaction ID (TrxID)</label>
                  <input 
                    type="text" 
                    name="transactionId" 
                    value={formData.transactionId} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono uppercase tracking-wider"
                    placeholder="8N17XXXX"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting || authError}
                className="w-full py-4 mt-4 bg-primary text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm & Request Activation'}
              </button>
            </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50 rounded-3xl p-8 border border-border sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-text">{pkg.name}</div>
                    <div className="text-sm text-text-2 mt-1">{formData.durationMonths} Month{formData.durationMonths > 1 ? 's' : ''} Subscription</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-text">৳{(Number(pkg.monthly_price) * formData.durationMonths).toFixed(0)}</div>
                    <div className="text-xs text-text-3 mt-0.5">৳{Number(pkg.monthly_price).toFixed(0)} /mo</div>
                  </div>
                </div>

                {pkg.setup_fee > 0 && (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-text">Setup Fee</div>
                      <div className="text-sm text-text-2 mt-1">One-time payment</div>
                    </div>
                    <div className="font-bold text-text">৳{Number(pkg.setup_fee).toFixed(0)}</div>
                  </div>
                )}

                <div className="w-full h-px bg-border my-2" />

                <div className="flex justify-between items-center text-lg">
                  <div className="font-black text-text">Total Today</div>
                  <div className="font-black text-primary text-2xl">৳{totalAmount.toFixed(0)}</div>
                </div>
              </div>
              
              <div className="mt-8 text-xs text-text-3 text-center leading-relaxed">
                By confirming your purchase, you agree to our Terms of Service and Privacy Policy. Account activation may take up to 24 hours while payment is verified.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
