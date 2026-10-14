import { Button } from '../components/ui/Button'
import { HoloCard } from '../components/holo/HoloCard'

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
      <div>
        <p className="font-mono text-sm text-muted">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">This page couldn't be verified</h1>
        <p className="mt-3 text-ink-2">The link may be mistyped, or the page moved.</p>
        <Button to="/" className="mt-8">
          Back home
        </Button>
      </div>
      <HoloCard username="not_found" proof="pending" className="mx-auto w-full max-w-sm" label="A blank credential" />
    </div>
  )
}
