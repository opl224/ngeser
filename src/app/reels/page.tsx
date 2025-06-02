
"use client";

import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReelsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.32))] text-center p-4">
      <Film className="h-20 w-20 sm:h-24 sm:w-24 text-primary mb-6" />
      <h1 className="text-3xl sm:text-4xl font-headline mb-3 text-foreground">Reels</h1>
      <p className="text-muted-foreground max-w-md">
        Temukan dan tonton video pendek yang seru dan kreatif dari komunitas Elegance.
      </p>
      <p className="text-xs text-muted-foreground mt-6">
        Fitur ini sedang dalam tahap pengembangan.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}
