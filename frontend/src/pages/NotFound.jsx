import { Button } from '../components/ui/Button'
import { HoloCard } from '../components/holo/HoloCard'
import { PageContainer, PageHeader } from '../components/layout/Page'

export default function NotFound() {
  return (
    <PageContainer>
      <PageHeader title="Page not found" description="The link may be mistyped, or the page moved." />
      <div className="grid items-center gap-10 rounded-[20px] border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-wrap gap-2">
          <Button to="/app">Go to the app</Button>
          <Button to="/" variant="ghost">
            Back to the homepage
          </Button>
        </div>
        <HoloCard username="not_found" proof="pending" className="mx-auto w-full max-w-sm" label="A blank credential" />
      </div>
    </PageContainer>
  )
}
