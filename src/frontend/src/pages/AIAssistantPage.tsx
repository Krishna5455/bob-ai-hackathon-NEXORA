import { HeartPulse } from 'lucide-react'

export default function AIAssistantPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">AI Clinical Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask questions about your patient panel
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <HeartPulse className="h-5 w-5 text-amber-600" />
          <p className="font-semibold text-amber-800">IBM watsonx.ai Clinician Assistant — Phase 4</p>
        </div>
        <p className="text-sm text-amber-700 mb-4">
          The AI Clinical Assistant will be powered by IBM watsonx.ai Granite in Phase 4.
          You will be able to ask natural language questions such as:
        </p>
        <ul className="space-y-2 text-sm text-amber-700 mb-4">
          <li>• "Which patients need attention this week?"</li>
          <li>• "Summarise patient P-004."</li>
          <li>• "Which patients have declining adherence?"</li>
          <li>• "Which patients show increasing discomfort?"</li>
        </ul>
        <p className="text-xs text-amber-600">
          ⚠ AI output will be presented as decision support only. It will not diagnose
          conditions, prescribe treatment, or recommend changing device parameters.
          The clinician remains the decision maker at all times.
        </p>
      </div>
    </div>
  )
}
