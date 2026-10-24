import { api } from '../services/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { Icon } from '../components/Icon'
import { LoadState, PageHeader, Panel, StatCard } from '../components/UI'

export function SustainabilityPage() {
  const query = useApiQuery(api.sustainability, 'sustainability')
  const data = query.data
  return (
    <>
      <PageHeader eyebrow="EFFICIENCY WITH IMPACT" title="Sustainability" description="A view of the estimated environmental benefit from making better use of your cloud resources." action={<span className="sustainability-badge"><Icon name="leaf" size={15} /> Monthly estimate</span>} />
      <LoadState loading={query.loading} error={query.error} onRetry={() => void query.reload()} />
      {data && (
        <>
          <div className="sustainability-hero"><div className="sustainability-orb"><Icon name="leaf" size={25} /></div><div><span>ESTIMATED CARBON SAVED EACH MONTH</span><strong>{data.carbon_saved_kg_co2e_per_month.toLocaleString('en-IN', { maximumFractionDigits: 1 })}<small> kg CO₂e</small></strong><p>Potential impact associated with reducing unused or over-provisioned capacity.</p></div></div>
          <div className="stat-grid stat-grid-three">
            <StatCard label="Energy saved" value={`${data.energy_saved_kwh.toLocaleString('en-IN')} kWh`} caption="Estimated each month" icon="analytics" tone="green" />
            <StatCard label="Equivalent trees planted" value={data.equivalent_trees_planted.toLocaleString('en-IN')} caption="Illustrative comparison" icon="leaf" tone="blue" />
            <StatCard label="Annual carbon savings" value={`${(data.carbon_saved_kg_co2e_per_month * 12).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`} caption="Based on the monthly estimate" icon="costs" tone="violet" />
          </div>
          <Panel title="How to read this estimate" subtitle="Sustainability values are indicative, not a carbon-accounting report">
            <div className="sustainability-explain"><span className="sustainability-explain-icon"><Icon name="assistant" size={18} /></span><div><strong>Efficiency can reduce waste.</strong><p>Carbon and energy estimates depend on workload, infrastructure mix, grid intensity, and the assumptions behind the dataset. Use them as directional indicators, and validate against your organization’s reporting method.</p></div></div>
          </Panel>
        </>
      )}
    </>
  )
}
