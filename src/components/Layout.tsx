import { Outlet } from 'react-router-dom'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { BottomNav } from './BottomNav'
import { useWorkout } from '@/context/WorkoutContext'

export function AppHeader() {
  return (
    <header className="app-header">
      <p className="brand-mark">GymBuddy</p>
      <p className="page-kicker">{format(new Date(), 'M月d日 EEEE', { locale: zhTW })}</p>
    </header>
  )
}

export function Layout() {
  const { todaySession } = useWorkout()
  const lifting = todaySession?.status === 'in_progress'
  return (
    <div className={`app-shell${lifting ? ' lifting' : ''}`}>
      <Outlet />
      {!lifting && <BottomNav />}
    </div>
  )
}
