/** A HUD-style callout: label and value at the end of a leader line from the ring. */
function Callout({ at, side, label, value }) {
  const left = side.includes('l')
  const top = side.includes('t')
  return (
    <div className="reticle-callout absolute" style={{ left: `${at[0]}%`, top: `${at[1]}%` }}>
      <div className={`absolute flex items-end gap-0 ${left ? 'right-0 flex-row-reverse' : 'left-0'} ${top ? 'bottom-0' : 'top-0 items-start'}`}>
        <svg width="34" height="22" className="shrink-0 overflow-visible text-white/30" aria-hidden="true">
          <path d={top ? (left ? 'M34 22 L14 2 L0 2' : 'M0 22 L20 2 L34 2') : left ? 'M34 0 L14 20 L0 20' : 'M0 0 L20 20 L34 20'} fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke" />
          <circle cx={left ? 34 : 0} cy={top ? 22 : 0} r="2" fill="#7fe3ff" />
        </svg>
        <div className={`px-2 font-mono text-[10.5px] leading-[1.35] tracking-[0.08em] whitespace-nowrap uppercase ${left ? 'text-right' : ''} ${top ? '-mb-1.5' : '-mt-1.5 pt-3'}`}>
          <p className="text-white/40">{label}</p>
          <p className="text-white/85 normal-case">{value}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * The scanner around the hero print: a fine ring with ticks, a sweep arc and
 * four callouts saying what this print is (and is not).
 */
export function Reticle() {
  return (
    <div className="relative size-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="none" stroke="rgb(255 255 255 / 0.1)" vectorEffect="non-scaling-stroke" />
        <g className="origin-center animate-[spin_90s_linear_infinite]" style={{ transformBox: 'fill-box' }}>
          <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgb(255 255 255 / 0.22)" strokeDasharray="0.25 1.6" strokeWidth="1.6" />
        </g>
        <g className="origin-center animate-[spin_7s_linear_infinite]" style={{ transformBox: 'fill-box' }}>
          <circle cx="50" cy="50" r="50" fill="none" stroke="#7fe3ff" strokeOpacity="0.7" strokeDasharray="14 300" vectorEffect="non-scaling-stroke" strokeWidth="1.5" />
        </g>
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1="50" y1="-3.5" x2="50" y2="-0.8" stroke="rgb(255 255 255 / 0.5)" vectorEffect="non-scaling-stroke" transform={`rotate(${a} 50 50)`} />
        ))}
      </svg>
      <div className="max-lg:hidden">
        <Callout at={[14.6, 14.6]} side="tl" label="Subject" value="@you · N°000001" />
        <Callout at={[85.4, 14.6]} side="tr" label="Print" value="17 ridges · whorl" />
        <Callout at={[14.6, 85.4]} side="bl" label="Derived from" value="0x7a3F…4F61" />
        <Callout at={[85.4, 85.4]} side="br" label="Biometrics stored" value="0 bytes" />
      </div>
    </div>
  )
}
