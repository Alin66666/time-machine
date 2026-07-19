import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/layout/Layout'
import BackgroundMusic from './components/layout/BackgroundMusic'
import RecordPage from './pages/RecordPage'
import SettingsPage from './pages/SettingsPage'
import CoCreatePage from './pages/CoCreatePage'
import GoToLatestPage from './pages/GoToLatestPage'
import UniversePage from './pages/UniversePage'

export default function App() {
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
        <Route path="/" element={<UniversePage />} />
        <Route path="/cocreate" element={<CoCreatePage />} />
        <Route path="/latest" element={<GoToLatestPage />} />
        <Route element={<Layout />}>
          <Route path="/record" element={<RecordPage />} />
          <Route path="/record/:id" element={<RecordPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  )
}
