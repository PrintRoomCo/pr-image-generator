'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, ShoppingBag, FileBox, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/views', label: 'Design Tool Views', icon: Layers },
  { href: '/ecommerce', label: 'Upload Ecommerce Images', icon: ShoppingBag },
  { href: '/techpacks', label: 'Tech Pack Assets', icon: FileBox },
  { href: '/jobs', label: 'All Jobs', icon: ListTodo },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[260px] flex flex-col border-r bg-background min-h-screen">
      <div className="flex h-14 items-center border-b px-4">
        <div>
          <h1 className="text-sm font-bold tracking-tight">PR Image Generator</h1>
          <p className="text-xs text-muted-foreground">The Print Room NZ</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pipelines
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">AI-powered generation</p>
      </div>
    </aside>
  )
}
