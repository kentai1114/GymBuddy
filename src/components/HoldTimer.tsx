import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { formatSeconds } from '@/lib/utils'

export function HoldTimer({
  left,
  total,
  running,
  onToggle,
}: {
  left: number
  total: number
  running: boolean
  onToggle: () => void
}) {
  const progress = total > 0 ? Math.min(100, ((total - left) / total) * 100) : 0
  return (
    <div className="hold-timer">
      <p className="eyebrow">計時</p>
      <strong>{formatSeconds(left)}</strong>
      <div className="hold-track" style={{ ['--progress' as string]: `${progress}%` }} />
      <button type="button" className="btn btn-ghost" onClick={onToggle}>
        {running ? <Pause size={16} /> : <Play size={16} />}
        {running ? '暫停' : '開始'}
      </button>
    </div>
  )
}

export function SideTimer({ durationSec }: { durationSec: number }) {
  const total = Math.max(1, durationSec || 45)
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    setLeft(total)
    setRunning(false)
  }, [total])

  useEffect(() => {
    if (!running || left <= 0) return
    const t = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          setRunning(false)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [running, left])

  return (
    <HoldTimer
      left={left}
      total={total}
      running={running}
      onToggle={() => {
        if (left <= 0) setLeft(total)
        setRunning((v) => !v)
      }}
    />
  )
}
