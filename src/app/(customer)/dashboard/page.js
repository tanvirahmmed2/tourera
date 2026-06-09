'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { LoadingSpinner, ErrorMessage } from '@/components/dashboard/ui';

export default function CustomerDashboardPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customer/workspaces', { withCredentials: true });
      if (res.data.success) {
        setWorkspaces(res.data.data.workspaces || []);
        setBaseUrl(res.data.data.baseUrl || 'http://localhost:3000');
      } else {
        throw new Error(res.data.message || 'Failed to load workspaces');
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

  const getWorkspaceUrl = (workspace) => {
    return `http://${workspace.primary_domain}/dashboard`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-text">My Workspaces</h1>
        <p className="text-text-3 text-sm mt-1">Manage your active tour businesses</p>
      </div>

      {workspaces.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🏢
          </div>
          <h2 className="text-lg font-bold text-text mb-2">No Workspaces Found</h2>
          <p className="text-text-2 mb-6 max-w-md mx-auto">
            You haven't created any workspaces yet. Purchase a subscription plan to get started.
          </p>
          <Link href="/pricing" className="btn-custom-primary inline-flex items-center gap-2">
            View Pricing Plans
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workspaces.map(workspace => (
            <div key={workspace.tenant_id} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-text">{workspace.tenant_name}</h3>
                  <p className="text-text-3 text-sm mt-0.5">{workspace.primary_domain}</p>
                </div>
                <div className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                  {workspace.status}
                </div>
              </div>
              
              <div className="space-y-3 mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-2 font-medium">Plan</span>
                  <span className="text-text font-bold">{workspace.plan_name || 'No Active Plan'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-2 font-medium">Subscription</span>
                  <span className="text-text font-bold capitalize">{workspace.subscription_status || 'Inactive'}</span>
                </div>
                {workspace.max_tours && (
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="text-text-2 font-medium">Max Tours</span>
                    <span className="text-text font-bold">{workspace.max_tours}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                <Link 
                  href={`/dashboard/workspaces/${workspace.tenant_id}`}
                  className="flex-1 px-4 py-2 bg-white border border-border text-text font-semibold text-sm rounded-xl text-center hover:bg-slate-50 transition-colors"
                >
                  Manage Settings
                </Link>
                <a 
                  href={getWorkspaceUrl(workspace)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 btn-custom-primary text-center justify-center"
                >
                  Login to App
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
