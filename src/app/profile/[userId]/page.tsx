"use client";

import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import { useParams } from 'next/navigation';
import React from 'react'; // Import React

interface ProfilePageProps {
  params: Promise<{ userId: string }>; // params is a Promise
}

export default function ProfilePage({ params }: ProfilePageProps) {
  // Unwrap the params Promise using React.use()
  const actualParams = React.use(params);

  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={actualParams.userId} />
    </div>
  );
}
