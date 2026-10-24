import { useCallback, useMemo, useState } from 'react'
import { api } from '../services/api'
import type { Metric, Percentiles } from '../types/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { MetricChart } from '../components/Charts'
import { Icon } from '../components/Icon'
import { Button, EmptyState, LoadState, PageHeader, Panel, SelectField, StatCard, Tag } from '../components/UI'
import { formatDate, formatPercentile, getDistinct } from '../utils/format'

export function AnalyticsPage() {
  const inventory = useApiQuery(api.inventory, 'analytics-inventory')
  const [selectedId, setSelectedId] = useState('')
  const [region, setRegion] = useState('All regions')
  const [environment, setEnvironment] = useState('All environments')
  const [team, setTeam] = useState('All teams')
  const resources = useMemo(() => inventory.data ?? [], [inventory.data])
  const visibleResources = useMemo(() => resources.filter((resource) =>
    (region === 'All regions' || resource.region === region) &&
    (environment === 'All environments' || resource.environment === environment) &&
    (team === 'All teams' || resource.owner === team),
  ), [resources, region, environment, team])

  const selectedResource = visibleResources.find((resource) => resource.resource_id === selectedId) ?? visibleResources[0]
  const activeId = selectedResource?.resource_id ?? ''

  const loadMetrics = useCallback(async () => {
      if (!activeId) return { history: [] as Metric[], percentiles: null as Percentiles | null, anomalies: [] as Metric[] }
      const [history, percentiles, anomalies] = await Promise.all([
        api.metrics(activeId), api.percentiles(activeId), api.anomalies(),
      ])
      return { history, percentiles, anomalies: anomalies.filter((item) => item.resource_id === activeId) }
  }, [activeId])
  const metrics = useApiQuery(loadMetrics, activeId)
  const selected = selectedResource
  const latest = metrics.data?.history[0]

  return (
    <>
      <PageHeader eyebrow="UTILIZATION & PERFORMANCE" title="Resource analytics" description="Inspect utilization over time, compare percentiles, and identify unusual readings before changing capacity." action={<Button variant="secondary" onClick={() => void metrics.reload()} disabled={metrics.loading}><Icon name="clock" size={15} /> Refresh metrics</Button>} />
      <LoadState loading={inventory.loading} error={inventory.error} onRetry={() => void inventory.reload()} />
      {inventory.data && (
        <>
          <div className="analytics-filters">
            <SelectField ariaLabel="Filter analytics by region" value={region} onChange={setRegion} options={['All regions', ...getDistinct(resources, (item) => item.region)]} />
            <SelectField ariaLabel="Filter analytics by environment" value={environment} onChange={setEnvironment} options={['All environments', ...getDistinct(resources, (item) => item.environment)]} />
            <SelectField ariaLabel="Filter analytics by team" value={team} onChange={setTeam} options={['All teams', ...getDistinct(resources, (item) => item.owner)]} />
            <SelectField label="Resource" ariaLabel="Select resource" value={activeId} onChange={setSelectedId} options={visibleResources.length ? visibleResources.map((resource) => resource.resource_id) : ['']} />
          </div>
          {selected && <div className="selected-resource-strip"><span><Icon name="cpu" size={17} />{selected.name}</span><span>{selected.region}</span><Tag tone="blue">{selected.environment}</Tag><span>Owned by {selected.owner}</span></div>}
          <LoadState loading={metrics.loading} error={metrics.error} onRetry={() => void metrics.reload()} />
          {metrics.data && selected && (
            <>
              <div className="stat-grid stat-grid-four">
                <StatCard label="Latest CPU" value={latest ? `${latest.cpu_pct.toFixed(1)}%` : 'Unavailable'} caption="Recent measurement" icon="cpu" tone="blue" />
                <StatCard label="Latest memory" value={latest ? `${latest.memory_pct.toFixed(1)}%` : 'Unavailable'} caption="Recent measurement" icon="analytics" tone="violet" />
                <StatCard label="Latest disk" value={latest ? `${latest.disk_pct.toFixed(1)}%` : 'Unavailable'} caption="Recent measurement" icon="inventory" tone="amber" />
                <StatCard label="Network in / out" value={latest ? `${latest.network_in_mb.toFixed(1)} / ${latest.network_out_mb.toFixed(1)} MB` : 'Unavailable'} caption="Latest reading" icon="cloud" tone="green" />
              </div>
              <Panel title="Utilization history" subtitle="Recent CPU, memory, and disk usage returned by the metrics API" action={<Tag>{metrics.data.history.length} readings</Tag>}>
                {metrics.data.history.length ? <MetricChart data={metrics.data.history} /> : <EmptyState title="No metrics found" message="The selected resource does not yet have utilization history." icon="analytics" />}
              </Panel>
              <div className="content-grid-two">
                <Panel title="Peak-aware sizing" subtitle="Percentiles give context beyond average utilization">
                  {metrics.data.percentiles ? (
                    <div className="percentile-grid">
                      <div><span>p95 CPU</span><strong>{formatPercentile(metrics.data.percentiles.p95_cpu)}</strong></div><div><span>p99 CPU</span><strong>{formatPercentile(metrics.data.percentiles.p99_cpu)}</strong></div>
                      <div><span>p95 memory</span><strong>{formatPercentile(metrics.data.percentiles.p95_memory)}</strong></div><div><span>p99 memory</span><strong>{formatPercentile(metrics.data.percentiles.p99_memory)}</strong></div>
                    </div>
                  ) : <EmptyState title="No percentile data" message="Percentiles will be available once the resource has metrics." icon="analytics" />}
                  <div className="assumption-note compact-note"><Icon name="assistant" size={15} /><span>Use p95/p99 values to sanity-check resizing recommendations against peak load.</span></div>
                </Panel>
                <Panel title="Anomalies" subtitle="High-utilization events for this resource">
                  {metrics.data.anomalies.length ? <div className="anomaly-list">{metrics.data.anomalies.map((item, index) => <div className="anomaly-row" key={`${item.timestamp}-${index}`}><span className="anomaly-point" /><div><strong>{item.cpu_pct}% CPU · {item.memory_pct}% memory</strong><span>{formatDate(item.timestamp)}</span></div><Tag tone="danger">Anomaly</Tag></div>)}</div> : <EmptyState title="No anomalies detected" message="No unusual utilization events are recorded for this resource." icon="overview" />}
                </Panel>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
