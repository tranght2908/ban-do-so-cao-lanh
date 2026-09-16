/* GIS hạ tầng kỹ thuật: tài sản theo vòng đời, sự cố – tiến độ khắc phục, phân tích không gian. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui, M = A.MAP;
  const inf = ui.infra;
  const HT = D.GROUPS.hatang.types;
  const year = Number(D.TODAY.slice(0, 4));

  // ---------- Tài sản & sự cố ----------
  A.VIEWS['ha-tang'] = function () {
    const tabs = [['taisan', '🏗️ Tài sản theo vòng đời'], ['suco', '🛠️ Sự cố & tiến độ khắc phục'], ['baotri', '📅 Kế hoạch bảo trì']];
    return `<div class="seg" style="align-self:flex-start">${tabs.map(t => `<button class="${inf.tab === t[0] ? 'on' : ''}" data-act="inf-tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>` + ({ taisan: assets, suco: incidents, baotri: maintenance }[inf.tab])();
  };
  A.ACT['inf-tab'] = el => { inf.tab = el.dataset.t; A.render(); };

  function assets() {
    const all = A.db.objs.filter(o => o.group === 'hatang' && o.approval === 'daduyet');
    const objs = all.filter(o => o.type === inf.type).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    const pg = U.pager('assets', objs.length, 12);
    const ages = [[0, 5, '< 5 năm'], [5, 10, '5–10 năm'], [10, 15, '10–15 năm'], [15, 99, '> 15 năm']];
    const ageSeries = Object.keys(D.COND).map(c => ({ name: D.COND[c].label, color: D.COND[c].color, values: ages.map(a => objs.filter(o => { const ag = year - o.life.year; return ag >= a[0] && ag < a[1] && o.cond === c; }).length) }));
    const repairCost = U.sum(objs, o => U.sum(o.life.repairs.filter(r => r.at >= '2026-01-01'), r => r.cost));
    const planCost = U.sum(objs.filter(o => o.life.plan), o => o.life.plan.est);
    return `<div class="row"><div class="seg">${HT.map(t => `<button class="${inf.type === t.id ? 'on' : ''}" data-act="inf-type" data-t="${t.id}">${D.TYPE_ICO[t.id]} ${t.name} <span class="muted">(${all.filter(o => o.type === t.id).length})</span></button>`).join('')}</div></div>
      <div class="kpis"><div class="card kpi"><div class="k-label">Tổng ${U.typeName(inf.type).toLowerCase()}</div><div class="k-value">${objs.length}</div><div class="k-sub">${objs.filter(o => o.cond === 'hong' || o.cond === 'xuongcap').length} hư hỏng / xuống cấp</div></div>
        <div class="card kpi"><div class="k-label">Tuổi trung bình</div><div class="k-value">${U.dec(U.avg(objs, o => year - o.life.year))} năm</div><div class="k-sub">${objs.filter(o => year - o.life.year > 15).length} tài sản trên 15 năm</div></div>
        <div class="card kpi"><div class="k-label">Chi phí sửa chữa năm ${year}</div><div class="k-value">${U.moneyShort(repairCost)}</div><div class="k-sub">${U.sum(objs, o => o.life.repairs.filter(r => r.at >= '2026-01-01').length)} lượt sửa chữa</div></div>
        <div class="card kpi"><div class="k-label">Dự toán bảo trì đã lập</div><div class="k-value">${U.moneyShort(planCost)}</div><div class="k-sub">${objs.filter(o => o.life.plan).length} hạng mục có kế hoạch</div></div></div>
      <div class="grid g-main">
        <div class="card"><div class="card-h"><h3>Sổ tài sản ${U.typeName(inf.type)}</h3><div class="spacer"></div><button class="btn sm" data-act="inf-export">Xuất Excel</button></div><div class="card-b">
          ${U.table([{ t: 'Mã' }, { t: 'Tên' }, { t: 'Thông số' }, { t: 'Năm SD' }, { t: 'Tuổi', num: true }, { t: 'Tình trạng' }, { t: 'Sửa chữa', num: true }, { t: 'Kiểm tra gần nhất' }, { t: 'Kế hoạch' }],
            objs.slice(pg.start, pg.end).map(o => `<tr class="click" data-act="open-obj" data-id="${o.id}"><td class="nowrap">${o.id}</td><td>${U.esc(o.name)}</td><td class="small">${U.esc(Object.values(o.attrs).slice(0, 2).join(' · '))}</td><td>${o.life.year}</td><td class="num">${year - o.life.year}</td><td>${U.condTag(o.cond)}</td><td class="num">${o.life.repairs.length}</td><td class="small nowrap">${o.life.inspections[0] ? U.dmy(o.life.inspections[0].at) : '—'}</td><td class="small">${o.life.plan ? '📅 ' + U.dmy(o.life.plan.at) : ''}</td></tr>`))}${pg.html}</div></div>
        <div class="card"><div class="card-h"><h3>Tuổi tài sản × tình trạng</h3></div><div class="card-b">${U.bars(ages.map(a => a[2]), ageSeries, { h: 220 })}<div class="note info small" style="margin-top:10px">Nhóm tài sản tuổi cao và xuống cấp là căn cứ lập dự toán duy tu, thay thế hằng năm thay vì sửa chữa bị động.</div></div></div>
      </div>`;
  }
  A.ACT['inf-type'] = el => { inf.type = el.dataset.t; ui.page.assets = 0; A.render(); };
  A.ACT['inf-export'] = () => { const objs = A.db.objs.filter(o => o.group === 'hatang' && o.type === inf.type && o.approval === 'daduyet'); U.csv('so-tai-san-' + inf.type, ['Mã', 'Tên', 'Năm sử dụng', 'Tuổi', 'Tình trạng', 'Đơn vị quản lý', 'Số lần sửa chữa', 'Chi phí sửa chữa', 'Kiểm tra gần nhất', 'Kế hoạch bảo trì', 'Vĩ độ', 'Kinh độ'], objs.map(o => { const p = U.anchor(o); return [o.id, o.name, o.life.year, year - o.life.year, D.COND[o.cond].label, D.UNITS[o.unit], o.life.repairs.length, U.sum(o.life.repairs, r => r.cost), o.life.inspections[0] ? o.life.inspections[0].at : '', o.life.plan ? o.life.plan.at + ' ' + o.life.plan.what : '', p[0], p[1]]; })); U.audit('Xuất sổ tài sản hạ tầng'); };

  function incidents() {
    const incs = A.db.incidents.filter(i => inf.incFilter === 'all' || i.type === inf.incFilter);
    const open = incs.filter(i => i.state !== 'hoanthanh');
    const late = open.filter(i => i.deadline < U.today());
    const doneDays = incs.filter(i => i.done).map(i => U.days(i.reported, i.done));
    // sự cố lặp lại: cùng đối tượng ≥ 2 lần
    const byObj = {}; A.db.incidents.forEach(i => { (byObj[i.objId] = byObj[i.objId] || []).push(i); });
    const repeats = Object.keys(byObj).filter(k => byObj[k].length >= 2).map(k => ({ o: A.idx.obj.get(k), n: byObj[k].length, last: byObj[k].map(i => i.reported).sort().pop() })).sort((a, b) => b.n - a.n);
    const col = st => `<div class="kcol"><h4>${D.INC_STATE[st].label}<span>${incs.filter(i => i.state === st).length}</span></h4>${incs.filter(i => i.state === st).sort((a, b) => b.reported.localeCompare(a.reported)).map(i => { const o = A.idx.obj.get(i.objId); return `<div class="kcard ${i.state !== 'hoanthanh' && i.deadline < U.today() ? 'late' : ''}" data-act="open-inc" data-id="${i.id}"><div class="row" style="justify-content:space-between"><span class="small muted">${i.id}</span>${i.priority === 'cao' ? '<span class="tag danger">Ưu tiên cao</span>' : ''}</div><div class="t">${U.esc(i.title)}</div><div class="meta">${D.TYPE_ICO[i.type]} ${U.esc(o ? o.name : '')}</div><div class="meta">${i.state === 'hoanthanh' ? 'Xong ' + U.dmy(i.done) : 'Hạn ' + U.dmy(i.deadline) + (i.deadline < U.today() ? ' · <b style="color:#df2225">quá hạn ' + U.days(i.deadline, U.today()) + ' ngày</b>' : '')}${i.assignee ? ' · ' + U.staffName(i.assignee) : ''}</div></div>`; }).join('')}</div>`;
    return `<div class="kpis"><div class="card kpi"><div class="k-label">Sự cố đang mở</div><div class="k-value">${open.length}</div><div class="k-sub ${late.length ? 'down' : ''}">${late.length} quá hạn xử lý</div></div><div class="card kpi"><div class="k-label">Mới tiếp nhận, chưa phân công</div><div class="k-value">${incs.filter(i => i.state === 'moi').length}</div></div><div class="card kpi"><div class="k-label">Thời gian khắc phục TB</div><div class="k-value">${doneDays.length ? U.dec(U.avg(doneDays)) : '—'} ngày</div><div class="k-sub">${doneDays.length} sự cố đã khắc phục</div></div><div class="card kpi"><div class="k-label">Điểm sự cố lặp lại</div><div class="k-value" style="color:#df2225">${repeats.length}</div><div class="k-sub">đối tượng có ≥ 2 lần sự cố</div></div></div>
      <div class="card"><div class="card-h"><h3>Theo dõi sự cố</h3><select class="input" data-ch="inc-filter"><option value="all">Tất cả loại tài sản</option>${HT.map(t => `<option value="${t.id}" ${inf.incFilter === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select><div class="spacer"></div>${A.can('them', 'hatang') ? '<button class="btn primary" data-act="inc-new">＋ Ghi nhận sự cố</button>' : ''}<button class="btn" data-act="inc-map">🗺️ Xem trên bản đồ</button></div>
        <div class="card-b"><div class="kanban k4">${Object.keys(D.INC_STATE).map(col).join('')}</div></div></div>
      <div class="card"><div class="card-h"><h3>Điểm sự cố lặp lại nhiều lần</h3><span class="small muted">Nhận diện hạng mục xuống cấp cần đầu tư thay thế</span></div><div class="card-b">${U.table([{ t: 'Đối tượng' }, { t: 'Loại' }, { t: 'Số lần', num: true }, { t: 'Gần nhất' }, { t: 'Tình trạng' }, { t: 'Đề xuất' }], repeats.map(r => `<tr class="click" data-act="open-obj" data-id="${r.o.id}"><td><b>${U.esc(r.o.name)}</b><div class="small muted">${r.o.id}</div></td><td class="small">${U.typeName(r.o.type)}</td><td class="num"><b style="color:#df2225">${r.n}</b></td><td class="small">${U.dmy(r.last)}</td><td>${U.condTag(r.o.cond)}</td><td class="small">${r.n >= 3 ? 'Đưa vào kế hoạch thay thế / cải tạo' : 'Theo dõi, kiểm tra định kỳ'}</td></tr>`))}</div></div>`;
  }
  A.CH['inc-filter'] = el => { inf.incFilter = el.value; A.render(); };
  A.ACT['inc-map'] = () => { ui.infra.analysis = 'suco'; A.go('phan-tich'); };
  A.openInc = function (id) {
    const i = A.db.incidents.find(x => x.id === id); if (!i) return;
    const o = A.idx.obj.get(i.objId);
    const canEdit = A.can('sua', 'hatang');
    const staff = A.db.accounts.filter(a => a.role === 'congchuc' && a.active);
    A.modal(A.mHead(`${i.id} · ${U.esc(i.title)}`) + `<div class="modal-b">
      <div class="row" style="gap:4px;margin-bottom:10px"><span class="tag"><span class="dot" style="background:${D.INC_STATE[i.state].color}"></span>${D.INC_STATE[i.state].label}</span><span class="tag ${i.priority === 'cao' ? 'danger' : ''}">Ưu tiên ${i.priority === 'cao' ? 'cao' : i.priority === 'thap' ? 'thấp' : 'trung bình'}</span>${i.state !== 'hoanthanh' && i.deadline < U.today() ? '<span class="tag danger">Quá hạn</span>' : ''}</div>
      <div class="grid g2"><div class="attr-grid"><div><b>Đối tượng</b><a href="#" data-act="open-obj" data-id="${o.id}" onclick="return false">${U.esc(o.name)}</a></div><div><b>Vị trí</b>${U.coordTxt(i.loc)}</div><div><b>Nguồn</b>${i.source}</div><div><b>Tiếp nhận</b>${U.dmy(i.reported)} · ${U.staffName(i.by)}</div><div><b>Người xử lý</b>${i.assignee ? U.staffName(i.assignee) : '<i>Chưa phân công</i>'}</div><div><b>Thời hạn</b>${U.dmy(i.deadline)}</div>${i.done ? `<div><b>Hoàn thành</b>${U.dmy(i.done)} (${U.days(i.reported, i.done)} ngày)</div>` : ''}</div>
      <div class="photo-strip">${Array.from({ length: i.photos }, (_, k) => U.photo(o, k + 9)).join('')}</div></div>
      ${canEdit && i.state !== 'hoanthanh' ? `<div class="divider"></div><div class="form-grid"><div class="field"><label>Phân công xử lý</label><select class="input" data-ch="inc-assign" data-id="${i.id}"><option value="">— Chọn cán bộ —</option>${staff.map(s => `<option value="${s.id}" ${i.assignee === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div><div class="field"><label>Thời hạn</label><input type="date" class="input" data-ch="inc-deadline" data-id="${i.id}" value="${i.deadline}"></div></div>` : ''}
      <div class="divider"></div><h4 style="font-size:13.5px;margin-bottom:6px">Nhật ký xử lý</h4><div class="timeline">${i.log.slice().reverse().map(l => `<div><span class="when">${U.dmy(l.at)} · ${U.esc(l.who)}</span><br>${U.esc(l.what)}</div>`).join('')}</div>
      </div><div class="modal-f">${canEdit ? { moi: `<button class="btn primary" data-act="inc-state" data-id="${i.id}" data-s="phancong">Phân công</button>`, phancong: `<button class="btn primary" data-act="inc-state" data-id="${i.id}" data-s="dangxuly">Bắt đầu xử lý</button>`, dangxuly: `<button class="btn primary" data-act="inc-state" data-id="${i.id}" data-s="hoanthanh">✓ Đã khắc phục</button>`, hoanthanh: `<button class="btn" data-act="inc-state" data-id="${i.id}" data-s="dangxuly">Mở lại</button>` }[i.state] : ''}<button class="btn" data-act="close">Đóng</button></div>`, true);
  };
  A.ACT['open-inc'] = el => A.openInc(el.dataset.id);
  const inc = id => A.db.incidents.find(x => x.id === id);
  A.CH['inc-assign'] = el => { const i = inc(el.dataset.id); i.assignee = el.value || null; i.log.push({ at: U.today(), who: U.staffName(U.me()), what: 'Phân công ' + (i.assignee ? U.staffName(i.assignee) : '(bỏ phân công)') }); if (i.assignee && i.state === 'moi') i.state = 'phancong'; A.save(); A.openInc(i.id); };
  A.CH['inc-deadline'] = el => { const i = inc(el.dataset.id); i.deadline = el.value; i.log.push({ at: U.today(), who: U.staffName(U.me()), what: 'Điều chỉnh thời hạn: ' + U.dmy(el.value) }); A.save(); };
  A.ACT['inc-state'] = el => {
    const i = inc(el.dataset.id), s = el.dataset.s;
    if (s === 'phancong' && !i.assignee) { U.toast('Chọn cán bộ xử lý trước khi phân công'); return; }
    i.state = s; i.done = s === 'hoanthanh' ? U.today() : null;
    i.log.push({ at: U.today(), who: U.staffName(U.me()), what: 'Chuyển trạng thái: ' + D.INC_STATE[s].label });
    if (s === 'hoanthanh') { const o = A.idx.obj.get(i.objId); if (o && o.life) { o.life.repairs.unshift({ at: U.today(), what: 'Khắc phục sự cố ' + i.id + ': ' + i.title, cost: 1500000 }); if (o.cond === 'hong') { o.cond = 'trungbinh'; o.history.push({ at: U.today(), who: U.me(), what: 'Cập nhật hiện trạng sau khắc phục sự cố ' + i.id }); } } }
    A.save(); U.audit('Cập nhật sự cố', i.id); A.openInc(i.id); A.render();
  };
  A.ACT['inc-new'] = el => {
    const objs = A.db.objs.filter(o => o.group === 'hatang' && o.approval === 'daduyet');
    const pre = el.dataset.obj || '';
    A.modal(A.mHead('Ghi nhận sự cố hạ tầng') + `<div class="modal-b"><div class="form-grid">
      <div class="field" style="grid-column:1/-1"><label>Đối tượng hạ tầng *</label><select class="input" id="inc-obj">${objs.map(o => `<option value="${o.id}" ${o.id === pre ? 'selected' : ''}>${U.esc(o.name)} (${o.id})</option>`).join('')}</select></div>
      <div class="field" style="grid-column:1/-1"><label>Mô tả sự cố *</label><input class="input" id="inc-title" placeholder="VD: Đèn không sáng, nắp hố ga bị mất…"></div>
      <div class="field"><label>Nguồn</label><select class="input" id="inc-src"><option>Khảo sát hiện trường</option><option>Phản ánh người dân</option><option>Tổng đài 1022</option><option>Tuần tra</option></select></div>
      <div class="field"><label>Ưu tiên</label><select class="input" id="inc-pri"><option value="trungbinh">Trung bình</option><option value="cao">Cao</option><option value="thap">Thấp</option></select></div>
      <div class="field"><label>Thời hạn xử lý</label><input type="date" class="input" id="inc-dl" value="${(() => { const d = new Date(U.today()); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })()}"></div>
      <div class="field"><label>Ảnh hiện trường</label><div class="photo add" data-act="noop" style="width:100%;height:38px;font-size:13px">📷 Chụp / tải ảnh (GPS tự động)</div></div></div>
      <div class="small muted" style="margin-top:8px">Vị trí sự cố lấy theo tọa độ đối tượng; trên thiết bị di động sẽ dùng GPS tại chỗ.</div></div>
      <div class="modal-f"><button class="btn primary" data-act="inc-new-ok">Ghi nhận</button><button class="btn" data-act="close">Hủy</button></div>`);
  };
  A.ACT.noop = () => U.toast('Đã đính kèm ảnh (mô phỏng)');
  A.ACT['inc-new-ok'] = () => {
    const objId = A.$('#inc-obj').value, title = A.$('#inc-title').value.trim();
    if (!title) { U.toast('Nhập mô tả sự cố'); return; }
    const o = A.idx.obj.get(objId);
    const i = { id: 'SC-' + U.pad(A.db.incidents.length + 1, 3), objId, title, type: o.type, loc: U.anchor(o), source: A.$('#inc-src').value, reported: U.today(), by: U.me(), assignee: null, deadline: A.$('#inc-dl').value, state: 'moi', done: null, priority: A.$('#inc-pri').value, photos: 1, log: [{ at: U.today(), who: U.staffName(U.me()), what: 'Tiếp nhận sự cố' }] };
    A.db.incidents.push(i); A.save(); U.audit('Ghi nhận sự cố', i.id); A.closeModal(); U.toast('Đã ghi nhận ' + i.id); inf.tab = 'suco'; A.go('ha-tang');
  };

  function maintenance() {
    const objs = A.db.objs.filter(o => o.group === 'hatang' && o.approval === 'daduyet' && o.life.plan).sort((a, b) => a.life.plan.at.localeCompare(b.life.plan.at));
    const byMonth = ['2026-10', '2026-11', '2026-12'].map(m => ({ m, v: objs.filter(o => o.life.plan.at.startsWith(m)) }));
    const suggest = A.db.objs.filter(o => o.group === 'hatang' && o.approval === 'daduyet' && !o.life.plan && (o.cond === 'xuongcap' || o.cond === 'hong' || year - o.life.year > 15)).slice(0, 8);
    return `<div class="grid g-main"><div class="card"><div class="card-h"><h3>Kế hoạch bảo trì quý IV/${year}</h3><span class="tag info">${objs.length} hạng mục · ${U.moneyShort(U.sum(objs, o => o.life.plan.est))}</span><div class="spacer"></div><button class="btn sm" data-act="plan-export">Xuất Excel</button></div><div class="card-b">
        ${U.table([{ t: 'Thời điểm' }, { t: 'Đối tượng' }, { t: 'Loại' }, { t: 'Nội dung' }, { t: 'Dự toán', num: true }, { t: 'Đơn vị' }], objs.map(o => `<tr class="click" data-act="open-obj" data-id="${o.id}"><td class="nowrap">${U.dmy(o.life.plan.at)}</td><td><b>${U.esc(o.name)}</b></td><td class="small">${U.typeName(o.type)}</td><td class="small">${o.life.plan.what}</td><td class="num">${U.money(o.life.plan.est)}</td><td class="small">${D.UNITS[o.unit]}</td></tr>`))}</div></div>
      <div style="display:flex;flex-direction:column;gap:16px"><div class="card"><div class="card-h"><h3>Dự toán theo tháng</h3></div><div class="card-b">${U.bars(byMonth.map(x => 'Tháng ' + x.m.slice(5)), [{ name: 'Dự toán', color: '#2f6fd6', values: byMonth.map(x => U.sum(x.v, o => o.life.plan.est)) }], { h: 180, fmt: U.moneyShort })}</div></div>
      <div class="card"><div class="card-h"><h3>Gợi ý đưa vào kế hoạch</h3><span class="small muted">xuống cấp / hư hỏng / trên 15 năm</span></div><div class="card-b">${suggest.map(o => `<div class="obj-item" data-act="open-obj" data-id="${o.id}"><div class="t">${D.TYPE_ICO[o.type]} ${U.esc(o.name)}</div><div class="small muted">${year - o.life.year} năm · ${D.COND[o.cond].label}</div></div>`).join('')}</div></div></div></div>`;
  }
  A.ACT['plan-export'] = () => { const objs = A.db.objs.filter(o => o.group === 'hatang' && o.life && o.life.plan); U.csv('ke-hoach-bao-tri', ['Thời điểm', 'Mã', 'Đối tượng', 'Loại', 'Nội dung', 'Dự toán', 'Đơn vị quản lý'], objs.map(o => [o.life.plan.at, o.id, o.name, U.typeName(o.type), o.life.plan.what, o.life.plan.est, D.UNITS[o.unit]])); };

  // ---------- Phân tích không gian ----------
  let PH = null;
  const ANALYSES = [['chieusang', '💡 Vùng thiếu chiếu sáng'], ['ngap', '🌊 Điểm thường ngập / cống nghẹt'], ['tapketrac', '🗑️ Bao phủ điểm tập kết rác'], ['suco', '🛠️ Bản đồ sự cố'], ['quantrac', '📡 Sẵn sàng kết nối quan trắc']];
  const lightGaps = () => {
    const lights = A.db.objs.filter(o => o.type === 'chieusang' && o.approval === 'daduyet' && o.cond !== 'hong');
    const roads = A.db.objs.filter(o => (o.type === 'duong' || o.type === 'phovanminh' || o.type === 'hem') && o.approval === 'daduyet');
    const gaps = [];
    roads.forEach(r => {
      const pts = [];
      for (let i = 0; i < r.geom.coords.length - 1; i++) { const a = r.geom.coords[i], b = r.geom.coords[i + 1]; const n = Math.max(1, Math.round(U.dist(a, b) / 60)); for (let k = 0; k <= n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
      const bad = pts.filter(p => !lights.some(l => U.dist(l.geom.coords, p) <= 70));
      if (bad.length) gaps.push({ road: r, pts: bad, len: bad.length * 60, pct: Math.round(bad.length * 100 / pts.length) });
    });
    return { lights, gaps: gaps.sort((a, b) => b.len - a.len) };
  };
  A.VIEWS['phan-tich'] = function () {
    const an = inf.analysis;
    let side = '', legend = '';
    const draw = () => {
      PH = M.create('pmap', { zoom: 14 }); if (!PH) return;
      if (an === 'chieusang') {
        const { lights, gaps } = lightGaps();
        lights.forEach(l => L.circle(l.geom.coords, { radius: 70, color: '#f2b01e', weight: 0, fillOpacity: .18, interactive: false }).addTo(PH.extra));
        M.draw(PH, A.db.objs.filter(o => o.type === 'duong' || o.type === 'phovanminh' || o.type === 'hem'), { colorFn: () => '#98a3b3', onClick: o => A.openObj(o.id) });
        gaps.forEach(g => g.pts.forEach(p => L.circleMarker(p, { radius: 5, color: '#df2225', fillColor: '#df2225', fillOpacity: .9, weight: 1 }).bindTooltip('Thiếu chiếu sáng: ' + g.road.name).addTo(PH.extra)));
        M.fit(PH, lights);
      } else if (an === 'ngap') {
        const incs = A.db.incidents.filter(i => i.type === 'thoatnuoc' || i.type === 'hoga');
        const byObj = {}; incs.forEach(i => { (byObj[i.objId] = byObj[i.objId] || []).push(i); });
        M.draw(PH, A.db.objs.filter(o => o.type === 'thoatnuoc' || o.type === 'hoga'), { colorFn: o => byObj[o.id] ? (byObj[o.id].length >= 3 ? '#df2225' : '#e5732b') : '#9fb3d9', onClick: o => A.openObj(o.id) });
        Object.keys(byObj).forEach(k => { const o = A.idx.obj.get(k); if (!o) return; L.circle(U.anchor(o), { radius: 60 + byObj[k].length * 50, color: '#df2225', weight: 1, fillOpacity: .15 + byObj[k].length * .08, interactive: false }).addTo(PH.extra); });
        M.fit(PH, A.db.objs.filter(o => o.type === 'thoatnuoc'));
      } else if (an === 'tapketrac') {
        const pts = A.db.objs.filter(o => o.type === 'tapketrac' && o.approval === 'daduyet');
        pts.forEach(p => L.circle(p.geom.coords, { radius: 250, color: '#8a6d3b', weight: 1, fillOpacity: .12, interactive: false }).addTo(PH.extra));
        M.draw(PH, pts, { onClick: o => A.openObj(o.id) });
        M.areas(PH, true);
        M.fit(PH, pts);
      } else if (an === 'suco') {
        const incs = A.db.incidents.filter(i => i.state !== 'hoanthanh');
        incs.forEach(i => L.marker(i.loc, { icon: L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 26], html: `<div class="pin" style="background:${D.INC_STATE[i.state].color}"><span>🛠️</span></div>` }) }).bindTooltip(`<b>${U.esc(i.title)}</b><br>${D.INC_STATE[i.state].label} · hạn ${U.dmy(i.deadline)}`).on('click', () => A.openInc(i.id)).addTo(PH.extra));
        PH.map.setView(D.CENTER, 14);
      } else { M.draw(PH, A.db.objs.filter(o => o.type === 'tramcapnuoc' || o.type === 'thoatnuoc' || o.type === 'chieusang').filter((o, i) => o.type !== 'chieusang' || i % 6 === 0), {}); PH.map.setView(D.CENTER, 14); }
    };
    if (an === 'chieusang') {
      const { lights, gaps } = lightGaps();
      legend = '<span><i style="background:#f2b01e"></i>Vùng phủ sáng (bán kính 70 m)</span><span><i style="background:#df2225"></i>Đoạn tuyến thiếu chiếu sáng</span>';
      side = `<div class="stat-row"><div><div class="v">${lights.length}</div><div class="l">đèn hoạt động</div></div><div><div class="v" style="color:#df2225">${gaps.length}</div><div class="l">tuyến có đoạn thiếu sáng</div></div><div><div class="v">${U.fmtLen(U.sum(gaps, g => g.len))}</div><div class="l">tổng chiều dài thiếu</div></div></div><div class="divider"></div>
        ${U.table([{ t: 'Tuyến' }, { t: 'Thiếu', num: true }, { t: '%', num: true }, { t: 'Đề xuất' }], gaps.map(g => `<tr class="click" data-act="open-obj" data-id="${g.road.id}"><td>${U.esc(g.road.name)}</td><td class="num">${U.fmtLen(g.len)}</td><td class="num">${g.pct}%</td><td class="small">Bổ sung ~${Math.ceil(g.len / 40)} đèn</td></tr>`))}
        <div class="note info small" style="margin-top:10px">Chồng lớp chiếu sáng với lớp đường/hẻm để tìm đoạn tuyến không có đèn trong bán kính 70 m — căn cứ ưu tiên đầu tư bổ sung.</div>`;
    } else if (an === 'ngap') {
      const incs = A.db.incidents.filter(i => i.type === 'thoatnuoc' || i.type === 'hoga');
      const byObj = {}; incs.forEach(i => { (byObj[i.objId] = byObj[i.objId] || []).push(i); });
      const rows = Object.keys(byObj).map(k => ({ o: A.idx.obj.get(k), n: byObj[k].length })).filter(x => x.o).sort((a, b) => b.n - a.n);
      legend = '<span><i style="background:#df2225"></i>≥ 3 lần sự cố</span><span><i style="background:#e5732b"></i>1–2 lần</span><span><i style="background:#9fb3d9"></i>Chưa ghi nhận</span>';
      side = `<div class="stat-row"><div><div class="v">${rows.length}</div><div class="l">điểm có sự cố thoát nước</div></div><div><div class="v" style="color:#df2225">${rows.filter(r => r.n >= 3).length}</div><div class="l">điểm thường xuyên (≥ 3)</div></div></div><div class="divider"></div>
        ${U.table([{ t: 'Vị trí' }, { t: 'Lần', num: true }, { t: 'Tình trạng' }], rows.map(r => `<tr class="click" data-act="open-obj" data-id="${r.o.id}"><td>${U.esc(r.o.name)}</td><td class="num"><b>${r.n}</b></td><td>${U.condTag(r.o.cond)}</td></tr>`))}
        <div class="note info small" style="margin-top:10px">Vòng tròn càng lớn, càng đậm thì sự cố lặp lại càng nhiều — gợi ý vị trí cần nạo vét, nâng cấp cống trước mùa mưa.</div>`;
    } else if (an === 'tapketrac') {
      const pts = A.db.objs.filter(o => o.type === 'tapketrac' && o.approval === 'daduyet');
      const cover = D.AREAS.map(a => { const c = a.poly.reduce((s, p) => [s[0] + p[0] / a.poly.length, s[1] + p[1] / a.poly.length], [0, 0]); const n = pts.filter(p => D.inPoly(p.geom.coords, a.poly)).length; const near = Math.min.apply(null, pts.map(p => U.dist(p.geom.coords, c))); return { a, n, near }; });
      legend = '<span><i style="background:#8a6d3b"></i>Bán kính phục vụ 250 m</span><span><i style="background:#7c54cd"></i>Khu vực</span>';
      side = U.table([{ t: 'Khu vực' }, { t: 'Điểm tập kết', num: true }, { t: 'Cách tâm khu', num: true }, { t: 'Đánh giá' }], cover.map(x => `<tr><td>${x.a.name}</td><td class="num">${x.n}</td><td class="num">${U.fmtLen(x.near)}</td><td>${x.n >= 3 ? '<span class="tag ok">Đủ</span>' : x.n >= 1 ? '<span class="tag warn">Cần bổ sung</span>' : '<span class="tag danger">Thiếu</span>'}</td></tr>`)) + '<div class="note info small" style="margin-top:10px">Chồng lớp điểm tập kết rác với lớp khu vực dân cư để đánh giá mức độ bao phủ và điểm thiếu hụt.</div>';
    } else if (an === 'suco') {
      const incs = A.db.incidents.filter(i => i.state !== 'hoanthanh');
      legend = Object.keys(D.INC_STATE).filter(s => s !== 'hoanthanh').map(s => `<span><i style="background:${D.INC_STATE[s].color}"></i>${D.INC_STATE[s].label}</span>`).join('');
      side = `<div class="stat-row"><div><div class="v">${incs.length}</div><div class="l">sự cố đang mở</div></div><div><div class="v" style="color:#df2225">${incs.filter(i => i.deadline < U.today()).length}</div><div class="l">quá hạn</div></div></div><div class="divider"></div><div class="obj-list">${incs.sort((a, b) => a.deadline.localeCompare(b.deadline)).map(i => `<div class="obj-item" data-act="open-inc" data-id="${i.id}"><div class="t">${U.esc(i.title)}</div><div class="small muted">${i.id} · hạn ${U.dmy(i.deadline)} · ${i.assignee ? U.staffName(i.assignee) : 'chưa phân công'}</div></div>`).join('')}</div>`;
    } else {
      side = `<div class="small" style="line-height:1.7"><p style="margin-top:0">Hệ thống thiết kế mở, sẵn sàng tiếp nhận dữ liệu từ thiết bị cảm biến khi địa phương đầu tư ở giai đoạn tiếp theo, không phải xây dựng lại:</p>
        ${U.table([{ t: 'Nguồn dữ liệu' }, { t: 'Gắn với lớp' }, { t: 'Chuẩn kết nối' }, { t: 'Trạng thái' }], [['Cảm biến mực nước', 'Tuyến thoát nước, hố ga', 'MQTT / REST API', 'Sẵn sàng'], ['Tủ điều khiển chiếu sáng thông minh', 'Chiếu sáng công cộng', 'REST API / LoRaWAN', 'Sẵn sàng'], ['Camera giám sát', 'Công trình công cộng, điểm vi phạm', 'RTSP / ONVIF', 'Sẵn sàng'], ['Đồng hồ nước thông minh', 'Trạm cấp nước', 'REST API', 'Sẵn sàng'], ['Nền bản đồ dùng chung của tỉnh', 'Toàn bộ lớp chuyên đề', 'WMS / WFS / GeoJSON', 'Đang kết nối']].map(r => `<tr><td>${r[0]}</td><td class="small">${r[1]}</td><td class="small"><code>${r[2]}</code></td><td>${r[3] === 'Sẵn sàng' ? '<span class="tag ok">' : '<span class="tag info">'}${r[3]}</span></td></tr>`))}
        <div class="note info" style="margin-top:10px">Bản đồ minh họa các vị trí có thể lắp cảm biến (trạm cấp nước, tuyến thoát nước, tủ điện chiếu sáng).</div></div>`;
    }
    A.after = draw;
    return `<div class="chips">${ANALYSES.map(a => `<button class="${an === a[0] ? 'on' : ''}" data-act="an-pick" data-a="${a[0]}">${a[1]}</button>`).join('')}</div>
      <div class="grid g-main"><div class="card"><div class="card-b" style="padding-top:12px"><div class="map-box" style="height:520px"><div class="lmap" id="pmap"></div>${legend ? `<div class="map-legend">${legend}</div>` : ''}</div></div></div>
      <div class="card"><div class="card-h"><h3>${ANALYSES.find(a => a[0] === an)[1].slice(3)}</h3></div><div class="card-b">${side}</div></div></div>`;
  };
  A.ACT['an-pick'] = el => { inf.analysis = el.dataset.a; A.render(); };
})(window.APP);
