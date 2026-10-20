(function () {
  const DATA = window.YASNO_DATA;
  if (!DATA) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const state = {
    view: "home", courseId: null, articleId: null, query: "", category: "все", level: "все", cost: "все", sort: "order",
    quizStep: 0, quizAnswers: [], openFaq: 0, threat: null, menu: false, shuffledQuiz: null,
  };
  function shuffleOptions(q) {
    const pairs = q.options.map((text, index) => ({ text, index }));
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return { ...q, options: pairs.map((p) => p.text), correct: pairs.findIndex((p) => p.index === q.correct) };
  }
  function loadProgress() { try { return JSON.parse(localStorage.getItem("interval-progress") || "{}"); } catch (e) { return {}; } }
  function saveProgress(p) { localStorage.setItem("interval-progress", JSON.stringify(p)); }
  function theme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function setTheme(next) {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("interval-theme", next);
  }
  function money(n) { return n === 0 ? "бесплатно" : n.toLocaleString("ru-RU") + " ₽"; }
  function courseById(id) { return DATA.courses.find((c) => c.id === id); }
  function articleById(id) { return DATA.articles.find((a) => a.id === id); }
  function progressOf(course) {
    const p = loadProgress()[course.id] || {};
    const done = course.lessons.filter((l) => p[l.id]).length;
    return { done, total: course.lessons.length, ratio: done / course.lessons.length };
  }
  function toast(text) {
    const box = $("#toasts");
    if (!box) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  function navigate(view, extra) {
    Object.assign(state, extra || {}, { view, menu: false });
    if (view === "check" && !extra) {
      state.quizStep = 0; state.quizAnswers = [];
      state.shuffledQuiz = DATA.quiz.map(shuffleOptions);
    }
    const hash = view === "home" ? "#/" : "#/" + view + (state.courseId && view === "course" ? "/" + state.courseId : "") + (state.articleId && view === "material" ? "/" + state.articleId : "");
    if (location.hash !== hash) location.hash = hash;
    render();
    window.scrollTo(0, 0);
  }
  function parseHash() {
    const parts = (location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    const view = parts[0] || "home";
    const known = ["home", "courses", "course", "check", "author", "materials", "material", "faq"];
    state.view = known.includes(view) ? view : "home";
    state.courseId = state.view === "course" ? parts[1] : null;
    state.articleId = state.view === "material" ? parts[1] : null;
  }
  function escapeAttr(s) {
    return String(s).replace(/&/g, "\u0026amp;").replace(/"/g, "\u0026quot;").replace(/</g, "\u0026lt;");
  }
  function shell(main) {
    const links = [["home","Главная"],["courses","Курсы"],["check","Проверка"],["materials","Материалы"],["author","Автор"],["faq","Вопросы"]];
    const nav = links.map(([id, label]) => `<button type="button" data-go="${id}" ${state.view===id||(id==="courses"&&state.view==="course")||(id==="materials"&&state.view==="material")?'aria-current="page"':''}>${label}</button>`).join("");
    return `<a class="skip" href="#main">К содержанию</a><div class="shell"><header class="nav"><button class="brand" type="button" data-go="home" aria-label="Интервал, на главную"><span class="mark" aria-hidden="true"><span></span></span> Интервал</button><nav class="nav-links ${state.menu?"open":""}" aria-label="Разделы">${nav}</nav><button class="icon-btn" id="theme-btn" type="button" aria-label="Тема">${theme()==="dark"?"☀":"☾"}</button><button class="icon-btn burger" type="button" aria-label="Меню">☰</button></header><main id="main" class="page">${main}</main><footer class="footer"><span>«Интервал» — демонстрационная платформа. Оплаты и отправки писем нет.</span><span>Автор сценария вымышлен: Иванко Сергей Романович.</span></footer></div><div class="toasts" id="toasts" aria-live="polite"></div><div id="modal-root"></div>`;
  }
  function home() {
    const popular = DATA.courses.slice(0, 4);
    const rows = popular.map((c) => `<button class="course-row" type="button" data-course="${c.id}"><span class="meta">${c.level}</span><span><strong>${c.title}</strong><br><span class="note">${c.blurb}</span></span><span class="price">${money(c.price)}</span></button>`).join("");
    const verdict = state.threat === "phish" ? "Верно. Срок и кнопка «подтвердить» — давление. Входите только привычным путём." : state.threat === "ok" ? "Это опасный путь: сообщение торопит и уводит на чужую страницу." : "";
    return `<section class="hero reveal"><div><p class="kicker">${DATA.slogan}</p><h1>Смотрите на цифровую жизнь ясно, а не тревожно.</h1><p class="lede">Короткие курсы о письмах, паролях, переводах и чужих просьбах «срочно».</p><div class="row"><button class="btn" type="button" data-go="courses">Смотреть курсы</button><button class="btn ghost" type="button" data-go="check">Проверить себя</button></div></div><div class="phone"><div class="phone-top"><span>учебный пример</span><span>не настоящая угроза</span></div><div class="bubble"><strong>Служба заботы</strong>Ваш профиль удалят через 40 минут. Нажмите кнопку и введите пароль.</div><div class="choice"><button class="btn" type="button" data-threat="phish">Это подозрительно</button><button class="btn ghost" type="button" data-threat="ok">Похоже на обычное</button></div>${verdict?`<p class="verdict">${verdict}</p>`:`<p class="note">Нажмите, как бы вы поступили.</p>`}</div></section><section class="band"><h2>Четыре опоры</h2><div class="principles"><article><h3>Не спешить</h3><p>Пауза — уже защита.</p></article><article><h3>Свой вход</h3><p>Банк и почта — из закладки или приложения.</p></article><article><h3>Второй шаг</h3><p>Код никому не диктуют.</p></article><article><h3>Свой канал</h3><p>Проверка — звонок на старый номер.</p></article></div></section><section><div class="row" style="justify-content:space-between;align-items:end"><h2>С чего начинают</h2><button class="text-btn" type="button" data-go="courses">Весь каталог</button></div>${rows}</section>`;
  }
  function filteredCourses() {
    const q = state.query.trim().toLowerCase();
    let list = DATA.courses.filter((c) => {
      if (state.category !== "все" && c.category !== state.category) return false;
      if (state.level !== "все" && c.level !== state.level) return false;
      if (state.cost === "free" && c.price !== 0) return false;
      if (state.cost === "paid" && c.price === 0) return false;
      if (q && !(c.title + " " + c.blurb).toLowerCase().includes(q)) return false;
      return true;
    });
    if (state.sort === "price") list = list.slice().sort((a, b) => a.price - b.price);
    if (state.sort === "title") list = list.slice().sort((a, b) => a.title.localeCompare(b.title, "ru"));
    return list;
  }
  function coursesView() {
    const cats = ["все", ...new Set(DATA.courses.map((c) => c.category))];
    const list = filteredCourses();
    const rows = list.length ? list.map((c) => `<button class="course-row" type="button" data-course="${c.id}"><span class="meta">${c.category}<br>${c.weeks} нед.</span><span><strong>${c.title}</strong><br><span class="note">${c.level} · ${c.hours} ч</span></span><span class="price">${money(c.price)}</span></button>`).join("") : `<div class="empty">Ничего не нашлось.</div>`;
    return `<p class="kicker">Каталог</p><h1>Курсы</h1><div class="filters"><input id="q" type="search" placeholder="Поиск" value="${escapeAttr(state.query)}"><select id="cat">${cats.map((c)=>`<option ${c===state.category?"selected":""}>${c}</option>`).join("")}</select><select id="lvl"><option>все</option><option ${state.level==="начальный"?"selected":""}>начальный</option><option ${state.level==="средний"?"selected":""}>средний</option></select><select id="cost"><option value="все">любая цена</option><option value="free" ${state.cost==="free"?"selected":""}>бесплатные</option><option value="paid" ${state.cost==="paid"?"selected":""}>платные</option></select><select id="sort"><option value="order">как в программе</option><option value="price" ${state.sort==="price"?"selected":""}>дешевле</option><option value="title" ${state.sort==="title"?"selected":""}>А–Я</option></select></div><div class="courses-list">${rows}</div>`;
  }
  function courseView() {
    const c = courseById(state.courseId);
    if (!c) return `<h1>Курс не найден</h1><button class="btn" type="button" data-go="courses">В каталог</button>`;
    const prog = progressOf(c);
    const stored = loadProgress()[c.id] || {};
    const lessons = c.lessons.map((l) => `<div class="lesson"><button class="lesson-h" type="button" data-lesson="${l.id}"><span>${stored[l.id]?"Прочитано · ":""}${l.title}</span><span class="meta">${l.minutes} мин</span></button>${stored[l.id]?`<p>${l.text}</p><button class="text-btn" type="button" data-unread="${l.id}">Снять отметку</button>`:`<p class="note">Откройте урок — текст сохранится в этом браузере.</p>`}</div>`).join("");
    return `<p class="kicker">${c.category} · ${c.level}</p><div class="layout-course"><div><h1>${c.title}</h1><p class="lede">${c.blurb}</p><h2>Чему научитесь</h2><ul>${c.goals.map((g)=>`<li>${g}</li>`).join("")}</ul><h2>Программа</h2><div class="progress"><span style="width:${Math.round(prog.ratio*100)}%"></span></div><p class="note">${prog.done} из ${prog.total}</p>${lessons}</div><aside class="buy"><p class="meta">${c.weeks} нед. · ${c.hours} ч</p><h2>${money(c.price)}</h2><p class="note">Демо. Оплаты нет.</p><button class="btn" type="button" id="buy">Записаться · демо</button></aside></div>`;
  }
  function checkView() {
    if (!state.shuffledQuiz) state.shuffledQuiz = DATA.quiz.map(shuffleOptions);
    const quiz = state.shuffledQuiz;
    const total = quiz.length;
    if (state.quizStep >= total) {
      const score = state.quizAnswers.filter((a) => a.ok).length;
      const pct = Math.round((score / total) * 100);
      return `<p class="kicker">Результат</p><h1>Вы разобрали ${score} из ${total}</h1><div class="score-ring" style="--p:${pct}"><b>${pct}%</b></div><div class="row"><button class="btn" type="button" id="retry">Ещё раз</button><button class="btn ghost" type="button" data-go="courses">К курсам</button></div>`;
    }
    const q = quiz[state.quizStep];
    const picked = state.quizAnswers[state.quizStep];
    const options = q.options.map((text, i) => {
      let cls = "option";
      if (picked) { if (i === q.correct) cls += " good"; else if (i === picked.index) cls += " bad"; }
      return `<button class="${cls}" type="button" data-opt="${i}" ${picked?"disabled":""}>${text}</button>`;
    }).join("");
    return `<p class="kicker">Проверка · ${state.quizStep+1} / ${total} · ${q.scene}</p><div class="quiz-card"><h1 style="font-size:clamp(28px,4vw,40px)">${q.prompt}</h1>${options}${picked?`<p class="explain">${q.explain}</p><button class="btn" type="button" id="nextq">${state.quizStep===total-1?"К результату":"Дальше"}</button>`:`<p class="note">Учебные ситуации, без реальных ссылок.</p>`}</div>`;
  }
  function authorView() {
    return `<p class="kicker">Вымышленный автор</p><h1>Иванко Сергей Романович</h1><p class="lede">Персонаж демонстрации: преподаватель цифровой безопасности на бытовых примерах.</p><section class="band"><h2>Зачем он «существует»</h2><div><p>В учебном макете нужен голос автора. Сергей Романович — не реальный человек. У него нет проверяемых дипломов и лицензий.</p><p>Миссия персонажа: чтобы человек не путал осторожность с тревогой.</p></div></section><section class="band"><h2>Как появился «Интервал»</h2><div><p>История демонстрационная. Формат платформы — каталог, проверка, материалы.</p><p>Настоящей компании и оферты за этим текстом нет.</p><button class="btn ghost" type="button" data-go="faq">Вопросы и контакт</button></div></section>`;
  }
  function materialsView() {
    const rows = DATA.articles.map((a) => `<button class="list-row" type="button" data-article="${a.id}"><span class="meta">${a.kind}</span><span><strong>${a.title}</strong><br><span class="note">${a.lead}</span></span><span class="meta">читать</span></button>`).join("");
    return `<p class="kicker">Читальня</p><h1>Полезные материалы</h1><p class="lede">Чек-листы и разборы на вечер.</p><div class="materials-list">${rows}</div>`;
  }
  function materialView() {
    const a = articleById(state.articleId);
    if (!a) return `<h1>Не найдено</h1><button class="btn" type="button" data-go="materials">Назад</button>`;
    return `<p class="kicker">${a.kind}</p><article class="article"><h1>${a.title}</h1><p class="lede">${a.lead}</p>${a.blocks.map((b)=>`<h2>${b.h}</h2><p>${b.p}</p>`).join("")}</article><p><button class="text-btn" type="button" data-go="materials">Все материалы</button></p>`;
  }
  function faqView() {
    const items = DATA.faqs.map((f, i) => `<div class="faq-item"><button type="button" data-faq="${i}"><span>${f.q}</span><span>${state.openFaq===i?"–":"+"}</span></button>${state.openFaq===i?`<p>${f.a}</p>`:""}</div>`).join("");
    return `<div class="layout-course"><div><p class="kicker">FAQ</p><h1>Частые вопросы</h1>${items}</div><form class="buy form" id="contact" novalidate><h2>Написать</h2><p class="note">Демо-форма. Письмо никуда не уходит.</p><label class="field">Имя<input name="name" required></label><label class="field">Почта<input name="email" type="email" required></label><label class="field">Сообщение<textarea name="msg" required minlength="12" rows="4"></textarea></label><p class="err" id="form-err" hidden></p><button class="btn" type="submit" id="send">Отправить демо</button></form></div>`;
  }
  function viewHtml() {
    switch (state.view) {
      case "courses": return coursesView();
      case "course": return courseView();
      case "check": return checkView();
      case "author": return authorView();
      case "materials": return materialsView();
      case "material": return materialView();
      case "faq": return faqView();
      default: return home();
    }
  }
  function render() {
    const root = document.getElementById("interval-root");
    if (!root) return;
    root.innerHTML = shell(viewHtml());
    bind();
  }
  function bind() {
    document.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => navigate(el.getAttribute("data-go"))));
    document.querySelectorAll("[data-course]").forEach((el) => el.addEventListener("click", () => navigate("course", { courseId: el.getAttribute("data-course") })));
    document.querySelectorAll("[data-article]").forEach((el) => el.addEventListener("click", () => navigate("material", { articleId: el.getAttribute("data-article") })));
    const themeBtn = $("#theme-btn");
    if (themeBtn) themeBtn.addEventListener("click", () => { setTheme(theme() === "dark" ? "light" : "dark"); render(); });
    const burger = $(".burger");
    if (burger) burger.addEventListener("click", () => { state.menu = !state.menu; render(); });
    document.querySelectorAll("[data-threat]").forEach((el) => el.addEventListener("click", () => { state.threat = el.getAttribute("data-threat"); render(); }));
    const q = $("#q");
    if (q) {
      const sync = () => { state.query = q.value; state.category = $("#cat").value; state.level = $("#lvl").value; state.cost = $("#cost").value; state.sort = $("#sort").value; render(); const again=$("#q"); if(again){again.focus(); again.setSelectionRange(again.value.length, again.value.length);} };
      q.addEventListener("input", sync);
      ["cat","lvl","cost","sort"].forEach((id) => { const el = $("#"+id); if (el) el.addEventListener("change", sync); });
    }
    document.querySelectorAll("[data-lesson]").forEach((el) => el.addEventListener("click", () => {
      const all = loadProgress(); all[state.courseId] = all[state.courseId] || {}; all[state.courseId][el.getAttribute("data-lesson")] = true; saveProgress(all); toast("Урок отмечен"); render();
    }));
    document.querySelectorAll("[data-unread]").forEach((el) => el.addEventListener("click", () => {
      const all = loadProgress(); if (all[state.courseId]) delete all[state.courseId][el.getAttribute("data-unread")]; saveProgress(all); render();
    }));
    const buy = $("#buy");
    if (buy) buy.addEventListener("click", () => {
      const c = courseById(state.courseId);
      const root = $("#modal-root");
      root.innerHTML = `<div class="modal" role="dialog"><form class="modal-card form" id="order"><h2>Запись на «${c.title}»</h2><p class="note">Демонстрация. Деньги не списываются. Цена: ${money(c.price)}.</p><label class="field">Имя<input name="name" required></label><label class="field">Почта<input name="email" type="email" required></label><p class="err" id="order-err" hidden></p><div class="row"><button class="btn" type="submit">Подтвердить демо</button><button class="btn ghost" type="button" id="close-order">Закрыть</button></div></form></div>`;
      $("#close-order").addEventListener("click", () => { root.innerHTML = ""; });
      $("#order").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const name = String(data.get("name")||"").trim();
        const email = String(data.get("email")||"").trim();
        const err = $("#order-err");
        if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.hidden = false; err.textContent = "Нужны имя и почта."; return; }
        root.innerHTML = ""; toast("Демо-запись принята. Оплаты не было.");
      });
    });
    document.querySelectorAll("[data-opt]").forEach((el) => el.addEventListener("click", () => {
      const qitem = (state.shuffledQuiz || DATA.quiz)[state.quizStep];
      const index = Number(el.getAttribute("data-opt"));
      state.quizAnswers[state.quizStep] = { index, ok: index === qitem.correct };
      render();
    }));
    const nextq = $("#nextq");
    if (nextq) nextq.addEventListener("click", () => { state.quizStep += 1; render(); });
    const retry = $("#retry");
    if (retry) retry.addEventListener("click", () => { state.quizStep = 0; state.quizAnswers = []; state.shuffledQuiz = DATA.quiz.map(shuffleOptions); render(); });
    document.querySelectorAll("[data-faq]").forEach((el) => el.addEventListener("click", () => {
      const i = Number(el.getAttribute("data-faq")); state.openFaq = state.openFaq === i ? -1 : i; render();
    }));
    const form = $("#contact");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      const name = String(data.get("name")||"").trim();
      const email = String(data.get("email")||"").trim();
      const msg = String(data.get("msg")||"").trim();
      const err = $("#form-err");
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || msg.length < 12) { err.hidden = false; err.textContent = "Проверьте поля. Отправка на сервер не выполняется."; return; }
      err.hidden = true; e.target.reset(); toast("Форма проверена. Письмо никуда не ушло.");
    });
  }
  function boot() { parseHash(); render(); }
  window.addEventListener("hashchange", () => { parseHash(); render(); });
  boot();
})();
