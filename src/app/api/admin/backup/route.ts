import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { getSession } from '@/lib/auth'

/**
 * GET /api/admin/backup
 * Downloads a byte-level copy of the SQLite database — the safest local backup.
 * Restore = stop server, replace prisma/db/custom.db, start server.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const dbPath = path.join(process.cwd(), 'prisma', 'db', 'custom.db')
  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: 'ملف قاعدة البيانات غير موجود' }, { status: 404 })
  }

  try {
    const buffer = await readFile(dbPath)
    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="dars-backup-${date}.db"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'تعذّر قراءة قاعدة البيانات: ' + (e as Error).message }, { status: 500 })
  }
}
