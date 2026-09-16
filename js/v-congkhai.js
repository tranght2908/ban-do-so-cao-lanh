/* Lớp thông tin công khai cho người dân, doanh nghiệp: không cần đăng nhập, có chỉ đường. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U, ui = A.ui, M = A.MAP;
  const pb = ui.pub;
  let PH = null;
  const PUB_TYPES = [['', 'Tất cả'], ['vungtrong', '🌱 Vùng trồng'], ['coso', '🏭 Cơ sở sản xuất'], ['ocop', '🏷️ Sản phẩm OCOP'], ['diemban', '🛒 Điểm bán'], ['phovanminh', '🏅 Tuyến phố văn minh'], ['baidoxe', '🅿️ Bãi đỗ xe']];
  const pubObjs = () => { const q = pb.q.trim().toLowerCase(); return A.db.objs.filter(o => o.public && o.approval === 'daduyet' && (!pb.type || o.type === pb.type) && (!q || o.name.toLowerCase().includes(q) || (o.attrs.sanpham || '').toLowerCase().includes(q) || (o.attrs.chuthe || '').toLowerCase().includes(q))); };
  const dirLink = o => { const p = U.anchor(o); return `https://www.google.com/maps/dir/?api=1&destination=${p[0]},${p[1]}`; };

  A.VIEWS['cong-khai'] = function () {
    const objs = pubObjs();
    const sel = pb.sel ? A.idx.obj.get(pb.sel) : null;
    A.after = () => {
      PH = M.create('pubmap', { zoom: 14 }); if (!PH) return;
      M.draw(PH, objs, { sel: pb.sel, onClick: o => { pb.sel = o.id; A.render(); } });
      if (sel) M.focus(PH, sel); else M.fit(PH, objs);
    };
    return `<div class="pub-hero"><div style="font-size:44px">🌾</div><div><h2>Nông sản và đô thị phường Cao Lãnh</h2><p>Tra cứu vùng trồng, cơ sở sản xuất, sản phẩm OCOP – đặc trưng, điểm giới thiệu và bán sản phẩm, cùng các thông tin đô thị được công khai. Không cần đăng nhập, xem được trên điện thoại.</p></div><div class="spacer"></div><div class="small" style="opacity:.9">${objs.length} địa điểm đã công bố<br>Cập nhật ${U.dmy(U.today())}</div></div>
      <div class="card"><div class="card-b" style="padding-top:14px"><div class="row"><input class="input" style="flex:1;min-width:220px" placeholder="Tìm sản phẩm, cơ sở, vùng trồng…" data-in="pub-q" value="${U.esc(pb.q)}"><div class="chips">${PUB_TYPES.map(t => `<button class="${pb.type === t[0] ? 'on' : ''}" data-act="pub-type" data-t="${t[0]}">${t[1]}</button>`).join('')}</div></div></div></div>
      <div class="pub-layout">
        <div class="card"><div class="card-b" style="padding-top:12px"><div class="map-box"><div class="lmap" id="pubmap"></div><div class="map-legend">${PUB_TYPES.slice(1).map(t => `<span><i style="background:${D.TYPE_COLOR[t[0]]}"></i>${t[1].slice(3)}</span>`).join('')}</div></div></div></div>
        <div class="card">${sel ? detail(sel) : `<div class="card-h"><h3>Địa điểm</h3><span class="tag info">${objs.length}</span></div><div class="card-b"><div class="obj-list" style="max-height:420px;overflow-y:auto">${objs.slice(0, 40).map(o => `<div class="obj-item" data-act="pub-sel" data-id="${o.id}"><div class="t">${D.TYPE_ICO[o.type]} ${U.esc(o.name)}</div><div class="small muted">${U.typeName(o.type)}${o.attrs.hang ? ' · OCOP ' + o.attrs.hang : ''}${o.attrs.sanpham ? ' · ' + U.esc(o.attrs.sanpham) : ''} · ${o.khu}</div></div>`).join('') || '<div class="empty">Không tìm thấy địa điểm phù hợp</div>'}</div></div>`}</div>
      </div>
      <h3 style="font-size:16px">Sản phẩm OCOP, sản phẩm đặc trưng</h3>
      <div class="pub-grid">${A.db.objs.filter(o => o.type === 'ocop' && o.approval === 'daduyet' && o.public).slice(0, 6).map(o => `<div class="card pub-card" data-act="pub-sel" data-id="${o.id}">${U.photo(o, 0, 'lg')}<div class="pb"><div class="t">${U.esc(o.name)}</div><div class="small muted">${U.esc(o.attrs.chuthe)} · OCOP ${o.attrs.hang} (${o.attrs.namcongnhan})</div><div class="row" style="justify-content:space-between;margin-top:6px"><b>${o.attrs.gia}</b><span class="small">📍 ${o.khu}</span></div></div></div>`).join('')}</div>
      <div class="small muted" style="text-align:center">Cổng thông tin công khai của UBND phường Cao Lãnh · Dữ liệu được công bố sau khi phê duyệt · Góp ý: 0277 3xxx xxx</div>`;
  };
  function detail(o) {
    const p = U.anchor(o);
    const attrs = Object.keys(o.attrs).filter(k => k !== 'mota');
    return `<div class="card-h"><button class="btn sm" data-act="pub-sel" data-id="">‹ Danh sách</button></div><div class="card-b">
      ${U.photo(o, 0, 'lg')}<div class="photo-strip" style="margin-top:6px">${U.photos(o, 3)}</div>
      <h3 style="font-size:17px;margin-top:10px">${D.TYPE_ICO[o.type]} ${U.esc(o.name)}</h3><div class="small muted">${U.typeName(o.type)} · ${o.khu}</div>
      ${o.attrs.mota ? `<p class="small" style="margin:8px 0">${U.esc(o.attrs.mota)}</p>` : ''}
      <div class="attr-grid" style="margin-top:8px">${attrs.map(k => `<div><b>${U.attrLabel(k)}</b>${U.esc(o.attrs[k])}</div>`).join('')}</div>
      <div class="divider"></div>
      <div class="row"><a class="btn primary" href="${dirLink(o)}" target="_blank" rel="noopener">🧭 Chỉ đường</a><button class="btn" data-act="pub-share" data-id="${o.id}">🔗 Chia sẻ</button><span class="small muted">${U.coordTxt(p)}</span></div>
      ${o.attrs.lienhe ? `<div class="small" style="margin-top:8px">☎️ ${o.attrs.lienhe}</div>` : ''}</div>`;
  }
  A.IN['pub-q'] = el => { pb.q = el.value; pb.sel = null; A.render(); };
  A.ACT['pub-type'] = el => { pb.type = el.dataset.t; pb.sel = null; A.render(); };
  A.ACT['pub-sel'] = el => { pb.sel = el.dataset.id || null; A.render(); };
  A.ACT['pub-share'] = el => { const url = location.href.split('#')[0] + '#/cong-khai?id=' + el.dataset.id; try { navigator.clipboard.writeText(url); } catch (e) { /* bỏ qua */ } U.toast('Đã sao chép liên kết chia sẻ'); };
})(window.APP);
