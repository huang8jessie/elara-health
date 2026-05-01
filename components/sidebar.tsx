'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Heart, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Clinical Dashboard',
    href: '/dashboard',
    icon: Heart,
  },
  {
    label: 'Admin Dashboard',
    href: '/admin',
    icon: FileText,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-[217px] bg-[#fafbfe] shadow-[inset_62px_-482px_176.2px_-275px_#d1d8fd] pointer-events-none z-10">
      <div className="flex h-full flex-col pointer-events-auto">
      {/* Logo */}
      <div className="px-4 pt-6">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/elara-logo.png"
            alt="Elara Health"
            width={140}
            height={32}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-[50px] px-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/dashboard' && pathname.startsWith('/patients'))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-lg text-[12px] text-text transition-colors',
                isActive 
                  ? 'bg-[rgba(114,104,221,0.2)]' 
                  : 'hover:bg-[rgba(114,104,221,0.1)]'
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      </div>
    </aside>
  )
}


