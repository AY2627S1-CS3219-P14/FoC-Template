import type { ComponentPropsWithoutRef } from 'react'

type SelectOption = { label: string; value: string }

type SelectProps = ComponentPropsWithoutRef<'select'> & {
  label: string
  options: SelectOption[]
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
