import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/layout/Layout'
import BackgroundMusic from './components/layout/BackgroundMusic'
import AchievementUnlock from './components/achievements/AchievementUnlock'
import AchievementWall from './components/achievements/AchievementWall'
import HomePage from './pages/HomePage'
import RecordPage from './pages/RecordPage'
import RevisitPage from './pages/RevisitPage'
import MemoryDetailPage from './pages/MemoryDetailPage'
import SettingsPage from './pages/SettingsPage'
import CoCreatePage from './pages/CoCreatePage'
import GoToLatestPage from './pages/GoToLatestPage'
import UniversePage from './pages/UniversePage'
import { useAchievementStore } from './store/achievementStore'

export default function App() {
  const unlockQueue = useAchievementStore((s) => s.unlockQueue)
  const clearQueue = useAchievementStore((s) => s.clearQueue)
  const wallOpen = useAchievementStore((s) => s.wallOpen)
  const setWallOpen = useAchievementStore((s) => s.setWallOpen)

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F5F0EB',
            border: '1px solid #2A2A2A',
          },
        }}
      />
      <BackgroundMusic />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/universe" element={<UniversePage />} />
        <Route path="/cocreate" element={<CoCreatePage />} />
        <Route path="/latest" element={<GoToLatestPage />} />
        <Route element={<Layout />}>
          <Route path="/record" element={<RecordPage />} />
          <Route path="/record/:id" element={<RecordPage />} />
          <Route path="/revisit" element={<RevisitPage />} />
          <Route path="/revisit/:id" element={<MemoryDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <AchievementUnlock queue={unlockQueue} onComplete={clearQueue} />
      <AchievementWall open={wallOpen} onClose={() => setWallOpen(false)} />
    </>
  )
}
