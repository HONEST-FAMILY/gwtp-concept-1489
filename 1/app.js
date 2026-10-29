(function () {
  var CAPS = [
    ['AI', '소양강댐 냉수로 식히는 K-클라우드파크'],
    ['바이오', '춘천 천연물소재 전주기 표준화'],
    ['디지털헬스', '원주 디지털헬스케어 특화'],
    ['반도체', '강릉 반도체 부재용 대형 세라믹'],
    ['수소', '수소전기차와 수소충전소 보급'],
    ['모빌리티', '미래차 전주기 실증 지원']
  ];
  var DUR = 6000;
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var steps = [].slice.call(document.querySelectorAll('#steps button'));
  var cap = document.getElementById('cap');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    var img = slides[cur].querySelector('img');
    if (img && img.loading === 'lazy') img.loading = 'eager';
    var next = slides[(cur + 1) % slides.length].querySelector('img');
    if (next && next.loading === 'lazy') next.loading = 'eager';
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

  var GW = window.GW;
  if (!GW) return;
  var live = GW.live().sort(GW.byDeadline);
  document.getElementById('liveCount').textContent = live.length;
  var pick = live.filter(function (n) { return GW.status(n) === 'open'; }).slice(0, 3);
  if (pick.length < 3) pick = pick.concat(live.filter(function (n) { return pick.indexOf(n) < 0; }).slice(0, 3 - pick.length));
  document.getElementById('nowList').innerHTML = pick.map(function (n) {
    var b = GW.badge(n);
    var href = String(n.url || '').split('||')[0] || 'https://www.gwtp.or.kr/gwtp/bbsNew_list.php?code=sub01b&keyvalue=sub01';
    return '<li><a href="' + GW.esc(href) + '" target="_blank" rel="noopener">' +
      '<span class="dd ' + b.cls + '">' + GW.esc(b.text) + '</span>' +
      '<span class="t">' + GW.esc(n.title) + '</span>' +
      '<span class="m">' + GW.esc(GW.deadlineText(n)) + '</span></a></li>';
  }).join('');
})();
