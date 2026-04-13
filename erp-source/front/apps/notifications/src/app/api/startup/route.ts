import { NextResponse } from 'next/server';
import manifest from '../../../../manifest.json';

let registered = false;

export async function GET() {
  if (registered) return NextResponse.json({ ok: true, alreadyRegistered: true });

  const coreUrl = process.env.CORE_API_URL ?? 'http://localhost:4000';
  const secret = process.env.INTERNAL_API_SECRET ?? '';

  try {
    const res = await fetch(`${coreUrl}/api/v1/auth/modules/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify(manifest),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, status: res.status, detail: text }, { status: 502 });
    }
    registered = true;
    return NextResponse.json({ ok: true, registered: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 503 });
  }
}
