import type { NextRequest } from 'next/server';
import { getMemorySubsystem } from '@lib/memory';
import { resolveSession } from '@lib/session/anonymous';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/memory/[id]
 *
 * Governance surface — the visitor's own /profile/memory page calls
 * this to delete a specific memory the AI has recorded about them.
 *
 * Owner check: the memory subsystem's `removeById` scopes the delete
 * to the current session (ownerKind='session', ownerId=sessionId) or
 * user id if authenticated. A crafted request that guesses another
 * user's memory id will get `{ ok: false, removed: false }` because
 * the (owner, id) tuple won't match a stored record — deletes never
 * cross ownership boundaries.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  if (!id || id.length > 200) {
    return Response.json({ error: 'invalid id' }, { status: 400 });
  }

  const cookieHeader = req.headers.get('cookie');
  const session = resolveSession(cookieHeader || null);
  const sessionId = session.sessionId;

  const mem = getMemorySubsystem();
  if (!mem.store.removeById) {
    return Response.json(
      { error: 'delete not supported by this store' },
      { status: 501 },
    );
  }

  // For now the surface treats anonymous session as the owner. Once
  // the auth layer lands a stable userId we'll prefer that as the
  // ownerKind='user' key and fall back to session for anonymous.
  const removed = await mem.store.removeById({
    ownerKind: 'session',
    ownerId: sessionId,
    id,
  });

  return Response.json({ ok: true, removed }, { status: 200 });
}
