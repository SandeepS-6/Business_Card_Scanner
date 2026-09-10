import { useEffect, useState } from 'react'

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
