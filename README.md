# GymBuddy

AI 健身訓練助手：揀今日要練嘅部位 → 自動排課 → 帶住你完成每一組（kg / reps）→ 進度寫入本機紀錄。

資料存在瀏覽器 LocalStorage。冇 API Key 都可以用本地規則排課。

## 快速開始

```bash
cd ~/Desktop/Project/GymBuddy
npm install
npm run dev
```

瀏覽器打開 **http://localhost:5173/**

同一 Wi‑Fi 用手機試：`npm run dev -- --host`，再用終端機顯示嘅 Network 網址打開。

```bash
npm run build      # 生產打包
npm run preview    # 預覽 dist
```

如果 `npm` command not found：`export PATH="$HOME/.local/node/bin:$PATH"`（可寫入 `~/.zshrc`）。

## 功能

| 頁面 | 做咩 |
|------|------|
| **訓練** | 揀肌群同時長，產生課表；記 kg / reps、休息計時、示範動畫 |
| **紀錄** | 日曆、過往訓練、肌肉恢復 |
| **我** | 個人資料同 LLM |

即場換動作、完成後有時間／訓練量／估算消耗。

## 接真實 AI

去 **設定 → LLM**。兩個供應商分開兩張卡，頂部會寫而家排課用邊個。

| | ChatGPT | OpenRouter |
|--|---------|------------|
| 要咩 | 貼 `sk-` key，再揀 model | 只貼 `sk-or-` key |
| Model | `gpt-5.6-luna` / `gpt-5.4-mini` / `gpt-5.4-nano` / `gpt-5-mini` / `gpt-5-nano` | 自動揀，App 入面唔使選 |
| Key | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | [openrouter.ai/keys](https://openrouter.ai/keys) |

- 兩個都有：預設用 ChatGPT，可以改「優先用邊個」
- 得其中一個：用嗰個
- 兩個都冇：用本地規則排課

本機開發可以喺專案根目錄 `cp .env.example .env` 填 key。GitHub Pages 喺設定頁貼 key 即可。

## GitHub Pages

**https://kentai1114.github.io/GymBuddy/**

**Source 一定要揀 GitHub Actions**，唔好揀 Deploy from a branch。揀錯會上載原始 `index.html`，頁面空白。

1. Repo → **Settings → Pages → Build and deployment → Source** 揀 **GitHub Actions**
2. **Actions** → `Deploy GitHub Pages` → 最新嗰次 → **Re-run jobs**（或再 push）
3. workflow 變綠色之後打開上面網址（硬 refresh：`⌘⇧R`）
