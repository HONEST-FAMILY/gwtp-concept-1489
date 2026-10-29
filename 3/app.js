(function () {
  var G = window.GW;
  var SITE = 'https://www.gwtp.or.kr/gwtp/';
  var EQNET = 'https://eqnet.gwtp.or.kr/';
  var MYBIZ = 'https://mybiz.gwtp.or.kr/';
  var placeCount = G.base.places.length;

  var all = G.live().slice().sort(G.byDeadline);
  var forCompanies = all.filter(function (n) { return (n.types || []).indexOf('전문가 모집') < 0; });

  var where = {
    equip: ['장비지원', SITE + 'pageview.php?url=sub02c&keyvalue=sub02'],
    eqnet: ['강원연구장비', EQNET],
    places: ['시설현황 ' + placeCount + '곳', SITE + 'pageview.php?url=sub04c&keyvalue=sub04'],
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

  var ICON = {
    '반도체': 'semi', '바이오': 'bio', '디지털헬스·의료기기': 'health', '수소·에너지': 'h2', '모빌리티': 'mobility', 'ICT·데이터': 'ai', '정보보호': 'ai'
  };

  function matches(n, key) {
    var s = STAGES[key];
    var typed = (n.types || []).some(function (t) { return s.types.indexOf(t) > -1; });
    return typed || s.words.test([n.title, n.benefit, n.short].join(' '));
  }

  function byStage(key) { return forCompanies.filter(function (n) { return matches(n, key); }); }

  var counts = {};
  Object.keys(STAGES).forEach(function (k) { counts[k] = byStage(k).length; });
  document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = counts[el.getAttribute('data-count')] + '건'; });

  function shortDeadline(n) {
    var st = G.status(n);
    if (st === 'open') return G.fmtShort(n.apply_end) + '(' + G.weekday(n.apply_end) + ')' + (n.apply_end_time ? ' ' + n.apply_end_time : '') + ' 마감';
    if (st === 'always') return '상시 접수';
    return '마감일은 공고문에서 확인';
  }

  function badge(n) {
    var b = G.badge(n);
    var text = b.cls === 'unknown' ? '마감일 확인' : b.text;
    return '<span class="b' + (b.cls === 'urgent' ? ' urgent' : '') + '">' + G.esc(text) + '</span>';
  }

  function icon(n) {
    var sec = (n.sectors || []).filter(function (s) { return ICON[s]; })[0];
    return sec ? '<img class="ic" src="board/ico-' + ICON[sec] + '.svg" alt="' + G.esc(sec) + '" width="24" height="24">' : '<span class="ic"></span>';
  }

  function row(n) {
    return '<li><a href="' + G.esc(n.url || G.base.listUrl) + '" target="_blank" rel="noopener">' + icon(n) + badge(n) +
      '<span class="t">' + G.esc(n.title) + '</span>' +
      '<span class="m">' + G.esc(shortDeadline(n)) + '<span class="dept">' + G.esc(n.dept || '') + '</span></span></a></li>';
  }

  function link(k) { var w = where[k]; return '<a href="' + G.esc(w[1]) + '" target="_blank" rel="noopener">' + G.esc(w[0]) + '</a>'; }

  var fTitle = document.getElementById('fTitle');
  var fCount = document.getElementById('fCount');
  var fList = document.getElementById('fList');
  var fWhere = document.getElementById('fWhere');
  var state = { stage: null, q: '' };

  function render() {
    var list, title, whereHtml, empty;
    if (state.q) {
      var r = G.search(state.q);
      list = r.notices.filter(function (n) { return G.status(n) !== 'closed'; });
      title = '‘' + state.q + '’ 검색 결과';
      whereHtml = r.places.length ? '이 낱말이 들어간 시설 ' + r.places.length + '곳' + link('places') : '장비는' + link('eqnet') + '<span class="sep">공간은</span>' + link('places');
      empty = '지금 접수 중인 공고 중에는 찾는 낱말이 없습니다. ' + link('list');
    } else if (state.stage) {
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
    fList.innerHTML = list.length ? list.slice(0, 3).map(row).join('') : '<li class="empty">' + empty + '</li>';
    fWhere.innerHTML = whereHtml;
    document.querySelectorAll('[data-stage]').forEach(function (el) {
      var on = el.getAttribute('data-stage') === state.stage;
      el.classList.toggle('on', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-stage]').forEach(function (el) {
    var key = el.getAttribute('data-stage');
    el.addEventListener('click', function () {
      state.q = '';
      document.getElementById('q').value = '';
      state.stage = state.stage === key ? null : key;
      render();
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
    state.stage = null;
    render();
  });

  document.getElementById('searchBtn').addEventListener('click', function () {
    var q = document.getElementById('q');
    q.scrollIntoView({ block: 'center' });
    q.focus({ preventScroll: true });
  });

  var gnb = document.getElementById('gnb');
  var mega = document.getElementById('mega');
  var allBtn = document.getElementById('allBtn');
  var desk = window.matchMedia('(min-width: 1024px)');
  var closeTimer = null;

  function open() { clearTimeout(closeTimer); gnb.classList.add('open'); allBtn.setAttribute('aria-expanded', 'true'); }
  function close() { gnb.classList.remove('open'); allBtn.setAttribute('aria-expanded', 'false'); }

  document.getElementById('top').addEventListener('mouseenter', function () { if (desk.matches) open(); });
  mega.addEventListener('mouseenter', function () { if (desk.matches) clearTimeout(closeTimer); });
  gnb.addEventListener('mouseleave', function () { if (desk.matches) closeTimer = setTimeout(close, 160); });
  document.getElementById('top').addEventListener('focusin', function () { if (desk.matches) open(); });
  allBtn.addEventListener('click', function () { if (gnb.classList.contains('open')) close(); else open(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  render();
})();
