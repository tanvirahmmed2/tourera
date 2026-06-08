'use client';
import axios from 'axios';
import { useState as __useState, useEffect as __useEffect, useCallback as __useCallback } from 'react';
import Link from 'next/link';

export function PricingCards({ showDescriptions = false }) {
  
  const fetchUrl = '/api/public/packages';
  const [data, setData] = __useState(null);
  const [loading, setLoading] = __useState(true);
  const [error, setError] = __useState(null);

  const fetchData = __useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(fetchUrl, { withCredentials: true });
      setData(res.data?.data?.packages || []);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        window.location.href = '/login';
        return;
      }
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  __useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="text-center p-12 text-text-3 font-semibold">Loading packages...</div>;
  if (error || !data || data.length === 0) return <div className="text-center p-12 text-text-3 font-semibold">No packages found.</div>;

  const packages = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
      {packages.map((pkg, index) => {
        const isPopular = index === 1; // Automatically highlight the middle tier
        return (
        <div 
          key={pkg.package_id} 
          className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col gap-6 ${
            isPopular 
              ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105 z-10 border-0' 
              : 'bg-white border border-border shadow-sm hover:border-primary/30 hover:shadow-md'
          }`}
        >
          {isPopular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-xs font-black py-1.5 px-5 rounded-full whitespace-nowrap tracking-widest uppercase border border-primary/10 shadow-sm">
              Most Popular
            </div>
          )}
          
          <div>
            <h3 className={`text-2xl font-black tracking-tight mb-2 ${isPopular ? 'text-white' : 'text-text'}`}>{pkg.name}</h3>
            {showDescriptions && pkg.description && (
              <p className={`text-sm leading-relaxed mt-2 min-h-[40px] ${isPopular ? 'text-white/80' : 'text-text-2'}`}>{pkg.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${isPopular ? 'text-white/70' : 'text-text-3'}`}>৳</span>
              <span className={`text-5xl font-black tracking-tighter ${isPopular ? 'text-white' : 'text-text'}`}>{Number(pkg.monthly_price).toFixed(0)}</span>
              <span className={`text-sm font-bold ${isPopular ? 'text-white/70' : 'text-text-3'}`}>/mo</span>
            </div>
            <div className={`text-xs font-medium ${isPopular ? 'text-white/60' : 'text-text-3'}`}>
              {pkg.setup_fee > 0 ? `+৳${Number(pkg.setup_fee).toFixed(0)} one-time setup fee` : 'No setup fee'}
            </div>
          </div>

          <div className={`w-full h-px ${isPopular ? 'bg-white/20' : 'bg-border'}`} />

          <ul className="list-none flex flex-col gap-4 flex-1 p-0 m-0">
            {(pkg.features || []).map((f) => (
              <li key={f.feature_id || f.name || f} className="text-sm font-medium flex items-start gap-3">
                <span className={`shrink-0 mt-0.5 ${isPopular ? 'text-white' : 'text-primary'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span> 
                <span className={`${isPopular ? 'text-white/90' : 'text-text-2'}`}>
                  {f.name || f} {f.value ? `: ${f.value}` : ''}
                </span>
              </li>
            ))}
          </ul>

          <Link 
            href={`/checkout/${pkg.package_id}`} 
            className={`w-full text-center py-4 rounded-xl font-bold text-sm transition-all duration-300 mt-4 shadow-sm ${
              isPopular 
                ? 'bg-white text-primary hover:bg-slate-50 hover:shadow-md' 
                : 'bg-primary text-white hover:opacity-90 hover:shadow-md'
            }`}
          >
            Complete Purchase
          </Link>
        </div>
      )})}
    </div>
  );
}
