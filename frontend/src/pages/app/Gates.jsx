import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Door, Plus, UsersThree } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Skeleton, TabPanel, Tabs, Tooltip } from '../../components/ui/primitives'
import { GateCard } from '../../components/GateCard'
import { useCredential } from '../../hooks/useCredential'
import { useMyGates } from '../../hooks/useGates'
import { CreateGateSheet } from './CreateGateSheet'
import { PageContainer, PageHeader } from '../../components/layout/Page'

export default function Gates() {
  const { address } = useAccount()
  const { credential } = useCredential(address)
  const { created, joined, isLoading } = useMyGates(address)
  const [tab, setTab] = useState('created')
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)

  // /app/gates?new=1 opens the create sheet (used by shortcuts elsewhere).
  useEffect(() => {
    if (params.get('new') && credential) {
      setCreating(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams, credential])

  const createButton = credential ? (
    <Button size="sm" onClick={() => setCreating(true)}>
      <Plus className="size-4" /> New gate
    </Button>
  ) : (
    <Tooltip content="Get verified to create gates">
      <span>
        <Button size="sm" disabled>
          <Plus className="size-4" /> New gate
        </Button>
      </span>
    </Tooltip>
  )

  const list = (gates, mine) =>
    isLoading ? (
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-[20px]" />
        ))}
      </div>
    ) : gates.length ? (
      <div className="grid gap-4 md:grid-cols-2">
        {gates.map((g) => (
          <GateCard key={g.id} gate={g} mine={mine} to={mine ? `/app/gates/${g.id}` : `/g/${g.id}`} />
        ))}
      </div>
    ) : mine ? (
      <div className="rounded-[20px] border border-dashed border-line-strong">
        <EmptyState
          icon={Door}
          title="You haven't created a gate"
          body="Gates are allowlists, waitlists and sign-ups that admit each verified human once. Create one and share the link."
          action={credential ? <Button variant="secondary" onClick={() => setCreating(true)}><Plus className="size-4" /> Create a gate</Button> : <Button to="/app/verify" variant="secondary">Get verified first</Button>}
        />
      </div>
    ) : (
      <div className="rounded-[20px] border border-dashed border-line-strong">
        <EmptyState icon={UsersThree} title="You haven't joined any gates" body="When a project shares a UWI gate link with you, joining takes one signature." />
      </div>
    )

  return (
    <PageContainer>
      <PageHeader title="Gates" description="Sybil-proof lists. One entry per human, gasless to join." actions={createButton} />

      <Tabs
        className=""
        value={tab}
        onValueChange={setTab}
        layoutId="gates-tab"
        items={[
          { value: 'created', label: 'Created', count: created.length },
          { value: 'joined', label: 'Joined', count: joined.length },
        ]}
      >
        <TabPanel value="created" className="pt-6 outline-none">
          {list(created, true)}
        </TabPanel>
        <TabPanel value="joined" className="pt-6 outline-none">
          {list(joined, false)}
        </TabPanel>
      </Tabs>

      <CreateGateSheet open={creating} onOpenChange={setCreating} />
    </PageContainer>
  )
}
