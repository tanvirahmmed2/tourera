'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setMessage('Your account has been successfully verified! You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold mb-4">Account Verification</h2>
      
      {status === 'loading' && (
        <p className="text-text-2 text-sm mb-6 animate-pulse">{message}</p>
      )}

      {status === 'success' && (
        <>
          <p className="text-green-600 font-medium text-sm mb-6">{message}</p>
          <Link href="/login" className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition w-full inline-block">
            Go to Login
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="text-red-500 font-medium text-sm mb-6">{message}</p>
          <Link href="/login" className="px-5 py-2.5 rounded-xl bg-bg border border-border text-text font-bold text-sm transition w-full inline-block">
            Return to Login
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-text-2">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
