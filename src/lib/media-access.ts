import { db } from '@/lib/db'

/**
 * Entitlement gate for protected media.
 *
 * - ADMIN / SUPERVISOR / TEACHER: always allowed (they create/manage content).
 * - PARENT: allowed only if at least one of their students has a CONFIRMED
 *   booking (i.e. they are an active paying customer).
 * - Everyone else: denied.
 */
export async function canAccessMedia(role: string, userId: string): Promise<boolean> {
  if (role === 'ADMIN' || role === 'SUPERVISOR' || role === 'TEACHER') return true
  if (role !== 'PARENT') return false

  const parent = await db.parent.findUnique({
    where: { userId },
    select: { students: { select: { id: true } } },
  })
  if (!parent || parent.students.length === 0) return false

  const booking = await db.booking.findFirst({
    where: {
      studentId: { in: parent.students.map((s) => s.id) },
      status: 'CONFIRMED',
    },
    select: { id: true },
  })
  return Boolean(booking)
}
