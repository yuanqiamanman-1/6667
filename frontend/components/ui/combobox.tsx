'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type ComboboxItem = {
  value: string
  label: string
  description?: string
  keywords?: string[]
  key?: string
}

export function Combobox(props: {
  items: ComboboxItem[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}) {
  const selected = useMemo(() => props.items.find(i => i.value === props.value), [props.items, props.value])
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={props.disabled}
          className={cn('w-full justify-between bg-transparent', props.className)}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : (props.placeholder ?? '请选择')}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command
          filter={(value, search) => {
            const item = props.items.find(i => i.value === value)
            if (!item) return 0
            const haystack = [
              item.label,
              item.description ?? '',
              ...(item.keywords ?? []),
            ]
              .join(' ')
              .toLowerCase()
            return haystack.includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder={props.searchPlaceholder ?? '搜索...'} />
          <CommandList
            className="overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandEmpty>{props.emptyText ?? '没有匹配项'}</CommandEmpty>
            <CommandGroup>
              {props.items.map(item => (
                <CommandItem
                  key={item.key || item.value}
                  value={item.value}
                  onSelect={(current) => {
                    props.onChange(current)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <Check className={cn('h-4 w-4', props.value === item.value ? 'opacity-100' : 'opacity-0')} />
                  <div className="min-w-0">
                    <div className="truncate">{item.label}</div>
                    {item.description && <div className="truncate text-xs text-muted-foreground">{item.description}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
