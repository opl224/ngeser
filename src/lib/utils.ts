import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow as fnsFormatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  // addSuffix is false by default, which removes "yang lalu"
  let formattedDistance = fnsFormatDistanceToNow(dateObj, { locale: localeID }); 
  
  // Remove "kurang dari " prefix
  if (formattedDistance.startsWith('kurang dari ')) {
    formattedDistance = formattedDistance.substring('kurang dari '.length);
  }
  return formattedDistance;
}
