import { NavLink } from 'react-router-dom'
import { CalendarDays, Dumbbell } from 'lucide-react'

const links = [
  { to: '/', label: '訓練', icon: Dumbbell, end: true },
  { to: '/history', label: '紀錄', icon: CalendarDays },
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
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
