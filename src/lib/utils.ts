import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCurrentISOWeek(): string {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((dayOfYear + yearStart.getDay() + 1) / 7);
  const paddedWeek = String(weekNumber).padStart(2, '0');
  return `${now.getFullYear()}-W${paddedWeek}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isLeapYear(date: Date): boolean {
  const year = date.getFullYear();
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('nl-NL').format(value);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return '--';
  return Math.round(score).toString();
}
