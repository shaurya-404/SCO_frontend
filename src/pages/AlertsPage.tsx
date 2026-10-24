import { api } from '../services/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { Icon } from '../components/Icon'
import { EmptyState, LoadState, PageHeader, Panel, Tag } from '../components/UI'
import { formatDate } from '../utils/format'

export function AlertsPage() {
  const query = useApiQuery(api.alerts, 'alerts')
  const alerts = query.data ?? []
  const high = alerts.filter((alert) => alert.severity.toLowerCase() === 'high').length
  return (
    <>
      <PageHeader eyebrow="OBSERVABILITY" title="Alert center" description="Usage events that may signal a capacity issue, an unusual spike, or a resource that needs investigation." action={<button type="button" className="text-action" onClick={() => void query.reload()} disabled={query.loading}><Icon name="clock" size={15} /> Refresh alerts</button>} />
      <LoadState loading={query.loading} error={query.error} onRetry={() => void query.reload()} />
      {query.data && (
        <>
          <div className="alert-summary"><span className="alert-summary-icon"><Icon name="alerts" size={19} /></span><div><strong>{alerts.length} active alerts</strong><span>{high} high severity · investigate before capacity is affected</span></div><Tag tone={high ? 'danger' : 'success'}>{high ? 'Attention needed' : 'No critical alerts'}</Tag></div>
          <Panel title="Recent activity" subtitle="Each alert includes the reason it was raised">
            {alerts.length ? <div className="alert-list">{alerts.map((alert) => <article className="alert-card" key={alert.alert_id}><span className={`alert-severity-dot ${alert.severity.toLowerCase()}`} /><div className="alert-card-content"><div className="alert-card-title"><Tag tone={alert.severity.toLowerCase() === 'high' ? 'danger' : 'amber'}>{alert.severity} severity</Tag><span>{formatDate(alert.timestamp)}</span></div><h3>{alert.message}</h3><p>Review the resource’s recent metrics and compare against expected workload patterns. Resolve only after confirming the event is understood.</p></div><Icon className="alert-card-icon" name="chevron" size={16} /></article>)}</div> : <EmptyState title="All clear" message="No active alerts were returned by the backend." icon="overview" />}
          </Panel>
        </>
      )}
    </>
  )
}
