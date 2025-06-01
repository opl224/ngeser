
// No "use client" directive here

import { PostDetailClientPage } from '@/components/PostDetailClientPage';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  { params: { postId }, searchParams }: { params: { postId: string }, searchParams: { [key: string]: string | string[] | undefined } }
): Promise<Metadata> {
  // searchParams tidak digunakan secara eksplisit, tetapi mendestrukturisasinya membantu Next.js
  return {
    title: `Detail Postingan`,
    description: 'Lihat detail postingan, komentar, dan interaksi lainnya.',
  };
}

interface PostPageProps {
  params: { postId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PostPage({ params: { postId }, searchParams }: PostPageProps) {
  // searchParams tidak digunakan secara eksplisit, tetapi mendestrukturisasinya membantu Next.js
  return <PostDetailClientPage postId={postId} />;
}
