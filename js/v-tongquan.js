/* Bảng điều khiển thống kê (lãnh đạo). */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui;

  A.VIEWS['tong-quan'] = function () {
    const db = A.db, objs = db.objs.filter(o => o.approval === 'daduyet');
    const byG = g => objs.filter(o => o.group === g);
    const need = objs.filter(o => o.cond === 'hong' || o.cond === 'xuongcap');
    const pending = db.objs.filter(o => o.approval === 'choduyet');
    const incOpen = db.incidents.filter(i => i.state !== 'hoanthanh');
    const late = incOpen.filter(i => i.deadline < U.today());
    const period = ui.period, prev = D.PERIODS[D.PERIODS.findIndex(p => p.id === period) - 1];
    const avgOf = (g, p) => { const r = A.ranking(g, p).filter(x => x.s != null); return r.length ? U.avg(r, x => x.s) : null; };
    const condSeries = Object.keys(D.COND).map(c => ({ name: D.COND[c].label, color: D.COND[c].color, values: Object.keys(D.GROUPS).map(g => byG(g).filter(o => o.cond === c).length) }));
    const trend = Object.keys(D.GROUPS).map(g => ({ name: D.GROUPS[g].name, color: D.GROUPS[g].color, values: D.PERIODS.map(p => { const v = avgOf(g, p.id); return v == null ? null : Math.round(v * 10) / 10; }) }));
    const scoreGrades = Object.keys(D.GROUPS).map(g => A.ranking(g, period).filter(x => x.s != null)).flat();
    const gradeParts = D.GRADES.map(gr => ({ label: gr.label, color: gr.color, value: scoreGrades.filter(x => U.grade(x.s).id === gr.id).length }));
    const khuStats = D.KHU.map(k => ({ k, n: objs.filter(o => o.khu === k).length, bad: need.filter(o => o.khu === k).length })).sort((a, b) => b.bad - a.bad).slice(0, 6);

    return `
      <div class="row"><div><h2 style="font-size:17px">Tình hình quản lý đô thị, nông sản, hạ tầng kỹ thuật</h2><div class="small muted">Số liệu tổng hợp đến ${U.dmy(U.today())} · Kỳ đánh giá: ${D.PERIODS.find(p => p.id === period).name}</div></div>
        <div class="spacer"></div><select class="input" data-ch="dash-period">${D.PERIODS.map(p => `<option value="${p.id}" ${p.id === period ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
        <button class="btn" data-act="go" data-to="bao-cao">📈 Báo cáo</button><button class="btn primary" data-act="go" data-to="ban-do">🗺️ Mở bản đồ</button></div>
      <div class="kpis">
        ${Object.keys(D.GROUPS).map(g => `<div class="card kpi click" data-act="dash-group" data-g="${g}"><div class="k-label">${D.GROUPS[g].ico} ${D.GROUPS[g].name}</div><div class="k-value">${U.num(byG(g).length)}</div><div class="k-sub">${byG(g).filter(o => o.cond === 'hong' || o.cond === 'xuongcap').length} cần xử lý · ${D.GROUPS[g].types.length} lớp dữ liệu</div><div class="bar-mini"><i style="width:${U.pct(byG(g).filter(o => o.cond === 'tot' || o.cond === 'kha').length, byG(g).length)}%;background:${D.GROUPS[g].color}"></i></div></div>`).join('')}
        <div class="card kpi click" data-act="go" data-to="ha-tang"><div class="k-label">🛠️ Sự cố hạ tầng đang xử lý</div><div class="k-value">${incOpen.length}</div><div class="k-sub ${late.length ? 'down' : ''}">${late.length} quá hạn · ${pending.length} bản ghi chờ duyệt</div></div>
      </div>
      <div class="grid g-main">
        <div class="card"><div class="card-h"><h3>Đối tượng theo nhóm lớp và hiện trạng</h3><span class="small muted">Chỉ tính dữ liệu đã duyệt</span></div><div class="card-b">${U.bars(Object.keys(D.GROUPS).map(g => D.GROUPS[g].name), condSeries, { h: 240 })}</div></div>
        <div class="card"><div class="card-h"><h3>Phân bố mức đánh giá kỳ này</h3></div><div class="card-b">${U.donut(gradeParts, [String(scoreGrades.length), 'đối tượng'])}
          <div class="divider"></div><div class="small">${Object.keys(D.GROUPS).map(g => { const v = avgOf(g, period), pv = prev ? avgOf(g, prev.id) : null; const d = v != null && pv != null ? v - pv : null; return `<div class="row" style="justify-content:space-between;padding:3px 0"><span>${D.GROUPS[g].ico} ${D.GROUPS[g].name}</span><span><b>${v == null ? '—' : U.dec(v)}</b> điểm ${d == null ? '' : `<span class="${d >= 0 ? 'k-sub up' : 'k-sub down'}" style="display:inline">(${d >= 0 ? '▲' : '▼'} ${U.dec(Math.abs(d))} so kỳ trước)</span>`}</span></div>`; }).join('')}</div></div></div>
      </div>
      <div class="grid g-main">
        <div class="card"><div class="card-h"><h3>Xu hướng điểm trung bình qua 04 kỳ</h3><button class="btn sm" data-act="go" data-to="ket-qua">Xem xếp hạng</button></div><div class="card-b">${U.lines(D.PERIODS.map(p => p.name), trend, { min: 40, max: 100 })}</div></div>
        <div class="card"><div class="card-h"><h3>Tổ dân phố có nhiều đối tượng cần xử lý</h3></div><div class="card-b">${U.table([{ t: 'Tổ dân phố' }, { t: 'Đối tượng', num: true }, { t: 'Cần xử lý', num: true }, { t: '' }], khuStats.map(x => `<tr><td>${x.k}</td><td class="num">${x.n}</td><td class="num"><b style="color:${x.bad ? '#df2225' : ''}">${x.bad}</b></td><td><div class="bar-mini" style="margin:0;width:90px"><i style="width:${U.pct(x.bad, x.n)}%;background:#df2225"></i></div></td></tr>`))}</div></div>
      </div>
      <div class="grid g-main">
        <div class="card"><div class="card-h"><h3>Danh sách đối tượng cần xử lý</h3><span class="tag danger">${need.length} đối tượng</span><div class="spacer"></div><button class="btn sm" data-act="dash-export">Xuất Excel</button></div><div class="card-b">
          ${U.table([{ t: 'Mã' }, { t: 'Tên đối tượng' }, { t: 'Nhóm / lớp' }, { t: 'Hiện trạng' }, { t: 'Đơn vị quản lý' }, { t: 'Cập nhật' }],
            need.sort((a, b) => (a.cond === 'hong' ? 0 : 1) - (b.cond === 'hong' ? 0 : 1)).slice(0, 10).map(o => `<tr class="click" data-act="open-obj" data-id="${o.id}"><td class="nowrap">${o.id}</td><td>${U.esc(o.name)}</td><td class="small">${D.GROUPS[o.group].name} · ${U.typeName(o.type)}</td><td>${U.condTag(o.cond)}</td><td class="small">${D.UNITS[o.unit]}</td><td class="nowrap small">${U.dmy(o.updated)}</td></tr>`))}
          ${need.length > 10 ? `<div class="small muted" style="margin-top:8px">Hiển thị 10 / ${need.length} — xem đầy đủ tại Quản lý đối tượng hoặc Báo cáo.</div>` : ''}</div></div>
        <div class="card"><div class="card-h"><h3>Sự cố hạ tầng gần đây</h3><button class="btn sm" data-act="go" data-to="ha-tang">Tất cả</button></div><div class="card-b">
          ${db.incidents.filter(i => i.state !== 'hoanthanh').sort((a, b) => b.reported.localeCompare(a.reported)).slice(0, 6).map(i => { const o = A.idx.obj.get(i.objId); return `<div class="kcard ${i.deadline < U.today() ? 'late' : ''}" data-act="open-inc" data-id="${i.id}"><div class="row" style="justify-content:space-between"><span class="tag"><span class="dot" style="background:${D.INC_STATE[i.state].color}"></span>${D.INC_STATE[i.state].label}</span><span class="small muted">${U.dmy(i.reported)}</span></div><div class="t">${U.esc(i.title)}</div><div class="meta">${U.esc(o ? o.name : '')} · hạn ${U.dmy(i.deadline)}${i.deadline < U.today() ? ' · <b style="color:#df2225">quá hạn</b>' : ''}</div></div>`; }).join('') || '<div class="empty">Không có sự cố đang mở</div>'}
        </div></div>
      </div>`;
  };

  A.CH['dash-period'] = el => { ui.period = el.value; A.render(); };
  A.ACT['dash-group'] = el => { ui.obj.group = el.dataset.g; ui.obj.type = ''; A.go('ql-' + el.dataset.g); };
  A.ACT['dash-export'] = () => {
    const need = A.db.objs.filter(o => o.approval === 'daduyet' && (o.cond === 'hong' || o.cond === 'xuongcap'));
    U.csv('doi-tuong-can-xu-ly', ['Mã', 'Tên', 'Nhóm', 'Lớp', 'Hiện trạng', 'Đơn vị quản lý', 'Tổ dân phố', 'Vĩ độ', 'Kinh độ', 'Cập nhật'], need.map(o => { const p = U.anchor(o); return [o.id, o.name, D.GROUPS[o.group].name, U.typeName(o.type), D.COND[o.cond].label, D.UNITS[o.unit], o.khu, p[0], p[1], o.updated]; }));
  };
})(window.APP);
