import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
const variants = cva('inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50', { variants: { variant: { default: 'bg-green-800 text-white hover:bg-green-900', outline: 'border border-green-900/20 bg-white hover:bg-green-50' } }, defaultVariants: { variant: 'default' } })
type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants> & { asChild?: boolean }
export function Button({ asChild, variant, className, ...props }: Props) {
 const Component = asChild ? Slot : 'button'
 return <Component className={cn(variants({variant}), className)} {...props} />
}
