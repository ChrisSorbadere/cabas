// Cabas — partage en direct v2 (Google Apps Script)
// Liste, placard, menus, prix, dépenses et photos partagés entre deux téléphones.
const VER = 2, CH = 45000;
function ss_(){ return SpreadsheetApp.getActive(); }
function sh_(n){ const s = ss_(); return s.getSheetByName(n) || s.insertSheet(n); }
function find_(s, col, val, room){
  const last = s.getLastRow(); if (!last) return 0;
  const vals = s.getRange(1, 1, last, Math.max(col, 1)).getValues();
  for (let i = 0; i < vals.length; i++){ if (String(vals[i][col - 1]) === val && (!room || vals[i][0] === room)) return i + 1; }
  return 0;
}
function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function read_(room){
  const s = sh_('rooms'), r = find_(s, 1, room); if (!r) return null;
  const v = s.getRange(r, 1, 1, Math.max(3, s.getLastColumn())).getValues()[0];
  if (typeof v[1] === 'string' && v[1].charAt(0) === '{') return JSON.parse(v[1]);
  let j = '';
  for (let i = 2; i < v.length; i++){ const c = String(v[i] || ''); if (!c) break; j += c.charAt(0) === '~' ? c.slice(1) : c; }
  return j ? JSON.parse(j) : null;
}
function write_(room, doc){
  const s = sh_('rooms'); let r = find_(s, 1, room);
  if (!r){ r = s.getLastRow() + 1; s.getRange(r, 1).setValue(room); }
  const j = JSON.stringify(doc), parts = [];
  for (let i = 0; i < j.length; i += CH) parts.push('~' + j.substr(i, CH));
  const row = [new Date()].concat(parts);
  const w = Math.max(s.getLastColumn() - 1, row.length);
  while (row.length < w) row.push('');
  const rg = s.getRange(r, 2, 1, row.length); rg.setNumberFormat('@'); rg.setValues([row]);
}
function mergeMap_(dst, arr){ (arr || []).forEach(function(it){ const c = dst[it.id]; if (!c || (it.u || 0) > (c.u || 0)) dst[it.id] = it; }); }
function prune_(m){ const lim = Date.now() - 30 * 864e5; Object.keys(m).forEach(function(k){ if (m[k].del && (m[k].u || 0) < lim) delete m[k]; }); }
function doGet(e){
  const room = String(e.parameter.room || '').toUpperCase();
  if (!room) return out_({ok:true, app:'cabas', ver:VER});
  if (e.parameter.photo){
    const s = sh_('photos'), r = find_(s, 2, String(e.parameter.photo), room);
    if (!r) return out_({ok:false, err:'nophoto'});
    return out_({ok:true, data:String(s.getRange(r, 3).getValue()).replace(/^~/, '')});
  }
  const d = read_(room); return out_(d ? {ok:true, ver:VER, doc:d} : {ok:false, err:'notfound', ver:VER});
}
function doPost(e){
  const b = JSON.parse(e.postData.contents); const room = String(b.room || '').toUpperCase();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (b.photo){
      const s = sh_('photos'); let r = find_(s, 2, String(b.photo.id), room);
      if (!r) r = s.getLastRow() + 1;
      const rg = s.getRange(r, 1, 1, 3); rg.setNumberFormat('@'); rg.setValues([[room, String(b.photo.id), '~' + b.photo.data]]);
      return out_({ok:true, ver:VER});
    }
    if (b.data){
      const s = sh_('data'), now = Date.now();
      let last = s.getLastRow();
      let vals = last ? s.getRange(1, 1, last, 5).getValues() : [];
      const append = [];
      b.data.forEach(function(x){
        const row = [room, x.kind, String(x.id), now, '~' + JSON.stringify(x)];
        let idx = -1;
        for (let i = 0; i < vals.length; i++){ if (vals[i][0] === room && String(vals[i][2]) === String(x.id)){ idx = i; break; } }
        if (idx >= 0){
          let cur = {}; try { cur = JSON.parse(String(vals[idx][4]).replace(/^~/, '')); } catch(err){}
          if ((x.u || 0) >= (cur.u || 0)){ const rg = s.getRange(idx + 1, 1, 1, 5); rg.setNumberFormat('@'); rg.setValues([row]); vals[idx] = row; }
        } else append.push(row);
      });
      if (append.length){ const rg = s.getRange(s.getLastRow() + 1, 1, append.length, 5); rg.setNumberFormat('@'); rg.setValues(append); vals = vals.concat(append); }
      const since = Number(b.since || 0), out = [];
      vals.forEach(function(v){ if (v[0] === room && Number(v[3]) > since){ try { out.push(JSON.parse(String(v[4]).replace(/^~/, ''))); } catch(err){} } });
      return out_({ok:true, ver:VER, data:out, now:now});
    }
    let d = read_(room);
    if (!d){ if (!b.create) return out_({ok:false, err:'notfound', ver:VER}); d = {name:'', budget:0, u:0, items:{}, pantry:{}, log:[], v:0}; }
    d.items = d.items || {}; d.pantry = d.pantry || {}; d.log = d.log || [];
    if (b.meta && (b.meta.u || 0) > (d.u || 0)){ d.name = b.meta.name; d.budget = b.meta.budget; d.u = b.meta.u; }
    mergeMap_(d.items, b.items); mergeMap_(d.pantry, b.pantry);
    if (b.plan && (b.plan.u || 0) > ((d.plan && d.plan.u) || 0)) d.plan = b.plan;
    (b.log || []).forEach(function(l){ d.log.push(l); }); d.log = d.log.slice(-80);
    prune_(d.items); prune_(d.pantry);
    d.v = (d.v || 0) + 1; write_(room, d);
    return out_({ok:true, ver:VER, doc:d});
  } finally { lock.releaseLock(); }
}
