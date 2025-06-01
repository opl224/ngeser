
"use client";

import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import { getCurrentUserId } from '@/lib/data';
import { useEffect, useState } from 'react';

export default function CurrentUserProfilePage() {
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getCurrentUserId();
      setCurrentUserIdState(id);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="font-headline text-xl">Loading profile...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="font-headline text-xl text-muted-foreground">Could not determine current user.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={currentUserId} />
    </div>
  );
}
