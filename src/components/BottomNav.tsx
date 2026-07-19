import { NavLink } from 'react-router-dom'
import { CalendarDays, Database, Dumbbell, Home, Sparkles } from 'lucide-react'

const links = [
  { to: '/', label: '今日', icon: Home, end: true },
  { to: '/suggest', label: 'AI建議', icon: Sparkles },
  { to: '/session', label: '訓練', icon: Dumbbell },
  { to: '/history', label: '記錄', icon: CalendarDays },
  { to: '/database', label: '動作庫', icon: Database },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="主導覽">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <Icon size={18} strokeWidth={2.2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
