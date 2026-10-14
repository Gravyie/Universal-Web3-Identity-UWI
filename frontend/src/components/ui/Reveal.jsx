import { motion } from 'motion/react'
import { easeOutExpo } from '../../lib/motion'

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ children, delay = 0, y = 24, className = '', as = 'div', ...props }) {
  const Tag = motion[as]
  return (
    <Tag
      {...props}
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: easeOutExpo }}
    >
      {children}
    </Tag>
  )
}
