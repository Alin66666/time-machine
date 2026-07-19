import { Link, useLocation } from 'react-router-dom'
import { Hourglass, PenLine, Settings, Orbit } from 'lucide-react'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', label: '宇宙', icon: Orbit },
  { to: '/record', label: '记录', icon: PenLine },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-text hover:opacity-80 transition-opacity">
          <Hourglass className="h-6 w-6 text-amber-500" />
          <span className="text-lg font-medium tracking-wide">美好时光机</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-bg-card text-text'
                    : 'text-text-muted hover:text-text hover:bg-bg-card/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
