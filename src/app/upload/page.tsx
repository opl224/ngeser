
"use client";

import { UploadForm } from '@/components/UploadForm';
import { getCurrentUserId } from '@/lib/data';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const id = getCurrentUserId();
    if (!id) {
      setAuthStatus('unauthenticated');
      router.push('/login');
    } else {
      setAuthStatus('authenticated');
    }
  }, [router]);

  if (authStatus === 'loading') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Loading Upload Page...</p>
      </div>
    );
  }
  
  if (authStatus === 'unauthenticated') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <UploadForm />
    </div>
  );
}
