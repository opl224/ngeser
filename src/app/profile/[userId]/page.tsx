
// No "use client" directive here
import { UserProfileDisplay } from '@/components/UserProfileDisplay';
import React, { use } from 'react'; // Import React.use

// Removed generateStaticParams as it returns [], which is the default.
// export async function generateStaticParams() {
//   return [];
// }

interface ProfilePageProps {
  params: { userId: string };
}

// Page component no longer needs to be async unless it uses await for other operations
export default function ProfilePage({ params }: ProfilePageProps) { // Accept params directly
  const actualParams = use(params); // Unwrap params using React.use()
  const userId = actualParams.userId; // Correctly access userId from the unwrapped params

  return (
    <div className="container mx-auto py-8">
      <UserProfileDisplay userId={userId} />
    </div>
  );
}
