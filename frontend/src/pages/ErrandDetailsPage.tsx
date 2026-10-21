import { Link, useParams } from 'react-router'
import { getMockErrandDetails } from '../features/errands/errand-details.mock'

export function ErrandDetailsPage() {
  const { errandId = '' } = useParams()
  const errand = getMockErrandDetails(errandId)

  if (!errand) {
    return (
      <section className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-xs font-medium tracking-[0.08em] text-[#175c45]">ERRAND DETAILS</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.035em] text-[#17211d]">
          Errand not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#68736c]">
          This errand may no longer be available, or the link may be incorrect.
        </p>
        <Link
          to="/my-errands"
          className="mt-6 inline-block rounded-lg bg-[#175c45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3c2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45]"
        >
          Back to My errands
        </Link>
      </section>
    )
  }

  return (
    <section>
      <Link className="text-sm font-medium text-[#175c45]" to="/my-errands">
        ← Back to My errands
      </Link>
      <p className="mt-6 text-xs font-medium tracking-[0.08em] text-[#175c45]">
        ERRAND DETAILS
      </p>
      <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.035em] text-[#17211d] sm:text-[2.375rem]">
        {errand.requiredItem}
      </h1>
    </section>
  )
}

