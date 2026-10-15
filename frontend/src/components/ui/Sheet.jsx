import * as Dialog from '@radix-ui/react-dialog'
import { Drawer } from 'vaul'
import { X } from '@phosphor-icons/react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

/**
 * One dialog API, two presentations: a centred dialog on desktop and a
 * draggable bottom sheet on phones, where thumbs live.
 */
export function Sheet({ open, onOpenChange, title, description, children, footer }) {
  const desktop = useMediaQuery('(min-width: 640px)')

  if (!desktop) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-60 bg-black/40" />
          <Drawer.Content data-lenis-prevent className="fixed inset-x-0 bottom-0 z-60 flex max-h-[92dvh] flex-col rounded-t-[20px] border-t border-line-strong bg-bg-elev outline-none">
            <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" />
            <div className="overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Drawer.Title className="text-lg font-semibold tracking-[-0.02em] text-ink">{title}</Drawer.Title>
              {description && <Drawer.Description className="mt-1 text-sm text-ink-2">{description}</Drawer.Description>}
              <div className="mt-5">{children}</div>
              {footer && <div className="mt-6 flex flex-col-reverse gap-2">{footer}</div>}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <Dialog.Content data-lenis-prevent className="fixed top-1/2 left-1/2 z-60 max-h-[85dvh] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] border border-line-strong bg-bg-elev p-6 shadow-card outline-none data-[state=open]:animate-[dialog-in_200ms_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-ink">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm text-ink-2">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="-m-1 grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="mt-5">{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
