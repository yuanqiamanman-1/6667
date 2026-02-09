'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { DURATIONS } from '@/lib/constants'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0,
  hover = true 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: DURATIONS.normal / 1000, 
        delay: delay / 1000,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={hover ? { 
        y: -8,
        transition: { duration: DURATIONS.fast / 1000 }
      } : undefined}
    >
      <Card className={className}>
        {children}
      </Card>
    </motion.div>
  )
}
