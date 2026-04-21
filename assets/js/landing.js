(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('hidden') === false;
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.add('hidden');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Trial Modal ──
  const modal = document.getElementById('trial-modal');
  const form  = document.getElementById('trial-form');
  const errorEl = document.getElementById('trial-error');

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('input, button[data-close-trial-modal]')?.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (form) form.reset();
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }
    // deselect radios visually
    modal.querySelectorAll('.trial-radio-input').forEach(r => { r.checked = false; });
  }

  document.querySelectorAll('[data-open-trial-modal]').forEach(btn =>
    btn.addEventListener('click', openModal)
  );

  document.querySelectorAll('[data-close-trial-modal]').forEach(btn =>
    btn.addEventListener('click', closeModal)
  );

  modal?.querySelector('[data-modal-backdrop]')?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }

    const data = Object.fromEntries(new FormData(form));
    const required = ['school','stage','gender','city','phone','name','system'];
    const missing  = required.filter(k => !data[k]?.trim());

    if (missing.length > 0) {
      errorEl.textContent = 'يرجى تعبئة جميع الحقول المطلوبة.';
      errorEl.classList.remove('hidden');
      return;
    }

    const phoneRaw = data.phone.trim();
    if (!/^(05\d{8}|\+9665\d{8}|9665\d{8})$/.test(phoneRaw.replace(/\s/g, ''))) {
      errorEl.textContent = 'يرجى إدخال رقم جوال سعودي صحيح (مثال: 05XXXXXXXX).';
      errorEl.classList.remove('hidden');
      return;
    }

    const msg =
`🏫 *طلب عرض مجاني للتجربة*

• *اسم المدرسة:* ${data.school.trim()}
• *المرحلة:* ${data.stage}
• *الجنس:* ${data.gender}
• *المدينة:* ${data.city.trim()}
• *رقم الجوال:* ${phoneRaw}
• *الاسم:* ${data.name.trim()}
• *النظام المطلوب:* ${data.system}`;

    const url = `https://wa.me/966537720207?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeModal();
  });

  // ── Reveal on scroll ──
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealItems.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const counterItems = document.querySelectorAll('[data-counter]');
  const animateCounter = (element) => {
    const target = Number(element.dataset.counter || 0);
    const suffix = element.dataset.suffix || '';
    const duration = 900;
    let start = 0;
    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * (target - start) + start);
      element.textContent = `${current}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && counterItems.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counterItems.forEach((counter) => counterObserver.observe(counter));
  } else {
    counterItems.forEach((counter) => {
      counter.textContent = `${counter.dataset.counter || '0'}${counter.dataset.suffix || ''}`;
    });
  }
})();
