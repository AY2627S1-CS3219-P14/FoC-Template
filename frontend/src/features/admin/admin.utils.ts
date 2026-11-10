// Shared by the admin dashboard sections

export const PAGE_SIZE = 10

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The request could not be completed.'
}
