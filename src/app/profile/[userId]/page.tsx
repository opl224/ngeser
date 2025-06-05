// No "use client" directive here
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import React from 'react';

interface ProfilePageProps {
  params: { userId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const actualParams = React.use(params);
  // Unwap searchParams even if not directly used in this component's logic
  // to prevent errors if Next.js internals try to access its keys.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _resolvedSearchParams = React.use(searchParams);

  const userId = actualParams.userId;
  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={userId} />
    </div>
  );
}
