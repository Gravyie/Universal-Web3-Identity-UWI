import { useState } from 'react'
import { toast } from 'sonner'
import { useCopy } from '../components/ui/primitives'

/** Save-as-image and share for a credential card. */
export function useCardActions(cardRef, username) {
  const [saving, setSaving] = useState(false)
  const { copy } = useCopy()
  const url = `${window.location.origin}/u/${username}`

  const save = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const data = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
      const a = document.createElement('a')
      a.href = data
      a.download = `uwi-${username}.png`
      a.click()
      toast.success('Card saved')
    } catch {
      toast.error("Couldn't render the image")
    } finally {
      setSaving(false)
    }
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${username} on UWI`, text: 'Verified human on UWI', url })
        return
      } catch {
        /* dismissed: fall through to copying */
      }
    }
    copy(url, 'Profile link copied')
  }

  return { save, share, saving, url }
}
