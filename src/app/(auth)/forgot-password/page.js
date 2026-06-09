'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok && !data.success) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }
      
      setSubmitted(true);
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Check your email</h2>
        <p className="text-muted text-sm mb-6">
          If an account exists for that email, we've sent instructions to reset your password.
        </p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50 w-full inline-block">Return to login</Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold text-center mb-2">Reset Password</h2>
      <p className="text-center text-muted text-sm mb-6">
        Enter your email and we'll send you a link to reset your password.
      </p>
      
      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="form-group gap-md">
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-semibold text-text-2 mb-1" htmlFor="email">Email address</label>
          <input 
            id="email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-3 focus:outline-none focus:border-primary/50" 
            required 
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50 w-full mt-4">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      
      <p className="text-center text-sm text-muted mt-6">
        Remember your password? <Link href="/login" className="text-primary font-medium">Sign in</Link>
      </p>
    </>
  );
}
