(function () {
  var GW = window.GW, B = window.GW_BASE, H = window.GW_HOME, F = window.GW_FACILITIES;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = GW ? GW.esc : function (s) { return String(s); };
  var listUrl = (B && B.listUrl) || 'https://www.gwtp.or.kr/gwtp/bbsNew_list.php?code=sub01b&keyvalue=sub01';
  var comma = function (s) { return String(s || '').replace(/\s*·\s*/g, ', '); };

  var gnb = $('#gnb'), allBtn = $('#allBtn'), menu = $('#menu');
  function openMega(v) {
    gnb.classList.toggle('open', v);
    allBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (v) gnb.classList.remove('hide');
  }
  allBtn.addEventListener('click', function () { openMega(!gnb.classList.contains('open')); });
  if (window.matchMedia('(hover: hover)').matches) {
    menu.addEventListener('mouseenter', function () { openMega(true); });
    gnb.addEventListener('mouseleave', function () { openMega(false); });
  }
  menu.addEventListener('focusin', function () { openMega(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openMega(false); });
  document.addEventListener('click', function (e) { if (!gnb.contains(e.target)) openMega(false); });

  var sm = $('#sitemap');
  $$('.mega .col').forEach(function (c) {
    var d = document.createElement('div');
    d.innerHTML = '<p>' + esc($('.col-t', c).textContent) + '</p>' + $$('a', c).map(function (a) { return '<a href="' + esc(a.getAttribute('href')) + '">' + esc(a.textContent) + '</a>'; }).join('');
    sm.appendChild(d);
  });

  if (!GW) return;
  var live = GW.live().sort(GW.byDeadline);
  $$('[data-live]').forEach(function (el) { el.textContent = live.length; });
  function href(n) { return String(n.url || '').split('||')[0] || listUrl; }

  var pick = [];
  var first = live.filter(function (n) { return GW.status(n) === 'open'; })[0];
  if (first) pick.push(first);
  [/냉열/, /수소/].forEach(function (re) {
    var hit = live.filter(function (n) { return re.test(n.title) && pick.indexOf(n) < 0; })[0];
    if (hit) pick.push(hit);
  });
  live.forEach(function (n) { if (pick.length < 3 && pick.indexOf(n) < 0) pick.push(n); });
  $('#nowList').innerHTML = pick.slice(0, 3).map(function (n) {
    var b = GW.badge(n), st = GW.status(n);
    var meta = st === 'unknown' ? (n.dept || '') : GW.deadlineText(n) + (n.dept ? ', ' + n.dept : '');
    return '<li><a href="' + esc(href(n)) + '" target="_blank" rel="noopener"><span class="dd ' + b.cls + '">' + esc(b.text) + '</span><span class="t">' + esc(n.title) + '</span><span class="m">' + esc(meta) + '</span></a></li>';
  }).join('');

  var sectors = (B.sectors || []).concat(['전 분야']);
  function inSector(n, s) { return !s || (n.sectors || []).indexOf(s) > -1; }
  var counts = {};
  sectors.forEach(function (s) { counts[s] = live.filter(function (n) { return inSector(n, s); }).length; });
  var chipBox = $('#sectorChips');
  chipBox.innerHTML = '<button type="button" aria-pressed="true" data-s="">전체<span>' + live.length + '</span></button>' + sectors.filter(function (s) { return counts[s] > 0; }).map(function (s) {
    return '<button type="button" aria-pressed="false" data-s="' + esc(s) + '">' + esc(comma(s)) + '<span>' + counts[s] + '</span></button>';
  }).join('');
  function dd(n) {
    var st = GW.status(n), d = GW.dday(n);
    if (st === 'open') return '<span class="dd' + (d <= 7 ? ' urgent' : '') + '">' + (d === 0 ? '오늘' : 'D-' + d) + '</span>';
    if (st === 'always') return '<span class="dd always">상시</span>';
    return '<span class="dd unknown">마감일<br>공고문 확인</span>';
  }
  function renderList(s) {
    var rows = live.filter(function (n) { return inSector(n, s); });
    $('#dList').innerHTML = rows.map(function (n) {
      var body = n.benefit || n.short || '';
      var meta = [GW.deadlineText(n), n.dept].filter(Boolean).join(', ');
      return '<li><a href="' + esc(href(n)) + '" target="_blank" rel="noopener">' + dd(n) +
        '<span class="main"><span class="t">' + esc(n.title) + '</span>' + (body ? '<span class="b">' + esc(comma(body)) + '</span>' : '') + '<span class="m">' + esc(meta) + '</span></span>' +
        '<span class="s">' + esc((n.sectors || []).map(comma).join(', ')) + '</span></a></li>';
    }).join('');
    $('#dEmpty').hidden = rows.length > 0;
    $$('button', chipBox).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-s') === (s || '') ? 'true' : 'false'); });
  }
  chipBox.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) renderList(b.getAttribute('data-s')); });
  $('[data-sector-reset]').addEventListener('click', function () { renderList(''); });
  renderList('');

  var bList = $('#bList'), bMore = $('#bMore');
  function renderBoard(key) {
    var items = (H && H[key]) || [];
    bList.innerHTML = items.map(function (x) {
      return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener"><span class="bd">' + esc(String(x.date || '').replace(/-/g, '.')) + '</span><span class="bt">' + esc(x.title) + '</span>' + (x.badge ? '<span class="bb">' + esc(x.badge) + '</span>' : '<span></span>') + '</a></li>';
    }).join('');
    if (H && H.boards && H.boards[key]) bMore.href = H.boards[key];
    $$('.tabs button').forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-board') === key ? 'true' : 'false'); });
  }
  $('.tabs').addEventListener('click', function (e) { var t = e.target.closest('button'); if (t) renderBoard(t.getAttribute('data-board')); });
  renderBoard('notice');

  $$('[data-count]').forEach(function (el) { el.textContent = counts[el.getAttribute('data-count')] || 0; });
  $$('.cnt[data-sector]').forEach(function (a) {
    a.addEventListener('click', function () { renderList(a.getAttribute('data-sector')); });
  });

  var places = F || B.places || [];
  var cities = [];
  places.forEach(function (p) { if (cities.indexOf(p.city) < 0) cities.push(p.city); });
  var cityBox = $('#cityChips');
  cityBox.innerHTML = '<button type="button" aria-pressed="true" data-c="">전체<span>' + places.length + '</span></button>' + cities.map(function (c) {
    return '<button type="button" aria-pressed="false" data-c="' + esc(c) + '">' + esc(c) + '<span>' + places.filter(function (p) { return p.city === c; }).length + '</span></button>';
  }).join('');
  $('#placeList').innerHTML = places.map(function (p) {
    var pic = p.img ? '<div class="ph"><img src="img/f-' + esc(p.img) + '.jpg" alt="' + esc(p.city + ' ' + p.name + ' 건물') + '" loading="lazy"></div>' : '<div class="ph pg"><img src="img/obj-stone.svg" alt="원료가 되는 돌 그림"></div>';
    var area = String(p.area || '').split(/\s*·\s*/).filter(Boolean).join(', ');
    var floors = (p.floors || []).map(function (f) { return '<li><b>' + esc(f.level) + '</b>' + esc(comma(f.use)) + '</li>'; }).join('');
    return '<li data-city="' + esc(p.city) + '">' + pic + '<div class="pb"><p class="pc">' + esc(p.city) + '</p><h3 class="pn">' + esc(p.name) + '</h3>' +
      (area ? '<p class="pa">' + esc(area) + '</p>' : '') + (p.use ? '<p class="pu">' + esc(comma(p.use)) + '</p>' : '') +
      (floors ? '<details class="pd"><summary>층별 구성</summary><ul>' + floors + '</ul></details>' : '') + '</div></li>';
  }).join('');
  cityBox.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var c = b.getAttribute('data-c');
    $$('#placeList > li').forEach(function (li) { li.hidden = !!c && li.getAttribute('data-city') !== c; });
    $$('button', cityBox).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
  });

  var news = (B.news || []).map(function (n, i) { return { date: n.date, title: n.title, img: 'img/news-' + (i + 1) + '.jpg' }; });
  var newsUrl = B.newsUrl || 'https://www.gwtp.or.kr/gwtp/bbsNew_list.php?code=sub06b&keyvalue=sub06';
  var fi = news.length > 1 ? 1 : 0;
  var feat = news[fi], rest = news.filter(function (n, i) { return i !== fi; });
  var dot = function (d) { return String(d || '').replace(/-/g, '.'); };
  if (feat) {
    $('#newsBox').innerHTML = '<article class="feat"><a href="' + esc(newsUrl) + '" target="_blank" rel="noopener"><div class="fi" id="featImg"><img src="' + esc(feat.img) + '" alt="' + esc(feat.title) + ' 사진" loading="lazy"></div><p class="fd">' + esc(dot(feat.date)) + '</p><h3 class="ft">' + esc(feat.title) + '</h3></a></article>' +
      '<ul class="nlist">' + rest.map(function (n) {
        return '<li><a href="' + esc(newsUrl) + '" target="_blank" rel="noopener"><div class="ni"><img src="' + esc(n.img) + '" alt="' + esc(n.title) + ' 사진" loading="lazy"></div><div><p class="nd">' + esc(dot(n.date)) + '</p><h3 class="nt">' + esc(n.title) + '</h3></div></a></li>';
      }).join('') + '</ul>';
  }

  $('#sysList').innerHTML = (B.systems || []).map(function (s) {
    return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener"><span class="sg">' + esc(s.group) + '</span><span class="sn">' + esc(s.name) + '</span></a></li>';
  }).join('');

  var biz = $('#biz'), scenes = $$('.scene'), steps = $$('#steps button'), bar = $('.bar');
  var cur = -1;
  function setScene(i) {
    if (i === cur) return;
    cur = i;
    scenes.forEach(function (s, k) { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    steps.forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'step' : 'false'); });
  }
  steps.forEach(function (b, k) {
    b.addEventListener('click', function () {
      if (reduce) { scenes[k].scrollIntoView(); return; }
      var total = biz.offsetHeight - window.innerHeight;
      var top = biz.getBoundingClientRect().top + window.scrollY + total * (k + 0.5) / scenes.length;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  var shot = $('#shot'), shotImg = $('#shotImg'), lastY = window.scrollY, ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (!gnb.classList.contains('open')) {
      if (y > lastY + 6 && y > 240) gnb.classList.add('hide');
      else if (y < lastY - 6 || y <= 240) gnb.classList.remove('hide');
    }
    lastY = y;
    if (!reduce) {
      var sh = shot.offsetHeight;
      if (y < sh + 200) shotImg.style.setProperty('--par', Math.min(y * 0.1, sh * 0.04).toFixed(1) + 'px');
      var fe = $('#featImg');
      if (fe) {
        var r = fe.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          var off = ((r.top + r.height / 2) - vh / 2) / vh;
          fe.firstChild.style.setProperty('--par2', (off * -0.06 * r.height).toFixed(1) + 'px');
        }
      }
      var br = biz.getBoundingClientRect(), total = biz.offsetHeight - vh;
      if (total > 0) {
        var p = Math.min(1, Math.max(0, -br.top / total));
        bar.style.setProperty('--p', p.toFixed(4));
        setScene(Math.min(scenes.length - 1, Math.floor(p * scenes.length)));
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduce) { scenes.forEach(function (s) { s.classList.add('on'); }); }
  else setScene(0);
  frame();
})();
