import { useCallback, useMemo } from 'react'
import { Link } from '../components/Link'
import { api } from '../services/api'
import type { Alert, Recommendation } from '../types/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { Icon } from '../components/Icon'
import { Button, EmptyState, LoadState, PageHeader, Panel, StatCard, Tag } from '../components/UI'
import { formatCurrency, formatDate, riskTone } from '../utils/format'

export function DashboardPage({ userName }: { userName: string }) {
  const loadOverview = useCallback(async () => {
    const [inventory, costs, recommendations, alerts, costForecast, trend] = await Promise.all([
      api.inventoryStats(),
      api.costSummary(),
      api.recommendations(),
      api.alerts(),
      api.costForecast(),
      api.forecast(),
    ])
    return { inventory, costs, recommendations, alerts, costForecast, trend }
  }, [])
  const overview = useApiQuery(loadOverview, 'dashboard')

  const pending = useMemo(
    () => overview.data?.recommendations.filter((item) => item.status.toLowerCase() === 'pending') ?? [],
    [overview.data],
  )
  const savings = pending.reduce((sum, item) => sum + item.estimated_monthly_saving, 0)
  const highestRisk = overview.data?.alerts.filter((alert) => alert.severity.toLowerCase() === 'high').length ?? 0
  const stats = overview.data?.inventory
  const cost = overview.data?.costs
  const forecast = overview.data?.costForecast
  const trend = overview.data?.trend
  const recs = overview.data?.recommendations
  const alerts = overview.data?.alerts

  return (
    <>
      <PageHeader
        eyebrow="MONDAY, MADE MORE EFFICIENT"
        title={`Good morning, ${userName.split(' ')[0]}.`}
        description="A clear view of your cloud footprint, spend, and the safest opportunities to optimize."
        action={<Button variant="secondary" onClick={() => overview.reload()} disabled={overview.loading}><Icon name="clock" size={15} /> Refresh data</Button>}
      />
      <LoadState loading={overview.loading} error={overview.error} onRetry={() => void overview.reload()} />
      {stats && cost && forecast && trend && recs && alerts && (
        <>
          <div className="stat-grid stat-grid-four">
            <StatCard label="Monthly cloud spend" value={formatCurrency(cost.total_current_spend)} caption="Across all tracked resources" icon="costs" tone="violet" />
            <StatCard label="Active resources" value={stats.total_resources.toLocaleString('en-IN')} caption={`${stats.total_vms} VMs · ${stats.total_volumes} volumes · ${stats.total_ips} IPs`} icon="inventory" tone="blue" />
            <StatCard label="Savings identified" value={formatCurrency(savings)} caption={`${pending.length} pending recommendations`} icon="recommendations" tone="green" />
            <StatCard label="High-priority alerts" value={String(highestRisk)} caption="Needs an engineer’s attention" icon="alerts" tone="amber" />
          </div>

          <div className="dashboard-feature-grid">
            <Panel title="Optimization opportunity" subtitle="Pending recommendations, grounded in resource usage">
              {pending.length ? (
                <>
                  <div className="opportunity-total"><strong>{formatCurrency(savings)}</strong><span>potential monthly savings</span></div>
                  <div className="recommendation-list compact-list">
                    {pending.slice(0, 3).map((item: Recommendation) => (
                      <div className="recommendation-row" key={item.rec_id}>
                        <div className="recommendation-symbol"><Icon name="recommendations" size={16} /></div>
                        <div className="recommendation-copy"><strong>{item.action}</strong><span>{item.resource_id} · {item.reason}</span></div>
                        <div className="recommendation-meta"><Tag tone={riskTone(item.risk_level)}>{item.risk_level} risk</Tag><strong>{formatCurrency(item.estimated_monthly_saving)}<small>/mo</small></strong></div>
                      </div>
                    ))}
                  </div>
                  <div className="panel-foot"><Link to="/recommendations">Review all recommendations <Icon name="chevron" size={14} /></Link></div>
                </>
              ) : <EmptyState title="You’re all caught up" message="There are no pending recommendations right now." icon="overview" />}
            </Panel>
            <Panel title="Spend trajectory" subtitle="Forecast based on current monthly spend">
              <div className="trajectory-current"><span>Current monthly spend</span><strong>{formatCurrency(forecast.current_monthly_spend)}</strong></div>
              <div className="trajectory-chart">
                {[forecast.current_monthly_spend, forecast.forecast_30_days, forecast.forecast_60_days, forecast.forecast_90_days].map((value, index) => {
                  const values = [forecast.current_monthly_spend, forecast.forecast_30_days, forecast.forecast_60_days, forecast.forecast_90_days]
                  const max = Math.max(...values, 1)
                  return <div className={`trajectory-column ${index > 0 ? 'trajectory-column-forecast' : ''}`} key={index}><span className="trajectory-value">{formatCurrency(value, true)}</span><i style={{ height: `${Math.max((value / max) * 100, 18)}%` }} /><small>{index === 0 ? 'Now' : `${index * 30} days`}</small></div>
                })}
              </div>
              <div className="forecast-note"><span>Projected to increase by <strong>{trend.projected_growth_rate_pct}%</strong> over the next month.</span></div>
              <div className="panel-foot"><Link to="/forecast">Explore forecast <Icon name="chevron" size={14} /></Link></div>
            </Panel>
          </div>

          <div className="dashboard-lower-grid">
            <Panel title="Resource mix" subtitle="Inventory by resource category">
              <div className="resource-mix">
                {[['Virtual machines', stats.total_vms, 'blue'], ['Block volumes', stats.total_volumes, 'violet'], ['Public IPs', stats.total_ips, 'amber']].map(([label, value, tone]) => (
                  <div className="mix-row" key={String(label)}><span className={`mix-indicator mix-${tone}`} /><span>{label}</span><strong>{Number(value).toLocaleString('en-IN')}</strong></div>
                ))}
                <div className="mix-total"><span>Total tracked</span><strong>{stats.total_resources.toLocaleString('en-IN')} resources</strong></div>
              </div>
              <div className="panel-foot"><Link to="/inventory">View full inventory <Icon name="chevron" size={14} /></Link></div>
            </Panel>
            <Panel title="Latest alerts" subtitle="Usage patterns worth a closer look" action={<Tag tone={highestRisk ? 'danger' : 'success'}>{highestRisk} high priority</Tag>}>
              {alerts.length ? (
                <div className="alert-list compact-list">
                  {alerts.slice(0, 3).map((alert: Alert) => (
                    <div className="alert-row" key={alert.alert_id}>
                      <span className={`alert-indicator ${alert.severity.toLowerCase()}`} />
                      <div><strong>{alert.message}</strong><span>{formatDate(alert.timestamp)}</span></div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="No active alerts" message="We’ll show notable usage changes here." icon="overview" />}
              <div className="panel-foot"><Link to="/alerts">Go to alert center <Icon name="chevron" size={14} /></Link></div>
            </Panel>
          </div>
          <div className="assumption-note"><Icon name="assistant" size={15} /><span>Forecasts and savings are estimates based on recent utilization and illustrative pricing. Review peak metrics and risk before applying changes.</span></div>
        </>
      )}
    </>
  )
}
