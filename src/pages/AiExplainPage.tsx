import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../services/api'
import { Icon } from '../components/Icon'
import { Button, PageHeader, Panel } from '../components/UI'
import { useToast } from '../hooks/useToast'

export function AiExplainPage() {
  const [resourceId, setResourceId] = useState('')
  const [summary, setSummary] = useState('')
  const [answer, setAnswer] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const toast = useToast()

  async function explain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resourceId.trim() || !summary.trim()) {
      setError('Enter a resource ID and a short metrics summary.')
      return
    }
    setLoading(true)
    setError(undefined)
    setAnswer(undefined)
    try {
      const response = await api.explain(resourceId.trim(), summary.trim())
      setAnswer(response.explanation)
      toast('Explanation is ready.')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not generate an explanation.'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="PLAIN-LANGUAGE INSIGHTS" title="AI explain" description="Turn resource metrics into a concise explanation your team can review. Recommendations never apply changes automatically." />
      <div className="explain-layout">
        <Panel title="Explain a resource" subtitle="Share the resource identifier and the utilization context">
          <form className="form-stack" onSubmit={(event) => void explain(event)}>
            <label className="form-field"><span>Resource ID</span><input value={resourceId} onChange={(event) => setResourceId(event.target.value)} placeholder="e.g. vm-cluster-1003" required /></label>
            <label className="form-field"><span>Metrics summary</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="e.g. p95 CPU: 11.2%, monthly cost: ₹3,820" rows={4} required /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <Button type="submit" disabled={loading}>{loading && <span className="button-spinner" />}<Icon name="assistant" size={16} /> Explain recommendation</Button>
          </form>
          <div className="form-hint"><Icon name="assistant" size={15} /><span>For trustworthy sizing decisions, include p95/p99 utilization, capacity limits, monthly cost, and workload context.</span></div>
        </Panel>
        <Panel title="Explanation" subtitle="Review the reasoning before acting">
          {answer ? <div className="explanation-result"><span><Icon name="assistant" size={19} /></span><p>{answer}</p><div className="explanation-disclaimer">Validate this guidance against peak load, service-level objectives, and your team’s change process.</div></div> : <div className="simulation-empty"><span><Icon name="assistant" size={21} /></span><strong>Your explanation appears here</strong><p>Provide metrics context to get a clear, resource-specific summary.</p></div>}
        </Panel>
      </div>
    </>
  )
}
