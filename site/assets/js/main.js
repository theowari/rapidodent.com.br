(() => {
  const WHATSAPP = '5519991076349';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Links do WhatsApp com mensagem pronta ----------
  document.querySelectorAll('[data-wa]').forEach((link) => {
    const topic = link.dataset.waMsg;
    const text = topic
      ? `Olá! Gostaria de saber mais sobre ${topic} na Rapidodent.`
      : 'Olá! Gostaria de agendar minha consulta na Rapidodent.';
    link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
    link.target = '_blank';
    link.rel = 'noopener';
  });

  // ---------- Ano no rodapé ----------
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Sombra do header ao sair do topo ----------
  const header = document.querySelector('[data-header]');
  const hero = document.querySelector('[data-hero]');
  const contact = document.querySelector('[data-contact]');
  const mobileCta = document.querySelector('[data-mobile-cta]');
  const mobileCtaLink = mobileCta?.querySelector('a');

  let heroVisible = true;
  let contactVisible = false;
  const syncMobileCta = () => {
    const show = !heroVisible && !contactVisible;
    mobileCta?.classList.toggle('is-visible', show);
    mobileCta?.setAttribute('aria-hidden', String(!show));
    if (mobileCtaLink) mobileCtaLink.tabIndex = show ? 0 : -1;
  };

  // Sentinela de 1px no topo do documento: quando sai da tela, a página rolou
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    header?.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(sentinel);

  if (hero) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncMobileCta();
    }).observe(hero);
  }
  // No contato e na seção de agendamento o botão fixo sairia duplicado ou cobriria o formulário
  const hideCtaOver = new Set();
  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) hideCtaOver.add(entry.target);
      else hideCtaOver.delete(entry.target);
    });
    contactVisible = hideCtaOver.size > 0;
    syncMobileCta();
  });
  [contact, document.getElementById('agendar')].forEach((el) => el && ctaObserver.observe(el));

  // ---------- Menu mobile ----------
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const main = document.querySelector('main');
  const isMenuOpen = () => menu?.classList.contains('is-open');
  const setMenu = (open) => {
    if (!toggle || !menu) return;
    menu.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Fechar menu' : 'Abrir menu';
    // Conteúdo atrás do menu fica fora do alcance do teclado e leitores de tela
    if (main) main.inert = open;
    if (mobileCta) mobileCta.inert = open;
  };
  toggle?.addEventListener('click', () => setMenu(!isMenuOpen()));
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen()) { setMenu(false); toggle.focus(); }
  });
  // Se a tela crescer para desktop com o menu aberto, fecha sem deixar a página travada
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  // ---------- Reveal no scroll ----------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  }

  // ---------- FAQ (acordeão) ----------
  document.querySelectorAll('[data-faq] .faq__item').forEach((item) => {
    const btn = item.querySelector('button');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
    });
  });

  // ---------- Galeria: botões anterior / próximo ----------
  const gallery = document.querySelector('[data-gallery]');
  const prev = document.querySelector('[data-gallery-prev]');
  const next = document.querySelector('[data-gallery-next]');
  if (gallery && prev && next) {
    const step = () => {
      const item = gallery.querySelector('.gallery__item');
      return item ? item.getBoundingClientRect().width + 16 : 320;
    };
    const behavior = reduceMotion ? 'auto' : 'smooth';
    prev.addEventListener('click', () => gallery.scrollBy({ left: -step(), behavior }));
    next.addEventListener('click', () => gallery.scrollBy({ left: step(), behavior }));

    const syncButtons = () => {
      const max = gallery.scrollWidth - gallery.clientWidth - 2;
      prev.disabled = gallery.scrollLeft <= 2;
      next.disabled = gallery.scrollLeft >= max;
    };
    gallery.addEventListener('scroll', syncButtons, { passive: true });
    window.addEventListener('resize', syncButtons);
    syncButtons();
  }

  // =====================================================================
  // AGENDAMENTO
  // =====================================================================

  // TODO: confirmar o e-mail oficial da clínica.
  const CLINIC_EMAIL = 'contato@rapidodent.com.br';
  const CLINIC_ADDRESS = 'Rua Henrique Cabral de Vasconcelos, 2120, Jardim São Nicolau, São João da Boa Vista, SP';

  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const pad = (n) => String(n).padStart(2, '0');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const longDate = (d) => `${cap(WEEKDAYS[d.getDay()])}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(new Date());

  // ---------- Validação compartilhada pelos dois formulários ----------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const digits = (v) => v.replace(/\D/g, '');

  const setError = (form, input, message) => {
    const slot = form.querySelector(`[data-error-for="${input.id}"]`);
    if (slot) slot.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const checkField = (input) => {
    const value = input.type === 'checkbox' ? input.checked : input.value.trim();
    switch (input.name) {
      case 'name':
        if (!value) return 'Informe seu nome.';
        if (value.length < 3) return 'Informe o nome completo.';
        return '';
      case 'email':
        if (!value) return 'Informe seu e-mail.';
        if (!EMAIL_RE.test(value)) return 'Confira o e-mail. Exemplo: nome@email.com';
        return '';
      case 'phone':
        if (!value) return input.required ? 'Informe seu WhatsApp com DDD.' : '';
        if (digits(value).length < 10) return 'Informe o número com DDD.';
        return '';
      case 'date':
        if (value && new Date(`${value}T00:00`) < today) return 'Escolha uma data a partir de hoje.';
        return '';
      case 'consent':
        return value ? '' : 'É preciso autorizar o contato para enviar.';
      default:
        return '';
    }
  };

  // Valida tudo; retorna o primeiro campo inválido (ou null)
  const validateForm = (form) => {
    let firstInvalid = null;
    form.querySelectorAll('input[name], textarea[name]').forEach((input) => {
      if (input.type === 'radio') return;
      const message = checkField(input);
      setError(form, input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  };

  // Depois da primeira tentativa, os erros se atualizam enquanto a pessoa corrige
  const liveValidate = (form) => {
    form.addEventListener('input', (e) => {
      const input = e.target;
      if (!form.dataset.touched || !input.name || input.type === 'radio') return;
      setError(form, input, checkField(input));
    });
    form.addEventListener('change', (e) => {
      const input = e.target;
      if (!form.dataset.touched || !input.name || input.type === 'radio') return;
      setError(form, input, checkField(input));
    });
  };

  // Máscara de telefone: (19) 99107-6349
  document.querySelectorAll('[data-phone]').forEach((input) => {
    input.addEventListener('input', () => {
      const d = digits(input.value).slice(0, 11);
      let out = d;
      if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 6) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      input.value = out;
    });
  });

  // ---------- Abas (Agenda online / Por e-mail) ----------
  const tabList = document.querySelector('[data-tabs]');
  if (tabList) {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const selectTab = (tab, focus) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectTab(tabs[next], true);
      });
    });
  }

  // ---------- Agenda online (PRÉVIA: sem backend, horários simulados) ----------
  // Na versão final, `slotsFor` consulta a API do Google Agenda (freebusy) e
  // a confirmação cria o evento na agenda da clínica.
  const scheduler = document.querySelector('[data-scheduler]');
  if (scheduler) {
    const grid = scheduler.querySelector('[data-cal-grid]');
    const monthLabel = scheduler.querySelector('[data-cal-month]');
    const prevMonth = scheduler.querySelector('[data-cal-prev]');
    const nextMonth = scheduler.querySelector('[data-cal-next]');
    const slotsWrap = scheduler.querySelector('[data-slots]');
    const slotsTitle = scheduler.querySelector('[data-slots-title]');
    const steps = [...scheduler.querySelectorAll('[data-step]')];
    const stepLabels = [...scheduler.querySelectorAll('[data-step-label]')];
    const form = scheduler.querySelector('[data-booking-form]');
    const summary = scheduler.querySelector('[data-summary]');
    const submitBtn = form.querySelector('[data-submit]');
    const submitLabel = form.querySelector('[data-submit-label]');
    const submitIcon = submitBtn.querySelector('i');
    const doneStep = scheduler.querySelector('[data-step="done"]');
    const doneText = scheduler.querySelector('[data-done-text]');
    const eventDate = scheduler.querySelector('[data-event-date]');
    const gcalLink = scheduler.querySelector('[data-gcal-link]');

    // Horário ilustrativo: seg a sex 8h-12h e 14h-18h, sábado 8h-12h
    const WEEKDAY_HOURS = [8, 9, 10, 11, 14, 15, 16, 17];
    const SATURDAY_HOURS = [8, 9, 10, 11];
    const booked = new Set();

    // Hash determinístico: o mesmo dia sempre mostra a mesma ocupação
    const hash = (str) => {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      return Math.abs(h);
    };

    const slotsFor = (date) => {
      if (date <= today || date.getDay() === 0) return [];
      const hours = date.getDay() === 6 ? SATURDAY_HOURS : WEEKDAY_HOURS;
      const key = dateKey(date);
      return hours.map((h) => ({ h, busy: booked.has(`${key}T${h}`) || hash(`${key}-${h}`) % 100 < 40 }));
    };

    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    // Abre no mês do primeiro dia com horário livre (ex.: no último dia do mês, já mostra o próximo)
    const firstFreeDay = () => {
      for (let d = new Date(today); d < new Date(maxMonth.getFullYear(), maxMonth.getMonth() + 1, 1); d.setDate(d.getDate() + 1)) {
        if (slotsFor(d).some((s) => !s.busy)) return new Date(d);
      }
      return today;
    };
    const firstFree = firstFreeDay();
    let viewMonth = new Date(firstFree.getFullYear(), firstFree.getMonth(), 1);
    let selectedDate = null;
    let selectedHour = null;

    const side = scheduler.querySelector('.scheduler__side');
    const stacked = window.matchMedia('(max-width: 1023px)');
    const showStep = (name) => {
      steps.forEach((s) => { s.hidden = s.dataset.step !== name; });
      // No mobile o painel fica abaixo do calendário: leva a pessoa até a próxima etapa
      if (stacked.matches && name !== 'empty') {
        side.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      const order = { empty: 0, slots: 1, form: 2, done: 3 }[name];
      stepLabels.forEach((label, i) => {
        label.classList.toggle('is-active', i === order);
        label.classList.toggle('is-done', i < order);
      });
    };

    const renderCalendar = () => {
      const y = viewMonth.getFullYear();
      const m = viewMonth.getMonth();
      monthLabel.textContent = `${MONTHS[m]} ${y}`;
      prevMonth.disabled = viewMonth <= minMonth;
      nextMonth.disabled = viewMonth >= maxMonth;

      const frag = document.createDocumentFragment();
      const lead = new Date(y, m, 1).getDay();
      for (let i = 0; i < lead; i++) frag.appendChild(document.createElement('span'));

      const days = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d);
        const free = slotsFor(date).filter((s) => !s.busy).length;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal__day';
        btn.textContent = d;
        btn.disabled = free === 0;
        btn.classList.toggle('is-available', free > 0);
        btn.classList.toggle('is-today', date.getTime() === today.getTime());
        btn.setAttribute('aria-pressed', String(!!selectedDate && date.getTime() === selectedDate.getTime()));
        btn.setAttribute('aria-label', `${longDate(date)}, ${free ? `${free} horários livres` : 'sem horários'}`);
        btn.addEventListener('click', () => selectDay(date));
        frag.appendChild(btn);
      }
      grid.replaceChildren(frag);
    };

    const renderSlots = () => {
      slotsTitle.textContent = longDate(selectedDate);
      const frag = document.createDocumentFragment();
      slotsFor(selectedDate).forEach(({ h, busy }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot';
        btn.textContent = `${pad(h)}:00`;
        btn.disabled = busy;
        btn.setAttribute('aria-pressed', String(h === selectedHour));
        if (busy) btn.setAttribute('aria-label', `${pad(h)}:00, ocupado`);
        btn.addEventListener('click', () => selectSlot(h));
        frag.appendChild(btn);
      });
      slotsWrap.replaceChildren(frag);
    };

    const selectDay = (date) => {
      selectedDate = date;
      selectedHour = null;
      renderCalendar();
      renderSlots();
      showStep('slots');
    };

    const selectSlot = (h) => {
      selectedHour = h;
      renderSlots();
      summary.textContent = `${longDate(selectedDate)} às ${pad(h)}:00`;
      showStep('form');
      form.querySelector('input').focus({ preventScroll: true });
    };

    const googleCalendarUrl = () => {
      const d = selectedDate;
      const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: 'Consulta VIP · Rapidodent',
        dates: `${day}T${pad(selectedHour)}0000/${day}T${pad(selectedHour + 1)}0000`,
        ctz: 'America/Sao_Paulo',
        details: 'Primeira consulta VIP com scanner 3D. Dúvidas: WhatsApp (19) 99107-6349.',
        location: CLINIC_ADDRESS,
      });
      return `https://calendar.google.com/calendar/render?${params}`;
    };

    prevMonth.addEventListener('click', () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    nextMonth.addEventListener('click', () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
      renderCalendar();
    });
    scheduler.querySelector('[data-change-slot]').addEventListener('click', () => showStep('slots'));

    liveValidate(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.dataset.touched = 'true';
      const invalid = validateForm(form);
      if (invalid) { invalid.focus(); return; }

      // Simula a chamada ao servidor que criaria o evento no Google Agenda
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.disabled = true;
      submitLabel.textContent = 'Confirmando...';
      submitIcon.className = 'ph ph-circle-notch';

      setTimeout(() => {
        booked.add(`${dateKey(selectedDate)}T${selectedHour}`);
        const email = form.elements.email.value.trim();
        doneText.textContent = `O convite da consulta vai para ${email}.`;
        eventDate.textContent = `${longDate(selectedDate)}, ${pad(selectedHour)}:00 às ${pad(selectedHour + 1)}:00`;
        gcalLink.href = googleCalendarUrl();

        submitBtn.removeAttribute('aria-busy');
        submitBtn.disabled = false;
        submitLabel.textContent = 'Confirmar horário';
        submitIcon.className = 'ph ph-calendar-plus';

        renderCalendar();
        showStep('done');
        doneStep.focus({ preventScroll: true });
      }, 1100);
    });

    scheduler.querySelector('[data-restart]').addEventListener('click', () => {
      form.reset();
      delete form.dataset.touched;
      form.querySelectorAll('[aria-invalid]').forEach((el) => setError(form, el, ''));
      selectedDate = null;
      selectedHour = null;
      renderCalendar();
      showStep('empty');
    });

    renderCalendar();
  }

  // ---------- Solicitação por e-mail (mailto: com a mensagem pronta) ----------
  const emailForm = document.querySelector('[data-email-form]');
  const emailDone = document.querySelector('[data-email-done]');
  if (emailForm && emailDone) {
    const dateInput = emailForm.querySelector('#em-date');
    if (dateInput) dateInput.min = dateKey(today);
    document.querySelectorAll('[data-clinic-email]').forEach((a) => {
      a.href = `mailto:${CLINIC_EMAIL}`;
      a.textContent = CLINIC_EMAIL;
    });

    liveValidate(emailForm);
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      emailForm.dataset.touched = 'true';
      const invalid = validateForm(emailForm);
      if (invalid) { invalid.focus(); return; }

      const f = emailForm.elements;
      const date = f.date.value ? f.date.value.split('-').reverse().join('/') : '';
      const lines = [
        'Olá, equipe Rapidodent!',
        '',
        'Gostaria de agendar uma consulta.',
        '',
        `Nome: ${f.name.value.trim()}`,
        `E-mail: ${f.email.value.trim()}`,
        f.phone.value ? `WhatsApp: ${f.phone.value}` : null,
        `Motivo: ${f.treatment.value}`,
        `Período preferido: ${f.period.value}`,
        date ? `Data de preferência: ${date}` : null,
        f.message.value.trim() ? `\nMensagem:\n${f.message.value.trim()}` : null,
      ].filter((l) => l !== null);

      const subject = `Agendamento pelo site: ${f.treatment.value}`;
      window.location.href = `mailto:${CLINIC_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;

      emailForm.hidden = true;
      emailDone.hidden = false;
      emailDone.focus({ preventScroll: true });
    });

    emailDone.querySelector('[data-email-restart]').addEventListener('click', () => {
      emailForm.reset();
      delete emailForm.dataset.touched;
      emailForm.querySelectorAll('[aria-invalid]').forEach((el) => setError(emailForm, el, ''));
      emailDone.hidden = true;
      emailForm.hidden = false;
      emailForm.querySelector('input').focus();
    });
  }
})();
