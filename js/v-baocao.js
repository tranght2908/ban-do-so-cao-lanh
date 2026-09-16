/* Báo cáo và kết xuất: bộ báo cáo sinh tự động, xuất Excel/PDF/GeoJSON, in bản đồ theo khu vực. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui, M = A.MAP;
  const approved = () => A.db.objs.filter(o => o.approval === 'daduyet');
  const year = Number(D.TODAY.slice(0, 4));

  const REPORTS = [
    { id: 'r1', name: 'Tổng hợp đối tượng theo nhóm lớp và hiện trạng', build: () => {
      const objs = approved();
      const cols = ['Nhóm lớp', 'Lớp dữ liệu'].concat(Object.keys(D.COND).map(c => D.COND[c].label), ['Tổng']);
      const rows = Object.keys(D.GROUPS).flatMap(g => D.GROUPS[g].types.map(t => { const v = objs.filter(o => o.type === t.id); return [D.GROUPS[g].name, t.name].concat(Object.keys(D.COND).map(c => v.filter(o => o.cond === c).length), [v.length]); }));
      return { cols, rows, chart: U.bars(Object.keys(D.GROUPS).map(g => D.GROUPS[g].name), Object.keys(D.COND).map(c => ({ name: D.COND[c].label, color: D.COND[c].color, values: Object.keys(D.GROUPS).map(g => objs.filter(o => o.group === g && o.cond === c).length) })), { h: 200 }) };
    } },
    { id: 'r2', name: 'Danh sách đối tượng cần xử lý (hư hỏng, xuống cấp)', build: () => ({ cols: ['Mã', 'Tên', 'Lớp', 'Hiện trạng', 'Tổ dân phố', 'Đơn vị quản lý', 'Cập nhật'], rows: approved().filter(o => o.cond === 'hong' || o.cond === 'xuongcap').map(o => [o.id, o.name, U.typeName(o.type), D.COND[o.cond].label, o.khu, D.UNITS[o.unit], U.dmy(o.updated)]) }) },
    { id: 'r3', name: 'Kết quả chấm điểm và xếp hạng theo kỳ', build: () => { const rank = Object.keys(D.GROUPS).flatMap(g => A.ranking(g, ui.period).filter(x => x.s != null).map((x, i) => [i + 1, D.GROUPS[g].name, x.o.id, x.o.name, U.typeName(x.o.type), U.dec(x.s), U.grade(x.s).label])); return { cols: ['Hạng', 'Nhóm', 'Mã', 'Tên', 'Lớp', 'Điểm', 'Xếp loại'], rows: rank }; } },
    { id: 'r4', name: 'So sánh kết quả đánh giá giữa các kỳ', build: () => { const rows = Object.keys(D.GROUPS).map(g => [D.GROUPS[g].name].concat(D.PERIODS.map(p => { const r = A.ranking(g, p.id).filter(x => x.s != null); return r.length ? U.dec(U.avg(r, x => x.s)) : '—'; }))); return { cols: ['Nhóm lớp'].concat(D.PERIODS.map(p => p.name)), rows, chart: U.lines(D.PERIODS.map(p => p.name), Object.keys(D.GROUPS).map(g => ({ name: D.GROUPS[g].name, color: D.GROUPS[g].color, values: D.PERIODS.map(p => { const r = A.ranking(g, p.id).filter(x => x.s != null); return r.length ? Math.round(U.avg(r, x => x.s) * 10) / 10 : null; }) })), { min: 40, max: 100, h: 200 }) }; } },
    { id: 'r5', name: 'Hiện trạng hạ tầng kỹ thuật theo lĩnh vực', build: () => { const objs = approved().filter(o => o.group === 'hatang'); return { cols: ['Lớp hạ tầng', 'Số lượng', 'Tuổi TB (năm)', 'Tốt/Khá', 'Trung bình', 'Xuống cấp/Hư hỏng', 'Sửa chữa năm ' + year, 'Chi phí sửa chữa', 'Có kế hoạch bảo trì'], rows: D.GROUPS.hatang.types.map(t => { const v = objs.filter(o => o.type === t.id); return [t.name, v.length, U.dec(U.avg(v, o => year - o.life.year)), v.filter(o => o.cond === 'tot' || o.cond === 'kha').length, v.filter(o => o.cond === 'trungbinh').length, v.filter(o => o.cond === 'xuongcap' || o.cond === 'hong').length, U.sum(v, o => o.life.repairs.filter(r => r.at >= year + '-01-01').length), U.money(U.sum(v, o => U.sum(o.life.repairs.filter(r => r.at >= year + '-01-01'), r => r.cost))), v.filter(o => o.life.plan).length]; }) }; } },
    { id: 'r6', name: 'Hiện trạng hạ tầng theo khu vực (tổ dân phố)', build: () => { const objs = approved().filter(o => o.group === 'hatang'); return { cols: ['Tổ dân phố', 'Đèn chiếu sáng', 'Hố ga', 'Cây xanh', 'Công trình', 'Tổng', 'Cần xử lý', 'Sự cố đang mở'], rows: D.KHU.map(k => { const v = objs.filter(o => o.khu === k); return [k, v.filter(o => o.type === 'chieusang').length, v.filter(o => o.type === 'hoga').length, v.filter(o => o.type === 'cayxanh').length, v.filter(o => o.type === 'congtrinh').length, v.length, v.filter(o => o.cond === 'hong' || o.cond === 'xuongcap').length, A.db.incidents.filter(i => i.state !== 'hoanthanh' && (A.idx.obj.get(i.objId) || {}).khu === k).length]; }) }; } },
    { id: 'r7', name: 'Tổng hợp sự cố hạ tầng và tiến độ khắc phục', build: () => { const incs = A.db.incidents; return { cols: ['Loại tài sản', 'Tổng sự cố', 'Mới', 'Đã phân công', 'Đang xử lý', 'Đã khắc phục', 'Quá hạn', 'Thời gian khắc phục TB (ngày)'], rows: D.GROUPS.hatang.types.map(t => { const v = incs.filter(i => i.type === t.id); const d = v.filter(i => i.done); return [t.name, v.length, v.filter(i => i.state === 'moi').length, v.filter(i => i.state === 'phancong').length, v.filter(i => i.state === 'dangxuly').length, d.length, v.filter(i => i.state !== 'hoanthanh' && i.deadline < U.today()).length, d.length ? U.dec(U.avg(d, i => U.days(i.reported, i.done))) : '—']; }).filter(r => r[1] > 0) }; } },
    { id: 'r8', name: 'Vùng trồng, cơ sở sản xuất và sản phẩm OCOP', build: () => ({ cols: ['Mã', 'Tên', 'Lớp', 'Chủ thể', 'Sản phẩm / hạng', 'Diện tích / công suất', 'Chứng nhận', 'Tổ dân phố'], rows: approved().filter(o => o.group === 'nongsan').map(o => [o.id, o.name, U.typeName(o.type), o.attrs.chuthe || '', o.attrs.sanpham || o.attrs.hang || '', o.attrs.dientich || o.attrs.congsuat || '', o.attrs.chungnhan || o.attrs.mavungtrong || '', o.khu]) }) },
    { id: 'r9', name: 'Trật tự đô thị: vi phạm và biển quảng cáo', build: () => ({ cols: ['Mã', 'Nội dung', 'Lớp', 'Chi tiết', 'Kết quả / giấy phép', 'Tổ dân phố', 'Ngày'], rows: A.db.objs.filter(o => o.type === 'vipham' || o.type === 'bienqc').map(o => [o.id, o.name, U.typeName(o.type), o.attrs.hanhvi || o.attrs.kichthuoc + ' · ' + o.attrs.chuso, o.attrs.xuly || o.attrs.giayphep + (o.attrs.hethan && o.attrs.hethan < U.today() ? ' (hết hạn)' : ''), o.khu, U.dmy(o.attrs.ngayphathien || o.updated)]) }) },
    { id: 'r10', name: 'Tình hình cập nhật dữ liệu và phê duyệt', build: () => ({ cols: ['Nhóm lớp', 'Tổng bản ghi', 'Đã duyệt', 'Chờ duyệt', 'Trả lại', 'Nháp', 'Cập nhật 30 ngày qua', 'Có ảnh hiện trạng', 'Tỷ lệ có ảnh'], rows: Object.keys(D.GROUPS).map(g => { const v = A.db.objs.filter(o => o.group === g); return [D.GROUPS[g].name, v.length, v.filter(o => o.approval === 'daduyet').length, v.filter(o => o.approval === 'choduyet').length, v.filter(o => o.approval === 'tralai').length, v.filter(o => o.approval === 'nhap').length, v.filter(o => U.days(o.updated, U.today()) <= 30).length, v.filter(o => o.photos > 0).length, U.pct(v.filter(o => o.photos > 0).length, v.length) + '%']; }) }) }
  ];
  let PMH = null;

  A.VIEWS['bao-cao'] = function () {
    const r = REPORTS.find(x => x.id === ui.report) || REPORTS[0];
    const out = r.build();
    const p = D.PERIODS.find(x => x.id === ui.period);
    A.after = () => {
      PMH = M.create('repmap', { zoom: 14 }); if (!PMH) return;
      const a = D.AREAS.find(x => x.id === ui.repArea);
      let objs = approved().filter(o => !ui.repGroup || o.group === ui.repGroup);
      if (a) { objs = objs.filter(o => D.inPoly(U.anchor(o), a.poly)); L.polygon(a.poly, { color: '#7b4bc4', weight: 2, fillOpacity: .05, interactive: false }).addTo(PMH.extra); }
      M.draw(PMH, objs, { onClick: o => A.openObj(o.id) });
      M.fit(PMH, objs);
    };
    return `<div class="grid g-report">
      <div class="card"><div class="card-h"><h3>Bộ báo cáo</h3></div><div class="card-b report-list">${REPORTS.map((x, i) => `<button class="${x.id === ui.report ? 'on' : ''}" data-act="rep-pick" data-id="${x.id}">${i + 1}. ${x.name}</button>`).join('')}
        <div class="divider"></div><div style="font-weight:600;font-size:13px;padding:0 12px 6px">Kết xuất dữ liệu không gian</div>
        <button data-act="rep-geo" data-g="">Toàn bộ lớp chuyên đề (GeoJSON)</button>${Object.keys(D.GROUPS).map(g => `<button data-act="rep-geo" data-g="${g}">Lớp ${D.GROUPS[g].name} (GeoJSON)</button>`).join('')}
        <div class="small muted" style="padding:6px 12px">Lớp chuyên đề cũng được công bố qua dịch vụ WMS/WFS để nền bản đồ dùng chung của tỉnh khai thác ngược lại.</div></div></div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card"><div class="card-h"><div><h3>${r.name}</h3><div class="small muted">Phường Cao Lãnh · số liệu đến ${U.dmy(U.today())} · kỳ đánh giá ${p.name}</div></div><div class="spacer"></div><select class="input no-print" data-ch="rep-period">${D.PERIODS.map(x => `<option value="${x.id}" ${x.id === ui.period ? 'selected' : ''}>${x.name}</option>`).join('')}</select><button class="btn no-print" data-act="rep-csv">Xuất Excel</button><button class="btn no-print" data-act="rep-print">In / PDF</button></div>
          <div class="card-b">${out.chart || ''}${U.table(out.cols.map((c, i) => ({ t: c, num: i > 0 && out.rows.length && typeof out.rows[0][i] === 'number' })), out.rows.map(row => `<tr>${row.map((v, i) => `<td class="${i > 0 && typeof v === 'number' ? 'num' : ''}">${U.esc(v)}</td>`).join('')}</tr>`))}<div class="small muted" style="margin-top:8px">${out.rows.length} dòng · sinh tự động lúc ${U.nowTime()}</div></div></div>
        <div class="card"><div class="card-h"><h3>In bản đồ theo khu vực</h3><select class="input" data-ch="rep-area"><option value="">Toàn phường</option>${D.AREAS.map(a => `<option value="${a.id}" ${ui.repArea === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}</select><select class="input" data-ch="rep-area-group"><option value="">Cả 03 nhóm lớp</option>${Object.keys(D.GROUPS).map(g => `<option value="${g}" ${ui.repGroup === g ? 'selected' : ''}>${D.GROUPS[g].name}</option>`).join('')}</select><div class="spacer"></div><button class="btn no-print" data-act="rep-map-print">🖨️ In bản đồ chuyên đề</button></div>
          <div class="card-b"><div class="map-box" style="height:360px"><div class="lmap" id="repmap"></div></div></div></div>
      </div></div>`;
  };
  A.ACT['rep-pick'] = el => { ui.report = el.dataset.id; A.render(); };
  A.CH['rep-period'] = el => { ui.period = el.value; A.render(); };
  A.CH['rep-area'] = el => { ui.repArea = el.value; A.render(); };
  A.CH['rep-area-group'] = el => { ui.repGroup = el.value; A.render(); };
  A.ACT['rep-csv'] = () => { const r = REPORTS.find(x => x.id === ui.report); const out = r.build(); U.csv('bao-cao-' + r.id, out.cols, out.rows); U.audit('Xuất báo cáo Excel', r.name); };
  A.ACT['rep-print'] = () => { U.audit('In báo cáo PDF', ui.report); window.print(); };
  A.ACT['rep-geo'] = el => { const g = el.dataset.g; U.geojson('lop-' + (g || 'tat-ca') + '-cao-lanh', approved().filter(o => !g || o.group === g)); U.audit('Xuất dữ liệu không gian (GeoJSON)', g); };
  A.ACT['rep-map-print'] = () => { U.audit('In bản đồ theo khu vực', ui.repArea || 'Toàn phường'); M.print('Bản đồ chuyên đề ' + (D.AREAS.find(x => x.id === ui.repArea) || { name: 'phường Cao Lãnh' }).name); };
})(window.APP);
