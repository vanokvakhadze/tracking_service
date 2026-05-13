import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/src/services/auth'

export type MobileRole = 'admin' | 'employee' | null

export function useMobileRole(): MobileRole {
  const [role, setRole] = useState<MobileRole>(null)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        setRole(null)
        return
      }
      const memberships = (user.memberships ?? []) as Array<{
        is_active: boolean | null
        role: string | null
      }>
      const active = memberships.find((m) => m.is_active)
      const isAdmin = active?.role === 'tenant_admin' || active?.role === 'super_admin'
      setRole(isAdmin ? 'admin' : 'employee')
    })
  }, [])

  return role
}
