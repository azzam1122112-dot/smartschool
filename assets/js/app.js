/* assets/js/site.js */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Topbar scroll effect =====
  const topbar = $("[data-topbar]");
  const onScroll = () => {
    if (!topbar) return;
    topbar.classList.toggle("isScrolled", (window.scrollY || 0) > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ===== Mobile Menu =====
  const menuBtn = $("[data-menu-btn]");
  const menu = $("[data-menu]");
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    const isOpen = Boolean(open);
    if (isOpen) menu.removeAttribute("hidden");
    else menu.setAttribute("hidden", "");
    menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
  function toggleMenu() {
    if (!menu) return;
    setMenu(menu.hasAttribute("hidden"));
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", toggleMenu);

    document.addEventListener("click", (e) => {
      const inside = menu.contains(e.target) || menuBtn.contains(e.target);
      if (!inside && !menu.hasAttribute("hidden")) setMenu(false);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hasAttribute("hidden")) setMenu(false);
    });

    $$("#mobileMenu a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );

    window.addEventListener("resize", () => {
      // عند الانتقال لسطح المكتب نخفي القائمة لتجنب حالات غريبة
      if (window.innerWidth > 980 && !menu.hasAttribute("hidden")) setMenu(false);
    });
  }

  // ===== WhatsApp Helpers =====
  const cfg = window.SMART_SCHOOLS || {};
  const waNumber = String(cfg.whatsappNumber || "").replace(/\D/g, "");
  const waPrefill = String(cfg.whatsappPrefill || "");

  const waUrl = (txt) => {
    if (!waNumber) return "#";
    const message = String(txt || waPrefill || "").trim();
    const encoded = message ? "?text=" + encodeURIComponent(message) : "";
    return "https://wa.me/" + waNumber + encoded;
  };

  const waTop = $("#waTop");
  const waMenu = $("#waMenu");
  const waQuick = $("#waQuick");

  function updateWAButtons() {
    if (!waNumber) {
      [waTop, waMenu, waQuick].forEach((el) => {
        if (el) el.hidden = true;
      });
      return;
    }
    const url = waUrl();
    [waTop, waMenu, waQuick].forEach((el) => {
      if (!el) return;
      el.href = url;
      el.hidden = false;
    });
  }
  updateWAButtons();

  // ===== Toast =====
  const toast = $("[data-toast]");
  let toastT = null;

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hideToast() {
    if (!toast) return;
    toast.hidden = true;
    clearTimeout(toastT);
    toastT = null;
  }

  function showToast(text) {
    if (!toast) return;
    toast.innerHTML = "";
    const left = document.createElement("div");
    left.innerHTML =
      "<strong>تنبيه</strong><div class='small' style='margin-top:4px;color:var(--muted)'>" +
      escapeHtml(text) +
      "</div>";

    const btn = document.createElement("button");
    btn.className = "toastBtn";
    btn.type = "button";
    btn.textContent = "إغلاق";
    btn.addEventListener("click", hideToast);

    toast.append(left, btn);
    toast.hidden = false;

    clearTimeout(toastT);
    toastT = setTimeout(hideToast, 4500);
  }

  // ===== Tabs (A11y + Keyboard) =====
  function initTabs(tabsRoot) {
    const btns = $$('[role="tab"]', tabsRoot);
    if (!btns.length) return;

    const panels = btns
      .map((b) => document.getElementById(b.getAttribute("aria-controls") || ""))
      .filter(Boolean);

    function activate(btn) {
      const id = btn.getAttribute("data-tab");
      if (!id) return;

      btns.forEach((b, i) => {
        const selected = b === btn;
        b.setAttribute("aria-selected", selected ? "true" : "false");
        b.tabIndex = selected ? 0 : -1;

        const p = panels[i];
        if (p) p.hidden = p.id !== id;
      });
      btn.focus({ preventScroll: true });
    }

    // init state
    btns.forEach((b, i) => {
      const selected = b.getAttribute("aria-selected") === "true";
      b.tabIndex = selected ? 0 : -1;

      const p = panels[i];
      if (p) p.hidden = !selected;
    });

    btns.forEach((btn) => {
      btn.addEventListener("click", () => activate(btn));
      btn.addEventListener("keydown", (e) => {
        const idx = btns.indexOf(btn);
        if (idx < 0) return;

        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          activate(btns[(idx - 1 + btns.length) % btns.length]);
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          activate(btns[(idx + 1) % btns.length]);
        } else if (e.key === "Home") {
          e.preventDefault();
          activate(btns[0]);
        } else if (e.key === "End") {
          e.preventDefault();
          activate(btns[btns.length - 1]);
        }
      });
    });
  }
  $$("[data-tabs]").forEach(initTabs);

  // ===== Gallery (Pointer Events, أخف وأثبت) =====
  function initGallery(root) {
    const viewport = $(".galleryViewport", root);
    const track = $(".galleryTrack", root);
    const dotsWrap = $("[data-dots]", root);
    const prevBtn = $("[data-prev]", root);
    const nextBtn = $("[data-next]", root);
    if (!viewport || !track || !dotsWrap) return;

    const slides = $$("img", track);
    if (!slides.length) return;

    dotsWrap.innerHTML = "";
    const dots = slides.map((_, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "dot" + (i === 0 ? " active" : "");
      d.setAttribute("aria-label", "انتقل للصورة " + (i + 1));
      d.addEventListener("click", () => scrollToIndex(i));
      dotsWrap.appendChild(d);
      return d;
    });

    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    const slideCenterX = (i) => {
      const el = slides[i];
      return el.offsetLeft;
    };

    function scrollToIndex(i) {
      i = clamp(i, 0, slides.length - 1);
      viewport.scrollTo({ left: slideCenterX(i), behavior: "smooth" });
    }

    function setActiveByScroll() {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;

      slides.forEach((img, i) => {
        const c = img.offsetLeft + img.offsetWidth / 2;
        const dist = Math.abs(c - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });

      dots.forEach((d, i) => d.classList.toggle("active", i === best));
      viewport.dataset.index = String(best);
    }

    let raf = null;
    viewport.addEventListener(
      "scroll",
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(setActiveByScroll);
      },
      { passive: true }
    );

    if (prevBtn)
      prevBtn.addEventListener("click", () => {
        const i = parseInt(viewport.dataset.index || "0", 10) || 0;
        scrollToIndex(i - 1);
      });
    if (nextBtn)
      nextBtn.addEventListener("click", () => {
        const i = parseInt(viewport.dataset.index || "0", 10) || 0;
        scrollToIndex(i + 1);
      });

    // Pointer drag
    let isDown = false;
    let startX = 0;
    let startLeft = 0;

    function onPointerDown(e) {
      isDown = true;
      viewport.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startLeft = viewport.scrollLeft;
    }

    function onPointerMove(e) {
      if (!isDown) return;
      const dx = e.clientX - startX;
      viewport.scrollLeft = startLeft - dx;
    }

    function onPointerUp() {
      isDown = false;
    }

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);

    viewport.dataset.index = "0";
    setActiveByScroll();

    // Auto Play
    let autoPlayInterval;
    const startAutoPlay = () => {
      stopAutoPlay();
      autoPlayInterval = setInterval(() => {
        const currentIndex = parseInt(viewport.dataset.index || "0", 10) || 0;
        const nextIndex = (currentIndex + 1) % slides.length;
        scrollToIndex(nextIndex);
      }, 4000); // Change slide every 4 seconds
    };

    const stopAutoPlay = () => {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
    };

    // Start auto play initially
    startAutoPlay();

    // Pause on interaction
    viewport.addEventListener("pointerdown", stopAutoPlay);
    viewport.addEventListener("touchstart", stopAutoPlay, { passive: true });
    if (prevBtn) prevBtn.addEventListener("click", stopAutoPlay);
    if (nextBtn) nextBtn.addEventListener("click", stopAutoPlay);
    
    // Resume on mouse leave (optional, but good for UX)
    root.addEventListener("mouseleave", startAutoPlay);
    root.addEventListener("mouseenter", stopAutoPlay);
  }
  $$("[data-gallery]").forEach(initGallery);

  // ===== Lead Form -> WhatsApp =====
  const form = $("#leadForm");
  const msg = $("#formMsg");

  function normalizePhone(p) {
    return String(p || "")
      .replace(/[^\d+]/g, "")
      .trim()
      .slice(0, 30);
  }

  function selectedProducts() {
    if (!form) return [];
    const boxes = $$('input[name="product"]', form).filter((x) => x.checked);
    const vals = boxes.map((x) => x.value);
    const map = { reports: "منصة التقارير والتذاكر", display: "شاشة العرض الذكية" };
    return vals.map((v) => map[v] || v);
  }

  function buildLeadMessage(payload) {
    const lines = [];
    lines.push(cfg.whatsappPrefill || "السلام عليكم، أرغب بعرض سعر/تجربة.");
    lines.push("");
    lines.push("— بيانات المدرسة —");
    lines.push("المدرسة: " + payload.school);
    lines.push("المدينة: " + payload.city);
    lines.push("اسم المسؤول: " + payload.name);
    lines.push("الجوال: " + payload.phone);
    lines.push("");
    lines.push("— المطلوب —");
    lines.push("المنتج: " + (payload.products.length ? payload.products.join(" + ") : "غير محدد"));
    if (payload.screens) lines.push("عدد الشاشات: " + payload.screens);
    if (payload.notes) {
      lines.push("");
      lines.push("ملاحظات:");
      lines.push(payload.notes);
    }
    return lines.join("\n");
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const payload = {
        school: ($("#schoolName")?.value || "").trim().slice(0, 120),
        city: ($("#city")?.value || "").trim().slice(0, 80),
        name: ($("#contactName")?.value || "").trim().slice(0, 80),
        phone: normalizePhone($("#phone")?.value || ""),
        products: selectedProducts(),
        screens: ($("#screens")?.value || "").trim().slice(0, 10),
        notes: ($("#notes")?.value || "").trim().slice(0, 500),
      };

      if (!payload.school || !payload.city || !payload.name || !payload.phone) {
        if (msg) msg.textContent = "فضلاً أكمل الحقول المطلوبة: اسم المدرسة، المدينة، اسم المسؤول، رقم الجوال.";
        showToast("فضلاً أكمل الحقول المطلوبة.");
        return;
      }

      if (!waNumber) {
        if (msg) msg.textContent = "زر واتساب غير مفعل حالياً. ضع رقم واتساب في إعدادات الصفحة.";
        showToast("زر واتساب غير مفعل. حدّث رقم واتساب في إعدادات الصفحة.");
        return;
      }

      const text = buildLeadMessage(payload);
      const url = waUrl(text);

      if (waQuick) {
        waQuick.href = url;
        waQuick.hidden = false;
      }

      if (msg) msg.textContent = "تم تجهيز الرسالة… سيتم فتح واتساب الآن.";
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
})();
