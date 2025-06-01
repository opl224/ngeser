
// No "use client" directive here

import { PostDetailClientPage } from '@/components/PostDetailClientPage';
import type { Metadata } from 'next';

// Tells Next.js not to pre-render any specific paths at build time.
// Combined with default dynamicParams = true, paths will be generated on-demand.
export async function generateStaticParams() {
  return [];
}

// Optional: Add metadata generation if needed
export async function generateMetadata({ params: { postId } }: { params: { postId: string } }): Promise<Metadata> {
  // In a real app with server-side data fetching, you might fetch post title here.
  // Since data is client-side, we'll use a generic title.
  return {
    title: `Detail Postingan`,
    description: 'Lihat detail postingan, komentar, dan interaksi lainnya.',
  };
}

interface PostPageProps {
  params: { postId: string };
}

export default function PostPage({ params: { postId } }: PostPageProps) {
  return <PostDetailClientPage postId={postId} />;
}
