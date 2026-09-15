import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCw,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  Brain,
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
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Breadcrumbs Navigation */}
      <nav className="animate-cs-fade-in-up flex items-center justify-between text-xs text-slate-400 font-medium shrink-0">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="hover:text-cyan-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-cyan-400 font-semibold">AI Assistant</span>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </nav>

      {/* Page Header Card */}
      <div className="animate-cs-fade-in-up cs-stagger-1 rounded-3xl glass-panel p-6 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4 shrink-0 cs-card">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Clinician AI Assistant
              </h1>
              <span className="rounded-full bg-cyan-950 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                IBM watsonx.ai / Granite
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural language clinical inquiry grounded in panel adherence, outcomes, and risk telemetry
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-cyan-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          Model: ibm/granite-13b-instruct-v2
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="shrink-0 space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
          Suggested Clinician Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(q)}
              disabled={askMutation.isPending}
              className="rounded-xl border border-slate-800 bg-[#0a1324]/80 px-3.5 py-1.5 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-slate-900 transition-all disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Scroll Container */}
      <div className="flex-1 overflow-y-auto rounded-3xl glass-panel p-6 border border-slate-800 space-y-4 shadow-inner">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4.5 space-y-2 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-950/90 text-slate-200 border border-slate-800/80 rounded-tl-none shadow-md'
                }`}
              >
                {/* Header for assistant message */}
                {!isUser && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Veno-Pump AI Intelligence
                    </span>
                    <span className="font-mono text-[10px]">{msg.timestamp}</span>
                  </div>
                )}

                {/* Body Text */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Footer disclaimer for assistant */}
                {!isUser && msg.disclaimer && (
                  <div className="mt-2 pt-2 border-t border-slate-900 flex items-start gap-1.5 text-[10px] text-slate-400 italic">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-500 shrink-0 mt-0.5" />
                    <span>{msg.disclaimer}</span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          )
        })}

        {/* Loading Bubble */}
        {askMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-950/90 border border-slate-800 p-4 text-xs text-slate-300 flex items-center gap-2">
              <RotateCw className="h-4 w-4 animate-spin text-cyan-400" />
              <span>Analyzing patient cohort records with Granite AI...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Query Input Box */}
      <div className="shrink-0 rounded-2xl glass-panel p-3 border border-slate-800 flex items-center gap-3">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a clinical question about patients, adherence trends, or risk flags…"
          disabled={askMutation.isPending}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || askMutation.isPending}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 px-5 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
