import { Button } from '../components/ui/Button'
import { Guilloche } from '../components/Guilloche'

export default function NotFound() {
  return (
    <div className="relative mx-auto flex max-w-lg flex-col items-center overflow-hidden px-4 py-28 text-center">
      <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[520px] -translate-x-1/2 -translate-y-1/2 text-accent">
        <Guilloche variant="seal" strokeWidth={0.25} opacity={0.25} />
      </div>
      <div className="relative font-display text-8xl text-accent italic">404</div>
      <h1 className="relative mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">This page couldn't be verified</h1>
      <p className="relative mt-2 text-ink-2">The link may be mistyped, or the page has moved.</p>
      <Button to="/" className="relative mt-8">
        Back home
      </Button>
    </div>
  )
}
