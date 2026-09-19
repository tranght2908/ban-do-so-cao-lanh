/* Quản lý đối tượng: danh sách, biểu mẫu thêm/sửa, hồ sơ chi tiết, nhập liệu hàng loạt, phê duyệt. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui;
  const f = ui.obj, imp = ui.imp;

  const attrKeys = type => { const o = A.db.objs.find(x => x.type === type); return o ? Object.keys(o.attrs) : []; };

  // ---------- danh sách ----------
  const listObjs = () => {
    const q = f.q.trim().toLowerCase();
    return A.db.objs.filter(o => A.can('xem', o.group) && (!f.group || o.group === f.group) && (!f.type || o.type === f.type) && (!f.approval || o.approval === f.approval) && (!f.cond || o.cond === f.cond) && (f.unit === '' || String(o.unit) === f.unit)
      && (!q || o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))).sort((a, b) => b.updated.localeCompare(a.updated));
  };
  // Module theo nhóm lớp: khóa bộ lọc vào một nhóm và bổ sung dải chỉ số, chip lớp dữ liệu
  function groupHead(g) {
    const G = D.GROUPS[g];
    const all = A.db.objs.filter(o => o.group === g);
    const pub = all.filter(o => o.approval === 'daduyet');
    const bad = pub.filter(o => o.cond === 'xuongcap' || o.cond === 'hong');
    const cho = all.filter(o => o.approval === 'choduyet');
    const moi = all.filter(o => U.days(o.updated, U.today()) <= 30);
    const ev = pub.filter(o => o.evaluated);
    const scored = ev.map(o => A.scoreOf(o.id, ui.period)).filter(s => s != null);
    return `<div class="kpis">
      <div class="card kpi"><div class="k-label">Đối tượng lớp ${G.name.toLowerCase()}</div><div class="k-value">${U.num(pub.length)}</div><div class="k-sub">${G.types.length} lớp dữ liệu chuyên đề</div></div>
      <div class="card kpi"><div class="k-label">Xuống cấp / hư hỏng</div><div class="k-value" style="color:#df2225">${bad.length}</div><div class="k-sub">${U.pct(bad.length, pub.length)}% tổng số đối tượng</div></div>
      <div class="card kpi"><div class="k-label">Chờ phê duyệt</div><div class="k-value">${cho.length}</div><div class="k-sub">${moi.length} bản ghi cập nhật trong 30 ngày</div></div>
      <div class="card kpi"><div class="k-label">Điểm đánh giá kỳ ${ui.period}</div><div class="k-value">${scored.length ? U.dec(U.avg(scored)) : '—'}</div><div class="k-sub">${scored.length}/${ev.length} đối tượng đã chấm</div></div></div>
      <div class="row" style="margin-bottom:10px"><div class="seg"><button class="${f.type === '' ? 'on' : ''}" data-act="obj-f-type" data-t="">Tất cả lớp <span class="muted">(${all.length})</span></button>${G.types.map(t => `<button class="${f.type === t.id ? 'on' : ''}" data-act="obj-f-type" data-t="${t.id}">${D.TYPE_ICO[t.id]} ${t.name} <span class="muted">(${all.filter(o => o.type === t.id).length})</span></button>`).join('')}</div></div>`;
  }
  function objListView(g) {
    if (g) { f.group = g; if (f.type && U.groupOfType(f.type) !== g) f.type = ''; }
    const objs = listObjs(), pg = U.pager('objlist', objs.length, 15);
    const types = f.group ? D.GROUPS[f.group].types : Object.keys(D.GROUPS).flatMap(g2 => D.GROUPS[g2].types);
    return (g ? groupHead(g) : '') + `<div class="card"><div class="card-h"><h3>${g ? 'Danh sách đối tượng ' + D.GROUPS[g].name.toLowerCase() : 'Danh sách đối tượng'}</h3><span class="tag info">${objs.length}</span><div class="spacer"></div>
        ${A.can('them', g || undefined) ? `<button class="btn primary" data-act="obj-new" ${g ? 'data-group="' + g + '"' : ''}>＋ Thêm đối tượng</button>` : ''}<button class="btn" data-act="go" data-to="nhap-lieu">📥 Nhập hàng loạt</button><button class="btn" data-act="obj-export">Xuất Excel</button><button class="btn" data-act="obj-export-geo">Xuất GeoJSON</button></div>
      <div class="card-b"><div class="row" style="margin-bottom:10px">
        <input class="input" style="min-width:220px" placeholder="Tìm tên, mã…" data-in="obj-q" value="${U.esc(f.q)}">
        ${g ? '' : `<select class="input" data-ch="obj-f" data-k="group"><option value="">Tất cả nhóm lớp</option>${Object.keys(D.GROUPS).map(g2 => `<option value="${g2}" ${f.group === g2 ? 'selected' : ''}>${D.GROUPS[g2].name}</option>`).join('')}</select>
        <select class="input" data-ch="obj-f" data-k="type"><option value="">Tất cả lớp</option>${types.map(t => `<option value="${t.id}" ${f.type === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select>`}
        <select class="input" data-ch="obj-f" data-k="approval"><option value="">Mọi trạng thái duyệt</option>${Object.keys(D.APPROVAL).map(c => `<option value="${c}" ${f.approval === c ? 'selected' : ''}>${D.APPROVAL[c].label}</option>`).join('')}</select>
        <select class="input" data-ch="obj-f" data-k="cond"><option value="">Mọi hiện trạng</option>${Object.keys(D.COND).map(c => `<option value="${c}" ${f.cond === c ? 'selected' : ''}>${D.COND[c].label}</option>`).join('')}</select>
        <select class="input" data-ch="obj-f" data-k="unit"><option value="">Mọi đơn vị</option>${D.UNITS.map((u, i) => `<option value="${i}" ${f.unit === String(i) ? 'selected' : ''}>${u}</option>`).join('')}</select>
      </div>
      ${U.table([{ t: 'Mã' }, { t: 'Tên đối tượng' }, { t: 'Nhóm / lớp' }, { t: 'Hình học' }, { t: 'Hiện trạng' }, { t: 'Duyệt' }, { t: 'Đơn vị quản lý' }, { t: 'Ảnh', num: true }, { t: 'Cập nhật' }, { t: '' }],
        objs.slice(pg.start, pg.end).map(o => `<tr class="click" data-act="open-obj" data-id="${o.id}"><td class="nowrap">${o.id}</td><td><b>${U.esc(o.name)}</b></td><td class="small">${D.GROUPS[o.group].ico} ${U.typeName(o.type)}</td><td class="small">${U.geomLabel(o.geom.type)}</td><td>${U.condTag(o.cond)}</td><td>${U.apprTag(o.approval)}</td><td class="small">${D.UNITS[o.unit]}</td><td class="num">${o.photos}</td><td class="nowrap small">${U.dmy(o.updated)}</td><td class="nowrap"><button class="btn sm" data-act="obj-locate" data-id="${o.id}" title="Xem trên bản đồ">🗺️</button></td></tr>`))}
      ${pg.html}</div></div>`;
  }
  A.VIEWS['doi-tuong'] = () => objListView(null);
  A.VIEWS['ql-dothi'] = () => objListView('dothi');
  A.VIEWS['ql-nongsan'] = () => objListView('nongsan');
  A.VIEWS['ql-hatang'] = () => objListView('hatang');
  A.IN['obj-q'] = el => { f.q = el.value; ui.page.objlist = 0; A.render(); };
  A.CH['obj-f'] = el => { f[el.dataset.k] = el.value; if (el.dataset.k === 'group') f.type = ''; ui.page.objlist = 0; A.render(); };
  A.ACT['obj-f-type'] = el => { f.type = el.dataset.t; ui.page.objlist = 0; A.render(); };
  A.ACT['obj-export'] = () => { const objs = listObjs(); U.csv('doi-tuong', ['Mã', 'Tên', 'Nhóm', 'Lớp', 'Hình học', 'Hiện trạng', 'Trạng thái duyệt', 'Đơn vị quản lý', 'Tổ dân phố', 'Vĩ độ', 'Kinh độ', 'Cập nhật'].concat(['Thuộc tính (JSON)']), objs.map(o => { const p = U.anchor(o); return [o.id, o.name, D.GROUPS[o.group].name, U.typeName(o.type), U.geomLabel(o.geom.type), D.COND[o.cond].label, D.APPROVAL[o.approval].label, D.UNITS[o.unit], o.khu, p[0], p[1], o.updated, JSON.stringify(o.attrs)]; })); U.audit('Xuất danh sách đối tượng (Excel)'); };
  A.ACT['obj-export-geo'] = () => { U.geojson('doi-tuong-cao-lanh', listObjs()); U.audit('Xuất dữ liệu không gian (GeoJSON)'); };
  A.ACT['obj-locate'] = (el, e) => { e.stopPropagation(); ui.map.sel = el.dataset.id; const o = A.idx.obj.get(el.dataset.id); ui.map.groups[o.group] = true; ui.map.types[o.type] = true; A.go('ban-do'); };
  A.ACT['obj-new'] = el => A.ACT['obj-add-start'](el);

  // ---------- hồ sơ chi tiết ----------
  A.openObj = function (id) {
    const o = A.idx.obj.get(id); if (!o) return;
    const p = U.anchor(o);
    const scores = D.PERIODS.map(pr => ({ pr, s: A.scoreOf(o.id, pr.id) }));
    const incs = A.db.incidents.filter(i => i.objId === o.id).sort((a, b) => b.reported.localeCompare(a.reported));
    A.modal(A.mHead(`${D.TYPE_ICO[o.type]} ${U.esc(o.name)}`) + `<div class="modal-b">
      <div class="row" style="gap:4px;margin-bottom:10px"><span class="tag">${o.id}</span><span class="tag">${D.GROUPS[o.group].name} · ${U.typeName(o.type)}</span>${U.condTag(o.cond)}${U.apprTag(o.approval)}${o.public ? '<span class="tag info">Lớp công khai</span>' : '<span class="tag">Nội bộ</span>'}</div>
      ${o.approval === 'tralai' ? `<div class="note" style="margin-bottom:10px"><b>Bị trả lại:</b> ${U.esc(o.returnReason)}</div>` : ''}
      <div class="grid g2">
        <div><div class="photo-strip">${U.photos(o, 3)}${A.can('sua', o.group) ? `<div class="photo add" data-act="obj-photo" data-id="${o.id}">＋ Ảnh</div>` : ''}</div>
          ${o.docs && o.docs.length ? `<div class="small" style="margin-top:8px">📎 ${o.docs.map(d => `<a href="#" onclick="return false">${U.esc(d)}</a>`).join(', ')}</div>` : ''}</div>
        <div class="attr-grid">
          <div><b>Vị trí (WGS-84)</b>${U.coordTxt(p)}</div><div><b>Hình học</b>${U.geomLabel(o.geom.type)}${o.geom.type === 'line' ? ' · ' + U.fmtLen(U.lineLen(o.geom.coords)) : o.geom.type === 'polygon' ? ' · ' + U.fmtArea(U.area(o.geom.coords)) : ''}</div>
          <div><b>Tổ dân phố</b>${o.khu}</div><div><b>Đơn vị quản lý</b>${D.UNITS[o.unit]}</div>
          <div><b>Người tạo</b>${U.staffName(o.createdBy)} · ${U.dmy(o.created)}</div><div><b>Cập nhật</b>${U.dmy(o.updated)}</div>
        </div>
      </div>
      <div class="divider"></div>
      <h4 style="font-size:13.5px;margin-bottom:6px">Thuộc tính</h4>
      <div class="attr-grid">${Object.keys(o.attrs).map(k => `<div><b>${U.attrLabel(k)}</b>${U.esc(o.attrs[k])}</div>`).join('')}${o.note ? `<div><b>Ghi chú</b>${U.esc(o.note)}</div>` : ''}</div>
      ${o.life ? `<div class="divider"></div><h4 style="font-size:13.5px;margin-bottom:6px">Vòng đời tài sản hạ tầng</h4>
        <div class="attr-grid"><div><b>Năm đưa vào sử dụng</b>${o.life.year} (${U.today().slice(0, 4) - o.life.year} năm)</div><div><b>Kế hoạch bảo trì</b>${o.life.plan ? U.dmy(o.life.plan.at) + ' · ' + o.life.plan.what + ' · dự toán ' + U.money(o.life.plan.est) : 'Chưa lập'}</div></div>
        <div class="grid g2" style="margin-top:8px"><div><div class="small muted" style="margin-bottom:4px">Lịch sử kiểm tra</div><div class="timeline">${o.life.inspections.map(i => `<div><span class="when">${U.dmy(i.at)} · ${U.staffName(i.by)}</span><br>${i.result}</div>`).join('') || '<div class="muted">Chưa có</div>'}</div></div>
        <div><div class="small muted" style="margin-bottom:4px">Lịch sử sửa chữa</div><div class="timeline">${o.life.repairs.map(r => `<div><span class="when">${U.dmy(r.at)}</span><br>${r.what} · ${U.money(r.cost)}</div>`).join('') || '<div class="muted">Chưa có</div>'}</div></div></div>
        ${incs.length ? `<div class="small" style="margin-top:8px"><b>Sự cố liên quan:</b> ${incs.map(i => `<span class="tag" data-act="open-inc" data-id="${i.id}" style="cursor:pointer"><span class="dot" style="background:${D.INC_STATE[i.state].color}"></span>${i.id} ${U.esc(i.title)}</span>`).join(' ')}</div>` : ''}` : ''}
      ${o.evaluated ? `<div class="divider"></div><h4 style="font-size:13.5px;margin-bottom:6px">Kết quả chấm điểm qua các kỳ</h4>
        <div class="row" style="gap:12px;flex-wrap:wrap">${scores.map(x => `<div class="stat-row" style="flex:1"><div><div class="l">${x.pr.name}</div><div class="v">${x.s == null ? '—' : U.dec(x.s)}</div>${x.s == null ? '<span class="small muted">Chưa chấm</span>' : U.gradeTag(x.s)}</div></div>`).join('')}</div>` : ''}
      <div class="divider"></div>
      <h4 style="font-size:13.5px;margin-bottom:6px">Lịch sử chỉnh sửa</h4>
      <div class="timeline">${o.history.slice().sort((a, b) => b.at.localeCompare(a.at)).map(h => `<div><span class="when">${U.dmy(h.at)} · ${U.staffName(h.who)}</span><br>${U.esc(h.what)}</div>`).join('')}</div>
      </div>
      <div class="modal-f">
        ${o.approval === 'choduyet' && A.can('duyet', o.group) ? `<button class="btn primary" data-act="appr-ok" data-id="${o.id}">✓ Phê duyệt</button><button class="btn danger" data-act="appr-return" data-id="${o.id}">Trả lại</button>` : ''}
        ${(o.approval === 'nhap' || o.approval === 'tralai') && A.can('sua', o.group) ? `<button class="btn primary" data-act="obj-submit" data-id="${o.id}">Gửi duyệt</button>` : ''}
        ${A.can('sua', o.group) ? `<button class="btn" data-act="obj-edit" data-id="${o.id}">✏️ Sửa</button>` : ''}
        ${A.can('xoa', o.group) ? `<button class="btn danger" data-act="obj-delete" data-id="${o.id}">Xóa</button>` : ''}
        <button class="btn" data-act="obj-locate" data-id="${o.id}">🗺️ Xem trên bản đồ</button>
        <button class="btn" data-act="close">Đóng</button></div>`, true);
  };
  A.ACT['obj-photo'] = el => { const o = A.idx.obj.get(el.dataset.id); o.photos = (o.photos || 0) + 1; o.history.push({ at: U.today(), who: U.me(), what: 'Đính kèm ảnh hiện trạng (chụp từ thiết bị)' }); A.save(); U.toast('Đã đính kèm ảnh (mô phỏng)'); A.openObj(o.id); };
  A.ACT['obj-submit'] = el => { const o = A.idx.obj.get(el.dataset.id); o.approval = 'choduyet'; o.updated = U.today(); o.history.push({ at: U.today(), who: U.me(), what: 'Gửi duyệt' }); A.save(); U.audit('Gửi duyệt bản ghi', o.id); A.closeModal(); U.toast('Đã gửi duyệt ' + o.id); A.render(); };
  A.ACT['obj-delete'] = el => {
    const o = A.idx.obj.get(el.dataset.id);
    A.modal(A.mHead('Xóa đối tượng') + `<div class="modal-b">Xóa <b>${U.esc(o.name)}</b> (${o.id})? Thao tác được ghi vào nhật ký và có thể khôi phục từ bản lưu vết.</div><div class="modal-f"><button class="btn danger" data-act="obj-delete-ok" data-id="${o.id}">Xóa</button><button class="btn" data-act="close">Hủy</button></div>`);
  };
  A.ACT['obj-delete-ok'] = el => { A.db.objs = A.db.objs.filter(o => o.id !== el.dataset.id); A.db.scores = A.db.scores.filter(s => s.objId !== el.dataset.id); A.reindex(); A.save(); U.audit('Xóa đối tượng', el.dataset.id); A.closeModal(); if (ui.map.sel === el.dataset.id) ui.map.sel = null; U.toast('Đã xóa ' + el.dataset.id); A.render(); };

  // ---------- biểu mẫu thêm / sửa ----------
  let draft = null;
  // Khối nhập tọa độ thủ công: điểm nhập vĩ độ/kinh độ, đường – vùng nhập danh sách đỉnh
  function geomFields(anchor) {
    if (draft.geom.type === 'point') {
      const p = draft.geom.coords;
      return `<div class="field"><label>Vĩ độ (WGS-84) *</label><input class="input" data-in="of-lat" value="${p[0]}" placeholder="10.46720"></div>
        <div class="field"><label>Kinh độ *</label><input class="input" data-in="of-lng" value="${p[1]}" placeholder="105.63030"></div>
        <div class="field" style="grid-column:1/-1"><label>Dán tọa độ (thập phân, độ–phút–giây hoặc liên kết bản đồ)</label>
          <div class="row"><input class="input" style="flex:1" id="of-paste" placeholder="VD: 10.46720, 105.63030"><button class="btn sm" data-act="of-paste-ok">Áp dụng</button></div></div>
        <div class="field" style="grid-column:1/-1"><div class="small muted" id="of-coord-txt">${coordInfo(p)}</div></div>`;
    }
    const verts = draft.geom.coords.map(c => c[0] + ', ' + c[1]).join('\n');
    return `<div class="field" style="grid-column:1/-1"><label>Danh sách đỉnh (mỗi dòng một tọa độ: vĩ độ, kinh độ)</label>
        <textarea class="input" rows="5" id="of-verts" spellcheck="false" placeholder="10.46720, 105.63030&#10;10.46810, 105.63120">${U.esc(verts)}</textarea>
        <div class="row" style="margin-top:6px"><button class="btn sm" data-act="of-verts-ok">Áp dụng danh sách đỉnh</button>${draft.geom.coords.length ? '<button class="btn sm" data-act="of-verts-redraw">🖉 Vẽ lại trên bản đồ</button>' : ''}</div></div>
      <div class="field" style="grid-column:1/-1"><div class="small muted" id="of-coord-txt">${geomInfo()}</div></div>`;
  }
  const coordInfo = p => U.dms(p) + ' · VN-2000 (KTT 105°, múi 3°): ' + U.vnTxt(p);
  const geomInfo = () => {
    const c = draft.geom.coords;
    if (!c.length) return 'Chưa có đỉnh nào — nhập danh sách tọa độ ở trên hoặc vẽ trên bản đồ.';
    return U.geomLabel(draft.geom.type) + ' · ' + c.length + ' đỉnh · ' + (draft.geom.type === 'line' ? U.fmtLen(U.lineLen(c)) : U.fmtArea(U.area(c))) + ' · điểm đầu ' + U.coordTxt(c[0]);
  };
  // Thông số quan sát riêng của camera giám sát
  function camFields() {
    const c = draft.cam || (draft.cam = { code: draft.attrs.maCam || 'CAM-mới', dir: 0, fov: 70, range: 110, online: true, road: draft.attrs.tuyen || '' });
    return `<div class="field"><label>Hướng quan sát (độ, 0 = Bắc)</label><input class="input" type="number" data-in="of-cam" data-k="dir" value="${c.dir}" min="0" max="359"></div>
      <div class="field"><label>Góc mở (độ)</label><input class="input" type="number" data-in="of-cam" data-k="fov" value="${c.fov}" min="20" max="360"></div>
      <div class="field"><label>Tầm quan sát (m)</label><input class="input" type="number" data-in="of-cam" data-k="range" value="${c.range}" min="20" max="500" step="10"></div>
      <div class="field"><label>Tình trạng kết nối</label><select class="input" data-ch="of-cam" data-k="online"><option value="1" ${c.online ? 'selected' : ''}>Trực tuyến</option><option value="0" ${c.online ? '' : 'selected'}>Mất kết nối</option></select></div>`;
  }
  A.objForm = function (o) {
    const isNew = !o.id;
    draft = o.__keep ? o : isNew ? { group: o.group, type: o.type, geom: o.geom, name: '', cond: 'tot', unit: o.group === 'hatang' ? 0 : o.group === 'dothi' ? 0 : 1, khu: D.KHU[0], public: o.group === 'nongsan', attrs: {}, photos: 0, note: '', docs: [] } : JSON.parse(JSON.stringify(o));
    if (isNew && !o.__keep) attrKeys(o.type).forEach(k => { draft.attrs[k] = ''; });
    delete draft.__keep;
    const anchor = draft.geom.type === 'point' ? draft.geom.coords : (draft.geom.coords[0] || D.CENTER);
    const inside = draft.geom.type === 'point' ? U.inBoundary(draft.geom.coords) : draft.geom.coords.every(U.inBoundary);
    A.modal(A.mHead(isNew ? 'Thêm đối tượng: ' + U.typeName(draft.type) : 'Sửa đối tượng ' + draft.id) + `<div class="modal-b">
      <div class="form-grid">
        <div class="field" style="grid-column:1/-1"><label>Tên đối tượng *</label><input class="input" data-in="of" data-k="name" value="${U.esc(draft.name)}"></div>
        <div class="field"><label>Hiện trạng</label><select class="input" data-ch="of" data-k="cond">${Object.keys(D.COND).map(c => `<option value="${c}" ${draft.cond === c ? 'selected' : ''}>${D.COND[c].label}</option>`).join('')}</select></div>
        <div class="field"><label>Đơn vị quản lý</label><select class="input" data-ch="of" data-k="unit">${D.UNITS.map((u, i) => `<option value="${i}" ${Number(draft.unit) === i ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
        <div class="field"><label>Tổ dân phố</label><select class="input" data-ch="of" data-k="khu">${D.KHU.map(k => `<option ${draft.khu === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
        <div class="field"><label>Hiển thị trên lớp công khai</label><select class="input" data-ch="of" data-k="public"><option value="1" ${draft.public ? 'selected' : ''}>Có (sau khi duyệt)</option><option value="0" ${!draft.public ? 'selected' : ''}>Không</option></select></div>
        ${geomFields(anchor)}
        ${draft.type === 'camera' ? camFields() : ''}
        <div style="grid-column:1/-1" id="of-check">${inside ? '<span class="tag ok">✓ Vị trí thuộc ranh giới hành chính phường</span>' : '<span class="tag danger">✗ Vị trí nằm ngoài ranh giới phường</span>'}</div>
      </div>
      <div class="divider"></div>
      <h4 style="font-size:13.5px;margin-bottom:8px">Thuộc tính của lớp ${U.typeName(draft.type)}</h4>
      <div class="form-grid">${Object.keys(draft.attrs).map(k => `<div class="field"><label>${U.attrLabel(k)}</label><input class="input" data-in="of-attr" data-k="${k}" value="${U.esc(draft.attrs[k])}"></div>`).join('')}
        <div class="field" style="grid-column:1/-1"><label>Ghi chú</label><textarea class="input" rows="2" data-in="of" data-k="note">${U.esc(draft.note)}</textarea></div></div>
      <div class="divider"></div>
      <div class="row"><div class="photo-strip">${Array.from({ length: Math.min(draft.photos, 3) }, (_, i) => U.photo(draft.id ? draft : { id: 'new', type: draft.type }, i)).join('')}<div class="photo add" data-act="of-photo">＋ Ảnh</div></div><div class="small muted">Ảnh hiện trạng · tài liệu đính kèm (PDF, DWG…) <button class="btn sm" data-act="of-doc">📎 Đính kèm</button> ${draft.docs.length ? draft.docs.map(U.esc).join(', ') : ''}</div></div>
      </div>
      <div class="modal-f"><button class="btn" data-act="of-save" data-mode="nhap">Lưu nháp</button><button class="btn primary" data-act="of-save" data-mode="choduyet">${isNew ? 'Lưu và gửi duyệt' : 'Lưu thay đổi'}</button><button class="btn" data-act="close">Hủy</button></div>`, true);
  };
  A.ACT['obj-edit'] = el => A.objForm(A.idx.obj.get(el.dataset.id));
  A.IN['of'] = el => { draft[el.dataset.k] = el.value; };
  A.CH['of'] = el => { draft[el.dataset.k] = el.dataset.k === 'public' ? el.value === '1' : el.dataset.k === 'unit' ? Number(el.value) : el.value; };
  A.IN['of-attr'] = el => { draft.attrs[el.dataset.k] = el.value; };
  const recheck = () => {
    const pts = draft.geom.type === 'point' ? [draft.geom.coords] : draft.geom.coords;
    const bad = pts.filter(p => !U.inBoundary(p)).length;
    const el = A.$('#of-check');
    if (el) el.innerHTML = !pts.length ? '<span class="tag warn">Chưa xác định vị trí</span>'
      : bad ? `<span class="tag danger">✗ ${bad} tọa độ nằm ngoài ranh giới phường</span>` : '<span class="tag ok">✓ Vị trí thuộc ranh giới hành chính phường</span>';
    const ci = A.$('#of-coord-txt');
    if (ci) ci.innerHTML = draft.geom.type === 'point' ? coordInfo(draft.geom.coords) : geomInfo();
  };
  A.IN['of-lat'] = el => { const v = Number(el.value); if (!isNaN(v)) { draft.geom.coords[0] = v; recheck(); } };
  A.IN['of-lng'] = el => { const v = Number(el.value); if (!isNaN(v)) { draft.geom.coords[1] = v; recheck(); } };
  A.IN['of-cam'] = el => { draft.cam[el.dataset.k] = Number(el.value) || 0; };
  A.CH['of-cam'] = el => { draft.cam[el.dataset.k] = el.value === '1'; };
  A.ACT['of-paste-ok'] = () => {
    const p = U.parseCoord(A.$('#of-paste').value);
    if (!p) { U.toast('Không đọc được tọa độ — kiểm tra lại định dạng'); return; }
    draft.geom.coords = p.slice();
    const la = document.querySelector('[data-in="of-lat"]'), ln = document.querySelector('[data-in="of-lng"]');
    if (la) la.value = p[0]; if (ln) ln.value = p[1];
    recheck(); U.toast('Đã nhận tọa độ ' + U.coordTxt(p));
  };
  A.ACT['of-verts-ok'] = () => {
    const lines = A.$('#of-verts').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const pts = [], bad = [];
    lines.forEach((s, i) => { const p = U.parseCoord(s); if (p) pts.push(p); else bad.push(i + 1); });
    const min = draft.geom.type === 'line' ? 2 : 3;
    if (pts.length < min) { U.toast('Cần ít nhất ' + min + ' đỉnh hợp lệ cho ' + U.geomLabel(draft.geom.type).toLowerCase()); return; }
    draft.geom.coords = pts;
    recheck();
    U.toast('Đã nhận ' + pts.length + ' đỉnh' + (bad.length ? ' · bỏ qua dòng ' + bad.join(', ') : ''));
  };
  A.ACT['of-verts-redraw'] = () => {
    const g = draft.geom.type;
    A.closeModal();
    if (A.MAP.handles.length) A.MAP.drawGeom(A.MAP.handles[0], g, coords => { draft.geom.coords = coords; draft.__keep = true; A.objForm(draft); });
    else U.toast('Mở màn hình Bản đồ tác nghiệp để vẽ lại hình học');
  };
  A.ACT['of-photo'] = () => { draft.photos = (draft.photos || 0) + 1; U.toast('Đã thêm ảnh hiện trạng (mô phỏng chụp/tải lên)'); };
  A.ACT['of-doc'] = () => { draft.docs.push('Tai-lieu-' + (draft.docs.length + 1) + '.pdf'); U.toast('Đã đính kèm tài liệu (mô phỏng)'); };
  A.ACT['of-save'] = el => {
    if (!draft.name.trim()) { U.toast('Vui lòng nhập tên đối tượng'); return; }
    const pts = draft.geom.type === 'point' ? [draft.geom.coords] : draft.geom.coords;
    const min = draft.geom.type === 'point' ? 1 : draft.geom.type === 'line' ? 2 : 3;
    if (pts.length < min) { U.toast('Chưa đủ tọa độ: cần ít nhất ' + min + ' đỉnh cho ' + U.geomLabel(draft.geom.type).toLowerCase()); return; }
    if (pts.some(p => isNaN(p[0]) || isNaN(p[1]) || Math.abs(p[0]) > 90 || Math.abs(p[1]) > 180)) { U.toast('Tọa độ không hợp lệ'); return; }
    if (draft.type === 'camera' && draft.cam) {
      draft.cam.code = draft.attrs.maCam || draft.cam.code; draft.cam.road = draft.attrs.tuyen || draft.cam.road;
      draft.attrs.huong = U.dirName(draft.cam.dir) + ' (' + draft.cam.dir + '°)'; draft.attrs.gocnhin = draft.cam.fov + '°';
      draft.attrs.tamnhin = draft.cam.range + ' m'; draft.attrs.ketnoi = draft.cam.online ? 'Trực tuyến' : 'Mất kết nối';
    }
    if (!pts.every(U.inBoundary)) { U.toast('Vị trí nằm ngoài ranh giới phường — không thể ghi nhận'); return; }
    const dup = A.db.objs.find(o => o.id !== draft.id && o.type === draft.type && o.name.trim().toLowerCase() === draft.name.trim().toLowerCase());
    if (dup) { U.toast('Trùng lặp với đối tượng ' + dup.id + ' (cùng tên, cùng lớp)'); return; }
    const mode = el.dataset.mode;
    if (!draft.id) {
      draft.id = draft.code = A.nextId(draft.group, draft.type);
      draft.created = draft.updated = U.today(); draft.createdBy = U.me();
      draft.approval = A.can('duyet', draft.group) && mode === 'choduyet' ? 'daduyet' : mode;
      draft.history = [{ at: U.today(), who: U.me(), what: mode === 'nhap' ? 'Tạo mới, lưu nháp' : draft.approval === 'daduyet' ? 'Tạo mới và phê duyệt (người tạo có quyền duyệt)' : 'Tạo mới, gửi duyệt' }];
      if (draft.group === 'hatang') draft.life = { year: Number(draft.attrs.namxaydung) || Number(U.today().slice(0, 4)), inspections: [], repairs: [], plan: null };
      A.db.objs.push(draft);
      U.audit('Thêm đối tượng', draft.id);
    } else {
      const o = A.idx.obj.get(draft.id);
      const changed = ['name', 'cond', 'unit', 'khu', 'public', 'note'].filter(k => String(o[k]) !== String(draft[k])).map(k => ({ name: 'tên', cond: 'hiện trạng', unit: 'đơn vị quản lý', khu: 'tổ dân phố', public: 'công khai', note: 'ghi chú' }[k]));
      if (JSON.stringify(o.attrs) !== JSON.stringify(draft.attrs)) changed.push('thuộc tính');
      if (JSON.stringify(o.geom) !== JSON.stringify(draft.geom)) changed.push('vị trí');
      Object.assign(o, draft, { updated: U.today() });
      if (mode === 'nhap') o.approval = 'nhap'; else if (o.approval === 'daduyet' && !A.can('duyet', o.group)) o.approval = 'choduyet';
      o.history.push({ at: U.today(), who: U.me(), what: 'Sửa ' + (changed.join(', ') || 'thông tin') + (o.approval === 'choduyet' ? ' → chờ duyệt lại' : '') });
      U.audit('Sửa thuộc tính đối tượng', o.id);
    }
    A.reindex(); A.save(); A.closeModal();
    ui.map.sel = draft.id; ui.map.groups[draft.group] = true; ui.map.types[draft.type] = true;
    U.toast((mode === 'nhap' ? 'Đã lưu nháp ' : 'Đã lưu ') + draft.id);
    if (A.current === 'ban-do' && A.updateMap) A.updateMap(false); else A.render();
    draft = null;
  };

  // ---------- nhập liệu hàng loạt ----------
  const IMPORT_COLS = ['ma', 'ten', 'lop', 'vido', 'kinhdo', 'hientrang', 'donvi'];
  const parseCSV = txt => {
    const lines = txt.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
    const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
    const split = l => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
    const head = split(lines[0]).map(h => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z]/g, ''));
    return lines.slice(1).map(l => { const cells = split(l); const r = {}; head.forEach((h, i) => { r[h] = cells[i]; }); return r; });
  };
  const parseGeoJSON = txt => {
    const g = JSON.parse(txt);
    return (g.features || []).map(ft => { const p = ft.properties || {}; const c = ft.geometry && ft.geometry.type === 'Point' ? ft.geometry.coordinates : (ft.geometry && ft.geometry.coordinates && (ft.geometry.type === 'LineString' ? ft.geometry.coordinates[0] : ft.geometry.coordinates[0][0])); return { ma: p.ma || p.id || p.code || '', ten: p.ten || p.name || '', lop: p.lop || p.type || '', vido: c ? c[1] : '', kinhdo: c ? c[0] : '', hientrang: p.hientrang || p.cond || 'tot', donvi: p.donvi || p.unit || '', _geom: ft.geometry }; });
  };
  const validate = rows => {
    const seen = new Set();
    return rows.map((r, i) => {
      const errs = [];
      const t = U.type(r.lop) || Object.keys(D.GROUPS).flatMap(g => D.GROUPS[g].types).find(x => x.name.toLowerCase() === String(r.lop || '').toLowerCase());
      if (!r.ten) errs.push('Thiếu tên');
      if (!t) errs.push('Lớp dữ liệu "' + (r.lop || '') + '" không có trong danh mục');
      const lat = Number(String(r.vido).replace(',', '.')), lng = Number(String(r.kinhdo).replace(',', '.'));
      if (isNaN(lat) || isNaN(lng) || r.vido === '' || r.kinhdo === '') errs.push('Tọa độ sai định dạng');
      else if (Math.abs(lat) > 90 || Math.abs(lng) > 180) errs.push('Tọa độ ngoài phạm vi WGS-84');
      else if (!U.inBoundary([lat, lng])) errs.push('Nằm ngoài ranh giới phường');
      if (r.ma) { if (seen.has(r.ma) || A.idx.obj.get(r.ma)) errs.push('Trùng mã ' + r.ma); seen.add(r.ma); }
      if (r.ten && t && A.db.objs.some(o => o.type === t.id && o.name.toLowerCase() === r.ten.toLowerCase())) errs.push('Trùng tên với đối tượng đã có');
      const cond = D.COND[r.hientrang] ? r.hientrang : Object.keys(D.COND).find(c => D.COND[c].label.toLowerCase() === String(r.hientrang || '').toLowerCase()) || 'tot';
      const unit = isNaN(Number(r.donvi)) ? Math.max(0, D.UNITS.findIndex(u => u.toLowerCase() === String(r.donvi || '').toLowerCase())) : Number(r.donvi) || 0;
      return { n: i + 1, r, t, lat, lng, cond, unit, errs };
    });
  };
  const sampleRows = () => {
    const T = D.CENTER; const rows = [];
    const mk = (ma, ten, lop, dlat, dlng, ht, dv) => rows.push({ ma, ten, lop, vido: (T[0] + dlat).toFixed(5), kinhdo: (T[1] + dlng).toFixed(5), hientrang: ht, donvi: dv });
    mk('', 'Đèn chiếu sáng Hẻm 35 Lê Lợi #01', 'chieusang', 0.0031, 0.0042, 'tot', '4');
    mk('', 'Đèn chiếu sáng Hẻm 35 Lê Lợi #02', 'chieusang', 0.0033, 0.0046, 'tot', '4');
    mk('', 'Đèn chiếu sáng Hẻm 35 Lê Lợi #03', 'chieusang', 0.0035, 0.0050, 'trungbinh', '4');
    mk('', 'Hố ga Hẻm 35 Lê Lợi #01', 'hoga', 0.0032, 0.0043, 'tot', '0');
    mk('', 'Hố ga Hẻm 35 Lê Lợi #02', 'hoga', 0.0036, 0.0051, 'hong', '0');
    mk('', 'Bằng lăng – Công viên Văn Miếu #21', 'cayxanh', -0.0021, 0.0012, 'tot', '0');
    mk('', 'Điểm tập kết rác Hẻm 35 Lê Lợi', 'tapketrac', 0.0030, 0.0040, 'trungbinh', '2');
    mk('', 'Biển quảng cáo Ngã tư Lê Lợi – Lý Thường Kiệt', 'bienqc', 0.0010, 0.0060, 'tot', '2');
    rows.push({ ma: '', ten: 'Đèn chiếu sáng sai tọa độ', lop: 'chieusang', vido: '10,46abc', kinhdo: '105.63', hientrang: 'tot', donvi: '4' });
    mk('', 'Vùng trồng sen ngoài ranh giới', 'vungtrong', 0.0400, 0.0500, 'tot', '1');
    rows.push({ ma: A.db.objs[0].id, ten: 'Bản ghi trùng mã', lop: 'duong', vido: (T[0] + 0.001).toFixed(5), kinhdo: (T[1] + 0.001).toFixed(5), hientrang: 'tot', donvi: '0' });
    mk('', 'Cơ sở sấy xoài Út Lành', 'lopkhongco', 0.0012, -0.0031, 'tot', '1');
    return rows;
  };

  A.VIEWS['nhap-lieu'] = function () {
    const steps = ['Chọn tệp', 'Kiểm tra hợp lệ', 'Ghi nhận'];
    let body = '';
    if (imp.step === 0) {
      body = `<div class="grid g2">
        <div><div class="dropzone" id="dropzone" data-act="imp-pick"><input type="file" id="imp-file" accept=".csv,.txt,.geojson,.json" data-ch="imp-file"><div style="font-size:30px">📥</div><b>Kéo thả tệp vào đây hoặc bấm để chọn</b><div class="small" style="margin-top:4px">Excel/CSV theo biểu mẫu chuẩn · GeoJSON · Shapefile (.zip)</div></div>
          <div class="row" style="margin-top:10px"><button class="btn" data-act="imp-template">⬇ Tải biểu mẫu CSV chuẩn</button><button class="btn primary" data-act="imp-sample">Dùng tệp mẫu (12 dòng, có 4 lỗi)</button></div></div>
        <div class="card" style="box-shadow:none"><div class="card-h"><h3>Biểu mẫu chuẩn</h3></div><div class="card-b small">
          <p style="margin-top:0">Mỗi dòng là một đối tượng dạng điểm. Các cột bắt buộc:</p>
          ${U.table([{ t: 'Cột' }, { t: 'Ý nghĩa' }], [['ma', 'Mã đối tượng (để trống để hệ thống tự cấp)'], ['ten', 'Tên đối tượng'], ['lop', 'Mã lớp dữ liệu: ' + Object.keys(D.GROUPS).flatMap(g => D.GROUPS[g].types.map(t => t.id)).join(', ')], ['vido, kinhdo', 'Tọa độ WGS-84 (hệ thống quy đổi VN-2000 khi lưu)'], ['hientrang', 'tot / kha / trungbinh / xuongcap / hong'], ['donvi', 'Số thứ tự đơn vị quản lý (0–' + (D.UNITS.length - 1) + ')']].map(r => `<tr><td><code>${r[0]}</code></td><td>${r[1]}</td></tr>`))}
          <p>Đối tượng dạng đường/vùng nhập bằng GeoJSON hoặc Shapefile. Hệ thống kiểm tra từng dòng: định dạng tọa độ, trùng mã/tên, thuộc ranh giới phường, lớp có trong danh mục — chỉ dòng hợp lệ mới được ghi nhận, ở trạng thái <b>Chờ duyệt</b>.</p>
          </div></div></div>`;
    } else if (imp.step === 1) {
      const ok = imp.rows.filter(r => !r.errs.length), bad = imp.rows.filter(r => r.errs.length);
      body = `<div class="stat-row" style="margin-bottom:12px"><div><div class="v">${imp.rows.length}</div><div class="l">Dòng trong tệp ${U.esc(imp.file)}</div></div><div><div class="v" style="color:#167a3c">${ok.length}</div><div class="l">Hợp lệ</div></div><div><div class="v" style="color:#df2225">${bad.length}</div><div class="l">Có lỗi (bỏ qua khi ghi nhận)</div></div></div>
        ${U.table([{ t: '#' }, { t: 'Mã' }, { t: 'Tên' }, { t: 'Lớp' }, { t: 'Vĩ độ' }, { t: 'Kinh độ' }, { t: 'Hiện trạng' }, { t: 'Kết quả kiểm tra' }],
          imp.rows.map(x => `<tr class="${x.errs.length ? 'row-err' : 'row-ok'}"><td>${x.n}</td><td class="small">${U.esc(x.r.ma || '(tự cấp)')}</td><td>${U.esc(x.r.ten)}</td><td class="small">${x.t ? x.t.name : '<span style="color:#df2225">' + U.esc(x.r.lop) + '</span>'}</td><td class="small">${U.esc(x.r.vido)}</td><td class="small">${U.esc(x.r.kinhdo)}</td><td class="small">${D.COND[x.cond].label}</td><td>${x.errs.length ? x.errs.map(e => `<span class="tag danger">${e}</span>`).join(' ') : '<span class="tag ok">✓ Hợp lệ</span>'}</td></tr>`))}
        <div class="row" style="margin-top:12px"><button class="btn" data-act="imp-back">‹ Chọn tệp khác</button><div class="spacer"></div>${bad.length ? '<button class="btn" data-act="imp-export-err">Tải danh sách lỗi</button>' : ''}<button class="btn primary" data-act="imp-commit" ${ok.length ? '' : 'disabled'}>Ghi nhận ${ok.length} dòng hợp lệ</button></div>`;
    } else {
      body = `<div class="empty"><div style="font-size:40px">✅</div><h3>Đã ghi nhận ${imp.done} đối tượng ở trạng thái Chờ duyệt</h3><p class="muted">Lãnh đạo bộ phận sẽ thấy các bản ghi này trong mục Phê duyệt dữ liệu. Nhật ký nhập liệu đã được lưu.</p><div class="row" style="justify-content:center"><button class="btn" data-act="imp-back">Nhập tệp khác</button><button class="btn primary" data-act="go" data-to="phe-duyet">Đến Phê duyệt</button><button class="btn" data-act="go" data-to="ban-do">Xem trên bản đồ</button></div></div>`;
    }
    return `<div class="card"><div class="card-h"><h3>Nhập liệu hàng loạt</h3><div class="spacer"></div><div class="step-bar">${steps.map((s, i) => `<span class="${i === imp.step ? 'on' : i < imp.step ? 'done' : ''}">${i + 1}. ${s}</span>`).join('')}</div></div><div class="card-b">${body}</div></div>
      <div class="card"><div class="card-h"><h3>Lịch sử nhập liệu</h3></div><div class="card-b">${U.table([{ t: 'Thời điểm' }, { t: 'Tệp' }, { t: 'Người nhập' }, { t: 'Dòng', num: true }, { t: 'Hợp lệ', num: true }, { t: 'Lỗi', num: true }], A.db.importLog.map(l => `<tr><td class="nowrap">${l.at}</td><td>${U.esc(l.file)}</td><td>${U.staffName(l.who)}</td><td class="num">${l.total}</td><td class="num">${l.ok}</td><td class="num">${l.bad}</td></tr>`), { empty: 'Chưa có lượt nhập liệu nào trong phiên này' })}</div></div>`;
  };
  A.ACT['imp-pick'] = (el, e) => { if (e.target.tagName !== 'INPUT') A.$('#imp-file').click(); };
  A.CH['imp-file'] = el => {
    const file = el.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { try { const rows = /json$/i.test(file.name) ? parseGeoJSON(rd.result) : parseCSV(rd.result); imp.rows = validate(rows); imp.file = file.name; imp.step = 1; A.render(); } catch (err) { U.toast('Không đọc được tệp: ' + err.message); } };
    rd.readAsText(file, 'utf-8');
  };
  A.ACT['imp-sample'] = () => { imp.rows = validate(sampleRows()); imp.file = 'mau-nhap-lieu.csv'; imp.step = 1; A.render(); };
  A.ACT['imp-template'] = () => { U.csv('bieu-mau-nhap-doi-tuong', IMPORT_COLS, [['', 'Đèn chiếu sáng Hẻm 35 Lê Lợi #01', 'chieusang', '10.4672', '105.6303', 'tot', '4']]); };
  A.ACT['imp-back'] = () => { imp.step = 0; imp.rows = null; A.render(); };
  A.ACT['imp-export-err'] = () => U.csv('dong-loi-nhap-lieu', ['Dòng', 'Tên', 'Lỗi'], imp.rows.filter(r => r.errs.length).map(r => [r.n, r.r.ten, r.errs.join('; ')]));
  A.ACT['imp-commit'] = () => {
    const ok = imp.rows.filter(r => !r.errs.length);
    ok.forEach(x => {
      const group = U.groupOfType(x.t.id);
      const attrs = {}; attrKeys(x.t.id).forEach(k => { attrs[k] = ''; });
      const geom = x.r._geom && x.r._geom.type === 'LineString' ? { type: 'line', coords: x.r._geom.coordinates.map(c => [c[1], c[0]]) } : x.r._geom && x.r._geom.type === 'Polygon' ? { type: 'polygon', coords: x.r._geom.coordinates[0].slice(0, -1).map(c => [c[1], c[0]]) } : { type: 'point', coords: [x.lat, x.lng] };
      const o = { id: x.r.ma || A.nextId(group, x.t.id), group, type: x.t.id, name: x.r.ten, geom, cond: x.cond, unit: x.unit, khu: D.KHU[Math.floor(Math.random() * 12)], approval: 'choduyet', public: group === 'nongsan', photos: 0, docs: [], attrs, updated: U.today(), created: U.today(), createdBy: U.me(), history: [{ at: U.today(), who: U.me(), what: 'Nhập từ tệp ' + imp.file }], note: '' };
      o.code = o.id;
      if (group === 'hatang') o.life = { year: Number(U.today().slice(0, 4)), inspections: [], repairs: [], plan: null };
      A.db.objs.push(o);
    });
    A.db.importLog.unshift({ at: U.today() + ' ' + U.nowTime(), file: imp.file, who: U.me(), total: imp.rows.length, ok: ok.length, bad: imp.rows.length - ok.length });
    A.reindex(); A.save(); U.audit('Nhập liệu hàng loạt (' + imp.file + ')');
    imp.done = ok.length; imp.step = 2; A.render();
  };

  // ---------- phê duyệt ----------
  A.VIEWS['phe-duyet'] = function () {
    const canAppr = A.can('duyet');
    const queue = A.db.objs.filter(o => o.approval === 'choduyet' && A.can('xem', o.group)).sort((a, b) => a.updated.localeCompare(b.updated));
    const recent = A.db.objs.filter(o => (o.approval === 'tralai' || o.approval === 'daduyet') && o.history.some(h => /duyệt|trả lại/i.test(h.what) && U.days(h.at, U.today()) <= 14)).sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 10);
    const mine = A.db.objs.filter(o => o.createdBy === U.me() && (o.approval === 'nhap' || o.approval === 'tralai'));
    return `<div class="kpis"><div class="card kpi"><div class="k-label">Chờ duyệt</div><div class="k-value">${queue.length}</div><div class="k-sub">${queue.filter(o => U.days(o.updated, U.today()) > 2).length} bản ghi chờ quá 2 ngày</div></div>
      ${Object.keys(D.GROUPS).map(g => `<div class="card kpi"><div class="k-label">${D.GROUPS[g].ico} ${D.GROUPS[g].name}</div><div class="k-value">${queue.filter(o => o.group === g).length}</div><div class="k-sub">chờ duyệt</div></div>`).join('')}</div>
      <div class="card"><div class="card-h"><h3>Hàng đợi phê duyệt</h3><span class="small muted">Bản ghi mới/sửa ở trạng thái chờ duyệt; chỉ dữ liệu đã duyệt mới hiển thị trên lớp công khai</span></div><div class="card-b">
        ${U.table([{ t: 'Mã' }, { t: 'Tên đối tượng' }, { t: 'Nhóm / lớp' }, { t: 'Hiện trạng' }, { t: 'Người gửi' }, { t: 'Gửi lúc' }, { t: 'Ảnh', num: true }, { t: 'Kiểm tra tự động' }, { t: '' }],
          queue.map(o => { const inside = (o.geom.type === 'point' ? [o.geom.coords] : o.geom.coords).every(U.inBoundary); return `<tr><td class="nowrap">${o.id}</td><td><a href="#" data-act="open-obj" data-id="${o.id}" onclick="return false"><b>${U.esc(o.name)}</b></a></td><td class="small">${D.GROUPS[o.group].ico} ${U.typeName(o.type)}</td><td>${U.condTag(o.cond)}</td><td class="small">${U.staffName(o.createdBy)}</td><td class="small nowrap">${U.dmy(o.updated)}</td><td class="num">${o.photos}</td><td>${inside ? '<span class="tag ok">Trong ranh giới</span>' : '<span class="tag danger">Ngoài ranh giới</span>'} ${o.photos ? '' : '<span class="tag warn">Thiếu ảnh</span>'}</td><td class="nowrap">${canAppr && A.can('duyet', o.group) ? `<button class="btn sm primary" data-act="appr-ok" data-id="${o.id}">✓ Duyệt</button> <button class="btn sm danger" data-act="appr-return" data-id="${o.id}">Trả lại</button>` : '<span class="small muted">Chờ lãnh đạo bộ phận</span>'}</td></tr>`; }), { empty: 'Không còn bản ghi chờ duyệt' })}
        ${canAppr && queue.length > 1 ? `<div class="row" style="margin-top:10px"><button class="btn" data-act="appr-all">Duyệt tất cả bản ghi đạt kiểm tra tự động</button></div>` : ''}
      </div></div>
      <div class="grid g2">
        <div class="card"><div class="card-h"><h3>Đã xử lý gần đây</h3></div><div class="card-b">${U.table([{ t: 'Mã' }, { t: 'Tên' }, { t: 'Kết quả' }, { t: 'Ngày' }], recent.map(o => { const h = o.history.slice().reverse().find(x => /duyệt|trả lại/i.test(x.what)); return `<tr class="click" data-act="open-obj" data-id="${o.id}"><td class="nowrap">${o.id}</td><td>${U.esc(o.name)}</td><td>${U.apprTag(o.approval)}</td><td class="small nowrap">${h ? U.dmy(h.at) : ''}</td></tr>`; }))}</div></div>
        <div class="card"><div class="card-h"><h3>Bản ghi của tôi cần hoàn thiện</h3></div><div class="card-b">${U.table([{ t: 'Mã' }, { t: 'Tên' }, { t: 'Trạng thái' }, { t: 'Lý do' }], mine.map(o => `<tr class="click" data-act="open-obj" data-id="${o.id}"><td class="nowrap">${o.id}</td><td>${U.esc(o.name)}</td><td>${U.apprTag(o.approval)}</td><td class="small">${U.esc(o.returnReason || (o.approval === 'nhap' ? 'Chưa gửi duyệt' : ''))}</td></tr>`), { empty: 'Không có' })}</div></div>
      </div>`;
  };
  const approve = o => { o.approval = 'daduyet'; o.updated = U.today(); delete o.returnReason; o.history.push({ at: U.today(), who: U.me(), what: 'Phê duyệt bản ghi → hiển thị trên bản đồ' + (o.public ? ' và lớp công khai' : '') }); U.audit('Phê duyệt bản ghi', o.id); };
  A.ACT['appr-ok'] = el => { approve(A.idx.obj.get(el.dataset.id)); A.save(); A.closeModal(); U.toast('Đã phê duyệt ' + el.dataset.id); A.render(); };
  A.ACT['appr-all'] = () => { let n = 0; A.db.objs.filter(o => o.approval === 'choduyet' && A.can('duyet', o.group) && o.photos && (o.geom.type === 'point' ? [o.geom.coords] : o.geom.coords).every(U.inBoundary)).forEach(o => { approve(o); n++; }); A.save(); U.toast('Đã phê duyệt ' + n + ' bản ghi'); A.render(); };
  A.ACT['appr-return'] = el => {
    const o = A.idx.obj.get(el.dataset.id);
    A.modal(A.mHead('Trả lại bản ghi ' + o.id) + `<div class="modal-b"><div class="field"><label>Lý do trả lại *</label><textarea class="input" rows="3" id="ret-reason" placeholder="VD: thiếu ảnh hiện trạng, tọa độ chưa chính xác…"></textarea></div><div class="small muted" style="margin-top:8px">Người gửi (${U.staffName(o.createdBy)}) sẽ nhận thông báo và thấy lý do trong hồ sơ.</div></div><div class="modal-f"><button class="btn danger" data-act="appr-return-ok" data-id="${o.id}">Trả lại</button><button class="btn" data-act="close">Hủy</button></div>`);
  };
  A.ACT['appr-return-ok'] = el => { const r = A.$('#ret-reason').value.trim(); if (!r) { U.toast('Vui lòng nhập lý do'); return; } const o = A.idx.obj.get(el.dataset.id); o.approval = 'tralai'; o.returnReason = r; o.updated = U.today(); o.history.push({ at: U.today(), who: U.me(), what: 'Trả lại: ' + r }); A.save(); U.audit('Trả lại bản ghi', o.id); A.closeModal(); U.toast('Đã trả lại ' + o.id); A.render(); };
})(window.APP);
