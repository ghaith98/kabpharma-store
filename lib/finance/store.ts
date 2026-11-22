import "server-only";
import { randomUUID } from "node:crypto";
import { queryD1 } from "./cloudflare";
import { schemaStatements } from "./schema";
import { encodeState, decodeState, stateDelta } from "./records.mjs";
import { applyAction, parsePacket, validateState } from "./engine.mjs";
import { FinanceError, type Packet, type StoredRecord, type FinanceAction } from "./types";

type Meta = { packet_id: string; owner: string; version: number; write_id: string; updated_at: string; updated_by: string };
export async function setupFinance() {
  for (const statement of schemaStatements) await queryD1(statement);
}
export async function financeStatus() {
  const { results } = await queryD1<Meta>("SELECT packet_id,owner,version,write_id,updated_at,updated_by FROM kab_finance_workspace WHERE singleton=1");
  return results[0] || null;
}
export async function financeRecordsPage(version: number | null, after: string) {
  const {results} = await queryD1<{section: string; data: string}>(`
    SELECT 'meta' AS section,json_object('packet_id',packet_id,'owner',owner,'version',version) AS data
    FROM kab_finance_workspace WHERE singleton=1
    UNION ALL
    SELECT 'record',json_object('key',key,'kind',kind,'position',position,'payload',payload,'array',array)
    FROM (SELECT * FROM kab_finance_records WHERE key > ? ORDER BY key LIMIT 200)`, [after]);
  const metaRow=results.find(row=>row.section==='meta');
  if(!metaRow) return {meta:null,rows:[],cursor:null};
  const meta=JSON.parse(metaRow.data) as Meta;
  if(version!==null && meta.version!==version) throw new FinanceError("تغيّرت البيانات أثناء تحميلها. أعد التحديث.",409,"LOAD_CONFLICT");
  const candidates=results.filter(row=>row.section==='record');
  const rows: StoredRecord[]=[];let bytes=0;
  for(const row of candidates){
    const size=Buffer.byteLength(row.data,'utf8');
    if(rows.length && bytes+size>700_000)break;
    rows.push(JSON.parse(row.data) as StoredRecord);bytes+=size;
  }
  const cursor=rows.length && (rows.length<candidates.length || candidates.length===200) ? rows.at(-1)!.key : null;
  return {meta,rows,cursor};
}
export async function loadFinance(): Promise<Packet | null> {
  // One statement gives a consistent snapshot even during a concurrent save.
  const {results} = await queryD1<{ section: string; data: string }>(`
    SELECT 'meta' AS section,json_object('packet_id',packet_id,'owner',owner,'version',version) AS data
    FROM kab_finance_workspace WHERE singleton=1
    UNION ALL
    SELECT 'record',json_object('key',key,'kind',kind,'position',position,'payload',payload,'array',array)
    FROM kab_finance_records`);
  const metaRow = results.find(row => row.section === "meta");
  if (!metaRow) return null;
  const meta = JSON.parse(metaRow.data) as Meta;
  const records = results.filter(row => row.section === "record").map(row => JSON.parse(row.data) as StoredRecord);
  const packet: Packet = {format: "kab-finance-local",id: meta.packet_id,actor: meta.owner,version: meta.version,state: decodeState(records)};
  validateState(packet.state);
  return packet;
}
function deltaValue(previous: Packet | null, next: Packet) {
  const delta = stateDelta(previous ? encodeState(previous.state) : new Map(), encodeState(next.state));
  const raw = JSON.stringify(delta);
  // D1 limits a bound string to 2 MB. Reject before writing any part of a change.
  if (Buffer.byteLength(raw, "utf8") > 1_900_000) throw new FinanceError("حجم هذه العملية أكبر من الحد المدعوم. لم تُحفظ أي تغييرات؛ احتفظ بنسخة البيانات وتواصل مع الإدارة.", 413, "SIZE");
  return raw;
}
export async function importFinance(raw: string, actor: string) {
  let packet: Packet;
  try { packet = parsePacket(raw); } catch(error) { throw new FinanceError(error instanceof Error ? error.message : "ملف البيانات غير صالح."); }
  const delta = deltaValue(null, packet);
  const writeId = randomUUID();
  const result = await queryD1<{version: number}>(`
    INSERT INTO kab_finance_workspace(singleton,packet_id,owner,version,write_id,updated_by,updated_at,delta_json)
    VALUES(1,?,?,?,?,?,?,?) ON CONFLICT(singleton) DO NOTHING RETURNING version`,
    [packet.id,packet.actor,packet.version,writeId,actor,new Date().toISOString(),delta]);
  if (!result.results.length) throw new FinanceError("يوجد ملف محاسبة مستورد بالفعل. تم إيقاف الاستيراد لحماية البيانات الموجودة.",409,"EXISTS");
  return packet;
}
export async function saveFinance(version: number, action: FinanceAction, requestId: string, actor: string) {
  const prior = await queryD1<{write_id: string}>("SELECT write_id FROM kab_finance_commits WHERE write_id=?",[requestId]);
  if (prior.results.length) return {reload: true};
  const current = await loadFinance();
  if (!current) throw new FinanceError("استورد ملف بيانات الشركة أولاً.",409,"EMPTY");
  if (current.version !== version) throw new FinanceError("تم تعديل البيانات من جهاز آخر. احتفظ بما أدخلته، ثم أغلق النموذج واضغط تحديث وأعد المحاولة.",409,"CONFLICT");
  // The portable owner remains the accounting owner. Website access is enforced
  // separately by getAdminFromRequest; the commit log records the actual admin.
  let state;
  try {
    state = applyAction(current.state, action, current.actor);
    validateState(state);
  } catch(error) { throw new FinanceError(error instanceof Error ? error.message : "تعذّر التحقّق من العملية."); }
  const next: Packet = {...current,version: current.version+1,state};
  const delta = deltaValue(current,next);
  const result = await queryD1<{version: number}>(`
    UPDATE kab_finance_workspace SET version=?,write_id=?,updated_by=?,updated_at=?,delta_json=?
    WHERE singleton=1 AND version=? RETURNING version`,
    [next.version,requestId,actor,new Date().toISOString(),delta,version]);
  if (!result.results.length) {
    // The same request may have succeeded while its first response was lost.
    const committed = await queryD1<{write_id: string}>("SELECT write_id FROM kab_finance_commits WHERE write_id=?",[requestId]);
    if (committed.results.length) return {reload: true};
    throw new FinanceError("حُفظ تعديل من جهاز آخر أثناء العملية. لم تُحفظ عمليتك؛ اضغط تحديث قبل إعادة المحاولة.",409,"CONFLICT");
  }
  const {upsert,remove}=JSON.parse(delta);
  return {meta:{packet_id:next.id,owner:next.actor,version:next.version},changes:{upsert,remove}};
}
