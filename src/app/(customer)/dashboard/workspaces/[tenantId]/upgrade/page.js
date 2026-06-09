'use client';
import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorMessage } from '@/components/dashboard/ui';

export default function UpgradeWorkspacePage({ params }) {
  const router = useRouter();
  const { tenantId } = use(params);

  const [workspace, setWorkspace] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [duration, setDuration] = useState(1);
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [wsRes, pkgsRes] = await Promise.all([
          axios.get(`/api/customer/workspaces/${tenantId}`, { withCredentials: true }),
          axios.get('/api/public/packages')
        ]);

        if (wsRes.data.success) {
          setWorkspace(wsRes.data.data);
        } else {
          throw new Error('Failed to load workspace');
        }

        if (pkgsRes.data.success) {
          setPackages(pkgsRes.data.data.packages || []);
        } else {
          throw new Error('Failed to load packages');
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push('/dashboard');
        } else {
          setError(err.message || 'Error loading upgrade data');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalPayable > 0 && !trxId) {
      alert("Transaction ID is required for payments.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`/api/customer/workspaces/${tenantId}/upgrade`, {
        package_id: selectedPkg.package_id,
        duration_months: duration,
        transaction_id: trxId
      }, { withCredentials: true });

      if (res.data.success) {
        alert('Plan change request submitted successfully!');
        router.push(`/dashboard/workspaces/${tenantId}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!workspace || !workspace.subscription) return <ErrorMessage message="No active subscription found to upgrade." />;

  const sub = workspace.subscription;
  const remainingDays = Math.max(0, Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
  const remainingValue = (Number(sub.monthly_price) / 30) * remainingDays;

  let newCost = 0;
  let totalPayable = 0;
  let newDaysIfDowngrade = 0;

  if (selectedPkg) {
    newCost = Number(selectedPkg.monthly_price) * duration;
    totalPayable = Math.max(0, newCost - remainingValue);
    
    // Calculate how many days they get if it's a downgrade (meaning payable is 0 and they still have leftover credit)
    if (totalPayable === 0) {
      const totalValueApplied = remainingValue;
      newDaysIfDowngrade = Math.floor((totalValueApplied / Number(selectedPkg.monthly_price)) * 30);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/dashboard/workspaces/${tenantId}`} className="px-4 py-2 text-sm font-bold text-text-2 bg-white border border-border rounded-xl hover:bg-slate-50 transition-colors">
          ← Back to Workspace
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-text">Change Plan: {workspace.tenant.name}</h1>
          <p className="text-text-3 text-sm mt-1">Upgrade or downgrade your current subscription</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text mb-6">Select a New Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map(pkg => {
                const isCurrent = pkg.package_id === sub.package_id;
                const isSelected = selectedPkg?.package_id === pkg.package_id;
                
                return (
                  <div 
                    key={pkg.package_id}
                    onClick={() => !isCurrent && setSelectedPkg(pkg)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col relative overflow-hidden ${
                      isCurrent ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-75' :
                      isSelected ? 'bg-primary/5 border-primary shadow-sm' : 
                      'bg-white border-slate-200 hover:border-primary/40'
                    }`}
                  >
                    {isCurrent && <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg">CURRENT PLAN</div>}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800">{pkg.name}</h3>
                      <div className="text-right">
                        <div className="font-bold text-primary">৳{Number(pkg.monthly_price).toFixed(0)}</div>
                        <div className="text-[10px] text-slate-500">/month</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <div><strong className="text-slate-700">{pkg.max_tours}</strong> Max Tours</div>
                      <div><strong className="text-slate-700">{pkg.max_bookings_per_month}</strong> Bookings/mo</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedPkg && (
            <div className="bg-white border border-border rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-lg font-bold text-text mb-6">Configure Duration & Payment</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Duration</label>
                  <select 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value={1}>1 Month (৳{(Number(selectedPkg.monthly_price) * 1).toFixed(0)})</option>
                    <option value={3}>3 Months (৳{(Number(selectedPkg.monthly_price) * 3).toFixed(0)})</option>
                    <option value={6}>6 Months (৳{(Number(selectedPkg.monthly_price) * 6).toFixed(0)})</option>
                    <option value={12}>1 Year (৳{(Number(selectedPkg.monthly_price) * 12).toFixed(0)})</option>
                  </select>
                </div>

                {totalPayable > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                      <p className="text-sm text-blue-800 font-medium leading-relaxed">
                        Please send <strong>৳{totalPayable.toFixed(0)}</strong> via bKash to our merchant number: <strong className="text-lg">017XXXXXXXX</strong>.
                      </p>
                    </div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">bKash Transaction ID (TrxID)</label>
                    <input 
                      type="text" 
                      required 
                      value={trxId} 
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none uppercase font-mono tracking-wider"
                      placeholder="8N17XXXX"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 mt-2 bg-primary text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting Request...' : totalPayable > 0 ? 'Confirm & Upgrade' : 'Confirm & Downgrade'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-slate-50 border border-border rounded-3xl p-6 sticky top-8">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider mb-6 border-b border-slate-200 pb-2">Plan Summary</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Current Plan</span>
                <span className="text-slate-800 font-bold">{sub.plan_name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Current Rate</span>
                <span className="text-slate-800 font-bold">৳{Number(sub.monthly_price).toFixed(0)} /mo</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Days Remaining</span>
                <span className="text-slate-800 font-bold">{remainingDays} days</span>
              </div>
              
              <div className="w-full h-px bg-slate-200 my-2" />

              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-bold">Unused Credit Value</span>
                <span className="text-success font-bold text-base">+৳{remainingValue.toFixed(0)}</span>
              </div>

              {selectedPkg && (
                <>
                  <div className="w-full h-px bg-slate-200 my-2" />
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-medium">New Plan</span>
                    <span className="text-slate-800 font-bold">{selectedPkg.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-medium">New Rate</span>
                    <span className="text-slate-800 font-bold">৳{Number(selectedPkg.monthly_price).toFixed(0)} /mo</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-medium">Duration Cost</span>
                    <span className="text-slate-800 font-bold">৳{newCost.toFixed(0)}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 font-black">Total Payable</span>
                      <span className="text-primary font-black text-xl">৳{totalPayable.toFixed(0)}</span>
                    </div>
                  </div>

                  {totalPayable === 0 && newDaysIfDowngrade > 0 && (
                     <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                        Since your unused credit (৳{remainingValue.toFixed(0)}) covers the cost of this downgrade, you pay <strong>৳0 today</strong>. Your credit will automatically be converted into <strong>{newDaysIfDowngrade} days</strong> of the {selectedPkg.name} plan!
                      </p>
                     </div>
                  )}
                </>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 mt-6 text-center">
              Credit values are calculated pro-rata based on your remaining subscription days. 
              Credit cannot be refunded as cash, but is applied fully towards your new plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
