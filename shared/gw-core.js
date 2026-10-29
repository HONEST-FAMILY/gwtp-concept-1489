(function () {
  var B = window.GW_BASE, M = window.GW_MAP, ALL = window.GW_NOTICES || [];

  var today = (function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  function parseD(s) { if (!s) return null; var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dday(n) { var e = parseD(n.apply_end); if (!e) return null; return Math.round((e - today) / 864e5); }
  function status(n) {
    if (n.apply_note && /상시/.test(n.apply_note) && !n.apply_end) return 'always';
    var d = dday(n);
    if (d === null) return n.list_only ? 'closed' : (n.board_status === '완료' ? 'closed' : 'unknown');
    return d < 0 ? 'closed' : 'open';
  }
  function badge(n) {
    var st = status(n), d = dday(n);
    if (st === 'always') return { cls: 'always', text: '상시 모집' };
    if (st === 'closed') return { cls: 'closed', text: '마감' };
    if (st === 'unknown') return { cls: 'unknown', text: '마감일 공고문 확인' };
    if (d === 0) return { cls: 'urgent', text: '오늘 마감' };
    if (d <= 7) return { cls: 'urgent', text: 'D-' + d };
    return { cls: 'open', text: 'D-' + d };
  }
  function fmtDate(s) { if (!s) return ''; var p = s.split('-'); return p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일'; }
  function fmtShort(s) { if (!s) return ''; var p = s.split('-'); return (+p[1]) + '.' + (+p[2]); }
  function weekday(s) { var d = parseD(s); return d ? '일월화수목금토'[d.getDay()] : ''; }
  function deadlineText(n) {
    if (n.apply_end) return fmtDate(n.apply_end) + '(' + weekday(n.apply_end) + ')' + (n.apply_end_time ? ' ' + n.apply_end_time : '') + '까지';
    if (status(n) === 'always') return n.apply_note || '연중 상시';
    return n.apply_note || '공고문 확인';
  }
  function tel(s) { var m = String(s || '').match(/0\d{1,2}-\d{3,4}-\d{4}/); return m ? m[0] : ''; }
  function detailed() { return ALL.filter(function (n) { return !n.list_only; }); }
  function live() { return detailed().filter(function (n) { return status(n) !== 'closed'; }); }
  function byDeadline(a, b) {
    var sa = status(a), sb = status(b);
    var da = sa === 'open' ? dday(a) : (sa === 'unknown' ? 9000 : 9999);
    var db = sb === 'open' ? dday(b) : (sb === 'unknown' ? 9000 : 9999);
    if (da !== db) return da - db;
    return (b.posted || '').localeCompare(a.posted || '');
  }
  function byPosted(a, b) { return (b.posted || '').localeCompare(a.posted || ''); }

  function regionOK(n, r) {
    var regs = n.regions || [];
    if (!r || !regs.length) return true;
    var wide = regs.some(function (x) { return /도내 전체|강원 전체|전국|제한 없음/.test(x); });
    var out = regs.some(function (x) { return /도외|전국|제한 없음/.test(x); });
    if (r === '강원 밖') return out;
    if (wide) return true;
    return regs.some(function (x) { return x.indexOf(r) > -1; });
  }
  function sectorOK(n, s) { if (!s || s === '모름') return true; var ss = n.sectors || []; return ss.indexOf(s) > -1 || ss.indexOf('전 분야') > -1; }
  function typeOK(n, t) { t = t || []; if (!t.length || t.indexOf('전부') > -1) return true; return (n.types || []).some(function (x) { return t.indexOf(x) > -1; }); }
  function find(q) {
    q = q || {};
    var pool = detailed(), lv = live();
    var hit = lv.filter(function (n) { return regionOK(n, q.r) && sectorOK(n, q.s) && typeOK(n, q.t); }).sort(byDeadline);
    var near = lv.filter(function (n) { return hit.indexOf(n) < 0 && regionOK(n, q.r) && (sectorOK(n, q.s) || typeOK(n, q.t)); }).sort(byDeadline);
    var closedHit = pool.filter(function (n) { return status(n) === 'closed' && regionOK(n, q.r) && sectorOK(n, q.s) && typeOK(n, q.t); });
    return { hit: hit, near: near, closed: closedHit, liveCount: lv.length };
  }
  function search(word) {
    var w = String(word || '').trim().toLowerCase();
    if (!w) return { notices: [], places: [], systems: [] };
    function has(s) { return String(s || '').toLowerCase().indexOf(w) > -1; }
    return {
      notices: ALL.filter(function (n) { return has(n.title) || has(n.short) || has(n.target) || has(n.benefit) || has(n.dept) || (n.sectors || []).some(has) || (n.types || []).some(has); }).sort(function (a, b) { var x = status(a) === 'closed', y = status(b) === 'closed'; return x === y ? byDeadline(a, b) : (x ? 1 : -1); }),
      places: B.places.filter(function (p) { return has(p.name) || has(p.city) || has(p.use) || has(p.addr); }),
      systems: B.systems.filter(function (s) { return has(s.name) || has(s.group); })
    };
  }
  function byId(idx) { for (var i = 0; i < ALL.length; i++) if (ALL[i].idx === String(idx)) return ALL[i]; return null; }
  function sectorCounts() {
    var c = {}; B.sectors.forEach(function (s) { c[s] = 0; });
    live().forEach(function (n) { (n.sectors || []).forEach(function (s) { if (c[s] != null) c[s]++; }); });
    return c;
  }
  function placesByCity() {
    var o = {}; B.places.forEach(function (p) { (o[p.city] = o[p.city] || []).push(p); }); return o;
  }
  function recruitingPlaces() {
    var r = {};
    live().forEach(function (n) { if ((n.types || []).indexOf('입주 공간') > -1) (n.places || []).forEach(function (p) { r[p] = n; }); });
    return r;
  }
  function areaBy(name) { for (var i = 0; i < M.areas.length; i++) if (M.areas[i].name === name) return M.areas[i]; return null; }
  function mapSvg(opts) {
    opts = opts || {};
    var pad = opts.pad || 0;
    var s = '<svg viewBox="' + (-pad) + ' ' + (-pad) + ' ' + (M.w + pad * 2) + ' ' + (M.h + pad * 2) + '" role="img" aria-label="강원특별자치도 18개 시군 지도">';
    M.areas.forEach(function (a) { s += '<path class="' + (opts.areaClass || 'area') + '" data-city="' + a.name + '" d="' + a.d + '"><title>' + a.name + '</title></path>'; });
    if (opts.labels) M.areas.forEach(function (a) { s += '<text class="' + (opts.labelClass || 'lbl') + '" data-lbl="' + a.name + '" x="' + a.cx + '" y="' + (a.cy + 7) + '" text-anchor="middle">' + a.name.replace(/(시|군)$/, '') + '</text>'; });
    return s + '<g class="marks"></g></svg>';
  }
  function cityShape(city, stroke, dot) {
    var ar = areaBy(city); if (!ar) return '';
    var n = ar.d.match(/-?\d+(\.\d+)?/g).map(Number), xs = [], ys = [];
    for (var i = 0; i + 1 < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); }
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var pad = Math.max(x1 - x0, y1 - y0) * 0.18;
    return '<svg viewBox="' + (x0 - pad) + ' ' + (y0 - pad) + ' ' + (x1 - x0 + pad * 2) + ' ' + (y1 - y0 + pad * 2) + '" role="img" aria-label="' + city + ' 위치"><path d="' + ar.d + '" fill="#fff" stroke="' + (stroke || '#002049') + '" stroke-width="1.5" vector-effect="non-scaling-stroke"/><circle cx="' + ar.cx + '" cy="' + ar.cy + '" r="' + (Math.max(x1 - x0, y1 - y0) * 0.05) + '" fill="' + (dot || '#1d4bff') + '"/></svg>';
  }
  function icsDownload(n, done) {
    if (!n.apply_end) return;
    var d = n.apply_end.replace(/-/g, ''), e = parseD(n.apply_end); e.setDate(e.getDate() + 1);
    var d2 = e.getFullYear() + ('0' + (e.getMonth() + 1)).slice(-2) + ('0' + e.getDate()).slice(-2);
    var now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GWTP//KO', 'BEGIN:VEVENT', 'UID:gwtp-' + n.idx + '@gwtp', 'DTSTAMP:' + now, 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + d2,
      'SUMMARY:[마감] ' + (n.short || n.title), 'DESCRIPTION:' + (n.no ? n.no + ' ' : '') + n.title + ' / ' + n.url, 'BEGIN:VALARM', 'TRIGGER:-P3D', 'ACTION:DISPLAY', 'DESCRIPTION:마감 3일 전', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'gwtp-' + (n.no || n.idx) + '-마감.ics';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    if (done) done('마감 3일 전 알림이 들어간 일정 파일을 받았습니다');
  }
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(function () { if (done) done('링크를 복사했습니다'); }); return; }
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); if (done) done('링크를 복사했습니다'); } catch (e) { }
    ta.remove();
  }
  function share(title, url, done) {
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () { }); return; }
    copyText(url, done);
  }
  function docsState(n) {
    var key = 'gwtp-docs-' + n.idx, saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { }
    return {
      get: function (i) { return !!saved[i]; },
      set: function (i, v) { saved[i] = !!v; try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) { } },
      count: function () { return (n.docs || []).filter(function (d, i) { return saved[i]; }).length; }
    };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.GW = {
    base: B, map: M, all: ALL, today: today,
    dday: dday, status: status, badge: badge, deadlineText: deadlineText, fmtDate: fmtDate, fmtShort: fmtShort, weekday: weekday, tel: tel,
    detailed: detailed, live: live, byDeadline: byDeadline, byPosted: byPosted,
    regionOK: regionOK, sectorOK: sectorOK, typeOK: typeOK, find: find, search: search, byId: byId,
    sectorCounts: sectorCounts, placesByCity: placesByCity, recruitingPlaces: recruitingPlaces,
    areaBy: areaBy, mapSvg: mapSvg, cityShape: cityShape,
    icsDownload: icsDownload, share: share, copyText: copyText, docsState: docsState, esc: esc
  };
})();
