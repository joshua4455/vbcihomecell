import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'ghost' | 'outline'
}

export function AnimatedButton({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  variant = 'default'
}: AnimatedButtonProps) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ 
        scale: disabled ? 1 : 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.98,
        transition: { duration: 0.1 }
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.button>
  )
}

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export function AnimatedCard({ 
  children, 
  className = '', 
  onClick,
  hoverable = true 
}: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hoverable ? { 
        y: -4,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2 }
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.div>
  )
}

interface CountUpProps {
  value: number
  duration?: number
  className?: string
}

export function CountUp({ value, duration = 1, className = '' }: CountUpProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          duration,
          ease: 'easeOut'
        }}
      >
        {value}
      </motion.span>
    </motion.span>
  )
}

interface FloatingActionButtonProps {
  children: ReactNode
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ 
  children, 
  onClick, 
  className = '' 
}: FloatingActionButtonProps) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      whileHover={{ 
        scale: 1.1,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
    >
      {children}
    </motion.button>
  )
}

interface PulseProps {
  children: ReactNode
  className?: string
  intensity?: 'low' | 'medium' | 'high'
}

export function Pulse({ 
  children, 
  className = '',
  intensity = 'medium' 
}: PulseProps) {
  const scales = {
    low: [1, 1.02, 1],
    medium: [1, 1.05, 1],
    high: [1, 1.1, 1]
  }

  return (
    <motion.div
      className={className}
      animate={{ scale: scales[intensity] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

interface ShakeProps {
  children: ReactNode
  className?: string
  trigger?: boolean
}

export function Shake({ 
  children, 
  className = '',
  trigger = false 
}: ShakeProps) {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      } : {}}
    >
      {children}
    </motion.div>
  )
}

interface ProgressBarProps {
  progress: number
  className?: string
  animated?: boolean
}

export function ProgressBar({ 
  progress, 
  className = '',
  animated = true 
}: ProgressBarProps) {
  return (
    <div className={`w-full bg-muted rounded-full h-2 ${className}`}>
      <motion.div
        className="bg-primary h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={animated ? { 
          duration: 0.8, 
          ease: 'easeOut' 
        } : { duration: 0 }}
      />
    </div>
  )
}
