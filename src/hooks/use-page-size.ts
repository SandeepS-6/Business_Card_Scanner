import { useEffect, useMemo, useState } from 'react'

/** Mobile: 4 rows; md+ (≥768px): 10 rows. */
export function usePageSize(mobile = 4, desktop = 10) {
  const [pageSize, setPageSize] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? desktop : mobile,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setPageSize(mq.matches ? desktop : mobile)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [mobile, desktop])

  return pageSize
}

/** Slice rows for DataTable + Pagination. Pass `resetKey` (e.g. search/filter) to jump back to page 1. */
export function usePagedRows<T>(rows: T[], resetKey?: string | number) {
  const pageSize = usePageSize()
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [pageSize, resetKey])

  const total = rows.length
  const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(page, maxPage)

  const paged = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  )

  return { page: safePage, setPage, pageSize, paged, total }
}
