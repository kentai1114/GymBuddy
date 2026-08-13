# GymBuddy

AI 健身訓練助手：揀今日要練嘅部位 → 自動排課 → 帶住你完成每一組（kg / reps）→ 進度寫入本機紀錄。

資料全部存在裝置 LocalStorage，唔使後端。冇 API Key 都可以用本地規則排課。

日常開發同試用，**直接開網頁版**就得，唔使 Xcode。

---

## 快速開始（網頁版）

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # 如果 command not found: npm
cd ~/Desktop/Project/GymBuddy
npm install
npm run dev
```

瀏覽器打開：**http://localhost:5173/**

改 `src/` 會即時 refresh。

手機用同一個 Wi‑Fi 試：

```bash
npm run dev -- --host
```

然後用終端機顯示嘅 **Network** 網址（例如 `http://192.168.x.x:5173`）喺手機瀏覽器打開。Safari / Chrome 可以加到主畫面當 PWA。

其他：

```bash
npm run build      # 生產打包
npm run preview    # 預覽 dist
```

建議把 `export PATH="$HOME/.local/node/bin:$PATH"` 寫入 `~/.zshrc`，之後新開終端機就有 `npm`。

---

## 功能

| 頁面 | 做咩 |
|------|------|
| **訓練** | 揀肌群同時長，產生今日課表；記 kg / reps、休息計時、示範動畫 |
| **紀錄** | 月曆睇過往訓練、週／月容量同完成組數 |
| **設定** | 個人資料（目標、經驗、分化、每週日數）同 LLM |

其他：肌肉恢復提示、即場換動作、完成後有時間／容量／估算消耗。

---

## 接真實 AI

去 **設定 → LLM**。兩個供應商分開兩張卡，頂部會寫而家排課用邊個。

| | ChatGPT | OpenRouter |
|--|---------|------------|
| 要咩 | 貼 `sk-` key，再揀 model | 只貼 `sk-or-` key |
| Model | `gpt-5.6-luna` / `gpt-5.4-mini` / `gpt-5.4-nano` / `gpt-5-mini` / `gpt-5-nano` | 自動揀，App 入面唔使選 |
| Key | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | [openrouter.ai/keys](https://openrouter.ai/keys) |

- 兩個都有：預設用 ChatGPT，可以改「優先用邊個」
- 得其中一個：用嗰個
- 兩個都冇：用本地規則排課，App 照用

本機開發亦可以喺專案根目錄建立 `.env`（唔好 commit）：

```bash
cp .env.example .env
# OPENAI_API_KEY=sk-...
# OPENROUTER_API_KEY=sk-or-v1-...
```

GitHub Pages 唔好把 key 寫入 repo；喺網頁／App 設定頁貼 key 即可。

---

## GitHub Pages（PWA）

正確網址：**https://kentai1114.github.io/GymBuddy/**

（repo 已改名做 `GymBuddy`，舊網址 `/gym_app/` 會 404。）

**一定要揀 GitHub Actions，唔好揀 Deploy from a branch。**  
如果 Source 係 `master` 根目錄，GitHub 會直接上載原始 `index.html`（入面係 `/src/main.tsx`），瀏覽器載唔到，就係一片空白。

第一次／改完 Source 之後：

1. Repo → **Settings → Pages → Build and deployment → Source** 揀 **GitHub Actions**
2. 去 **Actions** → `Deploy GitHub Pages` → 最新嗰次 → **Re-run jobs**（或再 push 一次）
3. 等 workflow 變綠色，用上面網址打開（硬 refresh：`⌘⇧R`）
4. 手機 Safari / Chrome 加到主畫面就係 PWA

---

## iOS / Android（可選）

要原生 App 先用。`npm run mobile:ios` **唔係**開網頁 server，佢只係：打包 → sync 入 Xcode → 打開 Xcode。

```bash
npm run mobile:ios        # sync 並打開 Xcode
npm run mobile:android    # sync 並打開 Android Studio
npm run mobile:sync       # 只 sync，唔開 IDE
```

Xcode：選 **App** → 模擬器（例如 iPhone 17）或真機 → Signing 揀 Apple ID → ▶。  
最低 iOS 15。改完 `src/` 要再 `npm run mobile:sync` 然後 Xcode ▶，網頁版唔使呢步。

---

## 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 本機網頁（http://localhost:5173） |
| `npm run dev -- --host` | 同一 Wi‑Fi 俾手機開 |
| `npm run build` | TypeScript check + Vite build |
| `npm run preview` | 預覽打包結果 |
| `npm run mobile:sync` | build 後 sync 去 iOS / Android |
| `npm run mobile:ios` | sync 並打開 Xcode |
| `npm run mobile:android` | sync 並打開 Android Studio |

---

## 專案結構

```
GymBuddy/
├── src/
│   ├── pages/              # 訓練、紀錄、設定
│   ├── components/         # 課表 runner、組數表、示範動畫
│   ├── lib/
│   │   ├── openai.ts       # ChatGPT / OpenRouter
│   │   ├── ai-suggest.ts   # AI 排課（LLM + 本地回退）
│   │   ├── settings.ts     # LLM 設定
│   │   └── storage.ts      # LocalStorage
│   ├── data/exercises.ts   # 動作庫
│   └── context/            # 全域訓練狀態
├── public/                 # PWA manifest、icons、service worker
├── ios/                    # Capacitor iOS
├── android/                # Capacitor Android
├── capacitor.config.ts
└── package.json
```

---

## 技術

Vite · React 19 · TypeScript · Capacitor 8（iOS / Android）· GitHub Pages PWA

---

## 備註

個人 / 學習用途。API Key 只存在本機（設定頁或 `.env`），唔好提交去 Git。
