/**
 * Shared formatting utilities for the application
 */

/**
 * Format a date string to a localized time (e.g., "2:30 PM")
 */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a date string to a short date (e.g., "Dec 27")
 */
export function formatShortDate(dateString: string | null): string {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric" 
  });
}

/**
 * Format a date string to a full date (e.g., "December 27, 2024")
 */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatShortDate(dateString);
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Generate a DiceBear avatar URL
 */
export function getAvatarUrl(seed: string | null, name: string): string {
  const avatarSeed = seed || name.toLowerCase().replace(/\s+/g, "-");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
