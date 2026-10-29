(function () {
  var G = window.GW;
  var H = window.GW_HOME || {};
  var F = window.GW_FACILITIES || [];
  var SITE = 'https://www.gwtp.or.kr/gwtp/';
  var EQNET = 'https://eqnet.gwtp.or.kr/';
  var MYBIZ = 'https://mybiz.gwtp.or.kr/';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desk = window.matchMedia('(min-width: 1024px)');

  var all = G.live().slice().sort(G.byDeadline);
  var forCompanies = all.filter(function (n) { return (n.types || []).indexOf('전문가 모집') < 0; });

  var where = {
    equip: ['장비지원', SITE + 'pageview.php?url=sub02c&keyvalue=sub02'],
    eqnet: ['강원연구장비', EQNET],
    places: ['시설현황 ' + G.base.places.length + '곳', SITE + 'pageview.php?url=sub04c&keyvalue=sub04'],
    move: ['입주안내', SITE + 'pageview.php?url=sub04a&keyvalue=sub04'],
    mybiz: ['입주기업종합지원', MYBIZ],
    list: ['공고 전체 보기', G.base.listUrl]
  };

  var STAGES = {
    dev: { name: '기술개발', types: [], words: /기술개발|R&D|연구개발|기술 ?컨설팅|기술멘토링|수요기술|기술 애로|회로설계|기술 ?지도/, where: ['eqnet', 'equip'] },
    proto: { name: '시제품', types: ['입주 공간'], words: /시제품|제작|벤처공장/, where: ['equip', 'places'] },
    test: { name: '시험·인증', types: ['장비·실증'], words: /시험|인증|평가|테스트|실증|검증/, where: ['eqnet', 'equip'] },
    biz: { name: '사업화', types: ['사업화 자금', '박람회·판로', '투자 연결'], words: /사업화|판로|마케팅|투자|수출|바이어/, where: ['move', 'mybiz'] }
  };

  var SECTORS = [
    { key: '반도체', label: '반도체', ic: 'semi' },
    { key: '바이오', label: '바이오', ic: 'bio' },
    { key: '디지털헬스·의료기기', label: '디지털헬스', ic: 'health' },
    { key: '수소·에너지', label: '수소·에너지', ic: 'h2' },
    { key: '모빌리티', label: '모빌리티', ic: 'mobility' },
    { key: 'ICT·데이터', label: 'ICT·데이터', ic: 'ai' },
    { key: '정보보호', label: '정보보호', ic: 'ai' }
  ];

  var ICON = { '반도체': 'semi', '바이오': 'bio', '디지털헬스·의료기기': 'health', '수소·에너지': 'h2', '모빌리티': 'mobility', 'ICT·데이터': 'ai', '정보보호': 'ai' };

  var BIZ = [
    { name: '반도체', ic: 'semi', where: '강릉 세라믹 특화, 강릉 반도체부재공장', sectors: ['반도체'],
      ev: ['반도체 부재용 대형 세라믹 제품 제조 지원', '국내 반도체 소재·부품·장비 기업의 아이템 실증 지원과 시장연계형 플랫폼 구축'] },
    { name: '바이오', ic: 'bio', where: '춘천 바이오 특화, 홍천 항체의약품소재 특화', sectors: ['바이오'],
      ev: ['천연물소재 전주기 표준화 허브의 기능 정립 및 활성화 기반 마련', '바이오 의약품의 초기단계 개발·사업화를 위한 공간·시설 등의 통합 지원'] },
    { name: '디지털헬스', ic: 'health', where: '원주 디지털헬스케어 특화', sectors: ['디지털헬스·의료기기'],
      ev: ['보건의료데이터 기반 실증 및 글로벌 협력 기반 산업 생태계 조성', '원주 권역 반도체, 디지털헬스케어 특화'] },
    { name: '수소', ic: 'h2', where: '삼척 액화수소 특화, 삼척 에너지방재지원센터', sectors: ['수소·에너지'],
      ev: ['국내 액화수소 제품의 신뢰성 평가를 위한 센터 설계 및 구축', '환동해권 액화수소 저장·운송 클러스터 조성 및 동해안 에너지 자원벨트 핵심 거점 구축'] },
    { name: '모빌리티', ic: 'mobility', where: '미래차 전주기 실증', sectors: ['모빌리티'],
      ev: ['전기차 배터리 팩 재제조를 위한 센터 구축과 특성화 장비를 이용한 재제조 배터리 안전성 및 신뢰성 확보', '미래차 전주기 실증 지원 체계 구축을 통한 미래차 산업 중심지 도약'] },
    { name: 'AI', ic: 'ai', where: '춘천 소양강댐 냉수, K-클라우드파크', sectors: ['ICT·데이터', '정보보호'],
      ev: ['소양강댐의 냉수를 자원으로 한 클라우드데이터센터 7기가 집적단지인 K-클라우드파크를 조성하여 데이터 산업 융합밸리 구성', '지역 주도 AI 대전환을 통한 바이오·헬스케어 산업 경쟁력 강화 및 지속가능 성장 생태계 구축'] }
  ];

  function esc(s) { return G.esc(s); }
  function matchesStage(n, key) {
    var s = STAGES[key];
    var typed = (n.types || []).some(function (t) { return s.types.indexOf(t) > -1; });
    return typed || s.words.test([n.title, n.benefit, n.short].join(' '));
  }
  function byStage(key) { return forCompanies.filter(function (n) { return matchesStage(n, key); }); }
  function inSectors(n, keys) { return keys.some(function (k) { return G.sectorOK(n, k); }); }

  function shortDeadline(n) {
    var st = G.status(n);
    if (st === 'open') return G.fmtShort(n.apply_end) + '(' + G.weekday(n.apply_end) + ')' + (n.apply_end_time ? ' ' + n.apply_end_time : '') + ' 마감';
    if (st === 'always') return '상시 접수';
    return '마감일은 공고문에서 확인';
  }
  function badgeHtml(n, cls) {
    var b = G.badge(n);
    var text = b.cls === 'unknown' ? '마감일 확인' : b.text;
    return '<span class="' + cls + (b.cls === 'urgent' ? ' urgent' : '') + '">' + esc(text) + '</span>';
  }
  function link(k) { var w = where[k]; return '<a href="' + esc(w[1]) + '" target="_blank" rel="noopener">' + esc(w[0]) + '</a>'; }
  function nUrl(n) { return String(n.url || '').split('||')[0] || G.base.listUrl; }
  function dots(t) { return String(t || '').split(' · ').join(', '); }
  function fmtDot(d) { var p = String(d || '').split('-'); return p.length === 3 ? p[0] + '.' + p[1] + '.' + p[2] : d; }

  var stageCounts = {};
  Object.keys(STAGES).forEach(function (k) { stageCounts[k] = byStage(k).length; });
  document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = stageCounts[el.getAttribute('data-count')] + '건'; });

  var state = { stage: '', sector: '', region: '', q: '' };

  var fTitle = document.getElementById('fTitle');
  var fCount = document.getElementById('fCount');
  var fList = document.getElementById('fList');
  var fWhere = document.getElementById('fWhere');

  function heroRow(n) {
    var sec = (n.sectors || []).filter(function (s) { return ICON[s]; })[0];
    var ic = sec ? '<img class="ic" src="img/ico-' + ICON[sec] + '.svg" alt="' + esc(sec) + '" width="24" height="24">' : '<span class="ic"></span>';
    return '<li><a href="' + esc(nUrl(n)) + '" target="_blank" rel="noopener">' + ic + badgeHtml(n, 'b') +
      '<span class="t">' + esc(n.title) + '</span>' +
      '<span class="m">' + esc(shortDeadline(n)) + '<span class="dept">' + esc(n.dept || '') + '</span></span></a></li>';
  }

  function renderHero() {
    var list, title, whereHtml, empty;
    if (state.stage) {
      var s = STAGES[state.stage];
      list = byStage(state.stage);
      title = s.name + ' 단계 공고';
      whereHtml = '이 단계에 쓰는 곳' + s.where.map(link).join('');
      empty = '이 단계 공고는 지금 없습니다. ' + link('list');
    } else {
      list = all;
      title = '지금 접수 중인 공고';
      whereHtml = '장비는' + link('eqnet') + '<span class="sep">공간은</span>' + link('places');
      empty = '지금 접수 중인 공고가 없습니다. ' + link('list');
    }
    fTitle.textContent = title;
    fCount.textContent = list.length + '건';
    fList.innerHTML = list.length ? list.slice(0, 3).map(heroRow).join('') : '<li class="empty">' + empty + '</li>';
    fWhere.innerHTML = whereHtml + (list.length > 3 ? '<a class="jump" href="#notices">' + list.length + '건 모두 보기</a>' : '');
    document.querySelectorAll('.hero [data-stage], .pick [data-stage]').forEach(function (el) {
      var on = el.getAttribute('data-stage') === state.stage;
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.hero [data-stage], .pick [data-stage]').forEach(function (el) {
    var key = el.getAttribute('data-stage');
    el.addEventListener('click', function () {
      state.stage = state.stage === key ? '' : key;
      state.q = '';
      var q = document.getElementById('q'); if (q) q.value = '';
      var nq = document.getElementById('nq'); if (nq) nq.value = '';
      renderHero();
      renderNotices();
    });
    if (el.classList.contains('spot')) {
      var tag = document.querySelector('.tag[data-stage="' + key + '"]');
      el.addEventListener('mouseenter', function () { tag.classList.add('hl'); });
      el.addEventListener('mouseleave', function () { tag.classList.remove('hl'); });
    }
  });

  document.getElementById('fSearch').addEventListener('submit', function (e) {
    e.preventDefault();
    state.q = document.getElementById('q').value.trim();
    state.stage = '';
    document.getElementById('nq').value = state.q;
    renderHero();
    renderNotices();
    if (state.q) document.getElementById('notices').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  var sectorChips = document.getElementById('sectorChips');
  sectorChips.innerHTML = '<button type="button" class="chip" data-fsector="">전체</button>' + SECTORS.map(function (s) {
    var c = all.filter(function (n) { return (n.sectors || []).indexOf(s.key) > -1; }).length;
    return '<button type="button" class="chip" data-fsector="' + esc(s.key) + '">' + esc(s.label) + '<span class="k">' + c + '</span></button>';
  }).join('');

  var region = document.getElementById('region');
  region.innerHTML = '<option value="">강원 전체</option>' + G.base.regions.map(function (r) { return '<option value="' + esc(r) + '">' + esc(r) + '</option>'; }).join('') + '<option value="강원 밖">강원 밖 기업도 가능</option>';

  var nList = document.getElementById('nList');
  var nState = document.getElementById('nState');
  var nReset = document.getElementById('nReset');
  document.getElementById('nTotal').textContent = all.length + '건';

  function nRow(n) {
    var secs = (n.sectors || []).filter(function (s) { return ICON[s]; }).slice(0, 2).map(function (s) {
      return '<span class="sec-n"><img src="img/ico-' + ICON[s] + '.svg" alt="" width="22" height="22">' + esc(s) + '</span>';
    }).join('');
    var types = (n.types || []).slice(0, 2).join(', ');
    var st = G.status(n);
    var dl = st === 'open' ? '<b>' + esc(G.fmtShort(n.apply_end) + '(' + G.weekday(n.apply_end) + ')' + (n.apply_end_time ? ' ' + n.apply_end_time : '')) + '</b>마감' : (st === 'always' ? '<b>상시 접수</b>' : '<b>마감일</b>공고문에서 확인');
    return '<li><a href="' + esc(nUrl(n)) + '" target="_blank" rel="noopener">' + badgeHtml(n, 'b') +
      '<span class="t">' + esc(n.title) + '</span>' +
      '<span class="m">' + secs + (types ? '<span>' + esc(types) + '</span>' : '') + '<span>' + esc(n.dept || '') + '</span></span>' +
      '<span class="d">' + dl + '</span></a></li>';
  }

  function filtered() {
    var list = state.q ? G.search(state.q).notices.filter(function (n) { return G.status(n) !== 'closed' && !n.list_only; }) : all;
    if (state.stage) list = list.filter(function (n) { return (n.types || []).indexOf('전문가 모집') < 0 && matchesStage(n, state.stage); });
    if (state.sector) list = list.filter(function (n) { return G.sectorOK(n, state.sector); });
    if (state.region) list = list.filter(function (n) { return G.regionOK(n, state.region); });
    return list;
  }

  function renderNotices() {
    var list = filtered();
    var parts = [];
    if (state.q) parts.push('‘' + state.q + '’');
    if (state.stage) parts.push(STAGES[state.stage].name + ' 단계');
    if (state.sector) parts.push(SECTORS.filter(function (s) { return s.key === state.sector; })[0].label);
    if (state.region) parts.push(state.region === '강원 밖' ? '강원 밖 기업도 가능' : state.region);
    nState.innerHTML = parts.length ? esc(parts.join(', ')) + ' 공고 <b>' + list.length + '건</b>' : '접수 중인 공고 <b>' + list.length + '건</b>, 마감이 빠른 순서';
    nReset.hidden = !parts.length;
    nList.innerHTML = list.length ? list.map(nRow).join('') : '<li class="empty">고른 조건에 맞는 공고가 지금은 없습니다. 거르기를 풀거나 ' + link('list') + '에서 지난 공고까지 찾아보세요.</li>';
    document.querySelectorAll('[data-fstage]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-fstage') === state.stage); b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false'); });
    document.querySelectorAll('[data-fsector]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-fsector') === state.sector); b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false'); });
    region.value = state.region;
  }

  document.getElementById('stageChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-fstage]'); if (!b) return;
    state.stage = b.getAttribute('data-fstage');
    renderNotices(); renderHero();
  });
  sectorChips.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fsector]'); if (!b) return;
    state.sector = b.getAttribute('data-fsector');
    renderNotices();
  });
  region.addEventListener('change', function () { state.region = region.value; renderNotices(); });
  document.getElementById('nSearch').addEventListener('submit', function (e) {
    e.preventDefault();
    state.q = document.getElementById('nq').value.trim();
    renderNotices();
  });
  nReset.addEventListener('click', function () {
    state.stage = ''; state.sector = ''; state.region = ''; state.q = '';
    document.getElementById('nq').value = ''; document.getElementById('q').value = '';
    renderNotices(); renderHero();
  });

  var bList = document.getElementById('bList');
  var bMore = document.getElementById('bMore');
  var BOARD_NAME = { notice: '공지사항', recruit: '모집공고', bid: '입찰공고', jobs: '채용공고' };
  function renderBoard(key) {
    var items = H[key] || [];
    bList.innerHTML = items.map(function (it) {
      return '<li><a href="' + esc(it.url || (H.boards || {})[key] || G.base.listUrl) + '" target="_blank" rel="noopener"><span class="bt">' + esc(it.title) + '</span><span class="bd"><span>' + esc(fmtDot(it.date)) + '</span>' + (it.badge ? '<span class="bg">' + esc(it.badge) + '</span>' : '') + '</span></a></li>';
    }).join('');
    bMore.href = (H.boards || {})[key] || G.base.listUrl;
    bMore.textContent = BOARD_NAME[key] + ' 전체 보기';
    document.querySelectorAll('[data-board]').forEach(function (t) { var on = t.getAttribute('data-board') === key; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
  }
  document.querySelectorAll('[data-board]').forEach(function (t) { t.addEventListener('click', function () { renderBoard(t.getAttribute('data-board')); }); });

  document.getElementById('aLive').textContent = all.length;
  document.getElementById('aPlaces').textContent = G.base.places.length;
  var cities = {}; G.base.places.forEach(function (p) { cities[p.city] = 1; });
  document.getElementById('aCities').textContent = Object.keys(cities).length;
  if (H.eqnet) {
    document.getElementById('aEquip').textContent = Number(H.eqnet.equipment).toLocaleString('ko-KR');
    document.getElementById('aInst').textContent = H.eqnet.institutions;
    document.getElementById('aAsOf').textContent = fmtDot(H.eqnet.asOf);
  }

  var bizNav = document.getElementById('bizNav');
  var bizPanel = document.getElementById('bizPanel');
  bizNav.innerHTML = BIZ.map(function (b, i) {
    var c = all.filter(function (n) { return inSectors(n, b.sectors); }).length;
    return '<li><button type="button" data-biz="' + i + '"><img src="img/ico-' + b.ic + '.svg" alt="" width="34" height="34"><span>' + esc(b.name) + '</span><span class="k">' + c + '건</span></button></li>';
  }).join('');
  bizPanel.innerHTML = BIZ.map(function (b, i) {
    var list = all.filter(function (n) { return inSectors(n, b.sectors); });
    var top = list.slice(0, 2).map(function (n) { return '<li>' + badgeHtml(n, 'bb') + '<span>' + esc(n.title) + '</span></li>'; }).join('');
    return '<article class="biz-item' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' +
      '<img class="biz-ic" src="img/big-' + b.ic + '.svg" alt="" width="240" height="240">' +
      '<div class="biz-body"><p class="biz-where">' + esc(b.where) + '</p><h3 class="biz-name">' + esc(b.name) + '</h3>' +
      '<ul class="biz-ev">' + b.ev.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<p class="biz-src">강원테크노파크 2026 홍보영상 자막에서</p>' +
      '<div class="biz-now"><p><b>' + list.length + '건</b>이 분야에서 지금 신청할 수 있는 공고</p>' + (top ? '<ul>' + top + '</ul>' : '') +
      '<button type="button" class="biz-go" data-go="' + i + '">' + esc(b.name) + ' 공고 보기</button></div></div></article>';
  }).join('');

  var bizItems = [].slice.call(bizPanel.querySelectorAll('.biz-item'));
  var bizBtns = [].slice.call(bizNav.querySelectorAll('button'));
  var bizTrack = document.getElementById('bizTrack');
  var bizCur = -1;
  function setBiz(i) {
    if (i === bizCur) return;
    bizCur = i;
    bizItems.forEach(function (it, k) { it.classList.toggle('on', k === i); });
    bizBtns.forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }
  function bizSticky() { return desk.matches && !reduce; }
  function onBizScroll() {
    if (!bizSticky()) return;
    var r = bizTrack.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    var p = span > 0 ? Math.min(Math.max(-r.top / span, 0), 0.9999) : 0;
    var seg = p * BIZ.length;
    var i = Math.floor(seg);
    setBiz(i);
    bizBtns.forEach(function (b, k) { b.style.setProperty('--p', k < i ? 1 : (k === i ? (seg - i).toFixed(3) : 0)); });
  }
  bizBtns.forEach(function (b, k) {
    b.addEventListener('click', function () {
      if (!bizSticky()) { setBiz(k); return; }
      var r = bizTrack.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      var y = window.scrollY + r.top + span * ((k + 0.35) / BIZ.length);
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  bizPanel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b) return;
    var biz = BIZ[+b.getAttribute('data-go')];
    state.sector = biz.sectors[0]; state.stage = ''; state.q = ''; state.region = '';
    document.getElementById('nq').value = '';
    renderNotices(); renderHero();
    document.getElementById('notices').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
  function syncBizMode() {
    if (bizSticky()) { bizCur = -1; onBizScroll(); }
    else bizItems.forEach(function (it) { it.classList.add('on'); });
  }

  var recruiting = G.recruitingPlaces ? G.recruitingPlaces() : {};
  var cityOrder = ['춘천시', '강릉시', '원주시', '삼척시', '태백시', '홍천군'];
  var byCity = {};
  F.forEach(function (f) { (byCity[f.city] = byCity[f.city] || []).push(f); });
  var cityTabs = document.getElementById('cityTabs');
  cityTabs.innerHTML = '<button type="button" role="tab" class="tab" data-city="">전체<span class="k">' + F.length + '</span></button>' + cityOrder.filter(function (c) { return byCity[c]; }).map(function (c) {
    return '<button type="button" role="tab" class="tab" data-city="' + esc(c) + '">' + esc(c.replace(/(시|군)$/, '')) + '<span class="k">' + byCity[c].length + '</span></button>';
  }).join('');
  document.getElementById('pTotal').textContent = F.length;
  var pGrid = document.getElementById('pGrid');
  function pImg(f, cls) {
    return f.img ? '<img src="img/p-' + esc(f.img) + '.jpg" alt="' + esc(f.city + ' ' + f.name) + '" loading="lazy" width="720" height="540">' : '<span class="noimg"><img src="img/big-stone.svg" alt="" width="240" height="240"></span>';
  }
  function renderPlaces(city) {
    var list = city ? (byCity[city] || []) : cityOrder.reduce(function (a, c) { return a.concat(byCity[c] || []); }, []);
    pGrid.innerHTML = list.map(function (f) {
      var idx = F.indexOf(f);
      return '<li><button type="button" class="p-card" data-place="' + idx + '"><span class="p-img">' + pImg(f) + (recruiting[f.name] ? '<span class="p-flag">지금 입주 모집</span>' : '') + '</span>' +
        '<span class="p-city">' + esc(f.city) + '</span><span class="p-name">' + esc(f.name) + '</span>' +
        '<span class="p-area">' + esc(dots(f.area)) + '</span><span class="p-use">' + esc(dots(f.use)) + '</span></button></li>';
    }).join('');
    cityTabs.querySelectorAll('[data-city]').forEach(function (t) { var on = t.getAttribute('data-city') === city; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
  }
  cityTabs.addEventListener('click', function (e) { var t = e.target.closest('[data-city]'); if (t) renderPlaces(t.getAttribute('data-city')); });

  var sheet = document.getElementById('sheet');
  var sheetBody = document.getElementById('sheetBody');
  var lastFocus = null;
  function openPlace(idx) {
    var f = F[idx]; if (!f) return;
    var rec = recruiting[f.name];
    var floors = (f.floors || []).map(function (fl) { return '<li><b>' + esc(fl.level) + '</b><span>' + esc(fl.use) + '</span></li>'; }).join('');
    var facts = [['주소', f.addr], ['규모', dots(f.scale)], ['면적', dots(f.area)], ['용도', dots(f.use)], ['편의시설', f.facility], ['승강기', f.lift]].filter(function (x) { return x[1] && x[1] !== '-'; });
    sheetBody.innerHTML = '<div class="sh-img">' + (f.img ? '<img src="img/p-' + esc(f.img) + '.jpg" alt="' + esc(f.name) + '">' : '<img class="ic" src="img/big-stone.svg" alt="">') + '</div>' +
      '<p class="sh-city">' + esc(f.city) + (rec ? ', 지금 입주 모집 중' : '') + '</p><h3 class="sh-name" id="sName">' + esc(f.name) + '</h3>' +
      '<dl class="sh-facts">' + facts.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' +
      (floors ? '<p class="sh-h">층별 구성</p><ul class="sh-floors">' + floors + '</ul>' : '') +
      '<div class="sh-links">' + (rec ? '<a href="' + esc(nUrl(rec)) + '" target="_blank" rel="noopener">입주 모집 공고 보기</a>' : '<a href="' + esc(where.move[1]) + '" target="_blank" rel="noopener">입주안내 보기</a>') +
      '<a href="' + esc(where.places[1]) + '" target="_blank" rel="noopener">시설현황 보기</a></div>';
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    sheet.querySelector('.sheet-x').focus();
  }
  function closePlace() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  pGrid.addEventListener('click', function (e) { var c = e.target.closest('[data-place]'); if (c) openPlace(+c.getAttribute('data-place')); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closePlace(); });

  var news = G.base.news || [];
  var newsUrl = G.base.newsUrl || (SITE + 'bbsNew_list.php?code=sub06b&keyvalue=sub06');
  document.getElementById('wMore').href = newsUrl;
  var wGrid = document.getElementById('wGrid');
  if (news.length) {
    var lead = news[0];
    wGrid.innerHTML = '<a class="w-lead" href="' + esc(newsUrl) + '" target="_blank" rel="noopener"><span class="w-img"><img id="wLeadImg" src="img/news-1.jpg" alt="' + esc(lead.title) + '" loading="lazy" width="1200" height="800"></span>' +
      '<span class="w-txt"><span class="w-date">' + esc(fmtDot(lead.date)) + '</span><span class="w-title">' + esc(lead.title) + '</span></span></a>' +
      '<ol class="w-list">' + news.slice(1, 5).map(function (n, i) {
        return '<li><a href="' + esc(newsUrl) + '" target="_blank" rel="noopener"><span class="wi"><img src="img/news-' + (i + 2) + '-s.jpg" alt="" loading="lazy" width="480" height="360"></span><span><span class="wd">' + esc(fmtDot(n.date)) + '</span><span class="wt">' + esc(n.title) + '</span></span></a></li>';
      }).join('') + '</ol>';
  }

  document.getElementById('lGrid').innerHTML = (G.base.systems || []).map(function (s) {
    return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener"><span class="lg">' + esc(s.group) + '</span><span class="ln">' + esc(s.name) + '</span></a></li>';
  }).join('');

  var gnb = document.getElementById('gnb');
  var mega = document.getElementById('mega');
  var allBtn = document.getElementById('allBtn');
  var closeTimer = null;
  function openMega() { clearTimeout(closeTimer); gnb.classList.add('open'); allBtn.setAttribute('aria-expanded', 'true'); }
  function closeMega() { gnb.classList.remove('open'); allBtn.setAttribute('aria-expanded', 'false'); }
  document.getElementById('top').addEventListener('mouseenter', function () { if (desk.matches) openMega(); });
  mega.addEventListener('mouseenter', function () { if (desk.matches) clearTimeout(closeTimer); });
  gnb.addEventListener('mouseleave', function () { if (desk.matches) closeTimer = setTimeout(closeMega, 160); });
  document.getElementById('top').addEventListener('focusin', function () { if (desk.matches) openMega(); });
  allBtn.addEventListener('click', function () { if (gnb.classList.contains('open')) closeMega(); else openMega(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMega(); closePlace(); } });
  document.getElementById('searchBtn').addEventListener('click', function () {
    var q = document.getElementById('nq');
    document.getElementById('notices').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { q.focus({ preventScroll: true }); }, reduce ? 0 : 500);
  });

  var hero = document.getElementById('hero');
  var lastY = window.scrollY;
  var leadImg = null;
  function onScroll() {
    var y = window.scrollY;
    var solid = y > 8;
    gnb.classList.toggle('solid', solid);
    var past = y > hero.offsetHeight * 0.6;
    if (!gnb.classList.contains('open')) {
      if (past && y > lastY + 4) gnb.classList.add('hide');
      else if (y < lastY - 4 || !past) gnb.classList.remove('hide');
    }
    lastY = y;
    onBizScroll();
    if (!reduce) {
      leadImg = leadImg || document.getElementById('wLeadImg');
      if (leadImg) {
        var r = leadImg.parentNode.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          var t = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          leadImg.style.setProperty('--py', Math.min(0, Math.max(-10, -5 - t * 5)).toFixed(2) + '%');
        }
      }
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }, { passive: true });
  window.addEventListener('resize', function () { syncBizMode(); onScroll(); });
  if (desk.addEventListener) desk.addEventListener('change', syncBizMode);

  renderHero();
  renderNotices();
  renderBoard('notice');
  renderPlaces('');
  syncBizMode();
  onScroll();
})();
