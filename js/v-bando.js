/* Bản đồ tác nghiệp: nền bản đồ, lớp dữ liệu, tìm kiếm – lọc, đo đạc, thêm đối tượng trên bản đồ. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui, M = A.MAP;
  const m = ui.map;
  let H = null, spatial = null; // spatial: {center, r} hoặc null

  const typeOn = t => m.types[t] !== false;
  const visibleObjs = () => {
    const q = m.q.trim().toLowerCase();
    return A.db.objs.filter(o => {
      if (o.approval === 'nhap' && o.createdBy !== U.me()) return false;
      if (!m.groups[o.group] || !typeOn(o.type)) return false;
      if (!A.can('xem', o.group)) return false;
      if (q && !(o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))) return false;
      if (m.cond && o.cond !== m.cond) return false;
      if (m.unit !== '' && String(o.unit) !== m.unit) return false;
      if (m.approval && o.approval !== m.approval) return false;
      if (m.from && o.updated < m.from) return false;
      if (m.to && o.updated > m.to) return false;
      if (m.area) { const a = D.AREAS.find(x => x.id === m.area); if (a && !D.inPoly(U.anchor(o), a.poly)) return false; }
      if (m.camOnly && o.type === 'camera' && (m.camOnly === 'on') !== !!o.cam.online) return false;
      if (spatial) { const pts = o.geom.type === 'point' ? [o.geom.coords] : o.geom.coords; if (!pts.some(p => U.dist(p, spatial.center) <= spatial.r)) return false; }
      return true;
    });
  };
  const colorFn = o => {
    if (m.colorBy === 'cond') return D.COND[o.cond].color;
    if (m.colorBy === 'score') { const s = A.scoreOf(o.id, ui.period); return s == null ? '#98a3b3' : U.grade(s).color; }
    if (m.colorBy === 'approval') return { daduyet: '#20a04e', choduyet: '#e0a526', tralai: '#df2225', nhap: '#98a3b3' }[o.approval];
    return U.color(o);
  };

  // ---------- panel trái ----------
  function leftPanel() {
    const all = A.db.objs;
    return `<div class="card-h" style="padding-bottom:6px"><h3>Lớp dữ liệu</h3></div><div class="card-b">
      <input class="input" style="width:100%" placeholder="Tìm theo tên, mã đối tượng…" data-in="map-q" value="${U.esc(m.q)}">
      <div class="row" style="margin-top:8px"><span class="label-sm">Nền</span><div class="basemap-seg"><button class="${m.base === 'street' ? 'on' : ''}" data-act="map-base" data-b="street">🗺️ Đường phố</button><button class="${m.base === 'sat' ? 'on' : ''}" data-act="map-base" data-b="sat">🛰️ Vệ tinh</button></div></div>
      <div class="row small" style="margin:8px 0 10px"><label class="row" style="gap:4px"><input type="checkbox" data-ch="map-boundary" ${m.boundary ? 'checked' : ''}> Ranh giới phường</label><label class="row" style="gap:4px"><input type="checkbox" data-ch="map-areas" ${m.areas ? 'checked' : ''}> Khu vực</label></div>
      ${Object.keys(D.GROUPS).map(g => { const G = D.GROUPS[g]; return `<div class="layer-group"><label><input type="checkbox" data-ch="map-group" data-g="${g}" ${m.groups[g] ? 'checked' : ''}><span class="sw" style="background:${G.color}"></span>${G.ico} ${G.name}<span class="cnt" style="margin-left:auto;font-weight:400;color:var(--muted);font-size:11.5px">${all.filter(o => o.group === g && o.approval !== 'nhap').length}</span></label>
        <div class="sub" ${m.groups[g] ? '' : 'style="display:none"'}>${G.types.map(t => `<label><input type="checkbox" data-ch="map-type" data-t="${t.id}" ${typeOn(t.id) ? 'checked' : ''}><span class="sw" style="background:${D.TYPE_COLOR[t.id]}"></span>${t.name}<span class="cnt">${all.filter(o => o.type === t.id && o.approval !== 'nhap').length}</span></label>`).join('')}</div></div>`; }).join('')}
      <div class="divider"></div>
      ${camPanel()}
      <div class="divider"></div>
      <div class="field"><label>Tô màu theo</label><select class="input" data-ch="map-colorby"><option value="type" ${m.colorBy === 'type' ? 'selected' : ''}>Loại đối tượng</option><option value="cond" ${m.colorBy === 'cond' ? 'selected' : ''}>Hiện trạng</option><option value="score" ${m.colorBy === 'score' ? 'selected' : ''}>Mức điểm kỳ ${ui.period}</option><option value="approval" ${m.colorBy === 'approval' ? 'selected' : ''}>Trạng thái duyệt</option></select></div>
      <div class="divider"></div>
      <div style="font-weight:600;font-size:13px;margin-bottom:6px">Bộ lọc</div>
      <div class="field"><label>Hiện trạng</label><select class="input" data-ch="map-f" data-k="cond"><option value="">Tất cả</option>${Object.keys(D.COND).map(c => `<option value="${c}" ${m.cond === c ? 'selected' : ''}>${D.COND[c].label}</option>`).join('')}</select></div>
      <div class="field" style="margin-top:6px"><label>Đơn vị quản lý</label><select class="input" data-ch="map-f" data-k="unit"><option value="">Tất cả</option>${D.UNITS.map((u, i) => `<option value="${i}" ${m.unit === String(i) ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      <div class="field" style="margin-top:6px"><label>Trạng thái duyệt</label><select class="input" data-ch="map-f" data-k="approval"><option value="">Tất cả</option>${Object.keys(D.APPROVAL).map(c => `<option value="${c}" ${m.approval === c ? 'selected' : ''}>${D.APPROVAL[c].label}</option>`).join('')}</select></div>
      <div class="form-grid" style="margin-top:6px;gap:6px"><div class="field"><label>Cập nhật từ</label><input type="date" class="input" data-ch="map-f" data-k="from" value="${m.from}"></div><div class="field"><label>đến</label><input type="date" class="input" data-ch="map-f" data-k="to" value="${m.to}"></div></div>
      <div class="divider"></div>
      <div style="font-weight:600;font-size:13px;margin-bottom:6px">Tìm kiếm không gian</div>
      <div class="field"><label>Theo khu vực</label><select class="input" data-ch="map-f" data-k="area"><option value="">— Không giới hạn —</option>${D.AREAS.map(a => `<option value="${a.id}" ${m.area === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select></div>
      <div class="row" style="margin-top:6px"><input type="number" class="input" style="width:90px" data-in="map-radius" value="${m.radius}" min="50" step="50"><span class="small">m</span><button class="btn sm ${m.tool === 'radius' ? 'primary' : ''}" data-act="map-tool" data-t="radius">◎ Theo bán kính</button></div>
      ${spatial ? `<div class="note info small" style="margin-top:8px">Đang lọc trong bán kính ${spatial.r} m quanh ${U.coordTxt(spatial.center)} <button class="btn sm" data-act="map-clear-spatial" style="margin-left:6px">Bỏ</button></div>` : ''}
      <div class="row" style="margin-top:10px"><button class="btn sm" data-act="map-reset-f">Xóa bộ lọc</button></div>
    </div>`;
  }

  // Khối camera giám sát tuyến đường trong panel trái
  function camPanel() {
    const cams = A.db.objs.filter(o => o.type === 'camera');
    const on = cams.filter(o => o.cam.online).length;
    return `<div style="font-weight:600;font-size:13px;margin-bottom:6px">📹 Camera giám sát tuyến đường</div>
      <div class="row small" style="gap:6px;flex-wrap:wrap"><span class="tag ok">${on} trực tuyến</span><span class="tag danger">${cams.length - on} mất kết nối</span></div>
      <label class="row small" style="gap:4px;margin-top:6px"><input type="checkbox" data-ch="map-cones" ${m.cones ? 'checked' : ''}> Hiện vùng quan sát (hình quạt)</label>
      <div class="field" style="margin-top:6px"><label>Lọc camera</label><select class="input" data-ch="map-f" data-k="camOnly"><option value="">Tất cả camera</option><option value="on" ${m.camOnly === 'on' ? 'selected' : ''}>Chỉ camera trực tuyến</option><option value="off" ${m.camOnly === 'off' ? 'selected' : ''}>Chỉ camera mất kết nối</option></select></div>
      <div class="row" style="margin-top:6px"><button class="btn sm" data-act="cam-only-layer">Chỉ xem lớp camera</button><button class="btn sm" data-act="cam-wall">🖥️ Tường camera</button></div>`;
  }

  // ---------- panel phải ----------
  function rightPanel(objs) {
    const sel = m.sel ? A.idx.obj.get(m.sel) : null;
    if (sel) return objDetailCard(sel);
    const key = 'maplist';
    const pg = U.pager(key, objs.length, 12);
    return `<div class="card-h" style="padding-bottom:6px"><h3>Kết quả</h3><span class="tag info">${objs.length} đối tượng</span></div><div class="card-b">
      ${objs.length ? '' : '<div class="empty">Không có đối tượng phù hợp bộ lọc</div>'}
      <div class="obj-list">${objs.slice(pg.start, pg.end).map(o => `<div class="obj-item" data-act="map-sel" data-id="${o.id}"><div class="row" style="justify-content:space-between;gap:4px"><span class="t">${D.TYPE_ICO[o.type]} ${U.esc(o.name)}</span></div><div class="small muted">${o.id} · ${U.typeName(o.type)}</div><div class="row" style="margin-top:4px;gap:4px">${U.condTag(o.cond)}${o.approval !== 'daduyet' ? U.apprTag(o.approval) : ''}</div></div>`).join('')}</div>
      ${pg.html}
      <div class="divider"></div>
      <div class="row"><button class="btn sm" data-act="map-export-csv">Xuất Excel</button><button class="btn sm" data-act="map-export-geo">Xuất GeoJSON</button><button class="btn sm" data-act="map-print">In bản đồ</button></div>
    </div>`;
  }
  function objDetailCard(o) {
    const s = A.scoreOf(o.id, ui.period);
    const p = U.anchor(o);
    return `<div class="card-h" style="padding-bottom:6px"><button class="btn sm" data-act="map-sel" data-id="">‹ Danh sách</button><div class="spacer"></div><button class="btn sm" data-act="map-focus">🎯 Phóng tới</button></div><div class="card-b">
      <div style="font-weight:700;font-size:15px">${D.TYPE_ICO[o.type]} ${U.esc(o.name)}</div>
      <div class="small muted">${o.id} · ${D.GROUPS[o.group].name} · ${U.typeName(o.type)}</div>
      <div class="row" style="margin:8px 0;gap:4px">${U.condTag(o.cond)}${U.apprTag(o.approval)}${o.public ? '<span class="tag info">Công khai</span>' : ''}</div>
      ${o.cam ? camPreview(o) : `<div class="photo-strip" style="margin-bottom:10px">${U.photos(o, 3) || '<span class="small muted">Chưa có ảnh hiện trạng</span>'}</div>`}
      <div class="attr-grid">
        <div><b>Vị trí (WGS-84)</b>${U.coordTxt(p)}</div><div><b>Dạng hình học</b>${U.geomLabel(o.geom.type)}${o.geom.type === 'line' ? ' · ' + U.fmtLen(U.lineLen(o.geom.coords)) : o.geom.type === 'polygon' ? ' · ' + U.fmtArea(U.area(o.geom.coords)) : ''}</div>
        <div><b>Tổ dân phố</b>${o.khu}</div><div><b>Đơn vị quản lý</b>${D.UNITS[o.unit]}</div>
        ${Object.keys(o.attrs).slice(0, 6).map(k => `<div><b>${U.attrLabel(k)}</b>${U.esc(o.attrs[k])}</div>`).join('')}
        <div><b>Cập nhật</b>${U.dmy(o.updated)} · ${U.staffName(o.createdBy)}</div>
        ${o.evaluated ? `<div><b>Điểm kỳ ${ui.period}</b>${s == null ? 'Chưa chấm' : U.dec(s) + ' ' + U.gradeTag(s)}</div>` : ''}
      </div>
      ${o.approval === 'tralai' ? `<div class="note" style="margin-top:8px"><b>Lý do trả lại:</b> ${U.esc(o.returnReason)}</div>` : ''}
      <div class="divider"></div>
      <div class="row"><button class="btn primary sm" data-act="open-obj" data-id="${o.id}">Hồ sơ đầy đủ</button>${A.can('sua', o.group) ? `<button class="btn sm" data-act="obj-edit" data-id="${o.id}">✏️ Sửa</button>` : ''}${o.group === 'hatang' ? `<button class="btn sm" data-act="inc-new" data-obj="${o.id}">🛠️ Báo sự cố</button>` : ''}${o.evaluated && A.can('sua', o.group) ? `<button class="btn sm" data-act="score-obj" data-id="${o.id}">📝 Chấm điểm</button>` : ''}</div>
    </div>`;
  }

  // ---------- camera ----------
  // Khung xem luồng camera (mô phỏng: không có luồng video thật trong prototype)
  A.camView = function (o, big) {
    const c = o.cam;
    return `<div class="cam-view ${big ? 'big' : ''} ${c.online ? '' : 'off'}">
      <div class="cam-scene"><span class="cam-road">${U.esc(c.road)}</span></div>
      <div class="cam-osd tl">${c.code} · ${U.esc(o.attrs.dophangiai)}</div>
      <div class="cam-osd tr">${c.online ? '<span class="rec"></span>TRỰC TIẾP' : 'MẤT TÍN HIỆU'}</div>
      <div class="cam-osd bl">${U.dmy(U.today())} ${U.nowTime()}</div>
      <div class="cam-osd br">Hướng ${U.dirName(c.dir)} · ${c.fov}° · ${c.range} m</div>
      ${c.online ? '' : '<div class="cam-lost">Không có tín hiệu từ thiết bị<br><span>Kiểm tra đường truyền / nguồn điện</span></div>'}
    </div>`;
  };
  function camPreview(o) {
    return `<div style="margin-bottom:10px">${A.camView(o)}
      <div class="row" style="margin-top:6px;gap:4px"><button class="btn sm primary" data-act="cam-live" data-id="${o.id}">▶ Xem luồng camera</button><button class="btn sm" data-act="cam-snap" data-id="${o.id}">📸 Chụp ảnh</button><button class="btn sm" data-act="cam-dir" data-id="${o.id}">🧭 Hiệu chỉnh hướng</button></div>
      <div class="small muted" style="margin-top:4px">Luồng video là mô phỏng trong prototype; khi triển khai sẽ nhúng luồng RTSP/HLS từ hệ thống camera của phường.</div></div>`;
  }
  A.ACT['cam-live'] = el => {
    const o = A.idx.obj.get(el.dataset.id), c = o.cam, p = o.geom.coords;
    A.modal(A.mHead('📹 ' + U.esc(o.name)) + `<div class="modal-b">
      ${A.camView(o, true)}
      <div class="row" style="margin-top:8px;gap:4px;flex-wrap:wrap">
        <button class="btn sm" data-act="cam-ptz" data-d="trái">◀</button><button class="btn sm" data-act="cam-ptz" data-d="lên">▲</button><button class="btn sm" data-act="cam-ptz" data-d="xuống">▼</button><button class="btn sm" data-act="cam-ptz" data-d="phải">▶</button>
        <button class="btn sm" data-act="cam-ptz" data-d="phóng to">＋</button><button class="btn sm" data-act="cam-ptz" data-d="thu nhỏ">－</button>
        <div class="spacer"></div><button class="btn sm" data-act="cam-snap" data-id="${o.id}">📸 Chụp ảnh</button><button class="btn sm" data-act="cam-play" data-id="${o.id}">⏱️ Xem lại</button>
      </div>
      <div class="divider"></div>
      <div class="attr-grid">
        <div><b>Mã thiết bị</b>${c.code}</div><div><b>Tuyến quản lý</b>${U.esc(c.road)}</div>
        <div><b>Vị trí (WGS-84)</b>${U.coordTxt(p)}</div><div><b>VN-2000 (KTT 105°, múi 3°)</b>${U.vnTxt(p)}</div>
        <div><b>Hướng quan sát</b>${U.dirName(c.dir)} · ${c.dir}°</div><div><b>Góc / tầm quan sát</b>${c.fov}° · ${c.range} m</div>
        ${['loaicam', 'dophangiai', 'truyendan', 'luutru', 'ketnoi', 'ngaylap', 'chucnang', 'diachiip'].map(k => `<div><b>${U.attrLabel(k)}</b>${U.esc(o.attrs[k])}</div>`).join('')}
        <div><b>Đơn vị quản lý</b>${D.UNITS[o.unit]}</div><div><b>Hiện trạng thiết bị</b>${D.COND[o.cond].label}</div>
      </div>
      <div class="note info small" style="margin-top:10px">Vùng quan sát hình quạt trên bản đồ được tính từ hướng, góc mở và tầm quan sát của camera — dùng để rà soát điểm mù trên tuyến.</div>
      </div><div class="modal-f"><button class="btn primary" data-act="open-obj" data-id="${o.id}">Hồ sơ đầy đủ</button><button class="btn" data-act="inc-new" data-obj="${o.id}">🛠️ Báo sự cố camera</button><button class="btn" data-act="close">Đóng</button></div>`, true);
  };
  A.ACT['cam-ptz'] = el => U.toast('Điều khiển camera: ' + el.dataset.d + ' (mô phỏng)');
  A.ACT['cam-snap'] = el => { const o = A.idx.obj.get(el.dataset.id); o.photos = (o.photos || 0) + 1; A.save(); U.audit('Chụp ảnh từ camera', o.id); U.toast('Đã lưu ảnh chụp từ ' + o.cam.code + ' vào hồ sơ (mô phỏng)'); };
  A.ACT['cam-play'] = el => U.toast('Mở dữ liệu ghi hình ' + A.idx.obj.get(el.dataset.id).attrs.luutru + ' gần nhất (mô phỏng)');
  A.ACT['cam-dir'] = el => {
    const o = A.idx.obj.get(el.dataset.id), c = o.cam;
    A.modal(A.mHead('Hiệu chỉnh hướng quan sát – ' + c.code) + `<div class="modal-b"><div class="form-grid">
      <div class="field"><label>Hướng quan sát (độ, 0 = Bắc)</label><input class="input" type="number" id="cam-dir" value="${c.dir}" min="0" max="359"></div>
      <div class="field"><label>Góc mở (độ)</label><input class="input" type="number" id="cam-fov" value="${c.fov}" min="20" max="360"></div>
      <div class="field"><label>Tầm quan sát (m)</label><input class="input" type="number" id="cam-range" value="${c.range}" min="20" max="500" step="10"></div>
      <div class="field"><label>Tình trạng kết nối</label><select class="input" id="cam-on"><option value="1" ${c.online ? 'selected' : ''}>Trực tuyến</option><option value="0" ${c.online ? '' : 'selected'}>Mất kết nối</option></select></div>
      </div><div class="note small" style="margin-top:8px">Sau khi lưu, vùng quan sát hình quạt trên bản đồ được vẽ lại theo thông số mới.</div>
      </div><div class="modal-f"><button class="btn primary" data-act="cam-dir-ok" data-id="${o.id}">Lưu</button><button class="btn" data-act="close">Hủy</button></div>`);
  };
  A.ACT['cam-dir-ok'] = el => {
    const o = A.idx.obj.get(el.dataset.id);
    o.cam.dir = ((Number(A.$('#cam-dir').value) || 0) % 360 + 360) % 360;
    o.cam.fov = Math.min(360, Math.max(20, Number(A.$('#cam-fov').value) || o.cam.fov));
    o.cam.range = Math.min(500, Math.max(20, Number(A.$('#cam-range').value) || o.cam.range));
    o.cam.online = A.$('#cam-on').value === '1';
    o.attrs.huong = U.dirName(o.cam.dir) + ' (' + o.cam.dir + '°)'; o.attrs.gocnhin = o.cam.fov + '°'; o.attrs.tamnhin = o.cam.range + ' m';
    o.attrs.ketnoi = o.cam.online ? 'Trực tuyến' : 'Mất kết nối';
    o.updated = U.today(); o.history.push({ at: U.today(), who: U.me(), what: 'Hiệu chỉnh hướng, góc và tầm quan sát camera' });
    A.save(); U.audit('Hiệu chỉnh camera', o.id); A.closeModal(); U.toast('Đã cập nhật vùng quan sát ' + o.cam.code); update(false);
  };
  A.ACT['cam-only-layer'] = () => {
    Object.keys(m.groups).forEach(g => { m.groups[g] = g === 'hatang'; });
    Object.keys(D.GROUPS).forEach(g => D.GROUPS[g].types.forEach(t => { m.types[t.id] = t.id === 'camera'; }));
    ui.page.maplist = 0; update(true);
  };
  A.ACT['cam-wall'] = () => {
    const cams = A.db.objs.filter(o => o.type === 'camera' && (!m.camOnly || (m.camOnly === 'on') === !!o.cam.online)).slice(0, 12);
    A.modal(A.mHead('Tường camera tuyến đường (' + cams.length + ' luồng)') + `<div class="modal-b">
      <div class="cam-wall">${cams.map(o => `<div class="cam-cell" data-act="cam-live" data-id="${o.id}">${A.camView(o)}<div class="small" style="margin-top:4px"><b>${U.esc(o.name)}</b><br><span class="muted">${o.cam.code} · ${U.esc(o.cam.road)}</span></div></div>`).join('')}</div>
      <div class="note small" style="margin-top:10px">Bấm vào một ô để mở luồng camera và xem thông số thiết bị. Hình ảnh là mô phỏng.</div>
      </div><div class="modal-f"><button class="btn" data-act="close">Đóng</button></div>`, true);
  };

  function legend() {
    if (m.colorBy === 'cond') return Object.keys(D.COND).map(c => `<span><i style="background:${D.COND[c].color}"></i>${D.COND[c].label}</span>`).join('');
    if (m.colorBy === 'score') return D.GRADES.map(g => `<span><i style="background:${g.color}"></i>${g.label} (≥ ${g.min})</span>`).join('') + '<span><i style="background:#98a3b3"></i>Chưa chấm / không đánh giá</span>';
    if (m.colorBy === 'approval') return Object.keys(D.APPROVAL).map(c => `<span><i style="background:${{ daduyet: '#20a04e', choduyet: '#e0a526', tralai: '#df2225', nhap: '#98a3b3' }[c]}"></i>${D.APPROVAL[c].label}</span>`).join('');
    return Object.keys(D.GROUPS).filter(g => m.groups[g]).map(g => `<span><i style="background:${D.GROUPS[g].color}"></i><b>${D.GROUPS[g].name}</b></span>` + D.GROUPS[g].types.filter(t => typeOn(t.id)).map(t => `<span style="padding-left:8px"><i style="background:${D.TYPE_COLOR[t.id]}"></i>${t.name}</span>`).join('')).join('');
  }

  A.VIEWS['ban-do'] = function () {
    A.after = mount;
    const canAdd = A.can('them');
    return `<div class="map-layout">
      <div class="card map-panel" id="lpanel"></div>
      <div class="map-box"><div class="lmap" id="lmap"></div>
        <div class="map-tools">
          <button data-act="map-tool" data-t="dist" title="Đo khoảng cách">📏</button>
          <button data-act="map-tool" data-t="area" title="Đo diện tích">⬠</button>
          <button data-act="map-tool" data-t="radius" title="Tìm theo bán kính">◎</button>
          <button data-act="map-tool" data-t="pin" title="Ghim tọa độ trên bản đồ (hoặc bấm chuột phải)">📌</button>
          <button data-act="map-goto" title="Nhập / đi tới tọa độ" style="width:auto;padding:0 10px;font-size:12.5px">🔢 Tọa độ</button>
          <button data-act="map-fit" title="Thu toàn bộ đối tượng">⛶</button>
          ${canAdd ? '<button data-act="obj-add-start" title="Thêm đối tượng trên bản đồ" style="width:auto;padding:0 10px;font-size:13px;font-weight:600">＋ Thêm đối tượng</button>' : ''}
          <button data-act="map-print" title="In bản đồ khu vực">🖨️</button>
        </div>
        <div class="map-hint" id="map-hint" style="display:none"></div>
        <div class="map-coord" id="map-coord">Di chuột để xem tọa độ</div>
        <div class="map-legend" id="map-legend"></div>
      </div>
      <div class="card map-panel" id="rpanel"></div>
    </div>`;
  };

  function mount() {
    H = M.create('lmap', { base: m.base });
    if (!H) return;
    H.onToolChange = st => {
      const hint = A.$('#map-hint');
      const btns = document.querySelectorAll('.map-tools button[data-t]');
      btns.forEach(b => b.classList.toggle('on', !!st && !st.done && ((st.kind === 'radius' && b.dataset.t === 'radius') || (st.kind === b.dataset.t))));
      if (!st) { hint.style.display = 'none'; m.tool = null; return; }
      hint.style.display = '';
      hint.innerHTML = (st.done ? (st.kind === 'radius' ? 'Đã lọc theo bán kính.' : 'Đã đo xong.') : st.hint) + ' <button data-act="map-tool-stop">' + (st.done ? 'Xóa' : 'Hủy') + '</button>';
    };
    M.coordBox(H, A.$('#map-coord'));
    H.onPinHtml = pinHtml;
    H.map.on('contextmenu', e => { L.DomEvent.stop(e); M.dropPin(H, [e.latlng.lat, e.latlng.lng], { pan: false }); });
    H.map.on('click', () => { if (!H.toolState && m.sel) { m.sel = null; update(false); } });
    update(true);
  }

  // ---------- bảng thông tin của ghim tọa độ (kiểu Google Maps) ----------
  function pinHtml(p) {
    const inside = U.inBoundary(p);
    const near = U.nearest(p, 3);
    const area = D.AREAS.find(a => D.inPoly(p, a.poly));
    return `<div class="coord-card">
      <div class="coord-h">📌 Tọa độ đã ghim</div>
      <div class="coord-v">${U.coordTxt(p)}</div>
      <div class="coord-sub">${U.dms(p)}</div>
      <div class="coord-sub">VN-2000 (KTT 105°, múi 3°): ${U.vnTxt(p)}</div>
      <div class="coord-sub">${inside ? '✓ Thuộc ranh giới phường Cao Lãnh' : '✗ Nằm ngoài ranh giới phường'}${area ? ' · ' + U.esc(area.name) : ''}</div>
      ${near.length ? `<div class="coord-near"><b>Gần đây:</b>${near.map(n => `<div data-act="pin-open" data-id="${n.o.id}">${D.TYPE_ICO[n.o.type]} ${U.esc(n.o.name)} <span class="muted">· ${U.fmtLen(n.d)}</span></div>`).join('')}</div>` : ''}
      <div class="coord-acts">
        <button class="btn sm primary" data-act="pin-add">＋ Thêm đối tượng tại đây</button>
        <button class="btn sm" data-act="pin-radius">◎ Tìm quanh ${m.radius} m</button>
        <button class="btn sm" data-act="pin-copy">⧉ Sao chép tọa độ</button>
        <button class="btn sm" data-act="pin-clear">Xóa ghim</button>
      </div>
      <div class="coord-note">Kéo ghim để chỉnh vị trí · tọa độ cập nhật theo thời gian thực</div>
    </div>`;
  }
  A.ACT['pin-open'] = el => { A.closeModal(); m.sel = el.dataset.id; update(false); if (H) M.focus(H, A.idx.obj.get(el.dataset.id)); };
  A.ACT['pin-copy'] = () => { if (!H || !H.pinAt) return; const t = U.coordTxt(H.pinAt); try { navigator.clipboard.writeText(t); } catch (e) { /* bỏ qua */ } U.toast('Đã sao chép tọa độ ' + t); };
  A.ACT['pin-clear'] = () => { if (H) M.clearPin(H); };
  A.ACT['pin-radius'] = () => { if (!H || !H.pinAt) return; spatial = { center: H.pinAt.slice(), r: m.radius }; H.tool.clearLayers(); L.circle(H.pinAt, { radius: m.radius, color: '#7c54cd', weight: 2, fillOpacity: .1 }).addTo(H.tool); ui.page.maplist = 0; update(false); };
  A.ACT['pin-add'] = () => { if (H && H.pinAt) A.ACT['obj-add-start'](null, null, H.pinAt.slice()); };

  // ---------- nhập / đi tới tọa độ ----------
  A.ACT['map-goto'] = () => {
    A.modal(A.mHead('Nhập tọa độ') + `<div class="modal-b">
      <div class="field"><label>Dán hoặc nhập tọa độ</label><input class="input" id="goto-txt" placeholder="VD: 10.46720, 105.63030 · 10°28'01.9&quot;B 105°37'49.1&quot;Đ · liên kết Google Maps" autofocus></div>
      <div class="small muted" style="margin-top:6px">Nhận các dạng: thập phân (vĩ độ, kinh độ), độ–phút–giây, hoặc liên kết bản đồ có dạng <code>@10.4672,105.6303</code>.</div>
      <div class="divider"></div>
      <div class="small"><b>Tọa độ tham chiếu nhanh:</b></div>
      <div class="row" style="gap:4px;flex-wrap:wrap;margin-top:6px">${[['Trung tâm phường', D.CENTER]].concat(D.AREAS.map(a => [a.name, [(a.poly[0][0] + a.poly[2][0]) / 2, (a.poly[0][1] + a.poly[1][1]) / 2]])).map(x => `<button class="btn sm" data-act="goto-quick" data-p="${x[1][0].toFixed(5)},${x[1][1].toFixed(5)}">${U.esc(x[0])}</button>`).join('')}</div>
      </div><div class="modal-f"><button class="btn primary" data-act="goto-ok">Đi tới &amp; ghim</button><button class="btn" data-act="close">Hủy</button></div>`);
    setTimeout(() => { const el = A.$('#goto-txt'); if (el) el.focus(); }, 30);
  };
  A.ACT['goto-quick'] = el => { const p = el.dataset.p.split(',').map(Number); A.closeModal(); if (H) M.dropPin(H, p, { zoom: 15 }); };
  A.ACT['goto-ok'] = () => {
    const p = U.parseCoord(A.$('#goto-txt').value);
    if (!p) { U.toast('Không đọc được tọa độ — kiểm tra lại định dạng'); return; }
    A.closeModal();
    if (H) M.dropPin(H, p, { zoom: 17 });
    U.toast(U.inBoundary(p) ? 'Đã ghim ' + U.coordTxt(p) : 'Đã ghim ' + U.coordTxt(p) + ' — nằm ngoài ranh giới phường');
  };
  function update(fit) {
    if (!H) return;
    const objs = visibleObjs();
    A.$('#lpanel').innerHTML = leftPanel();
    A.$('#rpanel').innerHTML = rightPanel(objs);
    A.$('#map-legend').innerHTML = legend() + (m.cones && m.groups.hatang && typeOn('camera')
      ? '<span><i style="background:#0e7490;opacity:.45"></i>Vùng quan sát camera</span><span><i style="background:#df2225;opacity:.45"></i>Camera mất kết nối</span>' : '');
    M.setBase(H, m.base);
    if (H.boundaryLayer) { if (m.boundary) H.boundaryLayer.addTo(H.map); else H.map.removeLayer(H.boundaryLayer); }
    M.areas(H, m.areas);
    M.draw(H, objs, { colorFn, sel: m.sel, cones: m.cones, onClick: o => { m.sel = o.id; update(false); } });
    if (fit) M.fit(H, objs);
    // đánh dấu nav badge có thể đổi
  }
  A.updateMap = update;

  // ---------- hành động ----------
  A.IN['map-q'] = el => { m.q = el.value; ui.page.maplist = 0; update(false); };
  A.IN['map-radius'] = el => { m.radius = Number(el.value) || 300; };
  A.ACT['map-base'] = el => { m.base = el.dataset.b; update(false); };
  A.CH['map-boundary'] = el => { m.boundary = el.checked; update(false); };
  A.CH['map-areas'] = el => { m.areas = el.checked; update(false); };
  A.CH['map-group'] = el => { m.groups[el.dataset.g] = el.checked; ui.page.maplist = 0; update(false); U.audit('Bật/tắt lớp dữ liệu', D.GROUPS[el.dataset.g].name); };
  A.CH['map-type'] = el => { m.types[el.dataset.t] = el.checked; ui.page.maplist = 0; update(false); };
  A.CH['map-colorby'] = el => { m.colorBy = el.value; update(false); };
  A.CH['map-cones'] = el => { m.cones = el.checked; update(false); };
  A.CH['map-f'] = el => { m[el.dataset.k] = el.value; ui.page.maplist = 0; update(false); };
  A.ACT['map-reset-f'] = () => { Object.assign(m, { q: '', cond: '', unit: '', approval: '', from: '', to: '', area: '' }); spatial = null; if (H) M.stopTool(H); update(false); };
  A.ACT['map-clear-spatial'] = () => { spatial = null; if (H) M.stopTool(H); update(false); };
  A.ACT['map-tool'] = el => {
    if (!H) return;
    const t = el.dataset.t;
    if (H.toolState && H.toolState.kind === t && !H.toolState.done) { M.stopTool(H); return; }
    if (t === 'radius') M.radius(H, m.radius, (c, r) => { spatial = { center: c, r }; ui.page.maplist = 0; update(false); });
    else if (t === 'pin') M.pinMode(H);
    else M.measure(H, t);
  };
  A.ACT['map-tool-stop'] = () => { if (H) { const wasRadius = H.toolState && H.toolState.kind === 'radius'; M.stopTool(H); if (wasRadius) { spatial = null; update(false); } } };
  A.ACT['map-fit'] = () => { if (H) M.fit(H, visibleObjs()); };
  A.ACT['map-sel'] = el => { m.sel = el.dataset.id || null; update(false); if (m.sel && H) M.focus(H, A.idx.obj.get(m.sel)); };
  A.ACT['map-focus'] = () => { if (H && m.sel) M.focus(H, A.idx.obj.get(m.sel)); };
  A.ACT['map-print'] = () => { U.audit('In bản đồ khu vực'); M.print('Bản đồ chuyên đề phường Cao Lãnh'); };
  A.ACT['map-export-csv'] = () => { const objs = visibleObjs(); U.csv('danh-sach-doi-tuong', ['Mã', 'Tên', 'Nhóm', 'Lớp', 'Hiện trạng', 'Trạng thái duyệt', 'Đơn vị quản lý', 'Tổ dân phố', 'Vĩ độ', 'Kinh độ', 'Cập nhật'], objs.map(o => { const p = U.anchor(o); return [o.id, o.name, D.GROUPS[o.group].name, U.typeName(o.type), D.COND[o.cond].label, D.APPROVAL[o.approval].label, D.UNITS[o.unit], o.khu, p[0], p[1], o.updated]; })); U.audit('Xuất danh sách đối tượng (Excel)'); };
  A.ACT['map-export-geo'] = () => { U.geojson('lop-du-lieu-cao-lanh', visibleObjs()); U.audit('Xuất dữ liệu không gian (GeoJSON)'); };

  // Thêm đối tượng: chọn loại → vẽ trên bản đồ → biểu mẫu
  let addAt = null; // tọa độ đặt sẵn khi thêm đối tượng từ ghim
  A.ACT['obj-add-start'] = (el, e, at) => {
    addAt = at || null;
    const groups = Object.keys(D.GROUPS).filter(g => A.can('them', g));
    A.modal(A.mHead('Thêm đối tượng' + (addAt ? ' tại ' + U.coordTxt(addAt) : ' trên bản đồ')) + `<div class="modal-b">
      <p class="muted small" style="margin-top:0">${addAt ? 'Vị trí lấy theo ghim tọa độ; với lớp dạng đường/vùng, hệ thống sẽ mở công cụ vẽ.' : 'Chọn lớp dữ liệu, sau đó bấm trực tiếp lên bản đồ để xác định vị trí (điểm) hoặc vẽ đường/vùng.'} Có thể nhập tọa độ thủ công trong biểu mẫu ở bước sau.</p>
      <div class="row small" style="margin-bottom:8px;gap:10px"><label class="row" style="gap:4px"><input type="radio" name="addmode" value="draw" data-ch="add-mode" ${addAt ? '' : 'checked'}> Bấm / vẽ trên bản đồ</label><label class="row" style="gap:4px"><input type="radio" name="addmode" value="coord" data-ch="add-mode" ${addAt ? 'checked' : ''}> Nhập tọa độ thủ công</label></div>
      ${groups.map(g => `<div class="layer-group"><label>${D.GROUPS[g].ico} ${D.GROUPS[g].name}</label><div class="sub">${D.GROUPS[g].types.map(t => `<label data-act="obj-add-type" data-t="${t.id}" style="cursor:pointer"><span class="sw" style="background:${D.TYPE_COLOR[t.id]}"></span>${t.name}<span class="cnt">${U.geomLabel(t.geom)}</span></label>`).join('')}</div></div>`).join('')}
      </div>`);
  };
  let addMode = 'draw';
  A.CH['add-mode'] = el => { addMode = el.value; };
  A.ACT['obj-add-type'] = el => {
    const t = U.type(el.dataset.t);
    const g = U.groupOfType(t.id);
    const mode = addAt ? 'coord' : addMode;
    A.closeModal();
    if (mode === 'coord' || !H) {
      const c = addAt || (H && H.pinAt) || D.CENTER;
      A.objForm({ group: g, type: t.id, geom: { type: t.geom, coords: t.geom === 'point' ? c.slice() : [] }, manual: true });
      addAt = null; addMode = 'draw';
      return;
    }
    M.drawGeom(H, t.geom, coords => {
      A.objForm({ group: g, type: t.id, geom: { type: t.geom, coords: t.geom === 'point' ? coords[0] : coords } });
    });
  };
})(window.APP);
