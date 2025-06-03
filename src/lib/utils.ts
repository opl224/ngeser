
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow as fnsFormatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  let formattedDistance = fnsFormatDistanceToNow(dateObj, { locale: localeID }); 
  
  if (formattedDistance.startsWith('kurang dari ')) {
    formattedDistance = formattedDistance.substring('kurang dari '.length);
  }
  if (formattedDistance.startsWith('sekitar ')) {
    formattedDistance = formattedDistance.substring('sekitar '.length);
  }
  // Hapus " yang lalu" jika ada (date-fns terkadang menambahkannya bahkan dengan addSuffix default)
  if (formattedDistance.endsWith(' yang lalu')) {
    formattedDistance = formattedDistance.substring(0, formattedDistance.length - ' yang lalu'.length);
  }
  return formattedDistance;
}
