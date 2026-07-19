import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WorkoutProvider } from '@/context/WorkoutContext'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { SuggestPage } from '@/pages/SuggestPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SessionPage } from '@/pages/SessionPage'
import { DatabasePage } from '@/pages/DatabasePage'
import { CoachPage } from '@/pages/CoachPage'
import { WeeklyPage } from '@/pages/WeeklyPage'

export default function App() {
  return (
    <WorkoutProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="suggest" element={<SuggestPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="session" element={<SessionPage />} />
            <Route path="database" element={<DatabasePage />} />
            <Route path="database/:id" element={<DatabasePage />} />
            <Route path="coach" element={<CoachPage />} />
            <Route path="weekly" element={<WeeklyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkoutProvider>
  )
}
