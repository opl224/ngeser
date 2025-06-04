
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isToday, isYesterday, format as fnsFormat, differenceInCalendarDays, startOfWeek } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(dateInput: Date | string | number): string {
  const dateObj = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const now = new Date();

  if (isToday(dateObj)) {
    return fnsFormat(dateObj, 'HH:mm'); // e.g., "14:30"
  }

  if (isYesterday(dateObj)) {
    return 'Kemarin';
  }

  // Check if the date is within the current calendar week (Monday to Sunday for Indonesian locale)
  // and also ensure it's within the last 7 days (differenceInCalendarDays < 7)
  // but not today or yesterday (already handled).
  const daysDifference = differenceInCalendarDays(now, dateObj);
  if (daysDifference > 1 && daysDifference < 7 && dateObj >= startOfWeek(now, { locale: localeID })) {
    return fnsFormat(dateObj, 'EEEE', { locale: localeID }); // e.g., "Senin"
  }

  // Older than a week or from a previous week (but still within 7 days if week started late)
  return fnsFormat(dateObj, 'dd/MM/yy'); // e.g., "15/07/24"
}
