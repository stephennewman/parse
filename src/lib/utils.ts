// File Purpose: This file contains small utility functions that help with common tasks throughout the app.
// Last updated: 2025-05-21
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
