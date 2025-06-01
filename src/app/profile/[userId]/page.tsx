
// No "use client" directive here

import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import React from 'react';

// Tells Next.js not to pre-render any specific paths at build time.
// Combined with default dynamicParams = true, paths will be generated on-demand.
export async function generateStaticParams() {
  return [];
}

interface ProfilePageProps {
  params: { userId: string }; 
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={params.userId} />
    </div>
  );
}
