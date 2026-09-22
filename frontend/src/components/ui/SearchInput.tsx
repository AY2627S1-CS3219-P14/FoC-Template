import type { ComponentPropsWithoutRef } from 'react'

type SearchInputProps = ComponentPropsWithoutRef<'input'> & { label?: string }

export function SearchInput({ label = 'Search', className = '', ...props }: SearchInputProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500 ${className}`}
        {...props}
      />
    </label>
  )
}
