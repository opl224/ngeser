
// No "use client" directive here
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import React from 'react';

export async function generateStaticParams() {
  return [];
}

interface ProfilePageProps {
  params: { userId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// Make the Page component async
export default async function ProfilePage({ params: { userId }, searchParams }: ProfilePageProps) {
  // searchParams tidak digunakan secara eksplisit, tetapi mendestrukturisasinya membantu Next.js
  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={userId} />
    </div>
  );
}
