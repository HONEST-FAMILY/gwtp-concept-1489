(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GW = window.GW, B = window.GW_BASE || {}, H = window.GW_HOME || {}, F = window.GW_FACILITIES || [];
  var esc = function (s) { return GW ? GW.esc(s) : String(s == null ? '' : s); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  var CAPS = [
    ['AI', '소양강댐 냉수로 식히는 K-클라우드파크'],
    ['바이오', '춘천 천연물소재 전주기 표준화'],
    ['디지털헬스', '원주 디지털헬스케어 특화'],
    ['반도체', '강릉 반도체 부재용 대형 세라믹'],
    ['수소', '수소전기차와 수소충전소 보급'],
    ['모빌리티', '미래차 전주기 실증 지원']
  ];
  var DUR = 6000;
  var slides = $$('.hero .slide');
  var steps = $$('#steps button');
  var cap = $('#cap');
  var cur = 0, timer = null;

  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-on', k === cur); });
    steps.forEach(function (b, k) {
      b.classList.remove('is-on');
      b.classList.toggle('is-done', k < cur);
      b.setAttribute('aria-current', k === cur ? 'true' : 'false');
    });
    void steps[cur].offsetWidth;
    steps[cur].classList.add('is-on');
    cap.innerHTML = '<b>' + CAPS[cur][0] + '</b>' + CAPS[cur][1];
    [cur, (cur + 1) % slides.length].forEach(function (k) {
      var img = slides[k].querySelector('img');
      if (img && img.loading === 'lazy') img.loading = 'eager';
    });
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (reduce || document.hidden) return;
    timer = setTimeout(function () { show(cur + 1); }, DUR);
  }

  steps.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) show(cur); else clearTimeout(timer); });
  document.documentElement.style.setProperty('--dur', DUR / 1000 + 's');
  show(0);

  if (!GW) return;

  var live = GW.live().sort(GW.byDeadline);
  $$('.live-n').forEach(function (el) { el.textContent = live.length; });

  function hrefOf(n) {
    return String(n.url || '').split('||')[0] || B.listUrl || 'https://www.gwtp.or.kr/gwtp/bbsNew_list.php?code=sub01b&keyvalue=sub01';
  }

  var pick = live.filter(function (n) { return GW.status(n) === 'open'; }).slice(0, 3);
  if (pick.length < 3) pick = pick.concat(live.filter(function (n) { return pick.indexOf(n) < 0; }).slice(0, 3 - pick.length));
  $('#nowList').innerHTML = pick.map(function (n) {
    var b = GW.badge(n);
    return '<li><a href="' + esc(hrefOf(n)) + '" target="_blank" rel="noopener">' +
      '<span class="dd ' + b.cls + '">' + esc(b.text) + '</span>' +
      '<span class="t">' + esc(n.title) + '</span>' +
      '<span class="m">' + esc(GW.deadlineText(n)) + '</span></a></li>';
  }).join('');

  var SECT = (B.sectors || []).slice();
  var tab = 'live', sect = '';
  var filters = $('#filters'), list = $('#ntList'), body = $('.nt-body'), more = $('#ntMore');

  function inSect(n, s) { var ss = n.sectors || []; return ss.indexOf(s) >= 0 || ss.indexOf('전 분야') >= 0; }

  function renderFilters() {
    var html = '<button type="button" data-s="" class="' + (sect ? '' : 'is-on') + '">전체<span>' + live.length + '</span></button>';
    SECT.forEach(function (s) {
      var c = live.filter(function (n) { return inSect(n, s); }).length;
      html += '<button type="button" data-s="' + esc(s) + '" class="' + (sect === s ? 'is-on' : '') + '">' + esc(s) + '<span>' + c + '</span></button>';
    });
    filters.innerHTML = html;
  }

  function renderLive() {
    var rows = sect ? live.filter(function (n) { return inSect(n, sect); }) : live;
    if (!rows.length) { list.innerHTML = '<li class="nt-empty">이 분야에서 지금 접수 중인 공고가 없습니다.</li>'; return; }
    list.innerHTML = rows.map(function (n, i) {
      var b = GW.badge(n);
      var meta = [n.dept, (n.sectors || []).join(', ')].filter(Boolean).join(' / ');
      return '<li' + (i >= 6 ? ' class="is-extra"' : '') + '><a href="' + esc(hrefOf(n)) + '" target="_blank" rel="noopener">' +
        '<span class="dd ' + b.cls + '">' + esc(b.text) + '</span>' +
        '<span><span class="nt-t">' + esc(n.title) + '</span><span class="nt-m">' + esc(meta) + '</span></span>' +
        '<span class="nt-d">' + esc(GW.deadlineText(n)) + '</span></a></li>';
    }).join('') + (rows.length > 6 ? '<li class="nt-moreli"><button type="button" class="nt-morebtn">나머지 ' + (rows.length - 6) + '건 더 보기</button></li>' : '');
    list.classList.remove('is-open');
  }

  list.addEventListener('click', function (e) {
    if (e.target.closest('.nt-morebtn')) list.classList.add('is-open');
  });

  function renderBoard(key) {
    var rows = H[key] || [];
    list.innerHTML = rows.map(function (r) {
      var d = String(r.date || '').split('-');
      var dd = d.length === 3 ? (+d[1]) + '.' + (+d[2]) : '';
      return '<li><a href="' + esc(r.url || (H.boards || {})[key] || '#') + '" target="_blank" rel="noopener">' +
        '<span class="dd">' + esc(dd) + '</span>' +
        '<span><span class="nt-t">' + esc(String(r.title || '').replace(/\.\.$/, '…')) + '</span>' + (r.badge ? '<span class="nt-m">' + esc(r.badge) + '</span>' : '') + '</span>' +
        '<span class="nt-d">' + esc(r.date || '') + '</span></a></li>';
    }).join('');
  }

  function render() {
    body.classList.toggle('no-filter', tab !== 'live');
    if (tab === 'live') { renderFilters(); renderLive(); more.href = B.listUrl || more.href; }
    else { renderBoard(tab); more.href = (H.boards || {})[tab] || more.href; }
  }

  $$('.notices .tab').forEach(function (t) {
    t.addEventListener('click', function () {
      tab = t.getAttribute('data-tab');
      $$('.notices .tab').forEach(function (x) { var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      render();
    });
  });

  filters.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    sect = b.getAttribute('data-s') || '';
    renderFilters(); renderLive();
  });

  render();

  var SC = [
    { k: 'ai', name: 'AI', sector: 'ICT·데이터', place: '소양강댐 냉수 K-클라우드파크, 강원디지털혁신센터', alt: '냉수 냉각판을 얹은 AI 연산 모듈',
      ev: ['소양강댐의 냉수를 자원으로 한 클라우드데이터센터 7기가 집적단지인 K-클라우드파크를 조성하여 데이터 산업 융합밸리 구성', '지역 주도 AI 대전환을 통한 바이오·헬스케어 산업 경쟁력 강화 및 지속가능 성장 생태계 구축'] },
    { k: 'bio', name: '바이오', sector: '바이오', place: '춘천 바이오 특화, 홍천 중화항체치료제개발지원센터', alt: '천연물 추출액이 담긴 유리 바이알',
      ev: ['천연물소재 전주기 표준화 허브의 기능 정립 및 활성화 기반 마련', '바이오 의약품의 초기단계 개발·사업화를 위한 공간·시설 등의 통합 지원'] },
    { k: 'health', name: '디지털헬스', sector: '디지털헬스·의료기기', place: '원주 권역 반도체, 디지털헬스케어 특화', alt: '몸에 붙이는 심전도 패치',
      ev: ['보건의료데이터 기반 실증 및 글로벌 협력 기반 산업 생태계 조성', '2026년 강원 디지털헬스케어 분야 VC·AC 투자 전문가 Pool 모집 공고'], src2: '지금 접수 중인 공고' },
    { k: 'semi', name: '반도체', sector: '반도체', place: '강릉 반도체부재공장, 세라믹신소재지원센터', alt: '반도체 장비에 들어가는 흰 세라믹 링',
      ev: ['반도체 부재용 대형 세라믹 제품 제조 지원', '국내 반도체 소재·부품·장비 기업의 아이템 실증 지원과 시장연계형 플랫폼 구축'] },
    { k: 'h2', name: '수소', sector: '수소·에너지', place: '삼척 에너지방재지원센터, 삼척 권역 액화수소 특화', alt: '탄소섬유로 감은 수소 저장 용기',
      ev: ['환동해권 액화수소 저장·운송 클러스터 조성 및 동해안 에너지 자원벨트 핵심 거점 구축', '수소전기차량 및 수소충전소의 보급 확대·운영'] },
    { k: 'mob', name: '모빌리티', sector: '모빌리티', place: '미래사업단 스마트모빌리티팀', alt: '전기차 구동모터 고정자',
      ev: ['미래차 전주기 실증 지원 체계 구축을 통한 미래차 산업 중심지 도약', '전기차 배터리 팩 재제조를 위한 센터 구축과 특성화 장비를 이용한 재제조 배터리 안전성 및 신뢰성 확보'] }
  ];

  var scenes = $('#scenes'), pics = $('#bizPic');
  scenes.innerHTML = SC.map(function (s, i) {
    var c = live.filter(function (n) { return (n.sectors || []).indexOf(s.sector) >= 0; }).length;
    var go = c ? '관련 접수 중 공고 ' + c + '건 보기' : '지금 접수 중인 공고 전체 보기';
    return '<div class="scene' + (i ? '' : ' is-on') + '" data-i="' + i + '">' +
      '<h3 class="sc-name">' + esc(s.name) + '</h3>' +
      '<p class="sc-place">' + esc(s.place) + '</p>' +
      '<ul class="sc-ev"><li>' + esc(s.ev[0]) + '<span>강원테크노파크 2026 홍보영상</span></li><li>' + esc(s.ev[1]) + '<span>' + esc(s.src2 || '강원테크노파크 2026 홍보영상') + '</span></li></ul>' +
      '<a class="sc-go" href="#notices" data-sect="' + (c ? esc(s.sector) : '') + '">' + go + '</a></div>';
  }).join('');
  pics.innerHTML = SC.map(function (s, i) {
    return '<figure class="' + (i ? '' : 'is-on') + '"><img src="img/m-' + s.k + '.jpg" alt="' + esc(s.alt) + '" loading="lazy"></figure>';
  }).join('');

  var biz = $('#biz'), bizSteps = $$('#bizSteps button'), sceneEls = $$('.scene', scenes), picEls = $$('figure', pics), active = 0;

  function setScene(idx, frac) {
    if (idx !== active) {
      sceneEls.forEach(function (el, k) { el.classList.toggle('is-on', k === idx); });
      picEls.forEach(function (el, k) { el.classList.toggle('is-on', k === idx); });
      active = idx;
    }
    bizSteps.forEach(function (b, k) {
      b.classList.toggle('is-on', k === idx);
      b.classList.toggle('is-done', k < idx);
      b.style.setProperty('--p', k === idx ? frac.toFixed(3) : (k < idx ? 1 : 0));
    });
  }

  function bizScroll() {
    var r = biz.getBoundingClientRect();
    var total = biz.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var p = Math.min(1, Math.max(0, -r.top / total));
    var idx = Math.min(SC.length - 1, Math.floor(p * SC.length));
    var frac = Math.min(1, p * SC.length - idx);
    setScene(idx, frac);
  }

  bizSteps.forEach(function (b, k) {
    b.addEventListener('click', function () {
      var total = biz.offsetHeight - window.innerHeight;
      var y = biz.getBoundingClientRect().top + window.scrollY + total * (k + 0.08) / SC.length;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  scenes.addEventListener('click', function (e) {
    var a = e.target.closest('.sc-go');
    if (!a) return;
    tab = 'live';
    sect = a.getAttribute('data-sect') || '';
    $$('.notices .tab').forEach(function (x) { var on = x.getAttribute('data-tab') === 'live'; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    render();
  });

  var CITIES = ['춘천시', '강릉시', '원주시', '삼척시', '태백시', '홍천군'];
  var city = '';
  var cityTabs = $('#cityTabs'), grid = $('#plGrid');

  function renderCities() {
    var html = '<button type="button" role="tab" class="tab' + (city ? '' : ' is-on') + '" data-c="" aria-selected="' + (city ? 'false' : 'true') + '">전체 ' + F.length + '곳</button>';
    CITIES.forEach(function (c) {
      var n = F.filter(function (f) { return f.city === c; }).length;
      html += '<button type="button" role="tab" class="tab' + (city === c ? ' is-on' : '') + '" data-c="' + c + '" aria-selected="' + (city === c ? 'true' : 'false') + '">' + c.replace(/[시군]$/, '') + ' ' + n + '곳</button>';
    });
    cityTabs.innerHTML = html;
  }

  function figOf(f, big) {
    if (f.img) return '<span class="pl-fig"><img src="img/f-' + esc(f.img) + '.jpg" alt="' + esc(f.city + ' ' + f.name + ' 전경') + '"' + (big ? '' : ' loading="lazy"') + '></span>';
    return '<span class="pl-fig noimg"><b>' + esc(f.city.replace(/[시군]$/, '')) + '</b></span>';
  }

  function renderPlaces() {
    var rows = F.map(function (f, i) { return { f: f, i: i }; }).filter(function (x) { return !city || x.f.city === city; });
    grid.innerHTML = rows.map(function (x) {
      var f = x.f;
      return '<li><button class="pl-card" type="button" data-i="' + x.i + '">' + figOf(f) +
        '<span class="pl-city">' + esc(f.city) + '</span>' +
        '<span class="pl-name">' + esc(f.name) + '</span>' +
        '<span class="pl-area">' + esc(String(f.area || '').replace(/ · /g, ', ')) + '</span>' +
        '<span class="pl-use">' + esc(String(f.use || '').replace(/ · /g, ', ')) + '</span></button></li>';
    }).join('');
  }

  cityTabs.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    city = b.getAttribute('data-c') || '';
    renderCities(); renderPlaces();
  });
  renderCities(); renderPlaces();

  var floor = $('#floor'), lastFocus = null;
  function openFloor(i) {
    var f = F[i];
    if (!f) return;
    lastFocus = document.activeElement;
    $('#floorPic').innerHTML = f.img ? '<img src="img/f-' + esc(f.img) + '.jpg" alt="' + esc(f.name + ' 전경') + '">' : '';
    $('#floorCity').textContent = f.city;
    $('#floorTitle').textContent = f.name;
    $('#floorMeta').innerHTML = [f.addr, String(f.area || '').replace(/ · /g, ', '), String(f.scale || '').replace(/ · /g, ', '), f.facility ? '편의시설 ' + f.facility : ''].filter(Boolean).map(esc).join('<br>');
    $('#floorList').innerHTML = (f.floors || []).map(function (l) { return '<li><b>' + esc(l.level) + '</b><span>' + esc(l.use) + '</span></li>'; }).join('') || '<li><b>층별</b><span>층별 구성은 시설현황 누리집에서 확인</span></li>';
    floor.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#floorX').focus();
  }
  function closeFloor() {
    floor.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  grid.addEventListener('click', function (e) { var b = e.target.closest('.pl-card'); if (b) openFloor(+b.getAttribute('data-i')); });
  $('#floorX').addEventListener('click', closeFloor);
  floor.addEventListener('click', function (e) { if (e.target === floor) closeFloor(); });

  var news = (B.news || []).map(function (n, i) { return { n: n, img: 'img/n-' + (i + 1) + '.jpg' }; });
  var feat = news[1] || news[0];
  var rest = news.filter(function (x) { return x !== feat; });
  var nurl = B.newsUrl || '#';
  function nd(s) { var p = String(s || '').split('-'); return p.length === 3 ? p[0] + '.' + p[1] + '.' + p[2] : s; }
  $('#news').innerHTML = (feat ? '<div class="nw-main"><a href="' + esc(nurl) + '" target="_blank" rel="noopener"><span class="nw-fig"><img src="' + feat.img + '" alt="' + esc(feat.n.title) + '" loading="lazy"></span>' +
    '<span class="nw-date">' + esc(nd(feat.n.date)) + '</span><span class="nw-title">' + esc(feat.n.title) + '</span></a></div>' : '') +
    '<ul class="nw-list">' + rest.map(function (x) {
      return '<li><a href="' + esc(nurl) + '" target="_blank" rel="noopener"><span class="nw-fig"><img src="' + x.img + '" alt="' + esc(x.n.title) + '" loading="lazy"></span>' +
        '<span><span class="nw-date">' + esc(nd(x.n.date)) + '</span><span class="nw-title">' + esc(x.n.title) + '</span></span></a></li>';
    }).join('') + '</ul>';

  $('#sys').innerHTML = (B.systems || []).map(function (s) {
    return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener"><span>' + esc(s.group) + '</span><b>' + esc(s.name) + '</b></a></li>';
  }).join('');

  $('#footMenu').innerHTML = $$('.mega .col').map(function (c) {
    return '<li><p>' + esc($('.col-t', c).textContent) + '</p>' + $('ul', c).outerHTML + '</li>';
  }).join('');

  var gnb = $('#gnb'), allBtn = $('#allBtn'), menu = $('.menu'), lastY = window.scrollY, ticking = false;
  var featFig = $('.nw-main .nw-fig');

  function setMega(on) {
    gnb.classList.toggle('is-mega', on);
    allBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  if (menu) menu.addEventListener('mouseenter', function () { if (window.matchMedia('(min-width: 1061px)').matches) setMega(true); });
  gnb.addEventListener('mouseleave', function () { if (window.matchMedia('(min-width: 1061px)').matches) setMega(false); });
  allBtn.addEventListener('click', function () { setMega(!gnb.classList.contains('is-mega')); });
  $$('.mega a').forEach(function (a) { a.addEventListener('click', function () { setMega(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!floor.hidden) closeFloor();
    setMega(false);
  });

  function frame() {
    ticking = false;
    var y = window.scrollY;
    var down = y > lastY;
    if (!gnb.classList.contains('is-mega')) {
      gnb.classList.toggle('is-solid', y > 24);
      if (down && y > 160) gnb.classList.add('is-hidden');
      else if (!down) gnb.classList.remove('is-hidden');
    }
    lastY = y;
    bizScroll();
    if (featFig && !reduce) {
      var r = featFig.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom > 0 && r.top < vh) {
        var t = (r.top + r.height / 2 - vh / 2) / vh;
        featFig.querySelector('img').style.setProperty('--py', (-5 + t * 6).toFixed(2) + '%');
      }
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(frame); });
  frame();
})();
