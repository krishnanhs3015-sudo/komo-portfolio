import { useEffect, useState } from 'react'

// true on phones and narrow windows, where the pages switch to a compact stacked layout
export default function useIsMobile(max = 900) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= max)
  useEffect(() => {
    const on = () => setMobile(window.innerWidth <= max)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [max])
  return mobile
}
