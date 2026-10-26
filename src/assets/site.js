// Меню на телефон
(function () {
  var btn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();

// Предупреждение за съдържание: ако JS липсва, статията остава видима
(function () {
  var gate = document.getElementById("cw-gate");
  var body = document.getElementById("article-body");
  if (gate && body) {
    document.documentElement.classList.add("js-cw");
    gate.hidden = false;
    body.hidden = true;
    document.getElementById("cw-continue").addEventListener("click", function () {
      gate.hidden = true;
      body.hidden = false;
      body.setAttribute("tabindex", "-1");
      body.focus();
    });
  }
})();

// Търсене в браузъра по предварително генериран индекс
(function () {
  var form = document.getElementById("search-form");
  if (!form) return;
  var input = form.querySelector("input[name=q]");
  var status = document.getElementById("search-status");
  var list = document.getElementById("search-results");
  var index = null;

  var norm = function (s) {
    return String(s || "").toLowerCase().replace(/ё/g, "е").normalize("NFKD").replace(/[̀-ͯ]/g, "");
  };
  var el = function (tag, text, cls) {
    var n = document.createElement(tag);
    if (text) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };

  function render(q) {
    list.textContent = "";
    var words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) { status.textContent = form.dataset.hint; return; }
    var hits = index.map(function (a) {
      var title = norm(a.title), desc = norm(a.description), topics = norm(a.topics.join(" ")), text = norm(a.text);
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], s = 0;
        if (title.indexOf(w) > -1) s += 6;
        if (topics.indexOf(w) > -1) s += 4;
        if (desc.indexOf(w) > -1) s += 2;
        if (text.indexOf(w) > -1) s += 1;
        if (!s) return null; // всички думи трябва да съвпадат
        score += s;
      }
      return { a: a, score: score };
    }).filter(Boolean).sort(function (x, y) { return y.score - x.score; });

    status.textContent = hits.length ? form.dataset.count + " " + hits.length : form.dataset.none;
    hits.forEach(function (h) {
      var li = el("li", "", "card");
      var h3 = el("h3");
      var link = el("a", h.a.title);
      link.href = h.a.url;
      h3.appendChild(link);
      li.appendChild(h3);
      if (h.a.description) li.appendChild(el("p", h.a.description));
      var meta = el("p", h.a.sectionTitle, "meta");
      if (h.a.cw) meta.appendChild(el("span", form.dataset.cw, "badge")), meta.insertBefore(document.createTextNode(" · "), meta.lastChild);
      li.appendChild(meta);
      list.appendChild(li);
    });
  }

  function run() {
    var q = input.value;
    history.replaceState(null, "", q ? "?q=" + encodeURIComponent(q) : location.pathname);
    render(q);
  }

  status.textContent = form.dataset.loading;
  fetch(form.dataset.index)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      index = data;
      var initial = new URLSearchParams(location.search).get("q") || "";
      input.value = initial;
      render(initial);
      input.addEventListener("input", run);
    })
    .catch(function () { status.textContent = form.dataset.error; });

  form.addEventListener("submit", function (e) { e.preventDefault(); if (index) run(); });
})();
