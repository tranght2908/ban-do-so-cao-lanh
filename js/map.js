/* Bao bọc Leaflet: nền bản đồ, lớp đối tượng, công cụ đo/vẽ/tìm theo bán kính. */
(function (A) {
  'use strict';
  const D = A.D, U = A.U;
  const M = A.MAP = { handles: [] };
  const DENSE = { chieusang: 1, hoga: 1, cayxanh: 1 };

  M.bases = () => ({
    street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: 'Nền: © OpenStreetMap (mô phỏng nền bản đồ dùng chung của tỉnh)' }),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Ảnh vệ tinh: Esri World Imagery (mô phỏng)' })
  });

  M.create = function (el, opts) {
    opts = opts || {};
    const node = typeof el === 'string' ? document.getElementById(el) : el;
    if (!node) return null;
    const map = L.map(node, { center: opts.center || D.CENTER, zoom: opts.zoom || 14, zoomControl: opts.zoom !== false, preferCanvas: true, attributionControl: true });
    const bases = M.bases();
    const h = { map, bases, base: opts.base || 'street', objLayer: L.layerGroup().addTo(map), extra: L.layerGroup().addTo(map), tool: L.layerGroup().addTo(map), markers: new Map(), toolState: null };
    bases[h.base].addTo(map);
    if (opts.boundary !== false) M.boundary(h);
    M.handles.push(h);
    setTimeout(() => map.invalidateSize(), 60);
    return h;
  };
  M.destroyAll = function () { M.handles.forEach(h => { try { h.map.remove(); } catch (e) { /* bỏ qua */ } }); M.handles = []; };
  M.setBase = function (h, b) { if (h.base === b) return; h.map.removeLayer(h.bases[h.base]); h.base = b; h.bases[b].addTo(h.map); };
  M.boundary = function (h) {
    h.boundaryLayer = L.polygon(D.BOUNDARY, { color: '#0b4a9e', weight: 2, dashArray: '6 4', fill: false, interactive: false }).addTo(h.map);
  };
  M.areas = function (h, on) {
    if (h.areaLayer) { h.map.removeLayer(h.areaLayer); h.areaLayer = null; }
    if (!on) return;
    h.areaLayer = L.layerGroup(D.AREAS.map(a => L.polygon(a.poly, { color: '#7c54cd', weight: 1.5, fillOpacity: .06, interactive: false }).bindTooltip(a.name, { permanent: true, direction: 'center', className: 'measure-label' }))).addTo(h.map);
  };

  M.pin = (o, color, sel) => L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24], html: `<div class="pin ${sel ? 'sel' : ''}" style="background:${color}"><span>${D.TYPE_ICO[o.type] || '📍'}</span></div>` });

  // Vẽ danh sách đối tượng. opts: colorFn(o), onClick(o), sel (id), popup (bool)
  M.draw = function (h, objs, opts) {
    opts = opts || {};
    h.objLayer.clearLayers(); h.markers.clear();
    objs.forEach(o => {
      const color = opts.colorFn ? opts.colorFn(o) : U.color(o);
      const sel = opts.sel === o.id;
      let lyr;
      if (o.geom.type === 'point') {
        if (DENSE[o.type] && !sel) lyr = L.circleMarker(o.geom.coords, { radius: 5, color: '#fff', weight: 1, fillColor: color, fillOpacity: .95 });
        else lyr = L.marker(o.geom.coords, { icon: M.pin(o, color, sel) });
      } else if (o.geom.type === 'line') {
        lyr = L.polyline(o.geom.coords, { color, weight: sel ? 7 : 4, opacity: sel ? 1 : .85 });
      } else {
        lyr = L.polygon(o.geom.coords, { color, weight: sel ? 3 : 2, fillOpacity: sel ? .45 : .28 });
      }
      if (opts.popup !== false) lyr.bindTooltip(`<b>${U.esc(o.name)}</b><br><span class="muted">${U.typeName(o.type)} · ${D.COND[o.cond].label}</span>`, { sticky: true });
      if (opts.onClick) lyr.on('click', e => { L.DomEvent.stopPropagation(e); opts.onClick(o, e); });
      lyr.addTo(h.objLayer);
      h.markers.set(o.id, lyr);
    });
  };
  M.fit = function (h, objs, pad) {
    if (!objs || !objs.length) { h.map.setView(D.CENTER, 14); return; }
    const pts = [];
    objs.forEach(o => { if (o.geom.type === 'point') pts.push(o.geom.coords); else o.geom.coords.forEach(c => pts.push(c)); });
    h.map.fitBounds(L.latLngBounds(pts), { padding: [pad || 30, pad || 30], maxZoom: 17 });
  };
  M.focus = function (h, o) {
    const p = U.anchor(o);
    h.map.setView(p, Math.max(h.map.getZoom(), 16), { animate: true });
  };

  // ---------- công cụ ----------
  M.stopTool = function (h) {
    if (h.toolState && h.toolState.cleanup) h.toolState.cleanup();
    h.tool.clearLayers();
    h.toolState = null;
    h.map.getContainer().style.cursor = '';
    if (h.onToolChange) h.onToolChange(null);
  };
  const fmtCoord = ll => ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5);

  // Đo khoảng cách / diện tích: bấm từng điểm, bấm đúp để kết thúc
  M.measure = function (h, kind) {
    M.stopTool(h);
    const pts = [];
    let line = null, poly = null, label = null;
    const st = h.toolState = { kind, hint: kind === 'dist' ? 'Đo khoảng cách: bấm từng điểm trên bản đồ, bấm đúp để kết thúc' : 'Đo diện tích: bấm các đỉnh của vùng, bấm đúp để kết thúc' };
    h.map.getContainer().style.cursor = 'crosshair';
    const redraw = () => {
      if (line) h.tool.removeLayer(line); if (poly) h.tool.removeLayer(poly); if (label) h.tool.removeLayer(label);
      if (kind === 'dist') {
        line = L.polyline(pts, { color: '#0089df', weight: 3, dashArray: '6 4' }).addTo(h.tool);
        if (pts.length > 1) label = L.marker(pts[pts.length - 1], { icon: L.divIcon({ className: 'measure-label', html: 'Tổng: ' + U.fmtLen(U.lineLen(pts.map(p => [p.lat, p.lng]))), iconAnchor: [-8, 10] }) }).addTo(h.tool);
      } else {
        poly = L.polygon(pts, { color: '#0089df', weight: 2, fillOpacity: .2 }).addTo(h.tool);
        if (pts.length > 2) { const c = poly.getBounds().getCenter(); label = L.marker(c, { icon: L.divIcon({ className: 'measure-label', html: 'Diện tích: ' + U.fmtArea(U.area(pts.map(p => [p.lat, p.lng]))), iconAnchor: [40, 10] }) }).addTo(h.tool); }
      }
      pts.forEach(p => L.circleMarker(p, { radius: 4, color: '#0089df', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(h.tool));
    };
    const onClick = e => { pts.push(e.latlng); redraw(); };
    const onDbl = e => { L.DomEvent.stop(e); h.map.off('click', onClick); h.map.off('dblclick', onDbl); h.map.doubleClickZoom.enable(); h.map.getContainer().style.cursor = ''; st.done = true; if (h.onToolChange) h.onToolChange(st); };
    h.map.doubleClickZoom.disable();
    h.map.on('click', onClick); h.map.on('dblclick', onDbl);
    st.cleanup = () => { h.map.off('click', onClick); h.map.off('dblclick', onDbl); h.map.doubleClickZoom.enable(); };
    if (h.onToolChange) h.onToolChange(st);
  };

  // Tìm theo bán kính: bấm 1 điểm
  M.radius = function (h, r, cb) {
    M.stopTool(h);
    const st = h.toolState = { kind: 'radius', hint: 'Tìm kiếm không gian: bấm một điểm trên bản đồ để tìm đối tượng trong bán kính ' + r + ' m' };
    h.map.getContainer().style.cursor = 'crosshair';
    const onClick = e => {
      h.tool.clearLayers();
      L.circle(e.latlng, { radius: r, color: '#7c54cd', weight: 2, fillOpacity: .1 }).addTo(h.tool);
      L.circleMarker(e.latlng, { radius: 5, color: '#7c54cd', fillColor: '#fff', fillOpacity: 1 }).addTo(h.tool);
      st.center = [e.latlng.lat, e.latlng.lng]; st.r = r; st.done = true;
      cb(st.center, r);
    };
    h.map.on('click', onClick);
    st.cleanup = () => h.map.off('click', onClick);
    if (h.onToolChange) h.onToolChange(st);
  };

  // Vẽ đối tượng mới: point (1 bấm), line/polygon (bấm nhiều, bấm đúp kết thúc). cb(coords)
  M.drawGeom = function (h, geom, cb) {
    M.stopTool(h);
    const pts = [];
    let shape = null;
    const st = h.toolState = { kind: 'draw', geom, hint: geom === 'point' ? 'Bấm lên bản đồ để đặt vị trí đối tượng' : geom === 'line' ? 'Vẽ đường: bấm từng điểm, bấm đúp để kết thúc' : 'Vẽ vùng: bấm các đỉnh, bấm đúp để kết thúc' };
    h.map.getContainer().style.cursor = 'crosshair';
    const finish = () => { st.cleanup(); h.map.getContainer().style.cursor = ''; cb(pts.map(p => [Math.round(p.lat * 1e5) / 1e5, Math.round(p.lng * 1e5) / 1e5])); };
    const redraw = () => {
      if (shape) h.tool.removeLayer(shape);
      shape = geom === 'line' ? L.polyline(pts, { color: '#0b4a9e', weight: 4 }).addTo(h.tool) : L.polygon(pts, { color: '#0b4a9e', weight: 2, fillOpacity: .25 }).addTo(h.tool);
      pts.forEach(p => L.circleMarker(p, { radius: 4, color: '#0b4a9e', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(h.tool));
    };
    const onClick = e => {
      if (geom === 'point') { pts.push(e.latlng); L.marker(e.latlng).addTo(h.tool); finish(); return; }
      pts.push(e.latlng); redraw();
    };
    const onDbl = e => { L.DomEvent.stop(e); if (pts.length >= (geom === 'line' ? 2 : 3)) finish(); };
    if (geom !== 'point') { h.map.doubleClickZoom.disable(); h.map.on('dblclick', onDbl); }
    h.map.on('click', onClick);
    st.cleanup = () => { h.map.off('click', onClick); h.map.off('dblclick', onDbl); h.map.doubleClickZoom.enable(); };
    if (h.onToolChange) h.onToolChange(st);
  };

  // Hiển thị tọa độ khi di chuột
  M.coordBox = function (h, el) {
    h.map.on('mousemove', e => { el.textContent = 'Tọa độ (WGS-84): ' + fmtCoord(e.latlng) + ' · Zoom ' + h.map.getZoom(); });
    h.map.on('click', e => { if (!h.toolState) el.textContent = 'Đã bấm: ' + fmtCoord(e.latlng) + ' (VN-2000 quy đổi tại máy chủ)'; });
  };

  // In bản đồ: mở cửa sổ in với ảnh chụp lớp hiện tại (mô phỏng bằng chính bản đồ)
  M.print = function (title) {
    document.body.classList.add('print-map');
    const t = document.title; document.title = title || 'Bản đồ chuyên đề';
    setTimeout(() => { window.print(); document.title = t; document.body.classList.remove('print-map'); }, 100);
  };
})(window.APP);
