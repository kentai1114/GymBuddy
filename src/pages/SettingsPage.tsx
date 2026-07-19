import { useState } from 'react'
import { ExternalLink, KeyRound, Save } from 'lucide-react'
import {
  LLM_MODELS,
  loadLlmSettings,
  saveLlmSettings,
  type LlmSettings,
} from '@/lib/settings'

export function SettingsPage() {
  const [settings, setSettings] = useState<LlmSettings>(() => loadLlmSettings())
  const [saved, setSaved] = useState(false)

  const save = () => {
    saveLlmSettings(settings)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">FORGE</p>
        <h1 style={{ marginTop: 8 }}>設定</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          接 OpenRouter 真實 LLM。免費 model 先試，之後可以轉平價付費。
        </p>
      </header>

      <section className="panel panel-accent">
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <KeyRound size={18} color="var(--accent)" />
          <h3>OpenRouter API</h3>
        </div>
        <ol className="muted" style={{ margin: '0 0 12px', paddingLeft: 18, lineHeight: 1.55 }}>
          <li>
            去{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
              openrouter.ai/keys <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
            </a>{' '}
            建立 key（免信用卡可用 free models）
          </li>
          <li>貼下面，揀 model，儲存</li>
          <li>免費大約 50 req/日；儲值 $10 可升到約 1000/日</li>
        </ol>

        <label className="muted" style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem' }}>
          API Key
        </label>
        <input
          className="input"
          type="password"
          autoComplete="off"
          placeholder="sk-or-v1-..."
          value={settings.apiKey}
          onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
        />

        <label
          className="muted"
          style={{ display: 'block', margin: '14px 0 6px', fontSize: '0.85rem' }}
        >
          Model
        </label>
        <select
          className="select"
          value={settings.model}
          onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
        >
          {LLM_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              [{m.tier}] {m.label}
            </option>
          ))}
        </select>

        <p className="muted" style={{ margin: '10px 0 0', fontSize: '0.85rem', lineHeight: 1.45 }}>
          {LLM_MODELS.find((m) => m.id === settings.model)?.note}
        </p>

        <label className="row" style={{ marginTop: 16, gap: 10 }}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
          />
          <span>啟用真實 LLM（關閉則用本地規則引擎）</span>
        </label>

        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={save}>
          <Save size={16} />
          {saved ? '已儲存' : '儲存設定'}
        </button>
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 10 }}>推薦揀邊個？</h3>
        <div className="list-item">
          <div className="badge">$0</div>
          <div>
            <strong>openrouter/free</strong>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              最省事：自動路由免費 model
            </p>
          </div>
        </div>
        <div className="list-item">
          <div className="badge">$0</div>
          <div>
            <strong>Llama 3.3 70B Free</strong>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              課表 JSON 較穩
            </p>
          </div>
        </div>
        <div className="list-item">
          <div className="badge">¢</div>
          <div>
            <strong>Gemini Flash / DeepSeek Chat</strong>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              每日用量高時最抵；免費額滿就轉呢啲
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 8 }}>開發者</h3>
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
          亦可喺專案根目錄建 <code>.env</code>：
          <br />
          <code>VITE_OPENROUTER_API_KEY=sk-or-v1-...</code>
        </p>
      </section>
    </div>
  )
}
