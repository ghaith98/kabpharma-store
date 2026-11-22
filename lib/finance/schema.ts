// A single guarded UPDATE fires this trigger. Records and revision commit or roll
// back together, without relying on transaction behaviour across REST requests.
export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS kab_finance_workspace (
    singleton INTEGER PRIMARY KEY CHECK(singleton=1),
    packet_id TEXT NOT NULL, owner TEXT NOT NULL, version INTEGER NOT NULL,
    write_id TEXT NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
    delta_json TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS kab_finance_records (
    key TEXT PRIMARY KEY, kind TEXT NOT NULL, position INTEGER NOT NULL,
    payload TEXT NOT NULL CHECK(json_valid(payload)), array INTEGER NOT NULL CHECK(array IN (0,1))
  )`,
  `CREATE TABLE IF NOT EXISTS kab_finance_commits (
    write_id TEXT PRIMARY KEY, version INTEGER NOT NULL,
    actor TEXT NOT NULL, at TEXT NOT NULL, inverse_json TEXT NOT NULL
  )`,
  ...["INSERT", "UPDATE"].map(event => `CREATE TRIGGER IF NOT EXISTS kab_finance_apply_${event.toLowerCase()}_v1
    AFTER ${event} ON kab_finance_workspace WHEN NEW.delta_json IS NOT NULL
    BEGIN
      INSERT INTO kab_finance_commits(write_id,version,actor,at,inverse_json)
      VALUES(NEW.write_id,NEW.version,NEW.updated_by,NEW.updated_at,json_extract(NEW.delta_json,'$.inverse'));
      DELETE FROM kab_finance_records WHERE key IN (SELECT value FROM json_each(NEW.delta_json,'$.remove'));
      INSERT OR REPLACE INTO kab_finance_records(key,kind,position,payload,array)
      SELECT json_extract(value,'$.key'),json_extract(value,'$.kind'),json_extract(value,'$.position'),
             json_extract(value,'$.payload'),json_extract(value,'$.array')
      FROM json_each(NEW.delta_json,'$.upsert');
      UPDATE kab_finance_workspace SET delta_json=NULL WHERE singleton=1;
      DELETE FROM kab_finance_commits WHERE version < NEW.version-200;
    END`),
];
