export function StepHeading({ icon: Icon, title, body }) {
  return (
    <div>
      <div className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon className="size-5" />
      </div>
      <h2 className="mt-6 text-[1.75rem] leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-3xl">{title}</h2>
      {body && <p className="mt-3 max-w-lg text-[15.5px] leading-relaxed text-ink-2">{body}</p>}
    </div>
  )
}
