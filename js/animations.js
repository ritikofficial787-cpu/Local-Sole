/* ==========================================================================
   Local Sole — animations.js
   IntersectionObserver reveals, number counters and a light hero parallax.
   All motion is transform/opacity based and disabled for reduced motion.
   ========================================================================== */

LS.animations = (() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scrollTicking = false;

  function initReveals() {
    const targets = document.querySelectorAll(".reveal, .stagger");
    if (!targets.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-revealed");
        if (el.classList.contains("stagger")) {
          [...el.children].forEach((child, index) => {
            child.style.transitionDelay = `${Math.min(index * 65, 420)}ms`;
          });
        }
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    targets.forEach((el) => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.counter || "0");
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }
    const duration = parseInt(el.dataset.duration || "1500", 10);
    const start = performance.now();
    const startValue = 0;

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (target - startValue) * eased;
      el.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((counter) => observer.observe(counter));
  }

  function initParallax() {
    const media = document.querySelector(".hero-media img[data-parallax]");
    if (!media || reduceMotion) return;
    let raf = null;

    function update() {
      scrollTicking = false;
      if (window.innerWidth < 860) {
        media.style.transform = "";
        return;
      }
      const rect = media.parentElement.getBoundingClientRect();
      const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.045;
      const clamped = Math.max(-24, Math.min(24, offset));
      media.style.transform = `scale(1.06) translate3d(0, ${clamped}px, 0)`;
    }

    function onScroll() {
      if (scrollTicking) return;
      scrollTicking = true;
      raf = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }

  function initHoverLift() {
    // Nothing to bind — card lift is handled with CSS transforms for 60fps.
  }

  function init() {
    initReveals();
    initCounters();
    initParallax();
    initHoverLift();

    // Re-observe any client-rendered content (product grids, shop lists).
    document.addEventListener("ls:content", LS.ui.debounce(initReveals, 80));
  }

  return { init, initReveals, animateCounter };
})();
