// Preserve all fields and array order from portable backups, including unknown future fields.
export function encodeState(state) {
  const records = new Map();
  for (const [kind, value] of Object.entries(state)) {
    if (Array.isArray(value)) {
      // An explicit marker preserves empty arrays.
      records.set(JSON.stringify([kind, '$array']), {key: JSON.stringify([kind, '$array']), kind, position: -1, payload: 'null', array: 1});
      value.forEach((item, position) => {
        const id = item && typeof item === 'object' && typeof item.id === 'string' ? `id:${item.id}` : `index:${position}`;
        const key = JSON.stringify([kind, id]);
        if (records.has(key)) throw Error('يوجد رقم سجل مكرر.');
        records.set(key, {key, kind, position, payload: JSON.stringify(item), array: 1});
      });
    } else {
      const key = JSON.stringify([kind, '$value']);
      records.set(key, {key, kind, position: 0, payload: JSON.stringify(value), array: 0});
    }
  }
  return records;
}
export function decodeState(rows) {
  const state = Object.create(null);
  for (const row of [...rows].sort((a,b) => a.position-b.position)) {
    if (row.array) {
      state[row.kind] ??= [];
      if (row.position >= 0) state[row.kind].push(JSON.parse(row.payload));
    } else state[row.kind] = JSON.parse(row.payload);
  }
  return state;
}
export function stateDelta(previous, next) {
  const upsert = [], remove = [], inverseUpsert = [], inverseRemove = [];
  for (const [key, record] of next) {
    const old = previous.get(key);
    if (!old || old.payload !== record.payload || old.position !== record.position || old.array !== record.array) {
      upsert.push(record);
      if (old) inverseUpsert.push(old); else inverseRemove.push(key);
    }
  }
  for (const [key, record] of previous) if (!next.has(key)) {remove.push(key); inverseUpsert.push(record);}
  return {upsert, remove, inverse: {upsert: inverseUpsert, remove: inverseRemove}};
}
