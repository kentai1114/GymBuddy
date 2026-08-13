import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Cpu, ExternalLink, KeyRound, Save, User } from 'lucide-react'
import { APP_MARK } from '@/lib/brand'
import { useWorkout } from '@/context/WorkoutContext'
import {
  OPENAI_MODELS,
  loadLlmSettings,
  llmStatusText,
  resolveLlm,
  saveLlmSettings,
  type LlmSettings,
} from '@/lib/settings'
import type { UserProfile } from '@/lib/types'

const GOALS: Array<{ id: UserProfile['goal']; label: string }> = [
  { id: 'hypertrophy', label: '增肌' },
  { id: 'strength', label: '力量' },
  { id: 'fat_loss', label: '減脂' },
  { id: 'endurance', label: '耐力' },
]

const EXPERIENCE: Array<{ id: UserProfile['experience']; label: string }> = [
  { id: 'beginner', label: '初階' },
  { id: 'intermediate', label: '中階' },
  { id: 'advanced', label: '高階' },
]

const SPLITS: Array<{ id: UserProfile['preferredSplit']; label: string }> = [
  { id: 'push_pull_legs', label: '推拉腿' },
  { id: 'upper_lower', label: '上下肢' },
  { id: 'full_body', label: '全身' },
  { id: 'bro_split', label: '分化' },
]

const DAYS = [2, 3, 4, 5, 6]

type MainTab = 'profile' | 'llm'

export function SettingsPage() {
  const { state, updateProfile } = useWorkout()
  const [mainTab, setMainTab] = useState<MainTab>('profile')
  const [profile, setProfile] = useState<UserProfile>(() => state.profile)
  const [settings, setSettings] = useState<LlmSettings>(() => loadLlmSettings())
  const [savedProfile, setSavedProfile] = useState(false)
  const [savedLlm, setSavedLlm] = useState(false)

  const saveProfile = () => {
    const next = {
      ...profile,
      name: profile.name.trim() || 'KEN',
      bodyWeightKg: Number.isFinite(profile.bodyWeightKg) ? Math.max(30, profile.bodyWeightKg) : 75,
    }
    setProfile(next)
    updateProfile(next)
    setSavedProfile(true)
    window.setTimeout(() => setSavedProfile(false), 1600)
  }

  const saveLlm = () => {
    const next: LlmSettings = {
      ...settings,
      openaiApiKey: settings.openaiApiKey.trim(),
      openaiModel: settings.openaiModel.trim(),
      openrouterApiKey: settings.openrouterApiKey.trim(),
      openrouterModel: settings.openrouterModel.trim(),
    }
    setSettings(saveLlmSettings(next))
    setSavedLlm(true)
    window.setTimeout(() => setSavedLlm(false), 1600)
  }

  const gptOn = Boolean(settings.openaiApiKey.trim())
  const orOn = Boolean(settings.openrouterApiKey.trim())
  const bothKeys = gptOn && orOn
  const active = resolveLlm(settings)

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">{APP_MARK}</p>
        <h1 style={{ marginTop: 6 }}>設定</h1>
        <p className="page-kicker">個人資料用嚟排課；LLM 用嚟叫 AI 砌訓練</p>
      </header>

      <div className="settings-tabs" role="tablist" aria-label="設定分類">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'profile'}
          className={`settings-tab${mainTab === 'profile' ? ' active' : ''}`}
          onClick={() => setMainTab('profile')}
        >
          <User size={15} />
          個人資料
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'llm'}
          className={`settings-tab${mainTab === 'llm' ? ' active' : ''}`}
          onClick={() => setMainTab('llm')}
        >
          <Cpu size={15} />
          LLM
        </button>
      </div>

      {mainTab === 'profile' && (
        <section className="panel">
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <User size={18} color="var(--accent)" />
            <h3>個人資料</h3>
          </div>

          <label className="field-label">名</label>
          <input
            className="input"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />

          <label className="field-label">體重 (kg)</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min={30}
            step={0.1}
            value={profile.bodyWeightKg}
            onChange={(e) =>
              setProfile((p) => ({ ...p, bodyWeightKg: Number(e.target.value) || 0 }))
            }
          />

          <label className="field-label">目標</label>
          <div className="pick-grid model-grid">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`pick-chip${profile.goal === g.id ? ' active' : ''}`}
                onClick={() => setProfile((p) => ({ ...p, goal: g.id }))}
              >
                {g.label}
              </button>
            ))}
          </div>

          <label className="field-label">程度</label>
          <div className="pick-grid duration-grid">
            {EXPERIENCE.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`pick-chip${profile.experience === g.id ? ' active' : ''}`}
                onClick={() => setProfile((p) => ({ ...p, experience: g.id }))}
              >
                {g.label}
              </button>
            ))}
          </div>

          <label className="field-label">每週訓練</label>
          <div className="pick-grid">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                className={`pick-chip${profile.daysPerWeek === d ? ' active' : ''}`}
                onClick={() => setProfile((p) => ({ ...p, daysPerWeek: d }))}
              >
                {d} 日
              </button>
            ))}
          </div>

          <label className="field-label">訓練分化</label>
          <div className="pick-grid model-grid">
            {SPLITS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`pick-chip${profile.preferredSplit === g.id ? ' active' : ''}`}
                onClick={() => setProfile((p) => ({ ...p, preferredSplit: g.id }))}
              >
                {g.label}
              </button>
            ))}
          </div>

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={saveProfile}>
            <Save size={16} />
            {savedProfile ? '已儲存' : '儲存個人資料'}
          </button>
        </section>
      )}

      {mainTab === 'llm' && (
        <div className="stack">
          <section className={`llm-banner${active.kind === 'local' ? '' : ' on'}`}>
            <p className="eyebrow">{active.kind === 'local' ? '未接 AI' : '而家排課用'}</p>
            <strong>{llmStatusText(settings)}</strong>
            <p>
              {active.kind === 'local'
                ? '貼下面其中一條 key 就會改用 AI。Key 只存在呢部機。'
                : bothKeys
                  ? '兩個都有 key，下面可以改優先用邊個。'
                  : '儲存之後，下一堂訓練就會用呢個。'}
            </p>
          </section>

          {bothKeys && (
            <section className="panel">
              <label className="field-label" style={{ marginTop: 0 }}>
                優先用邊個
              </label>
              <div className="pick-grid model-grid">
                <button
                  type="button"
                  className={`pick-chip${settings.preferredProvider === 'openai' ? ' active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, preferredProvider: 'openai' }))}
                >
                  ChatGPT
                </button>
                <button
                  type="button"
                  className={`pick-chip${settings.preferredProvider === 'openrouter' ? ' active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, preferredProvider: 'openrouter' }))}
                >
                  OpenRouter
                </button>
              </div>
            </section>
          )}

          <section className={`llm-card${active.kind === 'openai' ? ' active' : ''}`}>
            <div className="llm-card-head">
              <div className="row" style={{ gap: 8 }}>
                <KeyRound size={18} color="var(--accent)" />
                <h3>ChatGPT</h3>
              </div>
              {gptOn && <span className="llm-badge">{active.kind === 'openai' ? '用緊' : '已貼 key'}</span>}
            </div>
            <p className="llm-help">
              去{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                platform.openai.com/api-keys <ExternalLink size={12} />
              </a>{' '}
              開 <code>sk-</code> key，貼低。首次用 API 要加 Billing。
            </p>
            <input
              className="input"
              type="password"
              autoComplete="off"
              placeholder="sk-..."
              value={settings.openaiApiKey}
              onChange={(e) => setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))}
            />
            <label className="field-label">Model</label>
            <div className="pick-grid model-grid">
              {OPENAI_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`pick-chip${settings.openaiModel === m.id ? ' active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, openaiModel: m.id }))}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          <section className={`llm-card${active.kind === 'openrouter' ? ' active' : ''}`}>
            <div className="llm-card-head">
              <div className="row" style={{ gap: 8 }}>
                <KeyRound size={18} color="var(--accent)" />
                <h3>OpenRouter</h3>
              </div>
              {orOn && (
                <span className="llm-badge">{active.kind === 'openrouter' ? '用緊' : '已貼 key'}</span>
              )}
            </div>
            <p className="llm-help">
              去{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
                openrouter.ai/keys <ExternalLink size={12} />
              </a>{' '}
              開 <code>sk-or-</code> key。Model 由 OpenRouter 自動揀，唔使自己選。
            </p>
            <input
              className="input"
              type="password"
              autoComplete="off"
              placeholder="sk-or-v1-..."
              value={settings.openrouterApiKey}
              onChange={(e) => setSettings((s) => ({ ...s, openrouterApiKey: e.target.value }))}
            />
          </section>

          <button className="btn btn-primary btn-block" onClick={saveLlm}>
            <Save size={16} />
            {savedLlm ? '已儲存' : '儲存 LLM'}
          </button>
        </div>
      )}

      <Link to="/" className="btn btn-ghost btn-block">
        返回訓練
      </Link>
    </div>
  )
}
