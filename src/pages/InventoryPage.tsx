import { useCallback, useMemo, useState } from 'react'
import { api } from '../services/api'
import type { InventoryResource } from '../types/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { MetricChart } from '../components/Charts'
import { Icon } from '../components/Icon'
import { Button, EmptyState, LoadState, PageHeader, Panel, SelectField, StatCard, Tag } from '../components/UI'
import { formatCurrency, formatDate, formatPercentile, getDistinct } from '../utils/format'

export function InventoryPage() {
  const inventory = useApiQuery(api.inventory, 'inventory')
  const stats = useApiQuery(api.inventoryStats, 'inventory-stats')
  const [region, setRegion] = useState('All regions')
  const [environment, setEnvironment] = useState('All environments')
  const [team, setTeam] = useState('All teams')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<InventoryResource | null>(null)
  const resources = useMemo(() => inventory.data ?? [], [inventory.data])
  const filtered = useMemo(() => resources.filter((item) =>
    (region === 'All regions' || item.region === region) &&
    (environment === 'All environments' || item.environment === environment) &&
    (team === 'All teams' || item.owner === team) &&
    `${item.name} ${item.resource_id} ${item.type}`.toLowerCase().includes(search.toLowerCase()),
  ), [resources, region, environment, team, search])
  const loadDetail = useCallback(async () => {
    if (!selected) return { resource: null, metrics: [], percentiles: null }
    const [resource, metrics, percentiles] = await Promise.all([
      api.resource(selected.resource_id),
      api.metrics(selected.resource_id),
      api.percentiles(selected.resource_id),
    ])
    return { resource, metrics, percentiles }
  }, [selected])
  const detail = useApiQuery(loadDetail, selected?.resource_id ?? '')
  const detailResource = detail.data?.resource ?? selected

  return (
    <>
      <PageHeader eyebrow="CLOUD FOOTPRINT" title="Resource inventory" description="Every resource, owner, and monthly cost in one place. Filter the list or open a resource to inspect its utilization." action={<Button variant="secondary" onClick={() => { void inventory.reload(); void stats.reload() }} disabled={inventory.loading}><Icon name="clock" size={15} /> Refresh</Button>} />
      <LoadState loading={inventory.loading || stats.loading} error={inventory.error ?? stats.error} onRetry={() => { void inventory.reload(); void stats.reload() }} />
      {stats.data && (
        <div className="stat-grid stat-grid-four">
          <StatCard label="Resources" value={stats.data.total_resources.toLocaleString('en-IN')} icon="inventory" />
          <StatCard label="Monthly spend" value={formatCurrency(stats.data.total_monthly_cost)} icon="costs" tone="violet" />
          <StatCard label="Virtual machines" value={stats.data.total_vms.toLocaleString('en-IN')} icon="cpu" tone="blue" />
          <StatCard label="Storage & IPs" value={`${stats.data.total_volumes} volumes · ${stats.data.total_ips} IPs`} icon="cloud" tone="amber" />
        </div>
      )}
      {inventory.data && (
        <Panel title="All resources" subtitle={`${filtered.length} of ${resources.length} resources`} className="inventory-panel">
          <div className="inventory-filters">
            <label className="search-field"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or ID" aria-label="Search resources" /></label>
            <SelectField ariaLabel="Filter by region" value={region} onChange={setRegion} options={['All regions', ...getDistinct(resources, (item) => item.region)]} />
            <SelectField ariaLabel="Filter by environment" value={environment} onChange={setEnvironment} options={['All environments', ...getDistinct(resources, (item) => item.environment)]} />
            <SelectField ariaLabel="Filter by team" value={team} onChange={setTeam} options={['All teams', ...getDistinct(resources, (item) => item.owner)]} />
          </div>
          {filtered.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Resource</th><th>Type</th><th>Region</th><th>Environment</th><th>Owner</th><th>Configuration</th><th>Monthly cost</th><th /></tr></thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.resource_id} onClick={() => setSelected(item)} className="clickable-row">
                      <td><strong>{item.name}</strong><span className="table-subtext">{item.resource_id}</span></td>
                      <td><span className="type-label"><Icon name={item.type.toLowerCase().includes('vm') ? 'cpu' : 'cloud'} size={15} />{item.type}</span></td>
                      <td>{item.region}</td>
                      <td><Tag tone={item.environment === 'prod' ? 'violet' : item.environment === 'dev' ? 'blue' : 'neutral'}>{item.environment}</Tag></td>
                      <td>{item.owner}</td>
                      <td>{item.vcpu ? `${item.vcpu} vCPU · ${item.ram_gb} GB` : `${item.disk_size_gb} GB`}</td>
                      <td className="currency-cell">{formatCurrency(item.monthly_cost)}</td>
                      <td><button type="button" className="icon-button" aria-label={`View details for ${item.name}`} onClick={(event) => { event.stopPropagation(); setSelected(item) }}><Icon name="chevron" size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No matching resources" message="Try changing your search or filters." icon="search" />}
        </Panel>
      )}
      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
          <section className="resource-drawer" role="dialog" aria-modal="true" aria-labelledby="resource-title">
            <div className="drawer-header"><div><span className="eyebrow">RESOURCE DETAILS</span><h2 id="resource-title">{detailResource?.name}</h2><span className="drawer-id">{detailResource?.resource_id}</span></div><button type="button" className="icon-button" onClick={() => setSelected(null)} aria-label="Close details"><Icon name="close" /></button></div>
            <div className="drawer-tags"><Tag tone="violet">{detailResource?.type}</Tag><Tag>{detailResource?.region}</Tag><Tag tone="blue">{detailResource?.environment}</Tag></div>
            <div className="detail-grid">
              <div><span>Owner</span><strong>{detailResource?.owner}</strong></div><div><span>Monthly cost</span><strong>{detailResource && formatCurrency(detailResource.monthly_cost)}</strong></div>
              <div><span>Compute</span><strong>{detailResource?.vcpu ? `${detailResource.vcpu} vCPU` : 'Unavailable'}</strong></div><div><span>Memory</span><strong>{detailResource?.ram_gb ? `${detailResource.ram_gb} GB` : 'Unavailable'}</strong></div>
              <div><span>Disk</span><strong>{detailResource?.disk_size_gb} GB</strong></div><div><span>Created</span><strong>{detailResource && formatDate(detailResource.creation_date)}</strong></div>
            </div>
            <Panel title="Utilization history" subtitle="Recent CPU, memory, and disk readings">
              <LoadState loading={detail.loading} error={detail.error} onRetry={() => void detail.reload()} />
              {detail.data && <MetricChart data={detail.data.metrics} />}
              {detail.data?.percentiles && <div className="percentile-strip"><span>p95 CPU <strong>{formatPercentile(detail.data.percentiles.p95_cpu)}</strong></span><span>p99 CPU <strong>{formatPercentile(detail.data.percentiles.p99_cpu)}</strong></span><span>p95 memory <strong>{formatPercentile(detail.data.percentiles.p95_memory)}</strong></span><span>p99 memory <strong>{formatPercentile(detail.data.percentiles.p99_memory)}</strong></span></div>}
            </Panel>
          </section>
        </div>
      )}
    </>
  )
}
