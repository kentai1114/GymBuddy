import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Cpu, ExternalLink, KeyRound, Save, User } from 'lucide-react'
import { APP_MARK } from '@/lib/brand'
import { useWorkout } from '@/context/WorkoutContext'
import {
  OPENAI_MODELS,
  OPENROUTER_MODELS,
  loadLlmSettings,
  llmStatusText,
  resolveLlm,
  saveLlmSettings,
  type LlmProviderId,
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
type LlmTab = LlmProviderId

export function SettingsPage() {
  const { state, updateProfile } = useWorkout()
  const [mainTab, setMainTab] = useState<MainTab>('profile')
  const [llmTab, setLlmTab] = useState<LlmTab>('openai')
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
    saveLlmSettings(next)
    setSettings(next)
    setSavedLlm(true)
    window.setTimeout(() => setSavedLlm(false), 1600)
  }

  const bothKeys = Boolean(settings.openaiApiKey.trim() && settings.openrouterApiKey.trim())
  const active = resolveLlm(settings)
  const openaiKnown = OPENAI_MODELS.some((m) => m.id === settings.openaiModel)
  const openrouterKnown = OPENROUTER_MODELS.some((m) => m.id === settings.openrouterModel)

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
        <section className="panel panel-accent">
          <p className="llm-status">{llmStatusText(settings)}</p>
          {active.kind !== 'local' && (
            <p className="muted" style={{ margin: '-6px 0 12px', fontSize: '0.82rem' }}>
              實際呼叫：{active.label} · {active.model}
            </p>
          )}

          {bothKeys && (
            <>
              <label className="field-label">兩個都有時，優先用</label>
              <div className="pick-grid model-grid" style={{ marginBottom: 12 }}>
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
            </>
          )}

          <div className="settings-tabs nested" role="tablist" aria-label="LLM 供應商">
            <button
              type="button"
              role="tab"
              aria-selected={llmTab === 'openai'}
              className={`settings-tab${llmTab === 'openai' ? ' active' : ''}`}
              onClick={() => setLlmTab('openai')}
            >
              ChatGPT
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={llmTab === 'openrouter'}
              className={`settings-tab${llmTab === 'openrouter' ? ' active' : ''}`}
              onClick={() => setLlmTab('openrouter')}
            >
              OpenRouter
            </button>
          </div>

          {llmTab === 'openai' && (
            <>
              <div className="row" style={{ gap: 8, margin: '14px 0 8px' }}>
                <KeyRound size={18} color="var(--accent)" />
                <h3>ChatGPT API Key</h3>
              </div>
              <ol className="howto-ol">
                <li>
                  開{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                    platform.openai.com/api-keys <ExternalLink size={12} />
                  </a>
                </li>
                <li>用 OpenAI 帳號登入（同 ChatGPT 網頁可以係同一個）</li>
                <li>撳 <strong>Create new secret key</strong>，複製以 <code>sk-</code> 開頭嗰串</li>
                <li>首次用 API 要喺 Billing 加付款方式；key 只存在你部機，唔會上傳</li>
              </ol>
              <input
                className="input"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
                value={settings.openaiApiKey}
                onChange={(e) => setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))}
              />

              <div className="row" style={{ gap: 8, margin: '18px 0 10px' }}>
                <Cpu size={18} color="var(--accent)" />
                <h3>Model</h3>
              </div>
              <div className="pick-grid model-grid" style={{ marginBottom: 10 }}>
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
              <input
                className="input"
                autoComplete="off"
                spellCheck={false}
                placeholder="或自行填 model id"
                value={settings.openaiModel}
                onChange={(e) => setSettings((s) => ({ ...s, openaiModel: e.target.value }))}
              />
              <p className="muted" style={{ margin: '10px 0 0', fontSize: '0.85rem' }}>
                {openaiKnown
                  ? `而家 ChatGPT 用：${settings.openaiModel}`
                  : '用自訂 model id，儲存之後會跟呢個。'}
              </p>
            </>
          )}

          {llmTab === 'openrouter' && (
            <>
              <div className="row" style={{ gap: 8, margin: '14px 0 8px' }}>
                <KeyRound size={18} color="var(--accent)" />
                <h3>OpenRouter API Key</h3>
              </div>
              <ol className="howto-ol">
                <li>
                  開{' '}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
                    openrouter.ai/keys <ExternalLink size={12} />
                  </a>
                </li>
                <li>註冊／登入，撳 <strong>Create Key</strong></li>
                <li>複製以 <code>sk-or-</code> 開頭嗰串，貼喺下面</li>
                <li>
                  免費 model 唔一定要信用卡；名單睇{' '}
                  <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer">
                    Models <ExternalLink size={12} />
                  </a>
                </li>
              </ol>
              <input
                className="input"
                type="password"
                autoComplete="off"
                placeholder="sk-or-v1-..."
                value={settings.openrouterApiKey}
                onChange={(e) => setSettings((s) => ({ ...s, openrouterApiKey: e.target.value }))}
              />

              <div className="row" style={{ gap: 8, margin: '18px 0 10px' }}>
                <Cpu size={18} color="var(--accent)" />
                <h3>Model</h3>
              </div>
              <div className="pick-grid model-grid" style={{ marginBottom: 10 }}>
                {OPENROUTER_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`pick-chip${settings.openrouterModel === m.id ? ' active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, openrouterModel: m.id }))}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <input
                className="input"
                autoComplete="off"
                spellCheck={false}
                placeholder="或自行填 model id"
                value={settings.openrouterModel}
                onChange={(e) => setSettings((s) => ({ ...s, openrouterModel: e.target.value }))}
              />
              <p className="muted" style={{ margin: '10px 0 0', fontSize: '0.85rem' }}>
                {openrouterKnown
                  ? `而家 OpenRouter 用：${settings.openrouterModel}`
                  : '用自訂 model id，儲存之後會跟呢個。'}
              </p>
            </>
          )}

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={saveLlm}>
            <Save size={16} />
            {savedLlm ? '已儲存' : '儲存 LLM'}
          </button>
        </section>
      )}

      <Link to="/" className="btn btn-ghost btn-block">
        返回訓練
      </Link>
    </div>
  )
}
