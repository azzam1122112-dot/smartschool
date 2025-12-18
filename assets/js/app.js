"use strict";

(function () {
  const cfg = window.SMART_SCHOOLS || {};
  const waNumber = String(cfg.whatsappNumber || "").replace(/\D/g, "");
  const waPrefill = String(cfg.whatsappPrefill || "أرغب بالتواصل");
  const waBase = "https://wa.me/";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function enc(s) { return encodeURIComponent(String(s ?? "")); }

  function toast(msg, ms = 2400) {
    const el = $("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; el.textContent = ""; }, ms);
  }

  function buildWaLink(message) {
    if (!waNumber) return "#";
    return `${waBase}${waNumber}?text=${enc(message)}`;
  }

  function setWhatsAppLinks() {
    const waTop = $("#waTop");
    const waQuick = $("#waQuick");
    const link = buildWaLink(waPrefill);

    const enabled = !!waNumber;
    if (waTop) {
      waTop.hidden = !enabled;
      waTop.href = enabled ? link : "#";
    }
    if (waQuick) {
      waQuick.hidden = !enabled;
      waQuick.href = enabled ? link : "#";
    }
  }

  function normalizePhone(s) {
    s = String(s || "").trim();
    const cleaned = s.replace(/[^\d+]/g, "");
    if (cleaned.length < 8) return "";
    return cleaned.slice(0, 20);
  }

  function safeText(s, maxLen) {
    s = String(s ?? "").trim().replace(/\r/g, "");
    if (s.length > maxLen) s = s.slice(0, maxLen);
    return s;
  }

  function selectedProducts(form) {
    const values = [];
    $$('input[name="product"]:checked', form).forEach((el) => {
      const v = String(el.value || "");
      if (v === "reports" || v === "display") values.push(v);
    });
    return values;
  }

  function productLabel(v) {
    if (v === "reports") return "منصة التقارير والتذاكر";
    if (v === "display") return "شاشة العرض الذكية";
    return v;
  }

  function composeLeadMessage(data) {
    const products = data.products.map(productLabel);
    return [
      "طلب عرض سعر/تجربة — أنظمة المدارس الذكية",
      "—",
      `المدرسة: ${data.school || "-"}`,
      `المدينة: ${data.city || "-"}`,
      `المسؤول: ${data.name || "-"}`,
      `الجوال: ${data.phone || "-"}`,
      `المنتجات: ${products.length ? products.join("، ") : "غير محدد"}`,
      `عدد الشاشات: ${data.screens || "—"}`,
      `ملاحظات: ${data.notes || "—"}`
    ].join("\n");
  }

  function handleLeadSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const msgEl = $("#formMsg");

    if (!waNumber) {
      if (msgEl) msgEl.textContent = "لتفعيل الإرسال عبر واتساب: ضع رقمك داخل SMART_SCHOOLS.whatsappNumber في index.html.";
      toast("فعّل رقم واتساب أولًا.");
      return;
    }

    const fd = new FormData(form);
    const school = safeText(fd.get("school"), 120);
    const city = safeText(fd.get("city"), 80);
    const name = safeText(fd.get("name"), 80);
    const phone = normalizePhone(fd.get("phone"));
    const screens = safeText(fd.get("screens"), 10).replace(/[^\d]/g, "").slice(0, 6);
    const notes = safeText(fd.get("notes"), 500);
    const products = selectedProducts(form);

    if (!school || !city || !name || !phone) {
      if (msgEl) msgEl.textContent = "فضلاً أكمل: اسم المدرسة، المدينة، اسم المسؤول، رقم الجوال.";
      toast("تحقق من الحقول المطلوبة.");
      return;
    }

    const link = buildWaLink(composeLeadMessage({ school, city, name, phone, screens, notes, products }));
    try {
      window.open(link, "_blank", "noopener,noreferrer");
      if (msgEl) msgEl.textContent = "تم فتح واتساب لإرسال الطلب.";
      toast("تم فتح واتساب.");
    } catch (err) {
      console.error("WhatsApp open failed:", err);
      if (msgEl) msgEl.textContent = "تعذر فتح واتساب. جرّب متصفحًا آخر.";
      toast("تعذر فتح واتساب.");
    }
  }

  function initMenu() {
    const btn = $("[data-menu-btn]");
    const menu = $("[data-menu]");
    if (!btn || !menu) return;

    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");

    function isDesktop() {
      return window.matchMedia("(min-width: 900px)").matches;
    }

    function setOpen(open) {
      if (isDesktop()) open = false;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
    }

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    document.addEventListener("click", (e) => {
      if (menu.hidden) return;
      if (e.target.closest("[data-menu]") || e.target.closest("[data-menu-btn]")) return;
      setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => setOpen(false), { passive: true });

    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) setOpen(false);
    });

    if (isDesktop()) setOpen(false);
  }

  function initAnchors() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", href);
    });

    const topLink = document.querySelector("[data-top]");
    if (topLink) {
      topLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // سويتش مستقل: outcomes و how (بدون دمج)
  function initSwitches() {
    const switches = $$("[data-switch]");
    if (!switches.length) return;

    function setGroupActive(group, targetId) {
      // Buttons
      const btns = $$(`[data-switch="${group}"]`);
      btns.forEach((b) => {
        const on = b.getAttribute("data-target") === targetId;
        b.classList.toggle("isActive", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });

      // Panels
      const panels = $$(".switchPanel").filter(p => p.id && p.id.startsWith(group + "-"));
      panels.forEach((p) => {
        const show = p.id === targetId;
        p.hidden = !show;
        p.classList.toggle("isActive", show);
      });
    }

    switches.forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.getAttribute("data-switch");
        const target = btn.getAttribute("data-target");
        if (!group || !target) return;
        setGroupActive(group, target);
      });
    });

    // Defaults
    setGroupActive("outcomes", "outcomes-reports");
    setGroupActive("how", "how-reports");
  }

  function initGalleries() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

    function getSlides(viewport) {
      return Array.from(viewport.querySelectorAll("img"));
    }

    function scrollToSlide(viewport, slide, behavior) {
      if (!slide) return;
      const left = slide.offsetLeft;
      viewport.scrollTo({ left, behavior });
    }

    $$('[data-gallery]').forEach((gallery) => {
      const viewport = gallery.querySelector('.galleryViewport');
      const dotsEl = gallery.querySelector('[data-dots]');
      const prevBtn = gallery.querySelector('[data-prev]');
      const nextBtn = gallery.querySelector('[data-next]');
      if (!viewport || !dotsEl) return;

      const slides = getSlides(viewport);
      if (!slides.length) return;

      // Build dots
      dotsEl.innerHTML = "";
      const dots = slides.map((_, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "gDot";
        b.setAttribute("aria-label", `انتقل للصورة ${idx + 1}`);
        b.addEventListener("click", () => {
          const behavior = prefersReducedMotion ? "auto" : "smooth";
          scrollToSlide(viewport, slides[idx], behavior);
        });
        dotsEl.appendChild(b);
        return b;
      });

      let activeIndex = 0;

      function setActive(i) {
        activeIndex = clamp(i, 0, slides.length - 1);
        dots.forEach((d, di) => d.classList.toggle("isActive", di === activeIndex));
        if (prevBtn) prevBtn.disabled = activeIndex <= 0;
        if (nextBtn) nextBtn.disabled = activeIndex >= slides.length - 1;
      }

      // Track visibility to pick active slide
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            // choose the most visible slide
            let best = { idx: activeIndex, ratio: 0 };
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              const idx = slides.indexOf(e.target);
              if (idx >= 0 && e.intersectionRatio >= best.ratio) {
                best = { idx, ratio: e.intersectionRatio };
              }
            });
            setActive(best.idx);
          },
          { root: viewport, threshold: [0.55, 0.7, 0.85] }
        );
        slides.forEach((s) => io.observe(s));
      } else {
        // Fallback: update on scroll (best-effort)
        viewport.addEventListener(
          "scroll",
          () => {
            const left = viewport.scrollLeft;
            let bestIdx = 0;
            let bestDist = Infinity;
            slides.forEach((s, idx) => {
              const dist = Math.abs(s.offsetLeft - left);
              if (dist < bestDist) {
                bestDist = dist;
                bestIdx = idx;
              }
            });
            setActive(bestIdx);
          },
          { passive: true }
        );
      }

      // Buttons
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          const behavior = prefersReducedMotion ? "auto" : "smooth";
          scrollToSlide(viewport, slides[activeIndex - 1], behavior);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          const behavior = prefersReducedMotion ? "auto" : "smooth";
          scrollToSlide(viewport, slides[activeIndex + 1], behavior);
        });
      }

      // Wheel: map vertical wheel to horizontal scroll (Windows mouse friendly)
      viewport.addEventListener(
        "wheel",
        (e) => {
          if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
          viewport.scrollLeft += e.deltaY;
          e.preventDefault();
        },
        { passive: false }
      );

      // Drag to scroll (mouse/touch)
      let isDown = false;
      let startX = 0;
      let startLeft = 0;

      viewport.addEventListener("pointerdown", (e) => {
        isDown = true;
        viewport.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startLeft = viewport.scrollLeft;
      });

      viewport.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        viewport.scrollLeft = startLeft - dx;
      });

      function endDrag(e) {
        if (!isDown) return;
        isDown = false;
        try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
        // Snap to closest slide
        const left = viewport.scrollLeft;
        let bestIdx = 0;
        let bestDist = Infinity;
        slides.forEach((s, idx) => {
          const dist = Math.abs(s.offsetLeft - left);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
        const behavior = prefersReducedMotion ? "auto" : "smooth";
        scrollToSlide(viewport, slides[bestIdx], behavior);
      }

      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);

      // Keyboard support
      viewport.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const behavior = prefersReducedMotion ? "auto" : "smooth";
        scrollToSlide(viewport, slides[activeIndex + dir], behavior);
      });

      // Initial state
      setActive(0);
    });
  }

  function init() {
    setWhatsAppLinks();
    initMenu();
    initAnchors();
    initSwitches();
    initGalleries();

    const leadForm = document.getElementById("leadForm");
    if (leadForm) leadForm.addEventListener("submit", handleLeadSubmit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
