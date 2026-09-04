import { NextRequest, NextResponse } from 'next/server'
import Ably from 'ably/promises'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const clientId = session.userId

  // Ensure ABLY_API_KEY is defined in .env
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json({ error: 'ABLY_API_KEY is missing' }, { status: 500 })
  }

  try {
    const client = new Ably.Rest(process.env.ABLY_API_KEY)
    const tokenRequestData = await client.auth.createTokenRequest({ clientId })
    return NextResponse.json(tokenRequestData)
  } catch (error) {
    console.error('Ably Auth Error:', error)
    return NextResponse.json({ error: 'Failed to generate Ably token' }, { status: 500 })
  }
}
