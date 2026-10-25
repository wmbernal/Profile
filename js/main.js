(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
     Header, scroll progress and active navigation
     ------------------------------------------------------------------ */
  const header = document.querySelector('[data-header]');
  const progressBar = document.querySelector('[data-scroll-progress]');
  const navLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('main section[id]'));

  let scrollTicking = false;

  const updateOnScroll = () => {
    const scrollY = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0;

    if (header) {
      header.classList.toggle('is-scrolled', scrollY > 16);
    }

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    let currentSection = '';
    const marker = scrollY + window.innerHeight * 0.34;

    sections.forEach((section) => {
      if (section.offsetTop <= marker) {
        currentSection = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${currentSection}`;
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateOnScroll);
      scrollTicking = true;
    }
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateOnScroll();

  /* ------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------ */
  const themeToggle = document.querySelector('[data-theme-toggle]');

  const setTheme = (theme, persist = true) => {
    root.dataset.theme = theme;

    if (themeToggle) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    }

    if (persist) {
      try {
        localStorage.setItem('wmb-theme', theme);
      } catch (error) {
        /* Private mode or blocked storage — the theme still works for this visit. */
      }
    }
  };

  if (themeToggle) {
    setTheme(root.dataset.theme === 'light' ? 'light' : 'dark', false);

    themeToggle.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const primaryNav = document.getElementById('primary-nav');

  const setMenu = (open, restoreFocus = false) => {
    body.classList.toggle('nav-open', open);

    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    if (open) {
      window.setTimeout(() => {
        const firstLink = primaryNav?.querySelector('a');
        if (firstLink) firstLink.focus();
      }, 120);
    } else if (restoreFocus) {
      menuToggle?.focus();
    }
  };

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener('click', () => {
      setMenu(!body.classList.contains('nav-open'));
    });

    primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && body.classList.contains('nav-open')) {
        setMenu(false, true);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1020 && body.classList.contains('nav-open')) {
        setMenu(false);
      }
    });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  const revealElements = Array.from(document.querySelectorAll('.reveal'));

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  /* ------------------------------------------------------------------
     Hero spotlight (pointer devices only)
     ------------------------------------------------------------------ */
  const hero = document.querySelector('.hero');
  const heroGlow = document.querySelector('[data-hero-glow]');
  const finePointer = window.matchMedia('(pointer: fine)');

  if (hero && heroGlow && finePointer.matches && !reducedMotion.matches) {
    let glowFrame = 0;

    hero.addEventListener(
      'pointermove',
      (event) => {
        if (glowFrame) return;

        glowFrame = window.requestAnimationFrame(() => {
          const bounds = hero.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width) * 100;
          const y = ((event.clientY - bounds.top) / bounds.height) * 100;
          hero.style.setProperty('--mx', `${x}%`);
          hero.style.setProperty('--my', `${y}%`);
          glowFrame = 0;
        });
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------
     São Paulo clock
     ------------------------------------------------------------------ */
  const clock = document.querySelector('[data-local-time]');

  if (clock) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });

    const updateClock = () => {
      clock.textContent = formatter.format(new Date());
      clock.setAttribute('title', 'Current local time in São Paulo');
    };

    updateClock();
    window.setInterval(updateClock, 30000);
  }

  /* ------------------------------------------------------------------
     Copy email
     ------------------------------------------------------------------ */
  const copyButton = document.querySelector('[data-copy-email]');
  const toast = document.querySelector('[data-toast]');
  const email = 'wmbernal@outlook.com';
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  };

  const fallbackCopy = () => {
    const field = document.createElement('textarea');
    field.value = email;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-9999px';
    document.body.appendChild(field);
    field.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(field);
    return copied;
  };

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      // Try the legacy path first so it still runs inside the click gesture.
      let copied = fallbackCopy();

      if (!copied && navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }

      showToast(copied ? 'Email copied to clipboard' : `Email: ${email}`);
    });
  }

  /* ------------------------------------------------------------------
     Role accordions — one open role per company
     ------------------------------------------------------------------ */
  document.querySelectorAll('.career-roles').forEach((group) => {
    const roles = Array.from(group.querySelectorAll('details.role'));

    roles.forEach((role) => {
      role.addEventListener('toggle', () => {
        if (!role.open) return;
        roles.forEach((otherRole) => {
          if (otherRole !== role) otherRole.open = false;
        });
      });
    });
  });

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  const year = document.querySelector('[data-year]');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
