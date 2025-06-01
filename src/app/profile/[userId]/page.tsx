"use client";

import { UserProfileDisplay } from '@/components/UserProfileDisplay';

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={params.userId} />
    </div>
  );
}
