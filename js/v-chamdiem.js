/* Cấu hình bộ tiêu chí, thực hiện chấm điểm, tổng hợp kết quả – xếp hạng. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui, M = A.MAP;
  const sc = ui.score, rs = ui.result;
  const periodName = id => (D.PERIODS.find(p => p.id === id) || {}).name || id;
  const periodSel = (val, ch) => `<select class="input" data-ch="${ch}">${D.PERIODS.map(p => `<option value="${p.id}" ${p.id === val ? 'selected' : ''}>${p.name}${p.status === 'mo' ? ' (đang mở)' : ''}</option>`).join('')}</select>`;
  const groupSeg = (val, act) => `<div class="seg">${Object.keys(D.GROUPS).map(g => `<button class="${val === g ? 'on' : ''}" data-act="${act}" data-g="${g}">${D.GROUPS[g].ico} ${D.GROUPS[g].name}</button>`).join('')}</div>`;

  // ---------- Bộ tiêu chí & kỳ đánh giá ----------
  A.VIEWS['tieu-chi'] = function () {
    const set = A.critSet(ui.group, ui.period);
    const canEdit = A.can('duyet') && set && set.status !== 'khoa';
    const evalTypes = A.db.evalTypes[ui.group];
    return `<div class="row">${groupSeg(ui.group, 'crit-group')}<span class="label-sm">Kỳ đánh giá</span>${periodSel(ui.period, 'crit-period')}<div class="spacer"></div>${A.can('duyet') ? '<button class="btn" data-act="period-new">＋ Khai báo kỳ mới</button>' : ''}</div>
      <div class="grid g-main">
        <div class="card"><div class="card-h"><h3>Bộ tiêu chí ${D.GROUPS[ui.group].name} · ${periodName(ui.period)}</h3>${set ? `<span class="tag ${set.status === 'khoa' ? '' : 'ok'}">${set.status === 'khoa' ? 'Đã khóa (kỳ đã đóng)' : 'Đã ban hành'}</span>` : ''}<div class="spacer"></div>
          ${canEdit ? `<button class="btn sm" data-act="crit-add">＋ Tiêu chí</button><button class="btn sm" data-act="crit-copy">Sao chép từ kỳ trước</button>` : ''}</div>
          <div class="card-b">${set ? `<div class="tbl-wrap"><table class="tbl crit-table"><thead><tr><th>Mã</th><th>Tiêu chí / tiêu chí thành phần</th><th class="num">Thang điểm</th><th class="num">Trọng số (%)</th><th></th></tr></thead><tbody>
            ${set.criteria.map((c, ci) => `<tr style="background:var(--surface-2)"><td><b>${c.id}</b></td><td><b>${canEdit ? `<input class="input" style="width:100%" data-in="crit-name" data-ci="${ci}" value="${U.esc(c.name)}">` : U.esc(c.name)}</b></td><td class="num">${U.sum(c.subs, s => s.max)}</td><td class="num">${canEdit ? `<input type="number" class="input" data-in="crit-w" data-ci="${ci}" value="${c.weight}" min="0" max="100">` : c.weight}</td><td class="nowrap">${canEdit ? `<button class="btn sm" data-act="crit-addsub" data-ci="${ci}">＋ Thành phần</button> <button class="btn sm danger" data-act="crit-del" data-ci="${ci}">×</button>` : ''}</td></tr>
              ${c.subs.map((s, si) => `<tr><td class="small muted" style="padding-left:22px">${s.id}</td><td class="small">${canEdit ? `<input class="input" style="width:100%" data-in="crit-subname" data-ci="${ci}" data-si="${si}" value="${U.esc(s.name)}">` : U.esc(s.name)}</td><td class="num">${canEdit ? `<input type="number" class="input" data-in="crit-max" data-ci="${ci}" data-si="${si}" value="${s.max}" min="1" max="100">` : s.max}</td><td></td><td>${canEdit ? `<button class="btn sm danger" data-act="crit-delsub" data-ci="${ci}" data-si="${si}">×</button>` : ''}</td></tr>`).join('')}`).join('')}
            <tr><td></td><td><b>Tổng trọng số</b></td><td></td><td class="num"><b style="color:${U.sum(set.criteria, c => Number(c.weight)) === 100 ? '#167a3c' : '#df2225'}">${U.sum(set.criteria, c => Number(c.weight))}%</b></td><td></td></tr></tbody></table></div>
            ${canEdit ? '<div class="row" style="margin-top:10px"><button class="btn primary" data-act="crit-save">Lưu bộ tiêu chí</button><span class="small muted">Tổng trọng số phải bằng 100%. Điểm tổng hợp = Σ (điểm đạt / thang điểm × trọng số).</span></div>' : ''}`
            : `<div class="empty">Chưa có bộ tiêu chí cho kỳ này. ${A.can('duyet') ? '<button class="btn primary" data-act="crit-copy">Sao chép từ kỳ trước</button>' : ''}</div>`}</div></div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card"><div class="card-h"><h3>Kỳ đánh giá</h3></div><div class="card-b">${U.table([{ t: 'Kỳ' }, { t: 'Từ' }, { t: 'Đến' }, { t: 'Trạng thái' }], D.PERIODS.map(p => `<tr><td><b>${p.name}</b></td><td class="small">${U.dmy(p.from)}</td><td class="small">${U.dmy(p.to)}</td><td>${p.status === 'mo' ? '<span class="tag ok">Đang mở</span>' : '<span class="tag">Đã đóng</span>'}</td></tr>`))}</div></div>
          <div class="card"><div class="card-h"><h3>Đối tượng thuộc diện đánh giá</h3></div><div class="card-b small">Nhóm <b>${D.GROUPS[ui.group].name}</b> áp dụng cho các lớp: ${evalTypes.map(t => `<span class="tag">${U.typeName(t)}</span>`).join(' ')}<div class="divider"></div>${A.db.objs.filter(o => o.evaluated && o.group === ui.group && o.approval === 'daduyet').length} đối tượng đã duyệt thuộc diện chấm điểm kỳ này.</div></div>
          <div class="card"><div class="card-h"><h3>Thang xếp loại</h3></div><div class="card-b">${D.GRADES.map(g => `<div class="row" style="justify-content:space-between;padding:4px 0"><span class="grade" style="background:${g.color}">${g.label}</span><span class="small">${g.min === 0 ? 'dưới 50' : '≥ ' + g.min} điểm</span></div>`).join('')}</div></div>
        </div></div>`;
  };
  A.ACT['crit-group'] = el => { ui.group = el.dataset.g; A.render(); };
  A.CH['crit-period'] = el => { ui.period = el.value; A.render(); };
  const setNow = () => A.critSet(ui.group, ui.period);
  A.IN['crit-name'] = el => { setNow().criteria[el.dataset.ci].name = el.value; };
  A.IN['crit-w'] = el => { setNow().criteria[el.dataset.ci].weight = Number(el.value); };
  A.IN['crit-subname'] = el => { setNow().criteria[el.dataset.ci].subs[el.dataset.si].name = el.value; };
  A.IN['crit-max'] = el => { setNow().criteria[el.dataset.ci].subs[el.dataset.si].max = Number(el.value); };
  A.ACT['crit-add'] = () => { const s = setNow(); const pre = s.criteria[0].id.slice(0, 2); s.criteria.push({ id: pre + (s.criteria.length + 1), name: 'Tiêu chí mới', weight: 0, subs: [{ id: pre + (s.criteria.length + 1) + 'a', name: 'Tiêu chí thành phần', max: 10 }] }); A.render(); };
  A.ACT['crit-addsub'] = el => { const c = setNow().criteria[el.dataset.ci]; c.subs.push({ id: c.id + String.fromCharCode(97 + c.subs.length), name: 'Tiêu chí thành phần', max: 10 }); A.render(); };
  A.ACT['crit-del'] = el => { setNow().criteria.splice(Number(el.dataset.ci), 1); A.render(); };
  A.ACT['crit-delsub'] = el => { setNow().criteria[el.dataset.ci].subs.splice(Number(el.dataset.si), 1); A.render(); };
  A.ACT['crit-save'] = () => { const s = setNow(); if (U.sum(s.criteria, c => Number(c.weight)) !== 100) { U.toast('Tổng trọng số phải bằng 100%'); return; } A.save(); U.audit('Cập nhật bộ tiêu chí', s.id); U.toast('Đã lưu bộ tiêu chí ' + s.id); A.render(); };
  A.ACT['crit-copy'] = () => {
    const i = D.PERIODS.findIndex(p => p.id === ui.period); if (i <= 0) { U.toast('Không có kỳ trước để sao chép'); return; }
    const src = A.critSet(ui.group, D.PERIODS[i - 1].id); if (!src) { U.toast('Kỳ trước chưa có bộ tiêu chí'); return; }
    let s = setNow(); if (!s) { s = { id: 'BTC-' + ui.group.toUpperCase() + '-' + ui.period, group: ui.group, period: ui.period, status: 'banhanh' }; A.db.criteriaSets.push(s); }
    s.criteria = JSON.parse(JSON.stringify(src.criteria)); A.save(); U.toast('Đã sao chép bộ tiêu chí từ ' + D.PERIODS[i - 1].name); A.render();
  };
  A.ACT['period-new'] = () => A.modal(A.mHead('Khai báo kỳ đánh giá mới') + `<div class="modal-b"><div class="form-grid"><div class="field"><label>Tên kỳ</label><input class="input" value="Quý IV/2026"></div><div class="field"><label>Mã kỳ</label><input class="input" value="2026-Q4"></div><div class="field"><label>Từ ngày</label><input type="date" class="input" value="2026-10-01"></div><div class="field"><label>Đến ngày</label><input type="date" class="input" value="2026-12-31"></div><div class="field" style="grid-column:1/-1"><label>Bộ tiêu chí</label><select class="input"><option>Sao chép từ kỳ Quý III/2026 cho cả 03 nhóm lớp</option><option>Tạo mới (trống)</option></select></div></div><div class="note info" style="margin-top:10px">Trong bản trình diễn, danh sách kỳ được cố định 04 kỳ để so sánh; thao tác này chỉ minh họa biểu mẫu.</div></div><div class="modal-f"><button class="btn primary" data-act="close">Khai báo</button><button class="btn" data-act="close">Hủy</button></div>`);

  // ---------- Thực hiện chấm điểm ----------
  const scoreRec = (objId, period) => A.db.scores.find(s => s.objId === objId && s.period === period);
  const evalObjs = () => A.db.objs.filter(o => o.evaluated && o.group === sc.group && o.approval === 'daduyet').sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const ensureDraft = (o, set) => {
    const key = o.id + '|' + sc.period;
    if (!sc.draft[key]) { const ex = scoreRec(o.id, sc.period); sc.draft[key] = ex ? JSON.parse(JSON.stringify(ex)) : { id: 'PC-' + o.id + '-' + sc.period, objId: o.id, period: sc.period, values: {}, evidence: 0, by: U.me(), at: U.today(), status: 'nhap', note: '' }; }
    return sc.draft[key];
  };
  A.VIEWS['cham-diem'] = function () {
    const set = A.critSet(sc.group, sc.period);
    const objs = evalObjs();
    const o = sc.objId ? A.idx.obj.get(sc.objId) : null;
    const stats = { done: objs.filter(x => { const r = scoreRec(x.id, sc.period); return r && r.status !== 'nhap'; }).length, draft: objs.filter(x => { const r = scoreRec(x.id, sc.period); return r && r.status === 'nhap'; }).length };
    const list = `<div class="card map-panel"><div class="card-h" style="padding-bottom:6px"><h3>Đối tượng</h3><span class="tag info">${objs.length}</span></div><div class="card-b"><input class="input" style="width:100%;margin-bottom:8px" placeholder="Tìm…" data-in="score-q" value="${U.esc(sc.q || '')}">
      <div class="obj-list">${objs.filter(x => !sc.q || x.name.toLowerCase().includes(sc.q.toLowerCase())).map(x => { const r = scoreRec(x.id, sc.period); const s = r ? A.calcScore(r, set) : null; return `<div class="obj-item ${sc.objId === x.id ? 'on' : ''}" data-act="score-pick" data-id="${x.id}"><div class="t">${D.TYPE_ICO[x.type]} ${U.esc(x.name)}</div><div class="row small" style="justify-content:space-between"><span class="muted">${U.typeName(x.type)}</span>${r ? `<span>${U.dec(s)} ${r.status === 'nhap' ? '<span class="tag">Nháp</span>' : r.status === 'guiduyet' ? '<span class="tag warn">Chờ duyệt</span>' : '<span class="tag ok">Đã duyệt</span>'}</span>` : '<span class="tag">Chưa chấm</span>'}</div></div>`; }).join('')}</div></div></div>`;
    let main;
    if (!set) main = '<div class="card"><div class="empty">Kỳ này chưa có bộ tiêu chí cho nhóm ' + D.GROUPS[sc.group].name + '. Vào <b>Bộ tiêu chí</b> để khai báo.</div></div>';
    else if (!o) main = `<div class="card"><div class="empty"><div style="font-size:36px">📝</div>Chọn một đối tượng bên trái để chấm điểm theo bộ tiêu chí <b>${D.GROUPS[sc.group].name}</b> kỳ <b>${periodName(sc.period)}</b>.<div class="row" style="justify-content:center;margin-top:10px"><span class="tag ok">${stats.done} đã chấm</span><span class="tag">${stats.draft} nháp</span><span class="tag warn">${objs.length - stats.done - stats.draft} chưa chấm</span></div></div></div>`;
    else if (sc.mode === 'mobile') main = mobileScore(o, set);
    else main = desktopScore(o, set);
    return `<div class="row">${groupSeg(sc.group, 'score-group')}<span class="label-sm">Kỳ</span>${periodSel(sc.period, 'score-period')}<div class="spacer"></div><div class="seg"><button class="${sc.mode === 'desktop' ? 'on' : ''}" data-act="score-mode" data-m="desktop">🖥️ Máy tính</button><button class="${sc.mode === 'mobile' ? 'on' : ''}" data-act="score-mode" data-m="mobile">📱 Thực địa (điện thoại)</button></div></div>
      <div class="map-layout no-right" style="height:auto;min-height:0;align-items:start">${list}<div>${main}</div></div>`;
  };
  function desktopScore(o, set) {
    const d = ensureDraft(o, set), total = A.calcScore(d, set);
    const locked = D.PERIODS.find(p => p.id === sc.period).status !== 'mo' || d.status === 'daduyet';
    const prev = D.PERIODS[D.PERIODS.findIndex(p => p.id === sc.period) - 1];
    const ps = prev ? A.scoreOf(o.id, prev.id) : null;
    return `<div class="card"><div class="card-h"><div><h3>${D.TYPE_ICO[o.type]} ${U.esc(o.name)}</h3><div class="small muted">${o.id} · ${U.typeName(o.type)} · ${o.khu} · ${D.UNITS[o.unit]}</div></div><div class="spacer"></div>${d.status === 'daduyet' ? '<span class="tag ok">Đã duyệt</span>' : d.status === 'guiduyet' ? '<span class="tag warn">Chờ duyệt</span>' : '<span class="tag">Nháp</span>'}<button class="btn sm" data-act="open-obj" data-id="${o.id}">Hồ sơ</button></div>
      <div class="card-b">
        <div class="stat-row" style="margin-bottom:6px"><div><div class="l">Điểm tổng hợp (theo trọng số)</div><div class="v">${U.dec(total)} / 100</div>${U.gradeTag(total)}</div><div><div class="l">Kỳ trước (${prev ? prev.name : '—'})</div><div class="v">${ps == null ? '—' : U.dec(ps)}</div>${ps != null ? `<span class="small ${total - ps >= 0 ? 'k-sub up' : 'k-sub down'}">${total - ps >= 0 ? '▲' : '▼'} ${U.dec(Math.abs(total - ps))}</span>` : ''}</div><div><div class="l">Minh chứng</div><div class="v">${d.evidence}</div><span class="small muted">ảnh / tài liệu</span></div><div><div class="l">Người chấm</div><div class="v" style="font-size:14px">${U.staffName(d.by)}</div><span class="small muted">${U.dmy(d.at)}</span></div></div>
        ${set.criteria.map(c => { const max = U.sum(c.subs, s => s.max), got = U.sum(c.subs, s => Number(d.values[s.id]) || 0); return `<div class="crit-head"><span>${c.id}. ${U.esc(c.name)} <span class="muted" style="font-weight:400">· trọng số ${c.weight}%</span></span><span>${got}/${max} → ${U.dec(max ? got / max * c.weight : 0)} điểm</span></div>
          ${c.subs.map(s => `<div class="score-row"><span class="sub-name">${s.id}. ${U.esc(s.name)}</span><span class="row" style="gap:4px;justify-content:flex-end"><input type="number" class="input score-input" data-in="score-v" data-k="${s.id}" value="${d.values[s.id] != null ? d.values[s.id] : ''}" min="0" max="${s.max}" step="0.5" ${locked ? 'disabled' : ''}><span class="small muted">/${s.max}</span></span></div>`).join('')}`; }).join('')}
        <div class="form-grid" style="margin-top:12px"><div class="field"><label>Nhận xét</label><textarea class="input" rows="2" data-in="score-note" ${locked ? 'disabled' : ''}>${U.esc(d.note)}</textarea></div><div class="field"><label>Minh chứng đính kèm</label><div class="row"><div class="photo-strip">${Array.from({ length: Math.min(d.evidence, 3) }, (_, i) => U.photo(o, i + 5)).join('')}${locked ? '' : '<div class="photo add" data-act="score-evidence">＋ Ảnh/tài liệu</div>'}</div></div></div></div>
      </div>
      <div class="modal-f" style="border-top:1px solid var(--line)">${locked ? `<span class="small muted">${d.status === 'daduyet' ? 'Phiếu đã được duyệt' : 'Kỳ đã đóng'} — chỉ xem.</span>` : `<button class="btn" data-act="score-save" data-st="nhap">Lưu nháp</button><button class="btn primary" data-act="score-save" data-st="guiduyet">Gửi duyệt</button>`}${d.status === 'guiduyet' && A.can('duyet', o.group) ? `<button class="btn primary" data-act="score-approve">✓ Duyệt phiếu</button>` : ''}</div></div>`;
  }
  function mobileScore(o, set) {
    const d = ensureDraft(o, set), total = A.calcScore(d, set);
    const p = U.anchor(o);
    return `<div class="phone-wrap"><div class="phone"><div class="screen"><div class="notch"><span>9:41</span><span>📶 🔋</span></div><div class="m-head"><div class="hi">Chấm điểm thực địa · ${periodName(sc.period)}</div><div class="nm">${U.esc(o.name)}</div><div class="gps">📍 GPS: ${U.coordTxt(p)} · cách đối tượng 6 m</div></div>
      <div class="m-body">
        <div class="m-card"><div class="row" style="justify-content:space-between"><b>Điểm tạm tính</b><b style="font-size:18px">${U.dec(total)}</b></div><div class="score-bar" style="margin-top:6px"><div class="bar"><i style="width:${total}%;background:${U.grade(total).color}"></i></div></div></div>
        ${set.criteria.map(c => `<div class="m-card"><b>${c.id}. ${U.esc(c.name)}</b> <span class="muted">(${c.weight}%)</span>${c.subs.map(s => `<div style="margin-top:8px"><div class="small">${U.esc(s.name)}</div><div class="m-score" style="margin-top:4px">${[0, 2, 4, 6, 8, 10].map(v => `<button class="${Number(d.values[s.id]) === v ? 'on' : ''}" data-act="score-tap" data-k="${s.id}" data-v="${v}">${v}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}
        <div class="m-card"><div class="row" style="justify-content:space-between"><span>📷 Minh chứng</span><b>${d.evidence}</b></div><button class="m-btn ghost" style="margin-top:8px" data-act="score-evidence">Chụp ảnh hiện trạng</button></div>
        <button class="m-btn ghost" data-act="score-save" data-st="nhap">Lưu nháp (ngoại tuyến)</button><button class="m-btn" data-act="score-save" data-st="guiduyet">Gửi duyệt</button>
      </div></div></div>
      <div class="card"><div class="card-h"><h3>Tác nghiệp hiện trường</h3></div><div class="card-b small"><ul style="margin:0;padding-left:18px;line-height:1.7"><li>Ứng dụng di động định vị tự động bằng GPS, gợi ý đối tượng gần nhất để chấm.</li><li>Chấm nhanh bằng thang bấm 0–10, chụp ảnh minh chứng ngay tại chỗ, có thể lưu nháp khi mất sóng và đồng bộ sau.</li><li>Phiếu gửi duyệt sẽ xuất hiện ở máy tính của lãnh đạo bộ phận để duyệt.</li></ul><div class="divider"></div><div class="row" style="gap:4px">${U.photos(o, 2)}</div></div></div></div>`;
  }
  A.ACT['score-group'] = el => { sc.group = el.dataset.g; sc.objId = null; A.render(); };
  A.CH['score-period'] = el => { sc.period = el.value; A.render(); };
  A.ACT['score-mode'] = el => { sc.mode = el.dataset.m; A.render(); };
  A.IN['score-q'] = el => { sc.q = el.value; A.render(); };
  A.ACT['score-pick'] = el => { sc.objId = el.dataset.id; A.render(); };
  A.ACT['score-obj'] = el => { const o = A.idx.obj.get(el.dataset.id); sc.group = o.group; sc.objId = o.id; sc.period = ui.period; A.closeModal(); A.go('cham-diem'); };
  const curDraft = () => ensureDraft(A.idx.obj.get(sc.objId), A.critSet(sc.group, sc.period));
  A.IN['score-v'] = el => { const d = curDraft(); const max = Number(el.max); let v = Number(el.value); if (isNaN(v)) return; if (v > max) { v = max; el.value = max; } if (v < 0) { v = 0; el.value = 0; } d.values[el.dataset.k] = v; const total = A.calcScore(d, A.critSet(sc.group, sc.period)); const box = document.querySelector('.stat-row .v'); if (box) box.textContent = U.dec(total) + ' / 100'; };
  A.IN['score-note'] = el => { curDraft().note = el.value; };
  A.ACT['score-tap'] = el => { const d = curDraft(); d.values[el.dataset.k] = Number(el.dataset.v); A.render(); };
  A.ACT['score-evidence'] = () => { curDraft().evidence++; U.toast('Đã đính kèm minh chứng (mô phỏng)'); A.render(); };
  A.ACT['score-save'] = el => {
    const d = curDraft(), set = A.critSet(sc.group, sc.period);
    const missing = set.criteria.flatMap(c => c.subs).filter(s => d.values[s.id] == null || d.values[s.id] === '');
    if (el.dataset.st === 'guiduyet' && missing.length) { U.toast('Còn ' + missing.length + ' tiêu chí thành phần chưa chấm'); return; }
    d.status = el.dataset.st; d.by = U.me(); d.at = U.today();
    const i = A.db.scores.findIndex(s => s.objId === d.objId && s.period === d.period);
    if (i >= 0) A.db.scores[i] = d; else A.db.scores.push(d);
    delete sc.draft[d.objId + '|' + d.period];
    A.save(); U.audit('Chấm điểm đối tượng', d.objId);
    U.toast(el.dataset.st === 'nhap' ? 'Đã lưu nháp phiếu chấm' : 'Đã gửi duyệt phiếu chấm điểm');
    A.render();
  };
  A.ACT['score-approve'] = () => { const d = curDraft(); d.status = 'daduyet'; const i = A.db.scores.findIndex(s => s.objId === d.objId && s.period === d.period); if (i >= 0) A.db.scores[i] = d; delete sc.draft[d.objId + '|' + d.period]; A.save(); U.audit('Duyệt phiếu chấm điểm', d.objId); U.toast('Đã duyệt phiếu chấm'); A.render(); };

  // ---------- Kết quả & xếp hạng ----------
  let RH = null;
  A.VIEWS['ket-qua'] = function () {
    const rank = A.ranking(rs.group, rs.period);
    const scored = rank.filter(x => x.s != null);
    const cmp = rs.compare && rs.compare !== rs.period ? rs.compare : null;
    const avg = U.avg(scored, x => x.s), cavg = cmp ? U.avg(A.ranking(rs.group, cmp).filter(x => x.s != null), x => x.s) : null;
    const dist = D.GRADES.map(g => ({ label: g.label, color: g.color, value: scored.filter(x => U.grade(x.s).id === g.id).length }));
    const trend = D.PERIODS.map(p => { const r = A.ranking(rs.group, p.id).filter(x => x.s != null); return r.length ? Math.round(U.avg(r, x => x.s) * 10) / 10 : null; });
    const byType = A.db.evalTypes[rs.group].map(t => ({ t, v: scored.filter(x => x.o.type === t) })).filter(x => x.v.length);
    A.after = () => {
      RH = M.create('rmap', { zoom: 14 });
      if (!RH) return;
      const objs = rank.map(x => x.o);
      M.draw(RH, objs, { colorFn: o => { const s = A.scoreOf(o.id, rs.period); return s == null ? '#98a3b3' : U.grade(s).color; }, onClick: o => A.openObj(o.id) });
      M.fit(RH, objs);
    };
    return `<div class="row">${groupSeg(rs.group, 'res-group')}<span class="label-sm">Kỳ</span>${periodSel(rs.period, 'res-period')}<span class="label-sm">So với</span><select class="input" data-ch="res-compare"><option value="">— Không —</option>${D.PERIODS.filter(p => p.id !== rs.period).map(p => `<option value="${p.id}" ${cmp === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select><div class="spacer"></div><button class="btn" data-act="res-export">Xuất Excel</button><button class="btn" data-act="res-print">In / PDF</button></div>
      <div class="kpis"><div class="card kpi"><div class="k-label">Đối tượng thuộc diện</div><div class="k-value">${rank.length}</div><div class="k-sub">${scored.length} đã có điểm · ${rank.length - scored.length} chưa chấm</div></div>
        <div class="card kpi"><div class="k-label">Điểm trung bình</div><div class="k-value">${scored.length ? U.dec(avg) : '—'}</div><div class="k-sub ${cavg != null ? (avg >= cavg ? 'up' : 'down') : ''}">${cavg != null ? (avg >= cavg ? '▲' : '▼') + ' ' + U.dec(Math.abs(avg - cavg)) + ' so với ' + periodName(cmp) : ''}</div></div>
        <div class="card kpi"><div class="k-label">Xếp loại Tốt</div><div class="k-value">${dist[0].value}</div><div class="k-sub">${U.pct(dist[0].value, scored.length)}% đối tượng đã chấm</div></div>
        <div class="card kpi"><div class="k-label">Xếp loại Kém</div><div class="k-value" style="color:#df2225">${dist[3].value}</div><div class="k-sub">cần kế hoạch khắc phục</div></div></div>
      <div class="grid g-main">
        <div class="card"><div class="card-h"><h3>Bản đồ tô màu theo mức điểm</h3><span class="small muted">${D.GROUPS[rs.group].name} · ${periodName(rs.period)}</span></div><div class="card-b"><div class="map-box" style="height:380px"><div class="lmap" id="rmap"></div><div class="map-legend">${D.GRADES.map(g => `<span><i style="background:${g.color}"></i>${g.label} (≥ ${g.min})</span>`).join('')}<span><i style="background:#98a3b3"></i>Chưa chấm</span></div></div></div></div>
        <div style="display:flex;flex-direction:column;gap:16px"><div class="card"><div class="card-h"><h3>Phân bố xếp loại</h3></div><div class="card-b">${U.donut(dist, [String(scored.length), 'đã chấm'])}</div></div>
        <div class="card"><div class="card-h"><h3>Xu hướng điểm trung bình</h3></div><div class="card-b">${U.lines(D.PERIODS.map(p => p.name.replace('Quý ', 'Q')), [{ name: D.GROUPS[rs.group].name, color: D.GROUPS[rs.group].color, values: trend }], { min: 40, max: 100, h: 170 })}</div></div></div>
      </div>
      <div class="card"><div class="card-h"><h3>Bảng xếp hạng</h3><span class="small muted">Sắp xếp theo điểm tổng hợp giảm dần</span></div><div class="card-b">
        ${U.table([{ t: 'Hạng' }, { t: 'Đối tượng' }, { t: 'Lớp' }, { t: 'Tổ dân phố' }, { t: 'Điểm', num: true }, { t: 'Xếp loại' }, { t: cmp ? periodName(cmp) : 'Kỳ trước', num: true }, { t: 'Biến động', num: true }, { t: 'Trạng thái phiếu' }],
          rank.map((x, i) => { const prevId = cmp || (D.PERIODS[D.PERIODS.findIndex(p => p.id === rs.period) - 1] || {}).id; const ps = prevId ? A.scoreOf(x.o.id, prevId) : null; const d = x.s != null && ps != null ? x.s - ps : null; return `<tr class="click" data-act="open-obj" data-id="${x.o.id}"><td><span class="rank-no ${i < 3 && x.s != null ? 'top' : ''}">${x.s == null ? '–' : i + 1}</span></td><td><b>${U.esc(x.o.name)}</b><div class="small muted">${x.o.id}</div></td><td class="small">${U.typeName(x.o.type)}</td><td class="small">${x.o.khu}</td><td class="num"><b>${x.s == null ? '—' : U.dec(x.s)}</b></td><td>${x.s == null ? '<span class="tag">Chưa chấm</span>' : U.gradeTag(x.s)}</td><td class="num">${ps == null ? '—' : U.dec(ps)}</td><td class="num" style="color:${d == null ? '' : d >= 0 ? '#167a3c' : '#df2225'}">${d == null ? '—' : (d >= 0 ? '▲ ' : '▼ ') + U.dec(Math.abs(d))}</td><td>${x.sc ? (x.sc.status === 'daduyet' ? '<span class="tag ok">Đã duyệt</span>' : x.sc.status === 'guiduyet' ? '<span class="tag warn">Chờ duyệt</span>' : '<span class="tag">Nháp</span>') : ''}</td></tr>`; }))}
      </div></div>
      <div class="card"><div class="card-h"><h3>Điểm trung bình theo lớp đối tượng</h3></div><div class="card-b">${U.bars(byType.map(x => U.typeName(x.t)), [{ name: periodName(rs.period), color: D.GROUPS[rs.group].color, values: byType.map(x => Math.round(U.avg(x.v, y => y.s) * 10) / 10) }].concat(cmp ? [{ name: periodName(cmp), color: '#b8c4d3', values: byType.map(x => { const r = A.ranking(rs.group, cmp).filter(y => y.s != null && y.o.type === x.t); return r.length ? Math.round(U.avg(r, y => y.s) * 10) / 10 : 0; }) }] : []), { stacked: false, max: 100, h: 200, fmt: v => U.num(v) })}</div></div>`;
  };
  A.ACT['res-group'] = el => { rs.group = el.dataset.g; A.render(); };
  A.CH['res-period'] = el => { rs.period = el.value; A.render(); };
  A.CH['res-compare'] = el => { rs.compare = el.value; A.render(); };
  A.ACT['res-export'] = () => { const rank = A.ranking(rs.group, rs.period); U.csv('xep-hang-' + rs.group + '-' + rs.period, ['Hạng', 'Mã', 'Tên', 'Lớp', 'Tổ dân phố', 'Điểm', 'Xếp loại'].concat(D.PERIODS.map(p => p.name)), rank.map((x, i) => [x.s == null ? '' : i + 1, x.o.id, x.o.name, U.typeName(x.o.type), x.o.khu, x.s == null ? '' : x.s, x.s == null ? 'Chưa chấm' : U.grade(x.s).label].concat(D.PERIODS.map(p => { const v = A.scoreOf(x.o.id, p.id); return v == null ? '' : v; })))); U.audit('Xuất kết quả chấm điểm (Excel)'); };
  A.ACT['res-print'] = () => { U.audit('In kết quả chấm điểm'); window.print(); };
})(window.APP);
