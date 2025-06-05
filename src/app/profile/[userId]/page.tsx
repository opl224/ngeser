// No "use client" directive here
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import React from 'react'; // Changed from: import React, { use } from 'react';

// Removed generateStaticParams as it returns [], which is the default.
// export async function generateStaticParams() {
//   return [];
// }

interface ProfilePageProps {
  params: { userId: string };
}

// Page component no longer needs to be async unless it uses await for other operations
export default function ProfilePage({ params }: ProfilePageProps) { // Accept params directly
  const actualParams = React.use(params); // Changed from: use(params)
  const userId = actualParams.userId; // Correctly access userId from the unwrapped params

  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={userId} />
    </div>
  );
}
