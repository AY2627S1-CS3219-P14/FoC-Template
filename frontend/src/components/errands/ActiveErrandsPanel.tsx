type ActiveErrandsPanelProps = {
  count: number
}

export function ActiveErrandsPanel({ count }: ActiveErrandsPanelProps) {
  return (
    <aside aria-labelledby="active-errands-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="active-errands-heading" className="text-sm font-medium text-[#17211d]">
          Active errands
        </h2>
        {count > 0 ? (
          <span className="text-xs text-[#68736c]">{count}</span>
        ) : null}
      </div>

      <div className="mt-3 rounded-[18px] border border-dashed border-[#bdc8c0] bg-white px-5 py-8 text-center shadow-[0_8px_24px_rgba(22,59,42,0.04)]">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-[#ddf3e7] text-lg text-[#175c45]" aria-hidden="true">
          ✓
        </div>
        <p className="mt-3 text-sm font-medium text-[#17211d]">No active errands</p>
        <p className="mt-1.5 text-xs leading-5 text-[#68736c]">
          Errands you request or accept will appear here.
        </p>
      </div>
    </aside>
  )
}
