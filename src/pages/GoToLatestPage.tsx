import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllMemories } from '../db/operations'

export default function GoToLatestPage() {
  const navigate = useNavigate()

  useEffect(() => {
    getAllMemories().then((memories) => {
      if (memories.length > 0) {
        navigate(`/revisit/${memories[0].id}`, { replace: true })
      } else {
        navigate('/record', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="text-text-muted">正在跳转到最新记忆...</p>
    </div>
  )
}
