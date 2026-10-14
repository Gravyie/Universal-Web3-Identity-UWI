import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { Switch } from '../../components/ui/primitives'
import { useGasless } from '../../hooks/useGasless'

const EMPTY = { name: '', description: '', closesAt: '', capacity: '', strict: false }

/** Create a gate. The creator signs; the relayer submits. */
export function CreateGateSheet({ open, onOpenChange }) {
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const { createGate } = useGasless()
  const navigate = useNavigate()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  const errors = {
    name: !form.name.trim() ? 'Give the gate a name' : form.name.length > 64 ? 'At most 64 characters' : null,
    description: form.description.length > 280 ? 'At most 280 characters' : null,
    closesAt: form.closesAt && new Date(form.closesAt).getTime() <= Date.now() ? 'Pick a time in the future' : null,
    capacity: form.capacity && (!/^\d+$/.test(form.capacity) || Number(form.capacity) < 1) ? 'Use a whole number, or leave it empty' : null,
  }
  const valid = !Object.values(errors).some(Boolean)

  const submit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    setBusy(true)
    try {
      const { gateId } = await createGate({
        name: form.name.trim(),
        description: form.description.trim(),
        closesAt: form.closesAt ? Math.floor(new Date(form.closesAt).getTime() / 1000) : 0,
        capacity: form.capacity ? Number(form.capacity) : 0,
        strict: form.strict,
      })
      toast.success('Gate created')
      setForm(EMPTY)
      setTouched(false)
      onOpenChange(false)
      if (gateId) navigate(`/app/gates/${gateId}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const show = (k) => touched && errors[k]

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title="New gate"
      description="A list only verified humans can join, once each. You'll sign a message; no gas needed."
    >
      <form id="create-gate" onSubmit={submit} noValidate className="grid gap-5">
        <Field label="Name" error={show('name')}>
          {(a) => <Input {...a} value={form.name} onChange={set('name')} placeholder="Season 2 airdrop" maxLength={64} invalid={Boolean(show('name'))} autoFocus />}
        </Field>
        <Field label="Description" hint="Optional. Shown on the public join page." error={show('description')}>
          {(a) => <Textarea {...a} value={form.description} onChange={set('description')} placeholder="One claim per human." maxLength={280} invalid={Boolean(show('description'))} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Closes" hint="Optional." error={show('closesAt')}>
            {(a) => <Input {...a} type="datetime-local" value={form.closesAt} onChange={set('closesAt')} invalid={Boolean(show('closesAt'))} />}
          </Field>
          <Field label="Spots" hint="Optional. Empty means unlimited." error={show('capacity')}>
            {(a) => <Input {...a} inputMode="numeric" value={form.capacity} onChange={set('capacity')} placeholder="5000" invalid={Boolean(show('capacity'))} />}
          </Field>
        </div>
        <label className="flex items-start justify-between gap-4 rounded-[12px] border border-line p-4">
          <span>
            <span className="block text-sm font-medium text-ink">Self proofs only</span>
            <span className="mt-0.5 block text-[13px] text-muted">Turn on for anything with real value. Demo credentials won't be able to join.</span>
          </span>
          <Switch checked={form.strict} onCheckedChange={set('strict')} aria-label="Self proofs only" />
        </label>
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {busy ? 'Creating...' : 'Create gate'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
