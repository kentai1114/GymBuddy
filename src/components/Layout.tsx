import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useWorkout } from '@/context/WorkoutContext'

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
