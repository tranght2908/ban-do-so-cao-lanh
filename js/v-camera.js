/* Module quản lý camera giám sát tuyến đường: thiết bị, vùng quan sát, tường camera, độ phủ theo tuyến, sự cố. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui, M = A.MAP;
  const c = ui.cam;
  let H = null;

  const cams = () => A.db.objs.filter(o => o.type === 'camera' && o.cam);
  const roadsOf = () => A.db.objs.filter(o => (o.type === 'duong' || o.type === 'phovanminh') && o.approval === 'daduyet');
  const camList = () => {
    const q = c.q.trim().toLowerCase();
    return cams().filter(o => (!c.road || o.cam.road === c.road) && (!c.kind || o.attrs.loaicam === c.kind)
      && (!c.conn || (c.conn === 'on') === !!o.cam.online) && (c.unit === '' || String(o.unit) === c.unit)
      && (!q || o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.cam.code.toLowerCase().includes(q)))
      .sort((a, b) => a.cam.code.localeCompare(b.cam.code));
  };
  const camIncidents = () => A.db.incidents.filter(i => i.type === 'camera');

  // ---------- dải chỉ số + bộ lọc dùng chung cho các thẻ ----------
  function head() {
    const all = cams(), on = all.filter(o => o.cam.online);
    const roads = roadsOf();
    const covered = roads.filter(r => all.some(o => o.cam.road === r.name));
    const openInc = camIncidents().filter(i => i.state !== 'hoanthanh');
    const kinds = Array.from(new Set(all.map(o => o.attrs.loaicam)));
    const roadNames = Array.from(new Set(all.map(o => o.cam.road))).sort((a, b) => a.localeCompare(b, 'vi'));
    return `<div class="kpis">
      <div class="card kpi"><div class="k-label">Camera đang quản lý</div><div class="k-value">${all.length}</div><div class="k-sub">${kinds.length} loại thiết bị · ${roadNames.length} tuyến</div></div>
      <div class="card kpi"><div class="k-label">Trực tuyến</div><div class="k-value" style="color:#20a04e">${on.length}</div><div class="k-sub">${U.pct(on.length, all.length)}% thiết bị kết nối</div></div>
      <div class="card kpi"><div class="k-label">Mất kết nối</div><div class="k-value" style="color:#df2225">${all.length - on.length}</div><div class="k-sub">${openInc.length} sự cố camera đang mở</div></div>
      <div class="card kpi"><div class="k-label">Độ phủ tuyến đường</div><div class="k-value">${covered.length}/${roads.length}</div><div class="k-sub">${U.pct(covered.length, roads.length)}% tuyến chính đã có camera</div></div></div>
      <div class="row" style="margin-bottom:10px">
        <input class="input" style="min-width:210px" placeholder="Tìm mã thiết bị, tên camera…" data-in="cam-q" value="${U.esc(c.q)}">
        <select class="input" data-ch="cam-f" data-k="road"><option value="">Tất cả tuyến</option>${roadNames.map(r => `<option value="${U.esc(r)}" ${c.road === r ? 'selected' : ''}>${U.esc(r)}</option>`).join('')}</select>
        <select class="input" data-ch="cam-f" data-k="kind"><option value="">Mọi loại camera</option>${kinds.map(k => `<option value="${U.esc(k)}" ${c.kind === k ? 'selected' : ''}>${U.esc(k)}</option>`).join('')}</select>
        <select class="input" data-ch="cam-f" data-k="conn"><option value="">Mọi trạng thái kết nối</option><option value="on" ${c.conn === 'on' ? 'selected' : ''}>Trực tuyến</option><option value="off" ${c.conn === 'off' ? 'selected' : ''}>Mất kết nối</option></select>
        <select class="input" data-ch="cam-f" data-k="unit"><option value="">Mọi đơn vị quản lý</option>${D.UNITS.map((u, i) => `<option value="${i}" ${c.unit === String(i) ? 'selected' : ''}>${u}</option>`).join('')}</select>
        <div class="spacer"></div><button class="btn sm" data-act="cam-reset-f">Xóa lọc</button></div>`;
  }

  A.VIEWS['ql-camera'] = function () {
    const tabs = [['ds', '📋 Danh sách thiết bị'], ['bando', '🗺️ Bản đồ & vùng quan sát'], ['wall', '🖥️ Tường camera'], ['tuyen', '📏 Độ phủ theo tuyến'], ['suco', '🛠️ Sự cố & bảo trì']];
    return `<div class="seg" style="align-self:flex-start">${tabs.map(t => `<button class="${c.tab === t[0] ? 'on' : ''}" data-act="cam-tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>`
      + head() + ({ ds: tabList, bando: tabMap, wall: tabWall, tuyen: tabRoads, suco: tabInc }[c.tab] || tabList)();
  };
  A.ACT['cam-tab'] = el => { c.tab = el.dataset.t; A.render(); };
  A.IN['cam-q'] = el => { c.q = el.value; ui.page.camlist = 0; A.render(); };
  A.CH['cam-f'] = el => { c[el.dataset.k] = el.value; ui.page.camlist = 0; A.render(); };
  A.ACT['cam-reset-f'] = () => { Object.assign(c, { q: '', road: '', kind: '', conn: '', unit: '' }); ui.page.camlist = 0; A.render(); };

  // ---------- Danh sách thiết bị ----------
  function tabList() {
    const list = camList(), pg = U.pager('camlist', list.length, 14);
    return `<div class="card"><div class="card-h"><h3>Sổ thiết bị camera</h3><span class="tag info">${list.length}</span><div class="spacer"></div>
      ${A.can('them', 'hatang') ? '<button class="btn primary" data-act="obj-new" data-group="hatang">＋ Thêm camera</button>' : ''}<button class="btn" data-act="cam-export">Xuất Excel</button><button class="btn" data-act="cam-export-geo">Xuất GeoJSON</button></div>
      <div class="card-b">${U.table([{ t: 'Mã thiết bị' }, { t: 'Tên camera' }, { t: 'Tuyến' }, { t: 'Loại' }, { t: 'Độ phân giải' }, { t: 'Hướng' }, { t: 'Tầm', num: true }, { t: 'Kết nối' }, { t: 'Lưu trữ' }, { t: 'Đơn vị quản lý' }, { t: 'Cập nhật' }, { t: '' }],
      list.slice(pg.start, pg.end).map(o => `<tr class="click" data-act="cam-live" data-id="${o.id}"><td class="nowrap">${o.cam.code}</td><td><b>${U.esc(o.name)}</b><div class="small muted">${o.id}</div></td><td class="small">${U.esc(o.cam.road)}</td><td class="small">${U.esc(o.attrs.loaicam)}</td><td class="small">${U.esc(o.attrs.dophangiai)}</td><td class="small nowrap">${U.dirName(o.cam.dir)} (${o.cam.dir}°)</td><td class="num">${o.cam.range} m</td><td>${o.cam.online ? '<span class="tag ok">Trực tuyến</span>' : '<span class="tag danger">Mất kết nối</span>'}</td><td class="small">${U.esc(o.attrs.luutru)}</td><td class="small">${D.UNITS[o.unit]}</td><td class="small nowrap">${U.dmy(o.updated)}</td><td class="nowrap"><button class="btn sm" data-act="cam-dir" data-id="${o.id}" title="Hiệu chỉnh hướng">🧭</button><button class="btn sm" data-act="obj-locate" data-id="${o.id}" title="Xem trên bản đồ tác nghiệp">🗺️</button></td></tr>`))}
      ${pg.html}</div></div>`;
  }
  A.ACT['cam-export'] = () => {
    U.csv('camera-giam-sat', ['Mã thiết bị', 'Tên', 'Tuyến', 'Loại camera', 'Độ phân giải', 'Hướng (độ)', 'Góc mở', 'Tầm quan sát (m)', 'Kết nối', 'Đường truyền', 'Lưu trữ', 'Ngày lắp', 'Đơn vị quản lý', 'Hiện trạng', 'Vĩ độ', 'Kinh độ'],
      camList().map(o => [o.cam.code, o.name, o.cam.road, o.attrs.loaicam, o.attrs.dophangiai, o.cam.dir, o.cam.fov, o.cam.range, o.attrs.ketnoi, o.attrs.truyendan, o.attrs.luutru, o.attrs.ngaylap, D.UNITS[o.unit], D.COND[o.cond].label, o.geom.coords[0], o.geom.coords[1]]));
    U.audit('Xuất danh sách camera giám sát');
  };
  A.ACT['cam-export-geo'] = () => { U.geojson('camera-giam-sat-cao-lanh', camList()); U.audit('Xuất dữ liệu camera (GeoJSON)'); };

  // ---------- Bản đồ & vùng quan sát ----------
  function tabMap() {
    A.after = mountMap;
    const list = camList();
    return `<div class="card"><div class="card-h"><h3>Bản đồ camera và vùng quan sát</h3><span class="tag info">${list.length} thiết bị</span><div class="spacer"></div><span class="small muted">Bấm vào camera để mở luồng và thông số</span></div>
      <div class="card-b"><div class="map-box" style="height:560px"><div class="lmap" id="cam-map"></div>
        <div class="map-legend"><span><i style="background:#0e7490"></i>Camera trực tuyến</span><span><i style="background:#df2225"></i>Camera mất kết nối</span><span><i style="background:#0e7490;opacity:.4"></i>Vùng quan sát (hướng · góc · tầm)</span><span><i style="background:#b07a12"></i>Tuyến đường</span></div>
        <div class="map-coord" id="cam-coord">Di chuột để xem tọa độ</div></div>
        <div class="note info small" style="margin-top:10px">Vùng quạt dựng theo hướng, góc mở và tầm quan sát khai báo cho từng thiết bị — dùng để rà soát đoạn tuyến chưa được camera bao phủ trước khi đề xuất lắp bổ sung.</div>
      </div></div>`;
  }
  function mountMap() {
    H = M.create('cam-map', { base: 'street' });
    if (!H) return;
    M.coordBox(H, A.$('#cam-coord'));
    const list = camList();
    const roads = roadsOf().filter(r => !c.road || r.name === c.road);
    M.draw(H, roads.concat(list), { cones: true, colorFn: o => o.cam ? (o.cam.online ? '#0e7490' : '#df2225') : '#b07a12', onClick: o => { if (o.cam) A.ACT['cam-live']({ dataset: { id: o.id } }); else A.openObj(o.id); } });
    M.fit(H, list.length ? list : roads);
  }

  // ---------- Tường camera ----------
  function tabWall() {
    const list = camList().slice(0, 24);
    return `<div class="card"><div class="card-h"><h3>Tường camera</h3><span class="tag info">${list.length} luồng</span><div class="spacer"></div><span class="small muted">Hiển thị tối đa 24 luồng theo bộ lọc</span></div>
      <div class="card-b">${list.length ? `<div class="cam-wall">${list.map(o => `<div class="cam-cell" data-act="cam-live" data-id="${o.id}">${A.camView(o)}<div class="small" style="margin-top:4px"><b>${U.esc(o.name)}</b><br><span class="muted">${o.cam.code} · ${U.esc(o.cam.road)}</span></div></div>`).join('')}</div>` : '<div class="empty">Không có camera phù hợp bộ lọc</div>'}
      <div class="note small" style="margin-top:10px">Hình ảnh trong prototype là mô phỏng. Khi triển khai, mỗi ô nhúng luồng RTSP/HLS từ đầu ghi của hệ thống camera phường.</div></div></div>`;
  }

  // ---------- Độ phủ theo tuyến ----------
  function tabRoads() {
    const all = cams();
    const rows = roadsOf().map(r => {
      const list = all.filter(o => o.cam.road === r.name);
      const len = U.lineLen(r.geom.coords);
      return { r, list, len, km: len / 1000, dens: len ? list.length / (len / 1000) : 0, off: list.filter(o => !o.cam.online).length };
    }).sort((a, b) => a.dens - b.dens);
    const lack = rows.filter(x => x.dens < 2);
    const labels = rows.slice(0, 10).map(x => x.r.name.replace('Đường ', '').slice(0, 12));
    return `<div class="grid g-main">
      <div class="card"><div class="card-h"><h3>Mật độ camera trên từng tuyến</h3><div class="spacer"></div><button class="btn sm" data-act="cam-export-road">Xuất Excel</button></div><div class="card-b">
        ${U.table([{ t: 'Tuyến đường' }, { t: 'Chiều dài' }, { t: 'Số camera', num: true }, { t: 'Mất kết nối', num: true }, { t: 'Mật độ (cam/km)', num: true }, { t: 'Đánh giá độ phủ' }],
      rows.map(x => `<tr class="click" data-act="cam-road" data-r="${U.esc(x.r.name)}"><td><b>${U.esc(x.r.name)}</b></td><td class="small">${U.fmtLen(x.len)}</td><td class="num">${x.list.length}</td><td class="num">${x.off ? '<b style="color:#df2225">' + x.off + '</b>' : 0}</td><td class="num">${U.dec(x.dens)}</td><td>${x.dens >= 3 ? '<span class="tag ok">Đủ</span>' : x.dens >= 2 ? '<span class="tag">Tạm đủ</span>' : x.list.length ? '<span class="tag warn">Thưa, nên bổ sung</span>' : '<span class="tag danger">Chưa có camera</span>'}</td></tr>`))}
        <div class="note info small" style="margin-top:10px">Ngưỡng tham khảo trong bản trình diễn: từ 3 camera/km là đủ cho tuyến nội thị, dưới 2 camera/km nên xem xét lắp bổ sung. Ngưỡng này do phường cấu hình khi triển khai.</div></div></div>
      <div class="card"><div class="card-h"><h3>10 tuyến có mật độ thấp nhất</h3></div><div class="card-b">
        ${U.bars(labels, [{ name: 'Camera/km', color: '#0e7490', values: rows.slice(0, 10).map(x => Math.round(x.dens * 10) / 10) }], { h: 240, stacked: false, fmt: v => U.dec(v) })}
        <div class="small" style="margin-top:8px"><b>${lack.length}</b> tuyến dưới ngưỡng 2 camera/km — tổng chiều dài ${U.fmtLen(U.sum(lack, x => x.len))}.</div></div></div></div>`;
  }
  A.ACT['cam-road'] = el => { c.road = el.dataset.r; c.tab = 'bando'; A.render(); };
  A.ACT['cam-export-road'] = () => {
    const all = cams();
    U.csv('do-phu-camera-theo-tuyen', ['Tuyến đường', 'Chiều dài (m)', 'Số camera', 'Mất kết nối', 'Mật độ (cam/km)'],
      roadsOf().map(r => { const list = all.filter(o => o.cam.road === r.name); const len = U.lineLen(r.geom.coords); return [r.name, Math.round(len), list.length, list.filter(o => !o.cam.online).length, len ? (list.length / (len / 1000)).toFixed(2) : 0]; }));
    U.audit('Xuất báo cáo độ phủ camera theo tuyến');
  };

  // ---------- Sự cố & bảo trì ----------
  function tabInc() {
    const incs = camIncidents().sort((a, b) => b.reported.localeCompare(a.reported));
    const off = cams().filter(o => !o.cam.online);
    const plans = cams().filter(o => o.life && o.life.plan);
    return `<div class="grid g-main">
      <div class="card"><div class="card-h"><h3>Sự cố camera</h3><span class="tag info">${incs.filter(i => i.state !== 'hoanthanh').length} đang mở</span><div class="spacer"></div>${A.can('them', 'hatang') ? '<button class="btn primary sm" data-act="inc-new">＋ Ghi nhận sự cố</button>' : ''}</div><div class="card-b">
        ${U.table([{ t: 'Mã' }, { t: 'Nội dung' }, { t: 'Thiết bị' }, { t: 'Nguồn' }, { t: 'Tiếp nhận' }, { t: 'Hạn xử lý' }, { t: 'Trạng thái' }],
      incs.map(i => { const o = A.idx.obj.get(i.objId); return `<tr class="click" data-act="open-inc" data-id="${i.id}"><td class="nowrap">${i.id}</td><td><b>${U.esc(i.title)}</b></td><td class="small">${o ? U.esc(o.name) : '—'}${o && o.cam ? '<div class="muted">' + o.cam.code + '</div>' : ''}</td><td class="small">${U.esc(i.source)}</td><td class="small nowrap">${U.dmy(i.reported)}</td><td class="small nowrap">${i.state === 'hoanthanh' ? '—' : U.dmy(i.deadline) + (i.deadline < U.today() ? ' <b style="color:#df2225">quá hạn</b>' : '')}</td><td><span class="tag"><span class="dot" style="background:${D.INC_STATE[i.state].color}"></span>${D.INC_STATE[i.state].label}</span></td></tr>`; }), { empty: 'Chưa có sự cố camera' })}</div></div>
      <div class="card"><div class="card-h"><h3>Thiết bị cần xử lý</h3></div><div class="card-b">
        <div class="small muted" style="margin-bottom:6px">Camera đang mất kết nối</div>
        ${U.table([{ t: 'Mã' }, { t: 'Tuyến' }, { t: 'Hiện trạng' }, { t: '' }],
      off.map(o => `<tr class="click" data-act="cam-live" data-id="${o.id}"><td class="nowrap">${o.cam.code}</td><td class="small">${U.esc(o.cam.road)}</td><td>${U.condTag(o.cond)}</td><td class="nowrap"><button class="btn sm" data-act="inc-new" data-obj="${o.id}">Báo sự cố</button></td></tr>`), { empty: 'Tất cả camera đang trực tuyến' })}
        <div class="divider"></div>
        <div class="small muted" style="margin-bottom:6px">Kế hoạch bảo trì đã lập (${plans.length})</div>
        ${U.table([{ t: 'Thiết bị' }, { t: 'Thời gian' }, { t: 'Nội dung' }, { t: 'Dự toán', num: true }],
        plans.slice(0, 8).map(o => `<tr class="click" data-act="open-obj" data-id="${o.id}"><td class="small"><b>${o.cam.code}</b><div class="muted">${U.esc(o.cam.road)}</div></td><td class="small nowrap">${U.dmy(o.life.plan.at)}</td><td class="small">${U.esc(o.life.plan.what)}</td><td class="num small">${U.money(o.life.plan.est)}</td></tr>`), { empty: 'Chưa lập kế hoạch bảo trì cho camera' })}</div></div></div>`;
  }
})(window.APP);
