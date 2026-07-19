# FORGE — AI 健身訓練助手

> 知道你之前做過咩 → 推薦今日應該練咩 → 做緊時即時帶住你完成 → 自動累積進步

FORGE 唔係單純記錄 App，而係一個 **AI Gym Workout Assistant**：根據訓練歷史推薦課表、在訓練中帶住你完成，並自動累積進度。

---

## 功能一覽

| 功能 | 說明 |
|------|------|
| **今日訓練** | 今日部位、預計時間、上次訓練時間、今日目標 |
| **訓練記錄** | Workout History，容量與完成組數自動累積 |
| **AI 訓練建議** | 核心功能；接 OpenRouter 真實 LLM，失敗則回退本地規則 |
| **訓練模式** | 完成組數、重量訓練 Rest Timer、5 分鐘跑步計時 |
| **動作庫** | Muscle / Equipment / Instructions / YouTube demo |
| **AI Coach** | 對話式教練（今日練咩、休息、加重等） |
| **本週概覽** | 週曆與部位覆蓋 |
| **設定** | OpenRouter API Key 與 model 選擇 |

---

## 環境需求

- **Node.js 18+**（要有 `npm` 指令）
- 瀏覽器開發：任何現代瀏覽器
- iOS 真機 / 模擬器：**Xcode**
- Android：Android Studio（可選）

若終端機出現 `command not found: npm`，請確認 Node 已安裝並加入 PATH，例如：

```bash
# 若 Node 裝在 ~/.local/node
export PATH="$HOME/.local/node/bin:$PATH"
# 建議寫入 ~/.zshrc，之後新開終端機就有 npm
```

---

## 快速開始（網頁版）

```bash
cd gym_app
npm install
npm run dev
```

瀏覽器打開終端機顯示的網址（通常是 `http://localhost:5173`）。

其他指令：

```bash
npm run build      # 生產環境打包
npm run preview    # 預覽打包結果
```

---

## 接真實 AI（OpenRouter）

1. 去 [openrouter.ai/keys](https://openrouter.ai/keys) 建立 API Key  
   - 用 **free models 唔一定要信用卡**
2. 打開 App → **設定** → 貼上 Key → 揀 model → 儲存  
   或在專案根目錄建立 `.env`：

```bash
cp .env.example .env
# 編輯 .env：
# VITE_OPENROUTER_API_KEY=sk-or-v1-你的key
```

### 建議 Model

| Model | 費用 | 說明 |
|-------|------|------|
| `openrouter/free` | $0 | 預設；自動路由可用免費 model |
| `meta-llama/llama-3.3-70b-instruct:free` | $0 | 課表 JSON 較穩 |
| `google/gemma-3-12b-it:free` | $0 | 輕量、回應快 |
| `google/gemini-2.0-flash-001` | 極平 | 免費額用完時 |
| `deepseek/deepseek-chat` | 好平 | 中文表現好 |

**額度參考：** 免費帳號大約 **50 次/日**；帳戶儲值約 **US$10** 後，free model 可升到約 **1000 次/日**。

未設定 Key 時，AI 建議 / Coach 會用**本地規則引擎**，App 一樣可以完整使用。

---

## 手機版（Capacitor）

本專案用 **Capacitor** 把現有 React 網頁包成 iOS / Android App（唔使重寫 React Native）。

> `npm run mobile:ios` **唔係**開 API server，亦**唔會**長期佔用 port。  
> 佢只係：打包網頁 → sync 入原生專案 → 打開 Xcode。  
> 終端機可以關；之後用 Xcode 撳 ▶ 運行。

### 常用指令

```bash
npm install

# 改完程式後，同步到手機專案
npm run mobile:sync

# 同步並打開 Xcode（iOS）
npm run mobile:ios

# 同步並打開 Android Studio
npm run mobile:android
```

### 用 Xcode 試玩（iOS）— 新手步驟

1. 終端機執行：`npm run mobile:ios`
2. 等 Xcode 打開（見到 `Opening the Xcode workspace` 即係成功）
3. 頂部中間：
   - 左邊選 **App**
   - 右邊選一部模擬器，例如 **iPhone 16**
4. 撳左上角 ▶（或按 `⌘R`）
5. 等編譯完成，模擬器會自動開，入面就係 **FORGE**

#### 第一次常見問題

| 情況 | 處理 |
|------|------|
| 頂部冇 Simulator | Xcode → Settings → Platforms，安裝 iOS runtime |
| Signing 紅字 | 選 App target → Signing & Capabilities → Team 選你嘅 Apple ID（免費 Personal Team 都得） |
| 改咗程式但 App 冇更新 | 再跑 `npm run mobile:sync`，然後返 Xcode 再 ▶ |
| 想用真機 | 用線連 iPhone → 頂部選你部機 → ▶；第一次要在手機「設定 → 一般 → VPN與裝置管理」信任開發者 |

### App 入面建議試法

1. **設定**：貼 OpenRouter Key（可選）
2. **AI 建議**：睇今日課表 →「採用並開始訓練」
3. **訓練**：完成組數、試 Rest Timer / 5 分鐘跑步
4. **AI Coach**：問「今日練咩？」
5. **本週概覽 / 記錄**：睇進度累積

---

## 專案結構（簡述）

```
gym_app/
├── src/
│   ├── pages/           # 各頁面（今日、建議、訓練、記錄、動作庫、Coach、設定…）
│   ├── lib/
│   │   ├── openrouter.ts    # OpenRouter API
│   │   ├── ai-suggest.ts    # AI 課表建議（LLM + 本地回退）
│   │   ├── coach.ts         # AI Coach
│   │   └── settings.ts      # LLM 設定與 model 清單
│   ├── data/exercises.ts    # 動作資料庫
│   └── context/             # 全域訓練狀態（LocalStorage）
├── ios/                 # Capacitor iOS 專案
├── android/             # Capacitor Android 專案
├── capacitor.config.ts
└── package.json
```

資料預設存在瀏覽器 / App 的 **LocalStorage**，唔使後端。

---

## 技術棧

- Vite + React + TypeScript
- React Router
- OpenRouter（OpenAI 相容 API）
- Capacitor 8（iOS / Android）

---

## 授權與備註

個人 / 學習專案用途。API Key 存在本機（設定頁或 `.env`），請勿把 Key 提交到 Git。  
OpenRouter free model 名單可能更新，請以 [openrouter.ai/models](https://openrouter.ai/models) 為準。
