import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "@/config/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFullImageUrl(url: string): string {
  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}
