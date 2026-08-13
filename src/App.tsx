import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WorkoutProvider } from '@/context/WorkoutContext'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <WorkoutProvider>
      <BrowserRouter basename={basename === '/' ? undefined : basename}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkoutProvider>
  )
}
