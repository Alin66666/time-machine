import { create } from 'zustand'
import type { AppSettings } from '../types/memory'

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('tm-settings')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { apiKey: '', theme: 'auto', userName: '' }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem('tm-settings', JSON.stringify(s))
}

interface SettingsStore extends AppSettings {
  setApiKey: (key: string) => void
  setTheme: (t: AppSettings['theme']) => void
  setUserName: (name: string) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...loadSettings(),
  setApiKey: (apiKey) => {
    saveSettings({ ...loadSettings(), apiKey })
    set({ apiKey })
  },
  setTheme: (theme) => {
    saveSettings({ ...loadSettings(), theme })
    set({ theme })
  },
  setUserName: (userName) => {
    saveSettings({ ...loadSettings(), userName })
    set({ userName })
  },
}))
