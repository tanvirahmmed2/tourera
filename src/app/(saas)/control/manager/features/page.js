'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { LoadingSpinner, ErrorMessage } from '@/components/dashboard/ui';

export default function FeaturesPage() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/control/features', { withCredentials: true });
      setFeatures(res.data.data.features || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load features');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleAddFeature = async (e) => {
    e.preventDefault();
    if (!newFeatureName.trim()) return;
    
    setIsAdding(true);
    try {
      await axios.post('/api/control/features', { name: newFeatureName.trim() }, { withCredentials: true });
      setNewFeatureName('');
      fetchFeatures();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add feature');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (featureId) => {
    if (!confirm('Are you sure you want to delete this feature? Packages using this feature will lose it.')) return;
    try {
      await axios.delete(`/api/control/features/${featureId}`, { withCredentials: true });
      fetchFeatures();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete feature');
    }
  };

  if (loading && features.length === 0) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/control/manager/packages" className="px-4 py-2 text-sm font-bold text-text-2 bg-white border border-border rounded-xl hover:bg-slate-50 transition-colors">
          ← Back to Packages
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight">Manage Features</h1>
          <p className="text-sm text-text-2 mt-0.5">Global list of features that can be assigned to packages</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchFeatures} />}

      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-border bg-slate-50">
          <form onSubmit={handleAddFeature} className="flex items-center gap-3">
            <input 
              type="text" 
              value={newFeatureName} 
              onChange={(e) => setNewFeatureName(e.target.value)} 
              placeholder="e.g. Dedicated Account Manager" 
              className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-medium text-text" 
              required
            />
            <button 
              type="submit" 
              disabled={isAdding || !newFeatureName.trim()} 
              className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAdding ? 'Adding...' : 'Add Feature'}
            </button>
          </form>
        </div>

        <div className="p-0">
          {features.length === 0 ? (
            <div className="p-8 text-center text-text-2">No features found. Add one above.</div>
          ) : (
            <ul className="divide-y divide-border">
              {features.map((f) => (
                <li key={f.feature_id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold shrink-0">
                      ✓
                    </span>
                    <div>
                      <div className="font-bold text-sm text-text">{f.name}</div>
                      <div className="text-xs text-text-3 font-mono mt-0.5">{f.key}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(f.feature_id)}
                    className="px-3 py-1.5 text-xs font-bold text-danger bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger hover:text-white"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
