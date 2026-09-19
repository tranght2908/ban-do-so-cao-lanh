/* Lõi prototype: trạng thái, tiện ích, định tuyến, modal, biểu đồ, phân quyền. */
window.APP = (function () {
  'use strict';
  const D = window.DATA;
  const KEY = 'bds-caolanh-state', UIKEY = 'bds-caolanh-ui', GUIDEKEY = 'bds-caolanh-guide';
  const A = {
    D, db: null, idx: null, current: null, after: null,
    VIEWS: {}, ACT: {}, IN: {}, CH: {},
    ui: {
      role: 'congchuc', page: {}, period: '2026-Q3', group: 'hatang',
      map: { base: 'street', groups: { dothi: true, nongsan: true, hatang: true }, types: {}, boundary: true, areas: false, q: '', cond: '', unit: '', approval: '', from: '', to: '', sel: null, tool: null, radius: 300, area: '', colorBy: 'type', scoreView: false, listOpen: true, cones: true, camOnly: '' },
      obj: { q: '', group: '', type: '', approval: '', cond: '', unit: '', tab: 'list' },
      cam: { tab: 'ds', q: '', road: '', kind: '', conn: '', unit: '' },
      imp: { step: 0, rows: null, file: '' },
      score: { group: 'hatang', period: '2026-Q3', objId: null, mode: 'desktop', draft: {} },
      result: { group: 'hatang', period: '2026-Q3', compare: '2026-Q2' },
      infra: { tab: 'taisan', type: 'chieusang', analysis: 'chieusang', incFilter: 'all' },
      report: 'r1', admin: { tab: 'taikhoan' }, pub: { q: '', type: '', sel: null }
    }
  };
  const ui = A.ui;
  const $ = s => document.querySelector(s);
  A.$ = $;

  // ---------- tiện ích ----------
  const U = A.U = {};
  U.pad = (n, l) => String(n).padStart(l || 2, '0');
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.num = n => Math.round(n || 0).toLocaleString('vi-VN');
  U.money = n => Math.round(n || 0).toLocaleString('vi-VN') + ' đ';
  U.moneyShort = n => { n = n || 0; if (Math.abs(n) >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ'; if (Math.abs(n) >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr'; return U.num(n); };
  U.dec = (n, d) => (n || 0).toLocaleString('vi-VN', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d });
  U.pct = (a, b) => b ? Math.round(a * 1000 / b) / 10 : 0;
  U.dmy = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '';
  U.days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  U.sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);
  U.avg = (arr, f) => arr.length ? U.sum(arr, f) / arr.length : 0;
  U.today = () => A.db.today;
  U.nowTime = () => { const d = new Date(); return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); };
  U.staffName = id => { const s = D.STAFF.find(x => x.id === id) || A.db.accounts.find(x => x.id === id); return s ? s.name : (id || '—'); };
  U.me = () => ({ lanhdao: 'LD02', truongbp: 'LD01', congchuc: 'NV01', quantri: 'QT01', nguoidan: 'Người dân' }[ui.role]);
  U.group = g => D.GROUPS[g];
  U.type = t => { for (const g in D.GROUPS) { const x = D.GROUPS[g].types.find(y => y.id === t); if (x) return x; } return null; };
  U.typeName = t => (U.type(t) || {}).name || t;
  U.groupOfType = t => { for (const g in D.GROUPS) if (D.GROUPS[g].types.some(y => y.id === t)) return g; return null; };
  U.color = o => D.TYPE_COLOR[o.type] || D.GROUPS[o.group].color;
  U.anchor = o => o.geom.type === 'point' ? o.geom.coords : o.geom.coords[Math.floor(o.geom.coords.length / 2)];
  U.coordTxt = p => p[0].toFixed(5) + ', ' + p[1].toFixed(5);
  U.condTag = c => `<span class="tag"><span class="dot" style="background:${D.COND[c].color}"></span>${D.COND[c].label}</span>`;
  U.apprTag = a => `<span class="tag ${D.APPROVAL[a].cls}">${D.APPROVAL[a].label}</span>`;
  U.grade = s => D.GRADES.find(g => s >= g.min) || D.GRADES[3];
  U.gradeTag = s => { const g = U.grade(s); return `<span class="grade" style="background:${g.color}">${g.label}</span>`; };
  U.geomLabel = t => ({ point: 'Điểm', line: 'Đường', polygon: 'Vùng' }[t]);
  U.attrLabel = k => D.ATTR_LABEL[k] || k;
  U.dist = (a, b) => { const R = 6371000, dLat = (b[0] - a[0]) * Math.PI / 180, dLng = (b[1] - a[1]) * Math.PI / 180; const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  U.lineLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += U.dist(pts[i - 1], pts[i]); return s; };
  U.area = pts => { // m², chiếu phẳng cục bộ
    if (pts.length < 3) return 0;
    const lat0 = pts[0][0] * Math.PI / 180;
    const xy = pts.map(p => [(p[1] - pts[0][1]) * 111320 * Math.cos(lat0), (p[0] - pts[0][0]) * 110574]);
    let a = 0; for (let i = 0; i < xy.length; i++) { const j = (i + 1) % xy.length; a += xy[i][0] * xy[j][1] - xy[j][0] * xy[i][1]; }
    return Math.abs(a) / 2;
  };
  U.fmtLen = m => m >= 1000 ? U.dec(m / 1000, 2) + ' km' : U.num(m) + ' m';
  U.fmtArea = m => m >= 10000 ? U.dec(m / 10000, 2) + ' ha' : U.num(m) + ' m²';
  U.inBoundary = p => D.inPoly(p, D.BOUNDARY);
  U.photo = (o, i, cls) => {
    const h = (o.id + i).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const c1 = ['#3f7d6b', '#5b8c5a', '#8a6d3b', '#4d6f9c', '#7a5c8e', '#a06b3a'][h % 6];
    return `<div class="photo ${cls || ''}" style="background:linear-gradient(135deg,${c1},#243c36)"><span>${D.TYPE_ICO[o.type]}</span><small>Ảnh hiện trạng ${i + 1}</small></div>`;
  };
  U.photos = (o, max) => { const n = Math.min(o.photos || 0, max || 3); let h = ''; for (let i = 0; i < n; i++) h += U.photo(o, i); return h; };

  // ---------- tọa độ ----------
  const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
  U.bearing = (a, b) => (Math.atan2((b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180), b[0] - a[0]) * 180 / Math.PI + 360) % 360;
  U.dirName = deg => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  // Chuyển WGS-84 sang VN-2000 múi 3°, kinh tuyến trục 105°00' (Đồng Tháp) – quy đổi gần đúng để minh họa
  U.vn2000 = p => {
    const a = 6378137, f = 1 / 298.257223563, e2 = f * (2 - f), ep2 = e2 / (1 - e2), k0 = 0.9999, FE = 500000;
    const rad = Math.PI / 180, phi = p[0] * rad, lam = p[1] * rad, lam0 = 105 * rad;
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2), T = Math.tan(phi) ** 2, C = ep2 * Math.cos(phi) ** 2, Aa = (lam - lam0) * Math.cos(phi);
    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * phi - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi)
      + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * phi) - (35 * e2 ** 3 / 3072) * Math.sin(6 * phi));
    const E = FE + k0 * N * (Aa + (1 - T + C) * Aa ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * Aa ** 5 / 120);
    const Nn = k0 * (M + N * Math.tan(phi) * (Aa * Aa / 2 + (5 - T + 9 * C + 4 * C * C) * Aa ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * Aa ** 6 / 720));
    return { x: Math.round(E), y: Math.round(Nn) };
  };
  U.vnTxt = p => { const v = U.vn2000(p); return 'X = ' + U.num(v.x) + ' m · Y = ' + U.num(v.y) + ' m'; };
  U.dms = p => {
    const one = (v, pos, neg) => { const s = v < 0 ? neg : pos; v = Math.abs(v); const d = Math.floor(v), m = Math.floor((v - d) * 60), sec = ((v - d) * 60 - m) * 60; return d + '°' + U.pad(m) + "'" + sec.toFixed(1) + '"' + s; };
    return one(p[0], 'B', 'N') + ' ' + one(p[1], 'Đ', 'T');
  };
  // Nhận chuỗi tọa độ người dùng dán vào: thập phân, độ–phút–giây, hoặc liên kết Google Maps
  U.parseCoord = s => {
    if (!s) return null;
    s = String(s).trim().replace(/[′’]/g, "'").replace(/[″”]/g, '"');
    const fix = pair => {
      let [la, ln] = pair;
      if (Math.abs(la) > 90 && Math.abs(ln) <= 90) { const t = la; la = ln; ln = t; }
      if (isNaN(la) || isNaN(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) return null;
      return [Math.round(la * 1e5) / 1e5, Math.round(ln * 1e5) / 1e5];
    };
    const at = s.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || s.match(/[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (at) return fix([Number(at[1]), Number(at[2])]);
    const dms = s.match(/(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"?\s*([NSBnsb])?[,\s]+(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"?\s*([EWĐTewđt])?/);
    if (dms) {
      const v1 = Number(dms[1]) + Number(dms[2]) / 60 + Number(dms[3]) / 3600, v2 = Number(dms[5]) + Number(dms[6]) / 60 + Number(dms[7]) / 3600;
      return fix([/[Ss]/.test(dms[4] || '') ? -v1 : v1, /[WwTt]/.test(dms[8] || '') ? -v2 : v2]);
    }
    const nums = s.match(/-?\d+(?:\.\d+)?/g);
    if (nums && nums.length >= 2) return fix([Number(nums[0]), Number(nums[1])]);
    return null;
  };
  // Đối tượng gần một điểm: [{o, d}] sắp xếp theo khoảng cách
  U.nearest = (p, n, filter) => A.db.objs.filter(o => o.approval !== 'nhap' && (!filter || filter(o)))
    .map(o => ({ o, d: Math.min.apply(null, (o.geom.type === 'point' ? [o.geom.coords] : o.geom.coords).map(c => U.dist(p, c))) }))
    .sort((x, y) => x.d - y.d).slice(0, n || 5);
  U.pager = (key, total, size) => {
    const pages = Math.max(1, Math.ceil(total / size));
    const p = Math.min(ui.page[key] || 0, pages - 1);
    ui.page[key] = p;
    return {
      start: p * size, end: p * size + size,
      html: `<div class="pager">${total ? (p * size + 1) + '–' + Math.min(total, p * size + size) + ' / ' + total : '0 dòng'}
        <button class="btn sm" data-act="page" data-k="${key}" data-d="-1" ${p === 0 ? 'disabled' : ''}>‹ Trước</button>
        <button class="btn sm" data-act="page" data-k="${key}" data-d="1" ${p >= pages - 1 ? 'disabled' : ''}>Sau ›</button></div>`
    };
  };
  U.table = (cols, rows, opts) => {
    opts = opts || {};
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''}">${c.t}</th>`).join('')}</tr></thead>
      <tbody>${rows.length ? rows.join('') : `<tr><td colspan="${cols.length}" class="empty">${opts.empty || 'Không có dữ liệu'}</td></tr>`}</tbody></table></div>`;
  };
  U.download = (name, content, mime) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  U.csv = (name, cols, rows) => {
    const csv = '﻿' + [cols].concat(rows).map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    U.download(name + '.csv', csv, 'text/csv;charset=utf-8');
    U.toast('Đã xuất tệp ' + name + '.csv (mở được bằng Excel)');
  };
  U.geojson = (name, objs) => {
    const fc = { type: 'FeatureCollection', crs: { type: 'name', properties: { name: 'EPSG:4326' } }, features: objs.map(o => ({
      type: 'Feature', properties: Object.assign({ id: o.id, name: o.name, group: o.group, type: o.type, cond: o.cond, unit: D.UNITS[o.unit], updated: o.updated }, o.attrs),
      geometry: o.geom.type === 'point' ? { type: 'Point', coordinates: [o.geom.coords[1], o.geom.coords[0]] }
        : o.geom.type === 'line' ? { type: 'LineString', coordinates: o.geom.coords.map(c => [c[1], c[0]]) }
          : { type: 'Polygon', coordinates: [o.geom.coords.concat([o.geom.coords[0]]).map(c => [c[1], c[0]])] }
    })) };
    U.download(name + '.geojson', JSON.stringify(fc, null, 1), 'application/geo+json');
    U.toast('Đã xuất ' + objs.length + ' đối tượng ra ' + name + '.geojson');
  };
  U.toast = msg => {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3600);
  };
  U.audit = (what, target) => { A.db.audit.unshift({ at: U.today() + ' ' + U.nowTime(), who: U.me(), what, target: target || '', ip: '10.20.1.15' }); };

  // ---------- phân quyền ----------
  A.can = (act, group) => {
    if (ui.role === 'nguoidan') return act === 'xem' && group === 'nongsan';
    const p = A.db.perms[ui.role]; if (!p) return false;
    if (!group) return Object.keys(p).some(g => p[g][act]);
    return !!(p[group] && p[group][act]);
  };
  A.roleName = id => (A.db.roles.find(r => r.id === id) || {}).name || id;

  // ---------- điểm số ----------
  A.critSet = (group, period) => A.db.criteriaSets.find(c => c.group === group && c.period === period);
  A.calcScore = (sc, set) => { // điểm tổng hợp 0–100 theo trọng số
    if (!sc || !set) return null;
    let total = 0, wsum = 0;
    set.criteria.forEach(c => {
      const max = U.sum(c.subs, s => s.max), got = U.sum(c.subs, s => Number(sc.values[s.id]) || 0);
      total += (max ? got / max : 0) * c.weight; wsum += c.weight;
    });
    return wsum ? Math.round(total / wsum * 1000) / 10 : 0;
  };
  A.scoreOf = (objId, period) => { const o = A.idx.obj.get(objId); const sc = A.db.scores.find(s => s.objId === objId && s.period === period); return sc ? A.calcScore(sc, A.critSet(o.group, period)) : null; };
  A.ranking = (group, period) => A.db.objs.filter(o => o.evaluated && o.group === group && o.approval === 'daduyet')
    .map(o => ({ o, s: A.scoreOf(o.id, period), sc: A.db.scores.find(s => s.objId === o.id && s.period === period) }))
    .sort((a, b) => (b.s == null ? -1 : b.s) - (a.s == null ? -1 : a.s));

  // ---------- biểu đồ ----------
  const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  U.bars = (labels, series, o) => {
    o = Object.assign({ h: 230, stacked: true, fmt: U.num, max: null }, o || {});
    const W = 660, H = o.h, L = 54, B = 28, Tp = 12, Rt = 8;
    const tot = labels.map((_, i) => o.stacked ? U.sum(series, s => s.values[i]) : Math.max.apply(null, series.map(s => s.values[i])));
    const max = o.max || niceMax(Math.max.apply(null, tot.concat([1])));
    const ph = H - Tp - B, bw = (W - L - Rt) / labels.length;
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const y = Tp + ph * (1 - k / 4);
      g += `<line x1="${L}" x2="${W - Rt}" y1="${y}" y2="${y}" stroke="#e5eaf1"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7683">${o.fmt(max * k / 4)}</text>`;
    }
    labels.forEach((lb, i) => {
      const x0 = L + i * bw;
      if (o.stacked) {
        let acc = 0; const w = bw * 0.62, x = x0 + (bw - w) / 2;
        series.forEach(s => {
          const v = s.values[i], hh = ph * v / max, y = Tp + ph - ph * (acc + v) / max;
          g += `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(0, hh)}" fill="${s.color}" rx="2"><title>${lb} · ${s.name}: ${o.fmt(v)}</title></rect>`;
          acc += v;
        });
      } else {
        const w = bw * 0.7 / series.length;
        series.forEach((s, j) => {
          const v = s.values[i], hh = ph * v / max;
          g += `<rect x="${x0 + bw * 0.15 + j * w}" y="${Tp + ph - hh}" width="${w - 2}" height="${Math.max(0, hh)}" fill="${s.color}" rx="2"><title>${lb} · ${s.name}: ${o.fmt(v)}</title></rect>`;
        });
      }
      g += `<text x="${x0 + bw / 2}" y="${H - 9}" text-anchor="middle" font-size="11" fill="#5c646f">${lb}</text>`;
    });
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}</svg><div class="chart-legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div></div>`;
  };
  U.lines = (labels, series, o) => {
    o = Object.assign({ h: 220, min: 0, max: 100, fmt: v => U.num(v) }, o || {});
    const W = 660, H = o.h, L = 44, B = 28, Tp = 12, Rt = 12, ph = H - Tp - B, pw = W - L - Rt;
    let g = '';
    for (let k = 0; k <= 4; k++) { const y = Tp + ph * (1 - k / 4); g += `<line x1="${L}" x2="${W - Rt}" y1="${y}" y2="${y}" stroke="#e5eaf1"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7683">${o.fmt(o.min + (o.max - o.min) * k / 4)}</text>`; }
    labels.forEach((lb, i) => { g += `<text x="${L + pw * (labels.length === 1 ? 0.5 : i / (labels.length - 1))}" y="${H - 9}" text-anchor="middle" font-size="11" fill="#5c646f">${lb}</text>`; });
    series.forEach(s => {
      const pts = s.values.map((v, i) => v == null ? null : [L + pw * (labels.length === 1 ? 0.5 : i / (labels.length - 1)), Tp + ph * (1 - (v - o.min) / (o.max - o.min))]);
      let d = '', prev = false;
      pts.forEach(p => { if (!p) { prev = false; return; } d += (prev ? 'L' : 'M') + p[0] + ' ' + p[1] + ' '; prev = true; });
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>`;
      pts.forEach((p, i) => { if (p) g += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${s.color}"><title>${s.name} · ${labels[i]}: ${o.fmt(s.values[i])}</title></circle>`; });
    });
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${g}</svg><div class="chart-legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div></div>`;
  };
  U.donut = (parts, center) => {
    const total = U.sum(parts, p => p.value) || 1;
    let off = 25, arcs = '';
    parts.forEach(p => {
      const len = p.value * 100 / total;
      arcs += `<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${p.color}" stroke-width="6" stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${off}"><title>${p.label}: ${p.value}</title></circle>`;
      off -= len;
    });
    return `<div class="donut-wrap"><svg viewBox="0 0 42 42">${arcs}<text x="21" y="21" text-anchor="middle" font-size="6.5" font-weight="700" fill="#0f1e32">${center ? center[0] : ''}</text><text x="21" y="27" text-anchor="middle" font-size="3.2" fill="#5c646f">${center ? center[1] : ''}</text></svg>
      <div class="donut-legend">${parts.map(p => `<div><span class="tag"><span class="dot" style="background:${p.color}"></span>${p.label}</span><b>${p.value}</b></div>`).join('')}</div></div>`;
  };

  // ---------- dữ liệu ----------
  A.reindex = function () { A.idx = { obj: new Map(A.db.objs.map(o => [o.id, o])) }; };
  A.save = function () { try { localStorage.setItem(KEY, JSON.stringify(A.db)); } catch (e) { /* bỏ qua */ } };
  A.saveUi = function () { try { localStorage.setItem(UIKEY, JSON.stringify({ role: ui.role })); } catch (e) { /* bỏ qua */ } };
  A.fresh = function () { A.db = D.build(); A.reindex(); };
  A.load = function () {
    try { const s = localStorage.getItem(KEY); if (s) { const x = JSON.parse(s); if (x && x.version === D.VERSION) A.db = x; } } catch (e) { A.db = null; }
    if (A.db) A.reindex(); else A.fresh();
    try { const u = JSON.parse(localStorage.getItem(UIKEY) || 'null'); if (u && u.role) ui.role = u.role; } catch (e) { /* bỏ qua */ }
  };
  A.resetAll = function () { try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ } A.fresh(); ui.page = {}; ui.map.sel = null; };
  A.nextId = function (group, type) {
    const pre = { dothi: 'DT', nongsan: 'NS', hatang: 'HT' }[group] + '-' + type.toUpperCase().slice(0, 3) + '-';
    const n = A.db.objs.filter(o => o.id.startsWith(pre)).length + 1;
    return pre + U.pad(n, 3);
  };

  // ---------- modal ----------
  A.modal = function (html, wide) { $('#modal-root').innerHTML = `<div class="overlay" data-act="overlay"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`; };
  A.closeModal = function () { $('#modal-root').innerHTML = ''; };
  A.mHead = t => `<div class="modal-h"><h3>${t}</h3><button class="x" data-act="close" aria-label="Đóng">×</button></div>`;

  // ---------- menu & định tuyến ----------
  A.MENU = [
    { group: 'Điều hành', items: [
      { id: 'tong-quan', ico: '📊', label: 'Bảng điều khiển', roles: ['lanhdao', 'truongbp', 'congchuc', 'quantri'] },
      { id: 'ban-do', ico: '🗺️', label: 'Bản đồ tác nghiệp', roles: ['lanhdao', 'truongbp', 'congchuc', 'quantri'] }
    ] },
    { group: 'Quản lý chuyên đề', items: [
      { id: 'ql-dothi', ico: '🏙️', label: 'Quản lý đô thị', roles: ['truongbp', 'congchuc', 'quantri', 'lanhdao'] },
      { id: 'ql-nongsan', ico: '🌾', label: 'Quản lý nông sản', roles: ['truongbp', 'congchuc', 'quantri', 'lanhdao'] },
      { id: 'ql-hatang', ico: '🔧', label: 'Quản lý hạ tầng kỹ thuật', roles: ['truongbp', 'congchuc', 'quantri', 'lanhdao'] },
      { id: 'ql-camera', ico: '📹', label: 'Quản lý camera giám sát', roles: ['truongbp', 'congchuc', 'quantri', 'lanhdao'], badge: () => A.db.objs.filter(o => o.type === 'camera' && o.cam && !o.cam.online).length },
      { id: 'doi-tuong', ico: '📍', label: 'Tra cứu toàn bộ đối tượng', roles: ['truongbp', 'congchuc', 'quantri'] },
      { id: 'nhap-lieu', ico: '📥', label: 'Nhập liệu hàng loạt', roles: ['congchuc', 'quantri'] },
      { id: 'phe-duyet', ico: '✅', label: 'Phê duyệt dữ liệu', roles: ['truongbp', 'quantri', 'congchuc'], badge: () => A.db.objs.filter(o => o.approval === 'choduyet').length }
    ] },
    { group: 'Chấm điểm, đánh giá', items: [
      { id: 'tieu-chi', ico: '🧮', label: 'Bộ tiêu chí & kỳ đánh giá', roles: ['truongbp', 'quantri', 'lanhdao'] },
      { id: 'cham-diem', ico: '📝', label: 'Thực hiện chấm điểm', roles: ['congchuc', 'truongbp', 'quantri'] },
      { id: 'ket-qua', ico: '🏆', label: 'Kết quả & xếp hạng', roles: ['lanhdao', 'truongbp', 'congchuc', 'quantri'] }
    ] },
    { group: 'Vận hành & phân tích GIS', items: [
      { id: 'ha-tang', ico: '🔧', label: 'Tài sản hạ tầng & sự cố', roles: ['lanhdao', 'truongbp', 'congchuc', 'quantri'], badge: () => A.db.incidents.filter(i => i.state === 'moi').length },
      { id: 'phan-tich', ico: '📡', label: 'Phân tích không gian', roles: ['lanhdao', 'truongbp', 'congchuc', 'quantri'] }
    ] },
    { group: 'Khai thác', items: [
      { id: 'bao-cao', ico: '📈', label: 'Báo cáo & kết xuất', roles: ['lanhdao', 'truongbp', 'congchuc', 'quantri'] },
      { id: 'cong-khai', ico: '🌐', label: 'Lớp thông tin công khai', roles: ['lanhdao', 'truongbp', 'congchuc', 'quantri', 'nguoidan'] },
      { id: 'quan-tri', ico: '🛡️', label: 'Quản trị & phân quyền', roles: ['quantri'] }
    ] }
  ];
  A.menuItem = id => { for (const g of A.MENU) for (const it of g.items) if (it.id === id) return it; return null; };
  U.can = id => { const it = A.menuItem(id); return !!it && it.roles.includes(ui.role); };

  function chrome() {
    $('#nav').innerHTML = A.MENU.map(g => {
      const items = g.items.filter(it => U.can(it.id));
      if (!items.length) return '';
      return `<div class="nav-group">${g.group}</div>` + items.map(it => {
        const b = it.badge ? it.badge() : 0;
        return `<a href="#/${it.id}" class="${A.current === it.id ? 'active' : ''}"><span class="ico">${it.ico}</span>${it.label}${b ? `<span class="badge">${b}</span>` : ''}</a>`;
      }).join('');
    }).join('');
    $('#role-seg').innerHTML = A.db.roles.map(r => `<button class="${ui.role === r.id ? 'on' : ''}" data-act="role" data-id="${r.id}">${U.esc(r.name)}</button>`).join('');
    const it = A.menuItem(A.current);
    $('#page-title').textContent = it ? it.label : '';
    document.title = (it ? it.label + ' · ' : '') + 'Bản đồ số Cao Lãnh – Prototype';
  }

  A.render = function (scroll) {
    const ae = document.activeElement;
    const focusKey = ae && ae.dataset && ae.dataset.in ? ae.dataset.in : null;
    const caret = focusKey && ae.selectionStart != null ? ae.selectionStart : null;
    if (A.MAP) A.MAP.destroyAll();
    A.after = null;
    chrome();
    const view = A.VIEWS[A.current];
    $('#view').innerHTML = view ? view() : '<div class="empty">Đang xây dựng</div>';
    if (A.after) A.after();
    if (focusKey) { const el = document.querySelector(`[data-in="${focusKey}"]`); if (el) { el.focus(); if (caret != null) { try { el.setSelectionRange(caret, caret); } catch (e) { /* bỏ qua */ } } } }
    if (scroll) window.scrollTo(0, 0);
  };
  A.route = function () {
    let r = (location.hash || '').replace(/^#\/?/, '');
    const def = ui.role === 'nguoidan' ? 'cong-khai' : ui.role === 'lanhdao' ? 'tong-quan' : 'ban-do';
    if (!r || !U.can(r)) r = def;
    const changed = A.current !== r;
    A.current = r;
    $('#sidebar').classList.remove('open');
    A.render(changed);
  };
  A.go = r => { if (location.hash === '#/' + r) A.route(); else location.hash = '#/' + r; };

  // ---------- hành động chung ----------
  Object.assign(A.ACT, {
    overlay: (el, e) => { if (e.target === el) A.closeModal(); },
    close: () => A.closeModal(),
    print: () => window.print(),
    menu: () => $('#sidebar').classList.toggle('open'),
    role: el => { ui.role = el.dataset.id; A.saveUi(); ui.page = {}; if (!U.can(A.current)) A.go(ui.role === 'nguoidan' ? 'cong-khai' : 'tong-quan'); else A.route(); },
    page: el => { ui.page[el.dataset.k] = (ui.page[el.dataset.k] || 0) + Number(el.dataset.d); A.render(); },
    go: el => A.go(el.dataset.to),
    guide: () => A.guide(),
    'open-obj': el => A.openObj(el.dataset.id),
    'reset-data': () => { A.resetAll(); A.closeModal(); A.render(); U.toast('Đã đặt lại dữ liệu mẫu'); }
  });

  A.guide = function () {
    A.modal(A.mHead('Hướng dẫn xem prototype') + `<div class="modal-b">
      <p class="muted" style="margin-top:0">Prototype mô phỏng <b>Công cụ số quản lý đô thị, nông sản và hạ tầng kỹ thuật trên nền bản đồ số</b> của phường Cao Lãnh. Đổi <b>Vai trò</b> ở thanh trên cùng để xem từng góc nhìn.</p>
      <ol class="script">
        <li><div><b>Công chức chuyên môn → Bản đồ tác nghiệp:</b> bật/tắt 03 nhóm lớp, đổi nền đường phố/vệ tinh, đo khoảng cách – diện tích, tìm theo bán kính, bấm vào đối tượng để xem hồ sơ; <b>Thêm đối tượng</b> bằng cách bấm trực tiếp lên bản đồ hoặc nhập tọa độ thủ công.</div></li>
        <li><div><b>Ghim tọa độ:</b> bấm chuột phải (hoặc nút 📌) lên bản đồ để thả ghim — hiện tọa độ WGS-84, độ–phút–giây, quy đổi VN-2000, đối tượng gần nhất và lệnh thêm đối tượng ngay tại điểm đó; nút <b>🔢 Tọa độ</b> để dán và đi tới một tọa độ bất kỳ.</div></li>
        <li><div><b>Camera giám sát tuyến đường:</b> lớp camera trong nhóm Hạ tầng kỹ thuật hiển thị vùng quan sát hình quạt theo hướng – góc – tầm; chọn camera để xem luồng mô phỏng, chụp ảnh vào hồ sơ, hiệu chỉnh hướng hoặc mở <b>Tường camera</b>.</div></li>
        <li><div><b>Nhập liệu hàng loạt:</b> kéo thả tệp CSV/GeoJSON hoặc dùng tệp mẫu → hệ thống kiểm tra từng dòng (tọa độ, trùng mã, ngoài ranh giới) trước khi ghi nhận.</div></li>
        <li><div><b>Lãnh đạo bộ phận → Phê duyệt dữ liệu:</b> duyệt hoặc trả lại kèm lý do; chỉ dữ liệu đã duyệt mới lên lớp công khai.</div></li>
        <li><div><b>Chấm điểm:</b> chấm theo bộ tiêu chí có trọng số, đính kèm minh chứng, thử chế độ <b>điện thoại thực địa</b>; sang <b>Kết quả & xếp hạng</b> để xem bản đồ tô màu theo điểm và so sánh giữa các kỳ.</div></li>
        <li><div><b>Tài sản hạ tầng & sự cố / Phân tích không gian:</b> vòng đời tài sản, sự cố lặp lại, vùng thiếu chiếu sáng, điểm thường ngập.</div></li>
        <li><div><b>Người dân → Lớp thông tin công khai:</b> tra cứu vùng trồng, sản phẩm OCOP, điểm bán, chỉ đường – không cần đăng nhập.</div></li>
      </ol>
      <div class="note" style="margin-top:14px">Nền bản đồ trong bản trình diễn dùng OpenStreetMap/ảnh vệ tinh mở để mô phỏng nền bản đồ số dùng chung của tỉnh. Toàn bộ đối tượng, tọa độ, số liệu là mẫu minh họa. Thao tác được lưu trên trình duyệt; vào <b>Quản trị → Đặt lại dữ liệu mẫu</b> để quay về ban đầu.</div>
      </div><div class="modal-f"><button class="btn primary" data-act="close">Bắt đầu xem</button></div>`);
  };

  function init() {
    A.load();
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const fn = A.ACT[el.dataset.act];
      if (fn) fn(el, e);
    });
    document.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if (el && A.IN[el.dataset.in]) A.IN[el.dataset.in](el); });
    document.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if (el && A.CH[el.dataset.ch]) A.CH[el.dataset.ch](el); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') A.closeModal(); });
    window.addEventListener('hashchange', A.route);
    A.route();
    let seen = false;
    try { seen = !!localStorage.getItem(GUIDEKEY); localStorage.setItem(GUIDEKEY, '1'); } catch (e) { /* bỏ qua */ }
    if (!seen) A.guide();
  }
  document.addEventListener('DOMContentLoaded', init);
  return A;
})();
