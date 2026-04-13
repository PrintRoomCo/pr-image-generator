'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '~' },
  { href: '/views', label: 'Design Tool Views', icon: 'V' },
  { href: '/ecommerce', label: 'Ecommerce Images', icon: 'E' },
  { href: '/techpacks', label: 'Tech Pack Assets', icon: 'T' },
  { href: '/jobs', label: 'All Jobs', icon: 'J' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-primary text-primary-foreground min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-lg font-bold">PR Image Generator</h1>
        <p className="text-sm opacity-60 mt-1">The Print Room NZ</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-mono">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
