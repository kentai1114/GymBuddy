import type { AppState, ChatMessage } from './types'
import { suggestWorkoutHeuristic } from './ai-suggest'
import { lastCompleted, muscleLabel, uid, formatRelative } from './utils'
import { chatCompletion } from './openrouter'
import { hasLlmConfigured, loadLlmSettings } from './settings'

export function coachReplyHeuristic(input: string, state: AppState): ChatMessage {
  const q = input.trim().toLowerCase()
  const last = lastCompleted(state.sessions)
  const suggestion = suggestWorkoutHeuristic(state.sessions, state.profile)

  let content: string

  if (/今日|today|練咩|建議|suggest|推薦/.test(q)) {
    content = `今日建議：**${suggestion.session.title}**（${muscleLabel(suggestion.session.focus)}）。\n\n目標：${suggestion.session.goal}\n預計：${suggestion.session.estimatedMinutes} 分鐘。\n\n${suggestion.reason}\n\n去「AI 建議」頁可以直接採用呢個計劃。`
  } else if (/休息|恢復|sore|痠|酸/.test(q)) {
    content = last
      ? `你上次練咗 ${muscleLabel(last.focus)}（${formatRelative(last.completedAt)}）。大肌群通常要 48–72 小時。如果仍然明顯痠痛，今日可以做肩部細節 + 5 分鐘輕有氧，或者完全休息。`
      : '暫時未有訓練記錄。一般大肌群休息 48 小時，腿日可到 72 小時。'
  } else if (/加重量|progress|進步|加重|pr/.test(q)) {
    content =
      '進階原則：同一個動作連續 2 次訓練都能完成目標次數，下次加重 2.5–5%。組間失敗就維持重量，先把動作質量做好。FORGE 會在 AI 建議裡自動參考你上次重量。'
  } else if (/有氧|跑步|cardio|減脂/.test(q)) {
    content =
      '力量訓練後加 5 分鐘跑步機已經足夠維持心肺。若目標係減脂，可以每週加 2 次 20–30 分鐘穩定有氧，但唔好犧牲複合動作的恢復。'
  } else if (/姿勢|form|教學|點做/.test(q)) {
    content =
      '去「動作庫」揀動作，裡面有步驟說明同 YouTube demo。訓練模式入面亦可以即時查看當前動作要點。'
  } else if (/計劃|split|安排|一週|weekly/.test(q)) {
    content = `你而家設定係每週 ${state.profile.daysPerWeek} 日、${state.profile.preferredSplit.replaceAll('_', ' ')}。建議推 / 拉 / 腿循環，中間插入輕肩日或休息。可喺「本週概覽」睇到覆蓋情況。`
  } else {
    content = `我可以幫你：\n• 今日練咩\n• 休息夠唔夠\n• 點樣加重量\n• 有氧點安排\n\n目前上次訓練：${last ? `${last.title}（${formatRelative(last.completedAt)}）` : '未有'}。今日 AI 傾向推薦「${suggestion.session.title}」。`
  }

  return {
    id: uid('msg'),
    role: 'coach',
    content,
    createdAt: new Date().toISOString(),
  }
}

export async function coachReply(input: string, state: AppState): Promise<ChatMessage> {
  if (!hasLlmConfigured()) {
    return coachReplyHeuristic(input, state)
  }

  const last = lastCompleted(state.sessions)
  const suggestion = suggestWorkoutHeuristic(state.sessions, state.profile)
  const recentChat = state.chat.slice(-8).map((m) => ({
    role: m.role === 'coach' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }))

  try {
    const content = await chatCompletion({
      temperature: 0.7,
      maxTokens: 700,
      messages: [
        {
          role: 'system',
          content: `你係 FORGE AI Coach，用簡潔廣東話/書面中文回覆（可用少量英文術語）。
根據用戶訓練史俾實用建議。唔好胡亂編造用戶冇做過嘅重量。
上下文：
- 用戶：${state.profile.name}，目標 ${state.profile.goal}，經驗 ${state.profile.experience}
- 上次訓練：${last ? `${last.title} / ${muscleLabel(last.focus)} / ${formatRelative(last.completedAt)}` : '未有'}
- 本地今日傾向：${suggestion.session.title}（${suggestion.session.goal}）
- 模型：${loadLlmSettings().model}
回覆控制在 120 字以內，除非用戶要求詳細計劃。`,
        },
        ...recentChat,
        { role: 'user', content: input },
      ],
    })

    return {
      id: uid('msg'),
      role: 'coach',
      content,
      createdAt: new Date().toISOString(),
    }
  } catch (err) {
    const fallback = coachReplyHeuristic(input, state)
    const msg = err instanceof Error ? err.message : 'LLM 失敗'
    return {
      ...fallback,
      content: `${fallback.content}\n\n_（OpenRouter：${msg}）_`,
    }
  }
}

/** @deprecated use async coachReply */
export function coachReplySync(input: string, state: AppState): ChatMessage {
  return coachReplyHeuristic(input, state)
}
