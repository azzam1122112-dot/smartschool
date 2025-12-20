/* assets/js/app.js */
(function () {
  "use strict";

  // DOM Helper Functions
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== Loader =====
  function initLoader() {
    const loader = $('.loader');
    if (!loader) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
      }, 800);
    });

    // Fallback in case load event doesn't fire
    setTimeout(() => {
      if (!loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
      }
    }, 3000);
  }

  // ===== Topbar Scroll Effect =====
  function initTopbarScroll() {
    const topbar = $('[data-topbar]');
    if (!topbar) return;

    const onScroll = () => {
      topbar.classList.toggle('isScrolled', (window.scrollY || 0) > 8);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial check
  }

  // ===== Mobile Menu =====
  function initMobileMenu() {
    const menuBtn = $('[data-menu-btn]');
    const menu = $('[data-menu]');

    if (!menuBtn || !menu) return;

    function setMenu(open) {
      const isOpen = Boolean(open);
      if (isOpen) {
        menu.removeAttribute('hidden');
        menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      } else {
        menu.setAttribute('hidden', '');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    function toggleMenu() {
      setMenu(menu.hasAttribute('hidden'));
    }

    // Toggle menu on button click
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
        setMenu(false);
      }
    });

    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hasAttribute('hidden')) {
        setMenu(false);
      }
    });

    // Close menu on link click
    $$('#mobileMenu a').forEach((a) => {
      a.addEventListener('click', () => setMenu(false));
    });

    // Responsive behavior
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && !menu.hasAttribute('hidden')) {
        setMenu(false);
      }
    });
  }

  // ===== WhatsApp Integration =====
  function initWhatsApp() {
    const cfg = window.SMART_SCHOOLS || {};
    const waNumber = String(cfg.whatsappNumber || '').replace(/\D/g, '');
    const waPrefill = String(cfg.whatsappPrefill || '');

    const waUrl = (txt) => {
      if (!waNumber) return '#';
      const message = String(txt || waPrefill || '').trim();
      const encoded = message ? '?text=' + encodeURIComponent(message) : '';
      return 'https://wa.me/' + waNumber + encoded;
    };

    const waTop = $('#waTop');
    const waMenu = $('#waMenu');
    const waQuick = $('#waQuick');

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
  }

  // ===== Toast Notifications =====
  function initToast() {
    const toast = $('[data-toast]');
    let toastTimeout = null;

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function hideToast() {
      if (!toast) return;
      toast.hidden = true;
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }

    function showToast(text, type = 'info') {
      if (!toast) return;

      toast.innerHTML = '';
      
      const left = document.createElement('div');
      left.style.flex = '1';
      
      const icon = document.createElement('span');
      icon.style.marginLeft = '8px';
      icon.style.fontSize = '1.2rem';
      
      switch(type) {
        case 'success': icon.textContent = '✅'; break;
        case 'error': icon.textContent = '❌'; break;
        case 'warning': icon.textContent = '⚠️'; break;
        default: icon.textContent = 'ℹ️';
      }
      
      left.appendChild(icon);
      
      const textDiv = document.createElement('div');
      textDiv.className = 'small';
      textDiv.style.marginTop = '4px';
      textDiv.style.color = 'var(--muted)';
      textDiv.textContent = escapeHtml(text);
      left.appendChild(textDiv);
      
      const btn = document.createElement('button');
      btn.className = 'toastBtn';
      btn.type = 'button';
      btn.textContent = 'إغلاق';
      btn.addEventListener('click', hideToast);

      toast.append(left, btn);
      toast.hidden = false;

      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(hideToast, 5000);
    }

    window.showToast = showToast;
  }

  // ===== Tabs System =====
  function initTabs() {
    const tabsContainers = $$('[data-tabs]');
    
    tabsContainers.forEach(container => {
      const tabs = $$('[role="tab"]', container);
      if (!tabs.length) return;

      const panels = tabs.map(tab => {
        const panelId = tab.getAttribute('aria-controls');
        return panelId ? $(`#${panelId}`) : null;
      }).filter(Boolean);

      function activateTab(tab) {
        const tabId = tab.getAttribute('data-tab');
        if (!tabId) return;

        tabs.forEach((t, index) => {
          const isSelected = t === tab;
          t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          t.tabIndex = isSelected ? 0 : -1;
          
          const panel = panels[index];
          if (panel) panel.hidden = panel.id !== tabId;
        });

        tab.focus({ preventScroll: true });
      }

      // Initialize first tab as active
      const activeTab = tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0];
      if (activeTab) activateTab(activeTab);

      // Tab click handlers
      tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab));
        
        tab.addEventListener('keydown', (e) => {
          const index = tabs.indexOf(tab);
          if (index === -1) return;

          switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
              e.preventDefault();
              activateTab(tabs[(index - 1 + tabs.length) % tabs.length]);
              break;
            case 'ArrowRight':
            case 'ArrowDown':
              e.preventDefault();
              activateTab(tabs[(index + 1) % tabs.length]);
              break;
            case 'Home':
              e.preventDefault();
              activateTab(tabs[0]);
              break;
            case 'End':
              e.preventDefault();
              activateTab(tabs[tabs.length - 1]);
              break;
          }
        });
      });
    });
  }

  // ===== Gallery System =====
  function initGalleries() {
    const galleries = $$('[data-gallery]');
    
    galleries.forEach(initGallery);
    
    function initGallery(gallery) {
      const viewport = $('.galleryViewport', gallery);
      const track = $('.galleryTrack', gallery);
      const dotsWrap = $('[data-dots]', gallery);
      const prevBtn = $('[data-prev]', gallery);
      const nextBtn = $('[data-next]', gallery);
      
      if (!viewport || !track || !dotsWrap) return;
      
      const slides = $$('img', track);
      if (!slides.length) return;
      
      // Create dots
      dotsWrap.innerHTML = '';
      const dots = slides.map((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `انتقل للصورة ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsWrap.appendChild(dot);
        return dot;
      });
      
      let currentSlide = 0;
      let autoPlayInterval;
      
      function goToSlide(index) {
        currentSlide = Math.max(0, Math.min(index, slides.length - 1));
        
        // Update viewport scroll
        viewport.scrollTo({
          left: slides[currentSlide].offsetLeft,
          behavior: 'smooth'
        });
        
        // Update dots
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentSlide);
        });
        
        // Update data attribute for keyboard navigation
        viewport.dataset.currentSlide = currentSlide;
      }
      
      function nextSlide() {
        goToSlide(currentSlide + 1 >= slides.length ? 0 : currentSlide + 1);
      }
      
      function prevSlide() {
        goToSlide(currentSlide - 1 < 0 ? slides.length - 1 : currentSlide - 1);
      }
      
      // Button handlers
      if (prevBtn) prevBtn.addEventListener('click', () => {
        stopAutoPlay();
        prevSlide();
      });
      
      if (nextBtn) nextBtn.addEventListener('click', () => {
        stopAutoPlay();
        nextSlide();
      });
      
      // Keyboard navigation
      gallery.addEventListener('keydown', (e) => {
        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            prevSlide();
            break;
          case 'ArrowRight':
            e.preventDefault();
            nextSlide();
            break;
        }
      });
      
      // Touch/swipe support
      let touchStartX = 0;
      let touchEndX = 0;
      
      gallery.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
      }, { passive: true });
      
      gallery.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
      
      function handleSwipe() {
        const threshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > threshold) {
          if (swipeDistance > 0) {
            prevSlide();
          } else {
            nextSlide();
          }
        }
      }
      
      // Auto-play functionality
      function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(nextSlide, 4000);
      }
      
      function stopAutoPlay() {
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
          autoPlayInterval = null;
        }
      }
      
      // Start auto-play initially
      startAutoPlay();
      
      // Pause on hover
      gallery.addEventListener('mouseenter', stopAutoPlay);
      gallery.addEventListener('mouseleave', startAutoPlay);
      
      // Pause on focus
      gallery.addEventListener('focusin', stopAutoPlay);
      gallery.addEventListener('focusout', startAutoPlay);
      
      // Update on scroll
      let scrollTimeout;
      viewport.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const center = viewport.scrollLeft + viewport.clientWidth / 2;
          let closestIndex = 0;
          let closestDistance = Infinity;
          
          slides.forEach((slide, index) => {
            const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
            const distance = Math.abs(slideCenter - center);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          });
          
          if (closestIndex !== currentSlide) {
            currentSlide = closestIndex;
            dots.forEach((dot, i) => {
              dot.classList.toggle('active', i === currentSlide);
            });
          }
        }, 150);
      }, { passive: true });
      
      // Initialize
      viewport.dataset.currentSlide = '0';
    }
  }

  // ===== Animated Counters =====
  function initCounters() {
    const counters = $$('.counter[data-count]');
    if (!counters.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute('data-count'));
          const duration = 2000;
          const increment = target / (duration / 16);
          let current = 0;
          
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              counter.textContent = target.toLocaleString();
              clearInterval(timer);
            } else {
              counter.textContent = Math.floor(current).toLocaleString();
            }
          }, 16);
          
          observer.unobserve(counter);
        }
      });
    }, { 
      threshold: 0.5,
      rootMargin: '0px 0px -100px 0px'
    });
    
    counters.forEach(counter => observer.observe(counter));
  }

  // ===== Scroll Animations =====
  function initScrollAnimations() {
    const animatedElements = $$('.animate-on-scroll');
    if (!animatedElements.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });
    
    animatedElements.forEach(el => observer.observe(el));
  }

  // ===== Contact Form =====
  function initContactForm() {
    const form = $('#leadForm');
    const messageDiv = $('#formMsg');
    
    if (!form) return;
    
    // Field validation
    const phoneRegex = /^05\d{8}$/;
    
    function validateField(field) {
      const value = field.value.trim();
      const fieldName = field.name;
      const errorDiv = field.parentElement.querySelector('.field-error');
      
      if (errorDiv) errorDiv.style.display = 'none';
      
      let isValid = true;
      let errorMessage = '';
      
      if (field.required && !value) {
        isValid = false;
        errorMessage = 'هذا الحقل مطلوب';
      } else if (fieldName === 'phone' && value && !phoneRegex.test(value)) {
        isValid = false;
        errorMessage = 'رقم الجوال يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام';
      }
      
      if (!isValid && errorDiv) {
        errorDiv.textContent = errorMessage;
        errorDiv.style.display = 'block';
        field.style.borderColor = '#ef4444';
      } else {
        field.style.borderColor = '';
      }
      
      return isValid;
    }
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const fields = $$('input[required], textarea[required]', form);
      let isValid = true;
      
      fields.forEach(field => {
        if (!validateField(field)) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        showToast('يرجى تصحيح الأخطاء في النموذج', 'error');
        return;
      }
      
      // Build WhatsApp message
      const formData = {
        school: ($('#schoolName')?.value || '').trim(),
        city: ($('#city')?.value || '').trim(),
        name: ($('#contactName')?.value || '').trim(),
        phone: ($('#phone')?.value || '').trim(),
        products: Array.from($$('input[name="product"]:checked', form))
          .map(cb => cb.value === 'reports' ? 'منصة التقارير والتذاكر' : 'شاشة العرض الذكية'),
        screens: ($('#screens')?.value || '').trim(),
        notes: ($('#notes')?.value || '').trim()
      };
      
      const messageLines = [
        'طلب جديد - أنظمة المدارس الذكية',
        '',
        '🏫 بيانات المدرسة:',
        `المدرسة: ${formData.school}`,
        `المدينة: ${formData.city}`,
        `اسم المسؤول: ${formData.name}`,
        `رقم الجوال: ${formData.phone}`,
        '',
        '📋 المطلوب:',
        formData.products.length ? `المنتجات: ${formData.products.join('، ')}` : 'لم يتم تحديد منتجات',
        formData.screens ? `عدد الشاشات: ${formData.screens}` : ''
      ];
      
      if (formData.notes) {
        messageLines.push('', '📝 ملاحظات:', formData.notes);
      }
      
      const message = messageLines.join('\n');
      
      // Open WhatsApp
      const cfg = window.SMART_SCHOOLS || {};
      const waNumber = String(cfg.whatsappNumber || '').replace(/\D/g, '');
      
      if (!waNumber) {
        showToast('رقم واتساب غير متوفر حاليًا', 'error');
        return;
      }
      
      const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      
      // Update quick WhatsApp link
      const waQuick = $('#waQuick');
      if (waQuick) {
        waQuick.href = whatsappUrl;
        waQuick.hidden = false;
      }
      
      // Show success message
      if (messageDiv) {
        messageDiv.textContent = 'جاري فتح واتساب...';
        messageDiv.style.color = 'var(--accent)';
      }
      
      showToast('تم تجهيز الرسالة، جاري فتح واتساب...', 'success');
      
      // Open WhatsApp in new tab after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        
        // Reset form after successful submission
        setTimeout(() => {
          form.reset();
          if (messageDiv) messageDiv.textContent = '';
        }, 1000);
      }, 500);
    });
    
    // Real-time validation
    $$('input, textarea', form).forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        const errorDiv = field.parentElement.querySelector('.field-error');
        if (errorDiv) errorDiv.style.display = 'none';
        field.style.borderColor = '';
      });
    });
  }

  // ===== Network Status Detection =====
  function initNetworkStatus() {
    function showNetworkStatus(isOnline) {
      const message = isOnline 
        ? 'تم استعادة الاتصال بالإنترنت' 
        : 'فقدان الاتصال بالإنترنت - يتم العمل في وضع عدم الاتصال';
      
      showToast(message, isOnline ? 'success' : 'warning');
    }
    
    window.addEventListener('online', () => showNetworkStatus(true));
    window.addEventListener('offline', () => showNetworkStatus(false));
  }

  // ===== Smooth Scroll to Anchor Links =====
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        if (href === '#') return;
        
        const target = $(href);
        if (!target) return;
        
        e.preventDefault();
        
        // Close mobile menu if open
        const mobileMenu = $('[data-menu]');
        const menuBtn = $('[data-menu-btn]');
        if (mobileMenu && !mobileMenu.hasAttribute('hidden')) {
          mobileMenu.setAttribute('hidden', '');
          if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }
        
        // Smooth scroll to target
        const headerHeight = $('.topbar')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - headerHeight - 20;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without page jump
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      });
    });
  }

  // ===== Back to Top Button =====
  function initBackToTop() {
    const backToTopBtn = $('[data-top]');
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.visibility = 'visible';
        backToTopBtn.style.transform = 'translateY(0)';
      } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.visibility = 'hidden';
        backToTopBtn.style.transform = 'translateY(10px)';
      }
    }, { passive: true });
    
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== Initialize Everything =====
  function init() {
    initLoader();
    initTopbarScroll();
    initMobileMenu();
    initWhatsApp();
    initToast();
    initTabs();
    initGalleries();
    initCounters();
    initScrollAnimations();
    initContactForm();
    initNetworkStatus();
    initSmoothScroll();
    initBackToTop();
    
    // Add animation delays to sections for staggered entrance
    $$('.section').forEach((section, index) => {
      section.style.animationDelay = `${index * 0.1}s`;
    });
    
    console.log('أنظمة المدارس الذكية - تم تحميل النظام بنجاح 🚀');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for module usage (if needed)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      init,
      initLoader,
      initTopbarScroll,
      initMobileMenu,
      initWhatsApp,
      initToast,
      initTabs,
      initGalleries,
      initCounters,
      initScrollAnimations,
      initContactForm,
      initNetworkStatus,
      initSmoothScroll,
      initBackToTop
    };
  }
})();