export async function audit(q, { actorId, action, entity, entityId, before, after }) {
  await q.query(
    'INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,$2,$3,$4,$5,$6)',
    [actorId || null, action, entity, entityId ? String(entityId) : null, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null]
  );
}
