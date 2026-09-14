import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCw,
  ShieldCheck,
  HelpCircle,
  Clock,
} from 'lucide-react'
import { askAIAssistant } from '@/lib/api'
import type { AssistantResponse } from '@/types/api'

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  provider?: string
  model_used?: string
  disclaimer?: string
}

const EXAMPLE_QUESTIONS = [
  'Which patients need attention this week?',
  'Summarize P-004.',
  'Why is P-003 high risk?',
  'Which patients have declining adherence?',
  'Give me a cohort overview.',
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text:
        'Hello Doctor. I am your **Veno-Pump AI Clinical Decision Support Assistant** powered by IBM watsonx.ai Granite.\n\n' +
        'I analyze real-time patient adherence patterns, sequential compression cycles, reported pain scores, and computed risk flags across your active rehabilitation panel.\n\n' +
        'You can ask me questions about specific patients, risk trajectories, or panel-wide trends.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: 'watsonx-granite',
      model_used: 'ibm/granite-13b-instruct-v2',
      disclaimer:
        '⚠ AI decision support only — clinician judgement required. AI output does not constitute a diagnosis or treatment recommendation.',
    },
  ])
  const [inputQuery, setInputQuery] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const askMutation = useMutation({
    mutationFn: (msg: string) => askAIAssistant(msg),
    onSuccess: (data: AssistantResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: data.response || data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: data.provider,
          model_used: data.model_used,
          disclaimer: data.disclaimer,
        },
      ])
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: '⚠ I encountered an error connecting to the AI service. Please ensure the backend is running.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'error',
        },
      ])
    },
  })

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, askMutation.isPending])

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? inputQuery).trim()
    if (!text || askMutation.isPending) return

    // Append user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputQuery('')

    // Trigger API call
    askMutation.mutate(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Clinician AI Assistant</h1>
            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 uppercase tracking-wider">
              IBM watsonx.ai
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Natural language query engine grounded in panel adherence, outcomes, and risk telemetry
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="shrink-0 space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Example Clinician Queries:
        </span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(q)}
              disabled={askMutation.isPending}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="inline h-3 w-3 mr-1 text-brand-600" />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Assistant Avatar */}
            {msg.sender === 'assistant' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                <Bot className="h-5 w-5" />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none'
              }`}
            >
              {/* Header with provider tag for assistant */}
              {msg.sender === 'assistant' && msg.provider && msg.provider !== 'error' && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5 text-[10px] text-slate-400">
                  <span
                    className={`font-semibold font-mono px-1.5 py-0.5 rounded ${
                      msg.provider === 'watsonx-granite'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {msg.provider === 'watsonx-granite'
                      ? 'IBM watsonx.ai / Granite'
                      : 'Demo AI Assistant — watsonx.ai not configured'}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-2.5 w-2.5" />
                    {msg.timestamp}
                  </span>
                </div>
              )}

              {/* Text formatting */}
              <div className="whitespace-pre-wrap font-sans space-y-1">
                {msg.text}
              </div>

              {/* Safety disclaimer for assistant */}
              {msg.sender === 'assistant' && msg.disclaimer && (
                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center gap-1 italic">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span>{msg.disclaimer}</span>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {msg.sender === 'user' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}

        {/* Loading typing bubble */}
        {askMutation.isPending && (
          <div className="flex gap-3.5 justify-start animate-in fade-in duration-200">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
              <Bot className="h-5 w-5" />
            </div>
            <div className="rounded-2xl rounded-bl-none bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-center gap-2">
              <RotateCw className="h-3.5 w-3.5 animate-spin text-purple-600" />
              <span>Analyzing patient cohort database with Granite model...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div className="shrink-0 bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-3">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a clinical question (e.g. 'Summarize P-004', 'Why is P-003 high risk?')..."
          disabled={askMutation.isPending}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || askMutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {askMutation.isPending ? (
            <RotateCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Send
        </button>
      </div>

      {/* Footer disclaimer */}
      <p className="shrink-0 text-center text-[11px] text-slate-400">
        ⚠ Prototype Clinical Intelligence Layer · All patient data is synthetic · Decision support only.
      </p>
    </div>
  )
}

