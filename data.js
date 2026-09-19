/* Dữ liệu mẫu minh họa cho prototype Công cụ số quản lý trên nền bản đồ số – phường Cao Lãnh.
   Toàn bộ tên, tọa độ, số liệu đều là giả lập, sinh cố định từ hạt giống để mỗi lần mở đều giống nhau. */
window.DATA = (function () {
  'use strict';
  const VERSION = 'bds-2026-09-19-1';
  const TODAY = '2026-09-17';

  // Tâm bản đồ (khu trung tâm phường Cao Lãnh) và ranh giới mô phỏng
  const CENTER = [10.4672, 105.6303];
  const G = window.GEO; // hình học thật từ OpenStreetMap (geo.js)
  const BOUNDARY = G.BOUNDARY;
  const BB = BOUNDARY.reduce((r, p) => [Math.min(r[0], p[0]), Math.min(r[1], p[1]), Math.max(r[2], p[0]), Math.max(r[3], p[1])], [90, 180, -90, -180]);
  const KHU = Array.from({ length: 12 }, (_, i) => 'Tổ dân phố ' + (i + 1));
  // Khu vực (vùng) mô phỏng để tìm kiếm không gian theo khu vực
  const AREAS = [
    { id: 'KV1', name: 'Khu trung tâm hành chính', poly: [[10.4700, 105.6150], [10.4700, 105.6340], [10.4600, 105.6340], [10.4600, 105.6150]] },
    { id: 'KV2', name: 'Khu dân cư phía Tây', poly: [[10.4720, 105.5850], [10.4720, 105.6100], [10.4570, 105.6100], [10.4570, 105.5850]] },
    { id: 'KV3', name: 'Khu ven sông phía Nam', poly: [[10.4350, 105.6000], [10.4350, 105.6400], [10.4150, 105.6400], [10.4150, 105.6000]] },
    { id: 'KV4', name: 'Khu sản xuất nông nghiệp phía Đông', poly: [[10.4420, 105.6500], [10.4420, 105.6780], [10.4220, 105.6780], [10.4220, 105.6500]] }
  ];
  const GROUPS = {
    dothi: {
      name: 'Đô thị', color: '#d97706', ico: '🏙️',
      types: [
        { id: 'duong', name: 'Tuyến đường', geom: 'line' },
        { id: 'hem', name: 'Tuyến hẻm', geom: 'line' },
        { id: 'phovanminh', name: 'Tuyến phố văn minh đô thị', geom: 'line' },
        { id: 'tapketrac', name: 'Điểm tập kết rác', geom: 'point' },
        { id: 'baidoxe', name: 'Bãi đỗ xe', geom: 'polygon' },
        { id: 'bienqc', name: 'Biển quảng cáo', geom: 'point' },
        { id: 'vipham', name: 'Vị trí vi phạm trật tự đô thị', geom: 'point' }
      ]
    },
    nongsan: {
      name: 'Nông sản', color: '#20a04e', ico: '🌾',
      types: [
        { id: 'vungtrong', name: 'Vùng trồng', geom: 'polygon' },
        { id: 'coso', name: 'Cơ sở sản xuất, sơ chế, chế biến', geom: 'point' },
        { id: 'ocop', name: 'Sản phẩm OCOP, sản phẩm đặc trưng', geom: 'point' },
        { id: 'diemban', name: 'Điểm giới thiệu và bán sản phẩm', geom: 'point' }
      ]
    },
    hatang: {
      name: 'Hạ tầng kỹ thuật', color: '#2f6fd6', ico: '🔧',
      types: [
        { id: 'chieusang', name: 'Chiếu sáng công cộng', geom: 'point' },
        { id: 'thoatnuoc', name: 'Tuyến thoát nước, cống', geom: 'line' },
        { id: 'hoga', name: 'Hố ga', geom: 'point' },
        { id: 'cayxanh', name: 'Cây xanh đô thị', geom: 'point' },
        { id: 'tramcapnuoc', name: 'Trạm cấp nước', geom: 'point' },
        { id: 'congtrinh', name: 'Công trình công cộng', geom: 'point' },
        { id: 'camera', name: 'Camera giám sát tuyến đường', geom: 'point' }
      ]
    }
  };
  const TYPE_ICO = {
    duong: '🛣️', hem: '↔️', phovanminh: '🏅', tapketrac: '🗑️', baidoxe: '🅿️', bienqc: '🪧', vipham: '⚠️',
    vungtrong: '🌱', coso: '🏭', ocop: '🏷️', diemban: '🛒',
    chieusang: '💡', thoatnuoc: '🌊', hoga: '⭕', cayxanh: '🌳', tramcapnuoc: '🚰', congtrinh: '🏛️', camera: '📹'
  };
  // Màu riêng từng loại đối tượng trên bản đồ
  const TYPE_COLOR = {
    duong: '#b07a12', hem: '#d4a04a', phovanminh: '#e0561f', tapketrac: '#8a6d3b', baidoxe: '#b7791f', bienqc: '#d97706', vipham: '#df2225',
    vungtrong: '#20a04e', coso: '#167a3c', ocop: '#0b4a9e', diemban: '#5cb85c',
    chieusang: '#f2b01e', thoatnuoc: '#2f6fd6', hoga: '#1b4f9c', cayxanh: '#3a9d3a', tramcapnuoc: '#1aa3c8', congtrinh: '#6f4bc4', camera: '#0e7490'
  };
  // Nhãn thuộc tính theo loại
  const ATTR_LABEL = {
    chieudai: 'Chiều dài (m)', rong: 'Bề rộng (m)', matduong: 'Kết cấu mặt đường', namdautu: 'Năm đầu tư', viahe: 'Vỉa hè',
    gioTapKet: 'Giờ tập kết', soThung: 'Số thùng rác', donViThu: 'Đơn vị thu gom', dientich: 'Diện tích', succhua: 'Sức chứa (xe)', loai: 'Loại',
    kichthuoc: 'Kích thước', chuso: 'Chủ sở hữu', giayphep: 'Giấy phép', hethan: 'Hết hạn giấy phép', hanhvi: 'Hành vi vi phạm', ngayphathien: 'Ngày phát hiện', xuly: 'Kết quả xử lý',
    chuthe: 'Chủ thể', sanpham: 'Sản phẩm', sanluong: 'Sản lượng', chungnhan: 'Chứng nhận chất lượng', mavungtrong: 'Mã số vùng trồng', congsuat: 'Công suất', laodong: 'Lao động (người)',
    hang: 'Hạng OCOP', namcongnhan: 'Năm công nhận', gia: 'Giá tham khảo', mota: 'Mô tả', giomo: 'Giờ mở cửa', sosp: 'Số sản phẩm bày bán', lienhe: 'Liên hệ',
    cot: 'Loại cột', tuyen: 'Tuyến', tudien: 'Tủ điện', duongkinh: 'Đường kính', huongthoat: 'Hướng thoát', nap: 'Nắp hố ga', chieucao: 'Chiều cao', tuoi: 'Tuổi cây',
    nguon: 'Nguồn nước', apluc: 'Áp lực', hodan: 'Số hộ cấp nước', namxaydung: 'Năm xây dựng', quymo: 'Quy mô',
    maCam: 'Mã thiết bị', loaicam: 'Loại camera', dophangiai: 'Độ phân giải', huong: 'Hướng quan sát', tamnhin: 'Tầm quan sát', gocnhin: 'Góc quan sát',
    truyendan: 'Đường truyền', luutru: 'Thời gian lưu trữ', ketnoi: 'Tình trạng kết nối', ngaylap: 'Ngày lắp đặt', chucnang: 'Chức năng', diachiip: 'Địa chỉ IP / luồng'
  };
  const COND = {
    tot: { label: 'Tốt', color: '#20a04e' },
    kha: { label: 'Khá', color: '#7bb661' },
    trungbinh: { label: 'Trung bình', color: '#e0a526' },
    xuongcap: { label: 'Xuống cấp', color: '#e5732b' },
    hong: { label: 'Hư hỏng / cần xử lý', color: '#df2225' }
  };
  const APPROVAL = {
    nhap: { label: 'Nháp', cls: '' },
    choduyet: { label: 'Chờ duyệt', cls: 'warn' },
    daduyet: { label: 'Đã duyệt', cls: 'ok' },
    tralai: { label: 'Trả lại', cls: 'danger' }
  };
  const UNITS = ['Bộ phận Kinh tế – Hạ tầng – Đô thị', 'Bộ phận Văn hóa – Xã hội', 'Đội Quản lý trật tự đô thị', 'Công ty CP Cấp nước Đồng Tháp', 'Điện lực Cao Lãnh', 'Ban Quản lý dự án phường'];
  const STAFF = [
    { id: 'NV01', name: 'Trần Minh Khoa', role: 'congchuc', unit: 0, phone: '0913 456 789' },
    { id: 'NV02', name: 'Nguyễn Thị Bích Hằng', role: 'congchuc', unit: 0, phone: '0918 234 567' },
    { id: 'NV03', name: 'Lê Văn Tài', role: 'congchuc', unit: 2, phone: '0939 876 543' },
    { id: 'NV04', name: 'Phạm Thị Mỹ Duyên', role: 'congchuc', unit: 1, phone: '0947 111 222' },
    { id: 'LD01', name: 'Võ Thanh Phong', role: 'truongbp', unit: 0, phone: '0909 555 666' },
    { id: 'LD02', name: 'Huỳnh Ngọc Lan', role: 'lanhdao', unit: 0, phone: '0903 777 888' },
    { id: 'QT01', name: 'Đặng Quốc Bảo', role: 'quantri', unit: 0, phone: '0977 333 444' }
  ];
  const PERIODS = [
    { id: '2025-Q4', name: 'Quý IV/2025', from: '2025-10-01', to: '2025-12-31', status: 'dong' },
    { id: '2026-Q1', name: 'Quý I/2026', from: '2026-01-01', to: '2026-03-31', status: 'dong' },
    { id: '2026-Q2', name: 'Quý II/2026', from: '2026-04-01', to: '2026-06-30', status: 'dong' },
    { id: '2026-Q3', name: 'Quý III/2026', from: '2026-07-01', to: '2026-09-30', status: 'mo' }
  ];
  const GRADES = [
    { id: 'tot', label: 'Tốt', min: 80, color: '#167a3c' },
    { id: 'kha', label: 'Khá', min: 65, color: '#7bb661' },
    { id: 'tb', label: 'Trung bình', min: 50, color: '#e0a526' },
    { id: 'kem', label: 'Kém', min: 0, color: '#df2225' }
  ];
  const INC_STATE = {
    moi: { label: 'Mới tiếp nhận', color: '#df2225' },
    phancong: { label: 'Đã phân công', color: '#e0a526' },
    dangxuly: { label: 'Đang xử lý', color: '#2f6fd6' },
    hoanthanh: { label: 'Đã khắc phục', color: '#20a04e' }
  };

  // ---------- sinh ngẫu nhiên có hạt giống ----------
  let seed = 20260916;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const pad = (n, l) => String(n).padStart(l || 2, '0');
  const r4 = v => Math.round(v * 1e5) / 1e5;
  const dateBack = d => { const t = new Date(TODAY); t.setDate(t.getDate() - d); return t.toISOString().slice(0, 10); };
  const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const khuOf = pt => {
    const dy = pt[0] - CENTER[0], dx = pt[1] - CENTER[1];
    const ang = Math.atan2(dy, dx) + Math.PI;
    return KHU[Math.min(11, Math.floor(ang / (Math.PI * 2) * 12))];
  };

  // ---------- lưới đường mô phỏng ----------
  const ROADS = G.ROADS;
  const HEMS = G.HEMS;
  const along = (pts, step) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const d = Math.hypot((b[0] - a[0]) * 111000, (b[1] - a[1]) * 108000);
      const n = Math.max(1, Math.round(d / step));
      for (let k = 0; k < n; k++) out.push([r4(a[0] + (b[0] - a[0]) * k / n), r4(a[1] + (b[1] - a[1]) * k / n)]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const lineLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot((pts[i][0] - pts[i - 1][0]) * 111000, (pts[i][1] - pts[i - 1][1]) * 108000); return Math.round(s); };
  const offset = (pts, d) => pts.map(p => [r4(p[0] + d), r4(p[1] + d * 0.6)]);
  // Góc phương vị (độ, 0 = hướng Bắc) từ điểm a tới điểm b và tên hướng tiếng Việt
  const bearing = (a, b) => (Math.atan2((b[1] - a[1]) * Math.cos(a[0] * Math.PI / 180), b[0] - a[0]) * 180 / Math.PI + 360) % 360;
  const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
  const dirName = deg => DIRS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
  const randPt = () => { for (let k = 0; k < 80; k++) { const near = rnd() < 0.7; const p = near ? [r4(10.445 + rnd() * 0.03), r4(105.59 + rnd() * 0.05)] : [r4(BB[0] + rnd() * (BB[2] - BB[0])), r4(BB[1] + rnd() * (BB[3] - BB[1]))]; if (inPoly(p, BOUNDARY)) return p; } return CENTER.slice(); };
  const squareAround = (c, s) => [[r4(c[0] - s), r4(c[1] - s * 1.1)], [r4(c[0] - s * 0.9), r4(c[1] + s * 1.2)], [r4(c[0] + s * 1.1), r4(c[1] + s)], [r4(c[0] + s), r4(c[1] - s * 1.05)]];

  // ---------- sinh đối tượng ----------
  function build() {
    seed = 20260916;
    const objs = [];
    const counters = {};
    const add = (group, type, name, geom, attrs, o) => {
      o = o || {};
      counters[type] = (counters[type] || 0) + 1;
      const code = { dothi: 'DT', nongsan: 'NS', hatang: 'HT' }[group] + '-' + type.toUpperCase().slice(0, 3) + '-' + pad(counters[type], 3);
      const anchor = geom.type === 'point' ? geom.coords : geom.coords[Math.floor(geom.coords.length / 2)];
      const cond = o.cond || pick(['tot', 'tot', 'tot', 'kha', 'kha', 'trungbinh', 'trungbinh', 'xuongcap', 'hong']);
      const updated = o.updated || dateBack(ri(0, 240));
      const by = o.by || pick(['NV01', 'NV02', 'NV03', 'NV04']);
      const obj = {
        id: code, code, group, type, name, geom, cond, unit: o.unit != null ? o.unit : (group === 'hatang' ? pick([0, 3, 4, 5]) : group === 'dothi' ? pick([0, 2]) : 1),
        khu: khuOf(anchor), approval: o.approval || 'daduyet', public: o.public != null ? o.public : (group === 'nongsan' || (group === 'dothi' && (type === 'phovanminh' || type === 'baidoxe' || type === 'duong'))),
        photos: o.photos != null ? o.photos : ri(1, 3), docs: o.docs || [], attrs: attrs || {}, updated, createdBy: by, created: dateBack(ri(240, 400)),
        history: [{ at: updated, who: by, what: 'Cập nhật hiện trạng: ' + COND[cond].label }],
        note: o.note || ''
      };
      if (o.returnReason) obj.returnReason = o.returnReason;
      objs.push(obj);
      return obj;
    };

    // Đô thị
    ROADS.forEach(r => {
      add('dothi', r.pvm ? 'phovanminh' : 'duong', r.name, { type: 'line', coords: r.pts }, { chieudai: lineLen(r.pts), rong: r.w, matduong: pick(['Bê tông nhựa', 'Bê tông xi măng', 'Láng nhựa']), namdautu: ri(2008, 2023), viahe: pick(['Có', 'Có', 'Một bên', 'Không']) }, { docs: ['Hồ sơ hoàn công.pdf'] });
    });
    HEMS.forEach(h => add('dothi', 'hem', h.name, { type: 'line', coords: h.pts }, { chieudai: lineLen(h.pts), rong: ri(3, 6), matduong: pick(['Bê tông xi măng', 'Láng nhựa', 'Đất']), namdautu: ri(2005, 2022) }));
    for (let i = 0; i < 16; i++) { const p = randPt(); add('dothi', 'tapketrac', 'Điểm tập kết rác ' + pad(i + 1), { type: 'point', coords: p }, { gioTapKet: pick(['17:00–19:00', '18:00–20:00', '05:00–07:00']), soThung: ri(2, 8), donViThu: 'Công ty CP Đô thị Đồng Tháp' }); }
    for (let i = 0; i < 5; i++) { const p = randPt(); add('dothi', 'baidoxe', 'Bãi đỗ xe ' + ['Chợ Cao Lãnh', 'Công viên Văn Miếu', 'Bến tàu', 'Trung tâm hành chính', 'Khu dân cư mới'][i], { type: 'polygon', coords: squareAround(p, 0.0006) }, { dientich: ri(400, 2500) + ' m²', succhua: ri(40, 300), loai: pick(['Ô tô + xe máy', 'Xe máy', 'Ô tô']) }); }
    for (let i = 0; i < 18; i++) { const p = randPt(); add('dothi', 'bienqc', 'Biển quảng cáo ' + pad(i + 1), { type: 'point', coords: p }, { kichthuoc: pick(['3×6 m', '4×8 m', '2×4 m', '5×10 m']), chuso: pick(['Công ty TNHH Quảng cáo Sen Việt', 'Hộ kinh doanh Minh Tâm', 'Công ty CP Truyền thông Đồng Tháp']), giayphep: rnd() < 0.8 ? 'GP-' + ri(100, 999) + '/2025' : 'Chưa có', hethan: dateBack(ri(-300, 200)) }); }
    for (let i = 0; i < 12; i++) { const p = randPt(); add('dothi', 'vipham', 'Vi phạm TTĐT ' + pad(i + 1), { type: 'point', coords: p }, { hanhvi: pick(['Lấn chiếm vỉa hè kinh doanh', 'Xây dựng không phép', 'Đổ rác không đúng nơi', 'Treo biển hiệu sai quy định', 'Đậu xe sai quy định']), ngayphathien: dateBack(ri(1, 120)), xuly: pick(['Đã lập biên bản', 'Đã nhắc nhở', 'Đang xử lý', 'Đã khắc phục']) }, { cond: pick(['hong', 'xuongcap', 'trungbinh']), public: false }); }

    // Nông sản
    const crops = ['Xoài Cao Lãnh', 'Sen', 'Lúa chất lượng cao', 'Rau an toàn', 'Nhãn', 'Ổi', 'Cá tra (ao nuôi)', 'Hoa kiểng'];
    for (let i = 0; i < 9; i++) {
      const p = [r4(10.415 + rnd() * 0.03), r4(105.6 + rnd() * 0.08)];
      const crop = crops[i % crops.length];
      add('nongsan', 'vungtrong', 'Vùng trồng ' + crop.toLowerCase() + ' ' + pad(i + 1), { type: 'polygon', coords: squareAround(p, 0.0009 + rnd() * 0.0008) },
        { chuthe: pick(['HTX Nông sản Cao Lãnh', 'Tổ hợp tác Sen Tháp Mười', 'Hộ Nguyễn Văn Bé', 'HTX Xoài Mỹ Xương', 'Hộ Trần Thị Sáu']), sanpham: crop, dientich: ri(2, 25) + ',' + ri(0, 9) + ' ha', sanluong: ri(20, 300) + ' tấn/năm', chungnhan: pick(['VietGAP', 'VietGAP', 'GlobalGAP', 'Hữu cơ', 'Chưa có']), mavungtrong: rnd() < 0.7 ? 'VN-DT-' + ri(1000, 9999) : 'Chưa cấp' }, { cond: pick(['tot', 'tot', 'kha']) });
    }
    const cosos = ['Cơ sở sơ chế xoài Minh Phát', 'Cơ sở chế biến hạt sen Sen Vàng', 'Xưởng sấy trái cây Hoa Sen', 'Cơ sở sản xuất nem Cao Lãnh', 'Cơ sở chế biến khô cá Ba Khía', 'Xưởng đóng gói rau an toàn', 'Cơ sở sản xuất bánh phồng tôm', 'Cơ sở ép dầu mè Hai Lúa'];
    cosos.forEach(n => add('nongsan', 'coso', n, { type: 'point', coords: randPt() }, { chuthe: pick(['Hộ kinh doanh', 'Công ty TNHH', 'HTX']), sanpham: pick(['Xoài sấy', 'Hạt sen', 'Trái cây sấy', 'Nem', 'Khô cá', 'Rau', 'Bánh phồng', 'Dầu mè']), congsuat: ri(1, 20) + ' tấn/tháng', chungnhan: pick(['ATTP', 'ISO 22000', 'HACCP', 'ATTP']), laodong: ri(5, 60), mota: 'Cơ sở sản xuất tại phường Cao Lãnh, sử dụng nguyên liệu địa phương.' }, { cond: pick(['tot', 'kha', 'kha']) }));
    const ocops = [['Xoài sấy dẻo Cao Lãnh', '4 sao'], ['Hạt sen sấy Sen Vàng', '4 sao'], ['Trà tim sen', '3 sao'], ['Nem Cao Lãnh', '3 sao'], ['Khô cá lóc Ba Khía', '3 sao'], ['Bánh phồng tôm Sa Giang', '4 sao'], ['Mật ong hoa nhãn', '3 sao'], ['Rượu sen Tháp Mười', '3 sao'], ['Xoài cát chu tươi', '4 sao'], ['Dầu mè nguyên chất', '3 sao']];
    ocops.forEach(o => add('nongsan', 'ocop', o[0], { type: 'point', coords: randPt() }, { chuthe: pick(cosos), hang: o[1], namcongnhan: ri(2021, 2025), gia: ri(45, 320) + '.000 đ', mota: 'Sản phẩm đặc trưng của phường Cao Lãnh, được chế biến từ nguyên liệu tại địa phương theo quy trình bảo đảm an toàn thực phẩm.' }, { cond: 'tot' }));
    ['Điểm bán OCOP Chợ Cao Lãnh', 'Cửa hàng nông sản sạch Sen Hồng', 'Gian hàng đặc sản Bến Tàu', 'Điểm giới thiệu sản phẩm HTX', 'Quầy nông sản Công viên Văn Miếu', 'Điểm bán xoài Mỹ Xương'].forEach(n => add('nongsan', 'diemban', n, { type: 'point', coords: randPt() }, { chuthe: pick(['UBND phường', 'HTX Nông sản Cao Lãnh', 'Hộ kinh doanh']), giomo: '07:00–20:00', sosp: ri(8, 40), lienhe: '09' + ri(10, 99) + ' ' + ri(100, 999) + ' ' + ri(100, 999), mota: 'Điểm giới thiệu và bán sản phẩm nông sản, OCOP của địa phương.' }, { cond: 'tot' }));

    // Hạ tầng kỹ thuật
    const lampYears = [2012, 2015, 2018, 2019, 2021, 2023];
    ROADS.forEach((r, ri_) => {
      if (ri_ > 6) return;
      along(r.pts, 140).forEach((p, k) => {
        add('hatang', 'chieusang', 'Đèn chiếu sáng ' + r.name.replace('Đường ', '') + ' #' + pad(k + 1), { type: 'point', coords: [r4(p[0] + 0.00008), r4(p[1] + 0.00008)] },
          { loai: pick(['LED 100W', 'LED 150W', 'Cao áp 250W', 'LED 60W']), cot: pick(['Cột thép 8 m', 'Cột thép 10 m', 'Cột bê tông']), tuyen: r.name, tudien: 'TĐ-' + pad(ri_ + 1) }, { cond: pick(['tot', 'tot', 'tot', 'kha', 'trungbinh', 'hong']) });
      });
      const drain = offset(r.pts, -0.00012);
      add('hatang', 'thoatnuoc', 'Tuyến thoát nước ' + r.name.replace('Đường ', ''), { type: 'line', coords: drain }, { loai: pick(['Cống hộp', 'Cống tròn BTCT', 'Mương hở']), duongkinh: pick(['D600', 'D800', 'D1000', '1,2×1,2 m']), chieudai: lineLen(drain), huongthoat: pick(['Ra sông Cao Lãnh', 'Ra kênh Hòa Đông', 'Ra rạch Cái Sao']) }, { cond: pick(['tot', 'kha', 'trungbinh', 'xuongcap']), docs: ['Bản vẽ tuyến cống.dwg'] });
      along(drain, 220).forEach((p, k) => add('hatang', 'hoga', 'Hố ga ' + r.name.replace('Đường ', '') + ' #' + pad(k + 1), { type: 'point', coords: p }, { loai: pick(['Hố ga thu nước', 'Hố ga thăm']), nap: pick(['Gang', 'BTCT', 'Composite']), tuyen: r.name }, { cond: pick(['tot', 'tot', 'kha', 'trungbinh', 'hong']) }));
      if (ri_ < 5) along(r.pts, 90).forEach((p, k) => { if (k % 2) return; add('hatang', 'cayxanh', pick(['Dầu rái', 'Sao đen', 'Bằng lăng', 'Me tây', 'Lim xẹt', 'Phượng vĩ']) + ' – ' + r.name.replace('Đường ', '') + ' #' + pad(k + 1), { type: 'point', coords: [r4(p[0] - 0.00009), r4(p[1] - 0.00006)] }, { duongkinh: ri(15, 70) + ' cm', chieucao: ri(4, 18) + ' m', tuoi: ri(3, 40) + ' năm', tuyen: r.name }, { cond: pick(['tot', 'tot', 'kha', 'trungbinh', 'xuongcap']) }); });
    });
    // Camera giám sát gắn trên các tuyến đường: vị trí, hướng và vùng quan sát
    const CAM_KINDS = [
      { k: 'Camera cố định', fov: 70, range: 110, ai: 'Giám sát an ninh, trật tự đô thị' },
      { k: 'Camera PTZ xoay 360°', fov: 120, range: 180, ai: 'Quan sát toàn cảnh nút giao, phóng to theo yêu cầu' },
      { k: 'Camera AI nhận dạng biển số', fov: 55, range: 90, ai: 'Nhận dạng biển số, đếm lưu lượng phương tiện' },
      { k: 'Camera cố định', fov: 70, range: 120, ai: 'Giám sát vệ sinh môi trường, đổ rác không đúng nơi' }
    ];
    ROADS.forEach((r, ri_) => {
      if (ri_ > 8) return;
      const line = along(r.pts, 420);
      line.forEach((p, k) => {
        if (k === line.length - 1) return;
        const kind = CAM_KINDS[(ri_ + k) % CAM_KINDS.length];
        const dir = Math.round(bearing(p, line[k + 1]) + (k % 2 ? 0 : 180)) % 360;
        const online = rnd() > 0.12;
        const code = 'CAM-' + pad(ri_ + 1) + pad(k + 1);
        const o = add('hatang', 'camera', 'Camera ' + r.name.replace('Đường ', '') + ' #' + pad(k + 1), { type: 'point', coords: [r4(p[0] + 0.00007), r4(p[1] - 0.00007)] },
          {
            maCam: code, loaicam: kind.k, dophangiai: pick(['2 MP (1080p)', '4 MP (2K)', '4 MP (2K)', '8 MP (4K)']), huong: dirName(dir) + ' (' + dir + '°)',
            tamnhin: kind.range + ' m', gocnhin: kind.fov + '°', truyendan: pick(['Cáp quang', 'Cáp quang', '4G']), luutru: pick([15, 30, 30, 45]) + ' ngày',
            ketnoi: online ? 'Trực tuyến' : 'Mất kết nối', ngaylap: dateBack(ri(200, 1500)), chucnang: kind.ai, tuyen: r.name, diachiip: '10.30.' + (ri_ + 1) + '.' + ri(20, 240)
          },
          { unit: 2, cond: online ? pick(['tot', 'tot', 'kha']) : pick(['xuongcap', 'hong']), public: false, photos: 2 });
        o.cam = { code, dir, fov: kind.fov, range: kind.range, online, road: r.name };
      });
    });
    ['Trạm cấp nước Cao Lãnh 1', 'Trạm cấp nước Hòa Thuận', 'Trạm bơm tăng áp Bến Tàu'].forEach((n, i) => add('hatang', 'tramcapnuoc', n, { type: 'point', coords: randPt() }, { congsuat: [12000, 5000, 3000][i].toLocaleString('vi-VN') + ' m³/ngày', nguon: pick(['Nước mặt sông Tiền', 'Nước ngầm']), apluc: ri(18, 30) + ' m', hodan: ri(800, 6000) }, { unit: 3, cond: pick(['tot', 'kha']) }));
    ['Trụ sở UBND phường', 'Trạm Y tế phường', 'Nhà văn hóa Tổ dân phố 3', 'Trường Tiểu học Chu Văn An', 'Trường THCS Kim Hồng', 'Công viên Văn Miếu', 'Sân thể thao phường', 'Chợ Cao Lãnh', 'Nhà vệ sinh công cộng Bến Tàu', 'Đài truyền thanh phường'].forEach(n => add('hatang', 'congtrinh', n, { type: 'point', coords: randPt() }, { loai: pick(['Trụ sở', 'Y tế', 'Văn hóa', 'Giáo dục', 'Công viên', 'Thể thao', 'Thương mại']), dientich: ri(300, 12000).toLocaleString('vi-VN') + ' m²', namxaydung: ri(1995, 2022), quymo: pick(['1 tầng', '2 tầng', '3 tầng', 'Khu tổng hợp']) }, { cond: pick(['tot', 'kha', 'trungbinh']) }));

    // Thông tin vòng đời cho hạ tầng
    objs.filter(o => o.group === 'hatang').forEach(o => {
      o.life = {
        year: o.attrs.namxaydung || (o.attrs.ngaylap ? Number(o.attrs.ngaylap.slice(0, 4)) : pick(lampYears)),
        inspections: Array.from({ length: ri(1, 3) }, () => ({ at: dateBack(ri(10, 400)), by: pick(STAFF.slice(0, 4)).id, result: pick(['Bình thường', 'Bình thường', 'Cần theo dõi', 'Phát hiện hư hỏng nhỏ']) })).sort((a, b) => b.at.localeCompare(a.at)),
        repairs: o.cond === 'tot' && rnd() < 0.6 ? [] : Array.from({ length: ri(0, 2) }, () => ({ at: dateBack(ri(30, 700)), what: pick(['Thay bóng đèn', 'Nạo vét bùn', 'Thay nắp hố ga', 'Sơn cột', 'Cắt tỉa cành', 'Sửa tủ điện', 'Thay ống D600']), cost: ri(5, 120) * 100000 })).sort((a, b) => b.at.localeCompare(a.at)),
        plan: rnd() < 0.35 ? { at: '2026-' + pad(ri(10, 12)) + '-' + pad(ri(1, 28)), what: pick(['Bảo trì định kỳ', 'Thay thế thiết bị', 'Nạo vét định kỳ', 'Sơn bảo dưỡng']), est: ri(10, 400) * 100000 } : null
      };
    });

    // Một số bản ghi chờ duyệt, trả lại, nháp
    const pending = [
      add('dothi', 'tapketrac', 'Điểm tập kết rác Hẻm 21 Lê Lợi', { type: 'point', coords: randPt() }, { gioTapKet: '18:00–20:00', soThung: 3, donViThu: 'Công ty CP Đô thị Đồng Tháp' }, { approval: 'choduyet', updated: dateBack(1), by: 'NV01', cond: 'trungbinh' }),
      add('hatang', 'chieusang', 'Đèn chiếu sáng bổ sung Hẻm 14 Nguyễn Huệ', { type: 'point', coords: randPt() }, { loai: 'LED 60W', cot: 'Cột thép 8 m', tuyen: 'Hẻm 14 Nguyễn Huệ', tudien: 'TĐ-01' }, { approval: 'choduyet', updated: dateBack(2), by: 'NV02', cond: 'tot' }),
      add('nongsan', 'ocop', 'Kẹo sen Tháp Mười', { type: 'point', coords: randPt() }, { chuthe: 'Cơ sở Sen Vàng', hang: '3 sao', namcongnhan: 2026, gia: '65.000 đ', mota: 'Sản phẩm mới đăng ký OCOP năm 2026.' }, { approval: 'choduyet', updated: dateBack(0), by: 'NV04', cond: 'tot' }),
      add('dothi', 'vipham', 'Lấn chiếm vỉa hè Nguyễn Huệ (đoạn chợ)', { type: 'point', coords: randPt() }, { hanhvi: 'Lấn chiếm vỉa hè kinh doanh', ngayphathien: dateBack(1), xuly: 'Đã nhắc nhở' }, { approval: 'choduyet', updated: dateBack(1), by: 'NV03', cond: 'hong', public: false }),
      add('hatang', 'cayxanh', 'Sao đen – Công viên Văn Miếu #12', { type: 'point', coords: randPt() }, { duongkinh: '45 cm', chieucao: '12 m', tuoi: '25 năm', tuyen: 'Công viên Văn Miếu' }, { approval: 'tralai', updated: dateBack(3), by: 'NV02', cond: 'xuongcap', returnReason: 'Thiếu ảnh hiện trạng và tọa độ nằm ngoài ranh giới công viên. Đề nghị khảo sát lại.' }),
      add('nongsan', 'vungtrong', 'Vùng trồng ổi Tổ dân phố 7', { type: 'polygon', coords: squareAround([10.4300, 105.6620], 0.0007) }, { chuthe: 'Hộ Lê Văn Năm', sanpham: 'Ổi', dientich: '1,8 ha', sanluong: '30 tấn/năm', chungnhan: 'Chưa có', mavungtrong: 'Chưa cấp' }, { approval: 'nhap', updated: dateBack(0), by: 'NV04', cond: 'kha', photos: 0 })
    ];
    pending.forEach(o => { o.history = [{ at: o.updated, who: o.createdBy, what: o.approval === 'tralai' ? 'Lãnh đạo bộ phận trả lại: ' + o.returnReason : o.approval === 'nhap' ? 'Lưu nháp' : 'Gửi duyệt' }]; });
    objs.slice(0, 40).forEach(o => { if (rnd() < 0.5) o.history.push({ at: dateBack(ri(60, 300)), who: pick(['NV01', 'NV02']), what: pick(['Cập nhật ảnh hiện trạng', 'Sửa thuộc tính kỹ thuật', 'Điều chỉnh vị trí trên bản đồ', 'Bổ sung tài liệu đính kèm']) }); });

    // ---------- Bộ tiêu chí ----------
    const CRITERIA = {
      dothi: [
        { id: 'DT1', name: 'Mỹ quan, vệ sinh môi trường', weight: 30, subs: [{ id: 'DT1a', name: 'Không có rác thải, vật liệu tồn đọng', max: 10 }, { id: 'DT1b', name: 'Cây xanh, vỉa hè gọn gàng', max: 10 }] },
        { id: 'DT2', name: 'Trật tự đô thị', weight: 30, subs: [{ id: 'DT2a', name: 'Không lấn chiếm vỉa hè, lòng đường', max: 10 }, { id: 'DT2b', name: 'Biển hiệu, quảng cáo đúng quy định', max: 10 }] },
        { id: 'DT3', name: 'Hạ tầng và an toàn giao thông', weight: 25, subs: [{ id: 'DT3a', name: 'Mặt đường, vỉa hè không hư hỏng', max: 10 }, { id: 'DT3b', name: 'Biển báo, vạch kẻ đầy đủ', max: 10 }] },
        { id: 'DT4', name: 'Sự tham gia của cộng đồng', weight: 15, subs: [{ id: 'DT4a', name: 'Tổ tự quản hoạt động', max: 10 }, { id: 'DT4b', name: 'Không có phản ánh tồn đọng', max: 10 }] }
      ],
      nongsan: [
        { id: 'NS1', name: 'Chất lượng và chứng nhận', weight: 35, subs: [{ id: 'NS1a', name: 'Chứng nhận VietGAP/GlobalGAP/hữu cơ', max: 10 }, { id: 'NS1b', name: 'Mã số vùng trồng, truy xuất nguồn gốc', max: 10 }] },
        { id: 'NS2', name: 'Quy mô và hiệu quả sản xuất', weight: 25, subs: [{ id: 'NS2a', name: 'Diện tích/sản lượng ổn định', max: 10 }, { id: 'NS2b', name: 'Liên kết tiêu thụ', max: 10 }] },
        { id: 'NS3', name: 'Tuân thủ an toàn thực phẩm, môi trường', weight: 25, subs: [{ id: 'NS3a', name: 'Sổ nhật ký sản xuất', max: 10 }, { id: 'NS3b', name: 'Thu gom bao bì thuốc BVTV', max: 10 }] },
        { id: 'NS4', name: 'Ứng dụng công nghệ, quảng bá', weight: 15, subs: [{ id: 'NS4a', name: 'Có tem QR, kênh bán trực tuyến', max: 10 }, { id: 'NS4b', name: 'Tham gia hội chợ, điểm giới thiệu', max: 10 }] }
      ],
      hatang: [
        { id: 'HT1', name: 'Tình trạng kỹ thuật', weight: 40, subs: [{ id: 'HT1a', name: 'Hoạt động ổn định, không hư hỏng', max: 10 }, { id: 'HT1b', name: 'Đúng thông số thiết kế', max: 10 }] },
        { id: 'HT2', name: 'Bảo trì, bảo dưỡng', weight: 25, subs: [{ id: 'HT2a', name: 'Kiểm tra định kỳ đúng lịch', max: 10 }, { id: 'HT2b', name: 'Xử lý sự cố đúng hạn', max: 10 }] },
        { id: 'HT3', name: 'An toàn và mỹ quan', weight: 20, subs: [{ id: 'HT3a', name: 'Không gây mất an toàn cho người dân', max: 10 }, { id: 'HT3b', name: 'Hình thức bên ngoài', max: 10 }] },
        { id: 'HT4', name: 'Hồ sơ quản lý', weight: 15, subs: [{ id: 'HT4a', name: 'Hồ sơ, bản vẽ đầy đủ', max: 10 }, { id: 'HT4b', name: 'Lý lịch sửa chữa cập nhật', max: 10 }] }
      ]
    };
    const criteriaSets = [];
    PERIODS.forEach(p => Object.keys(CRITERIA).forEach(g => criteriaSets.push({ id: 'BTC-' + g.toUpperCase() + '-' + p.id, group: g, period: p.id, criteria: JSON.parse(JSON.stringify(CRITERIA[g])), status: p.status === 'mo' ? 'banhanh' : 'khoa' })));

    // ---------- Đối tượng thuộc diện đánh giá và điểm các kỳ ----------
    const EVAL_TYPES = { dothi: ['duong', 'phovanminh', 'hem'], nongsan: ['vungtrong', 'coso'], hatang: ['thoatnuoc', 'tramcapnuoc', 'congtrinh'] };
    const scores = [];
    const condBase = { tot: 8.6, kha: 7.6, trungbinh: 6.4, xuongcap: 5.2, hong: 4.0 };
    objs.filter(o => o.approval === 'daduyet' && EVAL_TYPES[o.group].includes(o.type)).forEach(o => {
      o.evaluated = true;
      const base = condBase[o.cond] + (rnd() - 0.5);
      PERIODS.forEach((p, pi) => {
        const isCur = p.status === 'mo';
        if (isCur && rnd() < 0.35) return;
        const drift = (pi - 3) * (rnd() * 0.5) * (rnd() < 0.6 ? 1 : -1);
        const values = {};
        CRITERIA[o.group].forEach(c => c.subs.forEach(s => { values[s.id] = Math.max(2, Math.min(10, Math.round((base + drift + (rnd() - 0.5) * 2) * 2) / 2)); }));
        scores.push({ id: 'PC-' + o.id + '-' + p.id, objId: o.id, period: p.id, values, evidence: ri(1, 3), by: pick(['NV01', 'NV02', 'NV03', 'NV04']), at: isCur ? dateBack(ri(1, 40)) : p.to, status: isCur ? pick(['daduyet', 'daduyet', 'guiduyet', 'nhap']) : 'daduyet', note: '' });
      });
    });

    // ---------- Sự cố hạ tầng ----------
    const incTitles = [['Đèn không sáng', 'chieusang'], ['Nắp hố ga bị mất', 'hoga'], ['Ngập cục bộ khi mưa lớn', 'thoatnuoc'], ['Cây nghiêng có nguy cơ đổ', 'cayxanh'], ['Cống bị nghẹt', 'thoatnuoc'], ['Cột đèn bị xe tông nghiêng', 'chieusang'], ['Rò rỉ ống nước', 'tramcapnuoc'], ['Vỡ nắp hố ga', 'hoga'], ['Đèn chớp tắt', 'chieusang'], ['Bùn đất tràn cống', 'thoatnuoc'], ['Camera mất tín hiệu', 'camera'], ['Camera lệch hướng quan sát, che khuất tầm nhìn', 'camera']];
    const incidents = [];
    const states = ['moi', 'phancong', 'dangxuly', 'hoanthanh', 'hoanthanh', 'hoanthanh'];
    for (let i = 0; i < 26; i++) {
      const t = pick(incTitles);
      const o = pick(objs.filter(x => x.type === t[1] && x.approval === 'daduyet'));
      const state = states[i % states.length];
      const reported = dateBack(state === 'hoanthanh' ? ri(5, 150) : ri(0, 20));
      const deadline = new Date(reported); deadline.setDate(deadline.getDate() + ri(3, 14));
      const inc = {
        id: 'SC-' + pad(i + 1, 3), objId: o.id, title: t[0], type: o.type, loc: o.geom.type === 'point' ? o.geom.coords : o.geom.coords[1],
        source: pick(['Khảo sát hiện trường', 'Phản ánh người dân', 'Tổng đài 1022', 'Tuần tra']), reported, by: pick(['NV01', 'NV03']),
        assignee: state === 'moi' ? null : pick(['NV01', 'NV02', 'NV03']), deadline: deadline.toISOString().slice(0, 10), state,
        done: state === 'hoanthanh' ? dateBack(ri(0, 4)) : null, priority: pick(['cao', 'trungbinh', 'trungbinh', 'thap']), photos: ri(1, 2),
        log: [{ at: reported, who: 'Hệ thống', what: 'Tiếp nhận sự cố' }]
      };
      if (inc.done && inc.done < reported) inc.done = reported;
      incidents.push(inc);
    }
    const rep = incidents.find(i => i.type === 'thoatnuoc') || incidents[0];
    for (let k = 0; k < 3; k++) incidents.push(Object.assign({}, rep, { id: 'SC-' + pad(27 + k, 3), reported: dateBack(ri(160, 400)), state: 'hoanthanh', done: dateBack(ri(150, 159)), assignee: 'NV01', log: [{ at: dateBack(200), who: 'Hệ thống', what: 'Tiếp nhận sự cố' }] }));

    // ---------- Tài khoản, phân quyền, nhật ký ----------
    const ROLES = [
      { id: 'lanhdao', name: 'Lãnh đạo UBND phường', desc: 'Khai thác bảng điều khiển, báo cáo, so sánh kỳ' },
      { id: 'truongbp', name: 'Lãnh đạo bộ phận', desc: 'Phê duyệt dữ liệu, cấu hình bộ tiêu chí' },
      { id: 'congchuc', name: 'Công chức chuyên môn', desc: 'Nhập liệu, khảo sát thực địa, chấm điểm' },
      { id: 'quantri', name: 'Quản trị hệ thống', desc: 'Tài khoản, phân quyền, nhật ký' },
      { id: 'nguoidan', name: 'Người dân', desc: 'Tra cứu lớp thông tin công khai, không cần đăng nhập' }
    ];
    const ACTIONS = [['xem', 'Xem'], ['them', 'Thêm'], ['sua', 'Sửa'], ['xoa', 'Xóa'], ['duyet', 'Duyệt']];
    const perms = {};
    ROLES.forEach(r => { perms[r.id] = {}; Object.keys(GROUPS).forEach(g => {
      perms[r.id][g] = r.id === 'quantri' ? { xem: 1, them: 1, sua: 1, xoa: 1, duyet: 1 }
        : r.id === 'truongbp' ? { xem: 1, them: 1, sua: 1, xoa: 0, duyet: 1 }
          : r.id === 'congchuc' ? { xem: 1, them: 1, sua: 1, xoa: g !== 'hatang' ? 1 : 0, duyet: 0 }
            : r.id === 'lanhdao' ? { xem: 1, them: 0, sua: 0, xoa: 0, duyet: 0 } : { xem: 0, them: 0, sua: 0, xoa: 0, duyet: 0 };
    }); });
    const accounts = STAFF.map(s => ({ id: s.id, name: s.name, role: s.role, unit: UNITS[s.unit], phone: s.phone, email: s.id.toLowerCase() + '@caolanh.dongthap.gov.vn', active: true, last: dateBack(ri(0, 6)) + ' ' + pad(ri(7, 17)) + ':' + pad(ri(0, 59)) }));
    accounts.push({ id: 'NV05', name: 'Bùi Thị Kim Chi', role: 'congchuc', unit: UNITS[1], phone: '0968 123 456', email: 'nv05@caolanh.dongthap.gov.vn', active: false, last: dateBack(90) + ' 09:12' });
    const audit = [];
    const acts = ['Đăng nhập hệ thống', 'Thêm đối tượng', 'Sửa thuộc tính đối tượng', 'Phê duyệt bản ghi', 'Chấm điểm đối tượng', 'Xuất báo cáo Excel', 'Nhập liệu hàng loạt (CSV)', 'Bật/tắt lớp dữ liệu', 'Trả lại bản ghi', 'Cập nhật sự cố'];
    for (let i = 0; i < 60; i++) { const s = pick(STAFF); audit.push({ at: dateBack(ri(0, 20)) + ' ' + pad(ri(7, 17)) + ':' + pad(ri(0, 59)), who: s.id, what: pick(acts), target: rnd() < 0.7 ? pick(objs).id : '', ip: '10.20.' + ri(1, 9) + '.' + ri(2, 250) }); }
    audit.sort((a, b) => b.at.localeCompare(a.at));

    return { version: VERSION, today: TODAY, objs, criteriaSets, scores, incidents, accounts, perms, audit, roles: ROLES, actions: ACTIONS, evalTypes: EVAL_TYPES, importLog: [] };
  }

  return { VERSION, TODAY, CENTER, BOUNDARY, KHU, AREAS, GROUPS, TYPE_ICO, TYPE_COLOR, ATTR_LABEL, COND, APPROVAL, UNITS, STAFF, PERIODS, GRADES, INC_STATE, build, inPoly };
})();
