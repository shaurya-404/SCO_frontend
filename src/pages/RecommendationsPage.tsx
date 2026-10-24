import { useState } from 'react'
import { api } from '../services/api'
import type { Recommendation } from '../types/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { Icon } from '../components/Icon'
import { Button, EmptyState, LoadState, PageHeader, Panel, Tag } from '../components/UI'
import { useToast } from '../hooks/useToast'
import { formatCurrency, riskTone } from '../utils/format'

export function RecommendationsPage() {
  const query = useApiQuery(api.recommendations, 'recommendations')
  const toast = useToast()
  const [busyId, setBusyId] = useState<string>()
  const [batchBusy, setBatchBusy] = useState(false)
  const recommendations = query.data ?? []
  const pending = recommendations.filter((item) => item.status.toLowerCase() === 'pending')
  const pendingSavings = pending.reduce((sum, item) => sum + item.estimated_monthly_saving, 0)

  async function update(item: Recommendation, status: 'Applied' | 'Dismissed') {
    setBusyId(item.rec_id)
    try {
      const result = await api.updateRecommendation(item.rec_id, status)
      if (!result.success || result.updated < 1) throw new Error('The recommendation was not updated.')
      query.setData((current) => current?.map((row) => row.rec_id === item.rec_id ? { ...row, status } : row))
      toast(status === 'Applied' ? 'Recommendation marked as applied.' : 'Recommendation dismissed.', 'success')
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'Could not update the recommendation.', 'error')
    } finally {
      setBusyId(undefined)
    }
  }

  async function applyAll() {
    if (!pending.length) return
    setBatchBusy(true)
    try {
      const result = await api.batchApplyRecommendations(pending.map((item) => item.rec_id))
      if (!result.success) throw new Error('The recommendations were not applied.')
      if (result.applied_count !== pending.length) {
        toast(`${result.applied_count} of ${pending.length} recommendations were applied. Refresh to verify remaining items.`, 'info')
        void query.reload()
        return
      }
      query.setData((current) => current?.map((item) => item.status.toLowerCase() === 'pending' ? { ...item, status: 'Applied' } : item))
      const savings = result.total_estimated_savings || pending.reduce((sum, item) => sum + item.estimated_monthly_saving, 0)
      toast(`${result.applied_count} recommendations applied. Estimated savings: ${formatCurrency(savings)} / month.`)
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'Could not apply recommendations.', 'error')
    } finally {
      setBatchBusy(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="SAFE, ACTIONABLE CHANGES" title="Recommendations" description="Optimization ideas are tied to observed usage. Review peak utilization and risk before you decide what to change." action={<Button onClick={() => void applyAll()} disabled={!pending.length || batchBusy || query.loading}>{batchBusy && <span className="button-spinner" />}Apply all pending</Button>} />
      <LoadState loading={query.loading} error={query.error} onRetry={() => void query.reload()} />
      {query.data && (
        <>
          <div className="recommendation-summary">
            <div><span>Potential monthly savings</span><strong>{formatCurrency(pendingSavings)}</strong><small>Across {pending.length} pending recommendations</small></div>
            <div><span>Awaiting review</span><strong>{pending.length}</strong><small>Applied or dismissed ideas are retained below</small></div>
            <div className="recommendation-caveat"><Icon name="assistant" size={18} /><p>Check resize advice against p95 and p99 usage, not averages alone. Apply changes through your normal rollout process.</p></div>
          </div>
          <Panel title="Optimization suggestions" subtitle="Individual savings are estimates at current pricing">
            {recommendations.length ? (
              <div className="recommendation-list">
                {recommendations.map((item) => {
                  const isPending = item.status.toLowerCase() === 'pending'
                  return (
                    <article className={`recommendation-card ${!isPending ? 'recommendation-complete' : ''}`} key={item.rec_id}>
                      <div className="recommendation-icon"><Icon name={item.status.toLowerCase() === 'applied' ? 'check' : 'recommendations'} size={18} /></div>
                      <div className="recommendation-detail">
                        <div className="recommendation-title"><h3>{item.action}</h3><Tag tone={item.status.toLowerCase() === 'pending' ? 'amber' : item.status.toLowerCase() === 'applied' ? 'success' : 'neutral'}>{item.status}</Tag></div>
                        <p>{item.reason}</p>
                        <div className="recommendation-tags"><span><Icon name="cloud" size={14} />{item.resource_id}</span><Tag tone={riskTone(item.risk_level)}>{item.risk_level} risk</Tag></div>
                      </div>
                      <div className="recommendation-actions">
                        <strong>{formatCurrency(item.estimated_monthly_saving)}<small>/mo</small></strong>
                        {isPending && <div><Button size="small" variant="secondary" disabled={Boolean(busyId) || batchBusy} onClick={() => void update(item, 'Dismissed')}>{busyId === item.rec_id ? 'Saving…' : 'Dismiss'}</Button><Button size="small" disabled={Boolean(busyId) || batchBusy} onClick={() => void update(item, 'Applied')}>{busyId === item.rec_id ? 'Saving…' : 'Apply'}</Button></div>}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : <EmptyState title="No recommendations yet" message="Suggestions will appear here when resource usage data is available." icon="recommendations" />}
          </Panel>
        </>
      )}
    </>
  )
}
