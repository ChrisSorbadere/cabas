// Cabas — partage en direct (Google Apps Script)
const SHEET = 'rooms';
function sh_(){ const ss = SpreadsheetApp.getActive(); return ss.getSheetByName(SHEET) || ss.insertSheet(SHEET); }
function row_(room){ const f = sh_().getRange('A:A').createTextFinder(room).matchEntireCell(true).findNext(); return f ? f.getRow() : 0; }
function read_(room){ const r = row_(room); return r ? JSON.parse(sh_().getRange(r, 2).getValue() || 'null') : null; }
function write_(room, doc){ const s = sh_(); let r = row_(room); if (!r){ r = s.getLastRow() + 1; s.getRange(r, 1).setValue(room); } s.getRange(r, 2, 1, 2).setValues([[JSON.stringify(doc), new Date()]]); }
function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet(e){
  const room = String(e.parameter.room || '').toUpperCase();
  if (!room) return out_({ok:true, app:'cabas'});
  const d = read_(room); return out_(d ? {ok:true, doc:d} : {ok:false, err:'notfound'});
}
function doPost(e){
  const b = JSON.parse(e.postData.contents); const room = String(b.room || '').toUpperCase();
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    let d = read_(room);
    if (!d){ if (!b.create) return out_({ok:false, err:'notfound'}); d = {name:'', budget:0, u:0, items:{}, log:[], v:0}; }
    if (b.meta && (b.meta.u || 0) > (d.u || 0)){ d.name = b.meta.name; d.budget = b.meta.budget; d.u = b.meta.u; }
    (b.items || []).forEach(it => { const c = d.items[it.id]; if (!c || (it.u || 0) > (c.u || 0)) d.items[it.id] = it; });
    (b.log || []).forEach(l => d.log.push(l)); d.log = d.log.slice(-80);
    const lim = Date.now() - 30 * 864e5;
    Object.keys(d.items).forEach(k => { if (d.items[k].del && d.items[k].u < lim) delete d.items[k]; });
    d.v++; write_(room, d);
    return out_({ok:true, doc:d});
  } finally { lock.releaseLock(); }
}
