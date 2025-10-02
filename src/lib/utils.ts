import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a random but memorable password that satisfies common policies
// - Includes uppercase, lowercase, digits, and a symbol
// - Length >= 10
// - Combines (FirstName or Word) + Word + 2-digit number + symbol
export function generateMemorablePassword(seed?: string): string {
  const words = [
    'Grace','Hope','Faith','Light','Joy','Peace','Praise','Zion','Shalom','Harvest',
    'Mercy','Truth','Glory','Lion','Rock','Eagle','River','Cedar','Olive','Anchor'
  ]

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
  const firstRaw = (seed || '').trim().split(/\s+/)[0] || ''
  const cap = firstRaw ? firstRaw.charAt(0).toUpperCase() + firstRaw.slice(1).toLowerCase() : pick(words)
  const word2 = pick(words)
  let base = `${cap}${word2}`
  if (base.length < 8) base = `${cap}${word2}Ab` // ensure mixed case and baseline length

  const num = Math.floor(10 + Math.random() * 90) // 2 digits
  const symbols = ['!','@','#','$','%','&']
  const sym = pick(symbols)

  const pwd = `${base}${num}${sym}`
  return pwd.length < 10 ? `${base}42!` : pwd
}
