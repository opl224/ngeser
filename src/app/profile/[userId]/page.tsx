
// No "use client" directive here
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import React from 'react';

export async function generateStaticParams() {
  return [];
}

interface ProfilePageProps {
  params: { userId: string };
  // searchParams: { [key: string]: string | string[] | undefined }; // Removed
}

// Make the Page component async
export default async function ProfilePage({ params: { userId } }: ProfilePageProps) {
  // searchParams was not used, so it's removed from props.
  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={userId} />
    </div>
  );
}
