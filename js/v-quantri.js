/* Quản trị hệ thống: tài khoản, phân quyền theo nhóm lớp × hành vi, nhật ký thao tác, kết nối nền bản đồ. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui;
  const ad = ui.admin;

  A.VIEWS['quan-tri'] = function () {
    const tabs = [['taikhoan', '🧑‍💼 Tài khoản'], ['phanquyen', '🔐 Phân quyền'], ['nhatky', '📜 Nhật ký thao tác'], ['ketnoi', '🔗 Kết nối & danh mục']];
    return `<div class="seg" style="align-self:flex-start">${tabs.map(t => `<button class="${ad.tab === t[0] ? 'on' : ''}" data-act="ad-tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>` + ({ taikhoan: accounts, phanquyen: perms, nhatky: audit, ketnoi: connect }[ad.tab])();
  };
  A.ACT['ad-tab'] = el => { ad.tab = el.dataset.t; A.render(); };

  function accounts() {
    return `<div class="card"><div class="card-h"><h3>Tài khoản người dùng</h3><span class="tag info">${A.db.accounts.filter(a => a.active).length} đang hoạt động</span><div class="spacer"></div><button class="btn primary" data-act="acc-new">＋ Thêm tài khoản</button></div><div class="card-b">
      ${U.table([{ t: 'Mã' }, { t: 'Họ tên' }, { t: 'Vai trò' }, { t: 'Đơn vị' }, { t: 'Liên hệ' }, { t: 'Đăng nhập gần nhất' }, { t: 'Trạng thái' }, { t: '' }], A.db.accounts.map(a => `<tr><td class="nowrap">${a.id}</td><td><div class="row"><span class="avatar">${a.name.split(' ').slice(-2).map(x => x[0]).join('')}</span><b>${U.esc(a.name)}</b></div></td><td><select class="input" data-ch="acc-role" data-id="${a.id}">${A.db.roles.filter(r => r.id !== 'nguoidan').map(r => `<option value="${r.id}" ${a.role === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></td><td class="small">${a.unit}</td><td class="small">${a.phone}<br>${a.email}</td><td class="small nowrap">${a.last}</td><td>${a.active ? '<span class="tag ok">Hoạt động</span>' : '<span class="tag">Đã khóa</span>'}</td><td class="nowrap"><button class="btn sm" data-act="acc-toggle" data-id="${a.id}">${a.active ? 'Khóa' : 'Mở khóa'}</button> <button class="btn sm" data-act="acc-reset" data-id="${a.id}">Đặt lại MK</button></td></tr>`))}
      <div class="note info small" style="margin-top:10px">Đăng nhập một lần (SSO) dùng chung với các phân hệ khác của phường; tài khoản công chức đồng bộ từ hệ thống quản lý cán bộ. Người dân tra cứu lớp công khai không cần tài khoản.</div></div></div>`;
  }
  A.CH['acc-role'] = el => { const a = A.db.accounts.find(x => x.id === el.dataset.id); a.role = el.value; A.save(); U.audit('Đổi vai trò tài khoản', a.id); U.toast('Đã cập nhật vai trò của ' + a.name); };
  A.ACT['acc-toggle'] = el => { const a = A.db.accounts.find(x => x.id === el.dataset.id); a.active = !a.active; A.save(); U.audit(a.active ? 'Mở khóa tài khoản' : 'Khóa tài khoản', a.id); A.render(); };
  A.ACT['acc-reset'] = el => { U.audit('Đặt lại mật khẩu', el.dataset.id); U.toast('Đã gửi liên kết đặt lại mật khẩu qua email (mô phỏng)'); };
  A.ACT['acc-new'] = () => A.modal(A.mHead('Thêm tài khoản') + `<div class="modal-b"><div class="form-grid"><div class="field"><label>Họ tên *</label><input class="input" id="acc-name"></div><div class="field"><label>Vai trò</label><select class="input" id="acc-role">${A.db.roles.filter(r => r.id !== 'nguoidan').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select></div><div class="field"><label>Đơn vị</label><select class="input" id="acc-unit">${D.UNITS.map(u => `<option>${u}</option>`).join('')}</select></div><div class="field"><label>Số điện thoại</label><input class="input" id="acc-phone"></div></div></div><div class="modal-f"><button class="btn primary" data-act="acc-new-ok">Tạo tài khoản</button><button class="btn" data-act="close">Hủy</button></div>`);
  A.ACT['acc-new-ok'] = () => { const name = A.$('#acc-name').value.trim(); if (!name) { U.toast('Nhập họ tên'); return; } const id = 'NV' + U.pad(A.db.accounts.length + 1); A.db.accounts.push({ id, name, role: A.$('#acc-role').value, unit: A.$('#acc-unit').value, phone: A.$('#acc-phone').value, email: id.toLowerCase() + '@caolanh.dongthap.gov.vn', active: true, last: 'Chưa đăng nhập' }); A.save(); U.audit('Tạo tài khoản', id); A.closeModal(); U.toast('Đã tạo tài khoản ' + id); A.render(); };

  function perms() {
    return `<div class="card"><div class="card-h"><h3>Ma trận phân quyền theo nhóm lớp dữ liệu và hành vi</h3><span class="small muted">Bấm ô để bật/tắt · áp dụng ngay cho vai trò đang chọn ở thanh trên</span></div><div class="card-b">
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Vai trò</th>${Object.keys(D.GROUPS).map(g => `<th colspan="${D.actions.length}" style="text-align:center;border-left:1px solid var(--line)">${D.GROUPS[g].ico} ${D.GROUPS[g].name}</th>`).join('')}</tr><tr><th></th>${Object.keys(D.GROUPS).map(() => D.actions.map((a, i) => `<th style="text-align:center;${i === 0 ? 'border-left:1px solid var(--line)' : ''}">${a[1]}</th>`).join('')).join('')}</tr></thead>
      <tbody>${A.db.roles.map(r => `<tr><td><b>${r.name}</b><div class="small muted">${r.desc}</div></td>${Object.keys(D.GROUPS).map(g => D.actions.map((a, i) => { const on = A.db.perms[r.id][g][a[0]]; return `<td style="text-align:center;${i === 0 ? 'border-left:1px solid var(--line)' : ''}"><button class="btn sm ${on ? 'primary' : ''}" style="min-width:34px" data-act="perm-toggle" data-r="${r.id}" data-g="${g}" data-a="${a[0]}">${on ? '✓' : '–'}</button></td>`; }).join('')).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:10px"><button class="btn" data-act="perm-default">Khôi phục mặc định</button><span class="small muted">Quyền "Duyệt" cho phép phê duyệt bản ghi và phiếu chấm điểm; quyền "Xem" của Người dân chỉ áp dụng cho lớp công khai.</span></div></div></div>`;
  }
  A.ACT['perm-toggle'] = el => { const p = A.db.perms[el.dataset.r][el.dataset.g]; p[el.dataset.a] = p[el.dataset.a] ? 0 : 1; A.save(); U.audit('Thay đổi phân quyền', el.dataset.r + '/' + el.dataset.g + '/' + el.dataset.a); A.render(); };
  A.ACT['perm-default'] = () => { A.db.perms = D.build().perms; A.save(); U.toast('Đã khôi phục phân quyền mặc định'); A.render(); };

  function audit() {
    const q = (ad.q || '').toLowerCase();
    const rows = A.db.audit.filter(l => !q || U.staffName(l.who).toLowerCase().includes(q) || l.what.toLowerCase().includes(q) || (l.target || '').toLowerCase().includes(q));
    const pg = U.pager('audit', rows.length, 20);
    return `<div class="card"><div class="card-h"><h3>Nhật ký thao tác</h3><span class="tag info">${rows.length}</span><input class="input" placeholder="Lọc theo người, thao tác, đối tượng…" data-in="audit-q" value="${U.esc(ad.q || '')}"><div class="spacer"></div><button class="btn" data-act="audit-export">Xuất Excel</button></div><div class="card-b">
      ${U.table([{ t: 'Thời điểm' }, { t: 'Người thực hiện' }, { t: 'Thao tác' }, { t: 'Đối tượng' }, { t: 'Địa chỉ IP' }], rows.slice(pg.start, pg.end).map(l => `<tr><td class="nowrap small">${l.at}</td><td>${U.staffName(l.who)}</td><td>${U.esc(l.what)}</td><td class="small">${l.target && A.idx.obj.get(l.target) ? `<a href="#" data-act="open-obj" data-id="${l.target}" onclick="return false">${l.target}</a>` : U.esc(l.target)}</td><td class="small muted">${l.ip}</td></tr>`))}${pg.html}
      <div class="small muted" style="margin-top:8px">Nhật ký ghi đầy đủ đăng nhập, thêm/sửa/xóa, phê duyệt, chấm điểm, kết xuất; lưu tối thiểu 12 tháng, không cho phép chỉnh sửa.</div></div></div>`;
  }
  A.IN['audit-q'] = el => { ad.q = el.value; ui.page.audit = 0; A.render(); };
  A.ACT['audit-export'] = () => U.csv('nhat-ky-thao-tac', ['Thời điểm', 'Người thực hiện', 'Thao tác', 'Đối tượng', 'IP'], A.db.audit.map(l => [l.at, U.staffName(l.who), l.what, l.target, l.ip]));

  function connect() {
    return `<div class="grid g2">
      <div class="card"><div class="card-h"><h3>Kết nối nền bản đồ dùng chung của tỉnh</h3></div><div class="card-b">
        ${U.table([{ t: 'Thành phần' }, { t: 'Cấu hình' }, { t: 'Trạng thái' }], [['Nền bản đồ dùng chung', 'WMTS/XYZ từ nền tảng bản đồ số tỉnh Đồng Tháp (bản trình diễn dùng OpenStreetMap)', 'ok'], ['Ảnh vệ tinh', 'Lớp ảnh nền do tỉnh cung cấp (bản trình diễn dùng Esri World Imagery)', 'ok'], ['Cơ sở dữ liệu không gian', 'PostgreSQL 16 + PostGIS 3.4 · EPSG:4326 (WGS-84) và VN-2000 / múi 105°45\'', 'ok'], ['Máy chủ dịch vụ bản đồ', 'GeoServer · công bố 03 nhóm lớp qua WMS 1.3 / WFS 2.0 / GeoJSON', 'ok'], ['Ranh giới hành chính', 'Lấy từ lớp ranh giới của tỉnh, dùng để kiểm tra hợp lệ khi nhập liệu', 'ok'], ['Dữ liệu du lịch – văn hóa', 'Đọc từ dự án chuyển đổi số Du lịch của tỉnh qua nền dùng chung (không xây dựng lại)', 'wait']].map(r => `<tr><td><b>${r[0]}</b></td><td class="small">${r[1]}</td><td>${r[2] === 'ok' ? '<span class="tag ok">Đang hoạt động</span>' : '<span class="tag warn">Chờ cấp quyền</span>'}</td></tr>`))}
        <div class="row" style="margin-top:10px"><button class="btn" data-act="conn-test">Kiểm tra kết nối</button><span class="small muted">Lần kiểm tra gần nhất: ${U.dmy(U.today())} 07:00 · phản hồi 180 ms</span></div></div></div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card"><div class="card-h"><h3>Danh mục lớp dữ liệu</h3></div><div class="card-b">${Object.keys(D.GROUPS).map(g => `<div class="layer-group"><label>${D.GROUPS[g].ico} ${D.GROUPS[g].name}</label><div class="sub">${D.GROUPS[g].types.map(t => `<label><span class="sw" style="background:${D.TYPE_COLOR[t.id]}"></span>${t.name}<span class="cnt">${U.geomLabel(t.geom)} · ${A.db.objs.filter(o => o.type === t.id).length}</span></label>`).join('')}</div></div>`).join('')}<div class="small muted">Danh mục lớp và cấu trúc thuộc tính được thống nhất với Chủ đầu tư khi khảo sát; có thể bổ sung lớp mới mà không cần lập trình lại.</div></div></div>
        <div class="card"><div class="card-h"><h3>Dữ liệu trình diễn</h3></div><div class="card-b"><p class="small muted" style="margin-top:0">Các thao tác trong lúc xem (thêm đối tượng, duyệt, chấm điểm, sự cố…) được lưu trên trình duyệt này. Bấm để quay về bộ dữ liệu mẫu ban đầu.</p><button class="btn danger" data-act="reset-confirm">Đặt lại dữ liệu mẫu</button></div></div>
      </div></div>`;
  }
  A.ACT['conn-test'] = () => U.toast('Kết nối nền bản đồ dùng chung: OK (182 ms) · GeoServer: OK · PostGIS: OK');
  A.ACT['reset-confirm'] = () => A.modal(A.mHead('Đặt lại dữ liệu mẫu') + '<div class="modal-b">Mọi thao tác đã thực hiện trên trình duyệt này sẽ bị xóa và dữ liệu quay về bộ mẫu ban đầu.</div><div class="modal-f"><button class="btn danger" data-act="reset-data">Đặt lại</button><button class="btn" data-act="close">Hủy</button></div>');
})(window.APP);
