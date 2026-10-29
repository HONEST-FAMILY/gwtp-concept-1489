(function () {
  var GW = window.GW;
  if (!GW) return;
  var live = GW.live().sort(GW.byDeadline);
  document.getElementById('liveCount').textContent = live.length;
  var pick = [];
  var first = live.filter(function (n) { return GW.status(n) === 'open'; })[0];
  if (first) pick.push(first);
  [/냉열/, /수소/].forEach(function (re) {
    var hit = live.filter(function (n) { return re.test(n.title) && pick.indexOf(n) < 0; })[0];
    if (hit) pick.push(hit);
  });
  live.forEach(function (n) { if (pick.length < 3 && pick.indexOf(n) < 0) pick.push(n); });
  pick = pick.slice(0, 3);
  document.getElementById('nowList').innerHTML = pick.map(function (n) {
    var b = GW.badge(n);
    var st = GW.status(n);
    var href = String(n.url || '').split('||')[0] || 'https://www.gwtp.or.kr/gwtp/bbsNew_list.php?code=sub01b&keyvalue=sub01';
    var meta = st === 'unknown' ? (n.dept || '') : GW.deadlineText(n) + (n.dept ? ', ' + n.dept : '');
    return '<li><a href="' + GW.esc(href) + '" target="_blank" rel="noopener">' +
      '<span class="dd ' + b.cls + '">' + GW.esc(b.text) + '</span>' +
      '<span class="t">' + GW.esc(n.title) + '</span>' +
      '<span class="m">' + GW.esc(meta) + '</span></a></li>';
  }).join('');
})();
