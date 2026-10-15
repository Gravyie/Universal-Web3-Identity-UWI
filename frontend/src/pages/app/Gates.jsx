import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Door, Plus, UsersThree } from '@phosphor-icons/react'
import { Button } from '../../components/ui/Button'
import { EmptyState, Skeleton, TabPanel, Tabs, Tooltip } from '../../components/ui/primitives'
import { GateCard } from '../../components/GateCard'
import { useCredential } from '../../hooks/useCredential'
import { gateState, useMyGates, useRecentGates } from '../../hooks/useGates'
import { CreateGateSheet } from './CreateGateSheet'
import { PageContainer, PageHeader } from '../../components/layout/Page'
import { ConnectPrompt } from '../../components/ConnectPrompt'

export default function Gates() {
  const { address } = useAccount()
  const { credential } = useCredential(address)
  const { created, joined, isLoading } = useMyGates(address)
  const recent = useRecentGates(24)
  // Explore first, unless you run gates of your own
  const [tab, setTab] = useState(null)
  const shownTab = tab ?? (address && created.length ? 'created' : 'explore')
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
    !address ? (
      <ConnectPrompt
        title={mine ? 'Connect to see the gates you run' : 'Connect to see the gates you joined'}
        body="Gates are tied to your wallet. Connecting is free and never costs gas."
      />
    ) : isLoading ? (
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
      <PageHeader title="Gates" description="Sybil-proof lists. One entry per human, gasless to join." actions={address ? createButton : null} />

      <Tabs
        className=""
        value={shownTab}
        onValueChange={setTab}
        layoutId="gates-tab"
        items={[
          { value: 'explore', label: 'Explore', count: recent.total },
          { value: 'created', label: 'Created', count: address ? created.length : undefined },
          { value: 'joined', label: 'Joined', count: address ? joined.length : undefined },
        ]}
      >
        <TabPanel value="explore" className="pt-6 outline-none">
          <Explore {...recent} />
        </TabPanel>
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

/** Every gate on UWI, newest first and open ones on top. No wallet needed to look. */
function Explore({ gates, total, isLoading, isError }) {
  const [showClosed, setShowClosed] = useState(false)
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-[20px]" />
        ))}
      </div>
    )
  }
  if (isError) return <EmptyState icon={Door} title="Couldn't reach Hedera" body="The network didn't respond. Refresh to try again." />
  // open gates are the ones you can act on; closed, full and ended ones are one tap away
  const open = gates.filter((g) => gateState(g) === 'open')
  const rest = gates.length - open.length
  const shown = showClosed ? gates : open
  return (
    <>
      {shown.length ? (
        <div className="grid gap-4 [&>*]:min-w-0 md:grid-cols-2">
          {shown.map((g) => (
            <GateCard key={g.id} gate={g} to={`/g/${g.id}`} />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-line-strong">
          <EmptyState icon={Door} title="No open gates right now" body="Create a list that admits each verified human once, and share the link." />
        </div>
      )}
      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted">
        {rest > 0 && (
          <button type="button" onClick={() => setShowClosed((v) => !v)} className="rounded-full px-3 py-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink">
            {showClosed ? 'Hide' : 'Show'} {rest} closed, full or ended {rest === 1 ? 'gate' : 'gates'}
          </button>
        )}
        {total > gates.length && <p>Looking at the {gates.length} newest of {total} gates.</p>}
      </div>
    </>
  )
}
