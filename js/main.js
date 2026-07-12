// ============================================================================
// main.js — Homepage Orchestrator
// Imports and initializes all modules. Sets up scroll animations,
// intersection observers, smooth scrolling, and scroll-to-top indicator.
// ============================================================================

import { initTerminal, openTerminal } from "./terminal.js";
import { initGitHub } from "./github.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ---------------------------------------------------------------------------
// Section fade-in animations on scroll
// ---------------------------------------------------------------------------

function initScrollAnimations() {
  // Target all sections and cards that should animate in
  const animTargets = document.querySelectorAll(
    "[data-animate], .section, section, .project-card, .animate-fade-in-up"
  );

  if (animTargets.length === 0) return;

  // Set initial hidden state (only if motion is OK)
  if (!prefersReducedMotion) {
    animTargets.forEach((el) => {
      // Don't re-hide elements that are already visible
      if (el.dataset.animated === "true") return;
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;

          if (prefersReducedMotion) {
            el.dataset.animated = "true";
            observer.unobserve(el);
            return;
          }

          // Stagger delay based on index within viewport batch
          const delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            el.dataset.animated = "true";
          }, delay);

          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  animTargets.forEach((el) => observer.observe(el));
}

// ---------------------------------------------------------------------------
// Count-up animations for stat numbers
// ---------------------------------------------------------------------------

function initCountUpAnimations() {
  const countEls = document.querySelectorAll("[data-count-target]");
  if (countEls.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        if (el.dataset.counted === "true") return;
        el.dataset.counted = "true";

        const target = parseInt(el.dataset.countTarget, 10);
        if (isNaN(target)) return;

        if (prefersReducedMotion) {
          el.textContent = target;
          observer.unobserve(el);
          return;
        }

        const duration = 1200;
        const start = performance.now();

        const step = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = target;
          }
        };

        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  countEls.forEach((el) => observer.observe(el));
}

// ---------------------------------------------------------------------------
// Smooth scroll for anchor links
// ---------------------------------------------------------------------------

function initSmoothScroll() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute("href").slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    // Update URL without scroll jump
    history.pushState(null, "", `#${targetId}`);

    // Optionally focus the target for accessibility
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}

// ---------------------------------------------------------------------------
// Scroll-to-top indicator
// ---------------------------------------------------------------------------

function initScrollToTop() {
  const btn = document.createElement("button");
  btn.setAttribute("aria-label", "Scroll to top");
  btn.innerHTML = "↑";
  btn.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:999;
    width:40px;height:40px;border-radius:50%;
    background:#09090b;border:1px solid #1a1a1e;
    color:rgba(252,253,255,0.6);font-size:1.1em;
    cursor:pointer;display:none;align-items:center;justify-content:center;
    transition:opacity 0.3s,transform 0.3s,border-color 0.2s;
    opacity:0;transform:translateY(10px);
    font-family:'Geist Mono',monospace;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.borderColor = "rgba(252,253,255,0.15)";
    btn.style.color = "#fcfdff";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.borderColor = "#1a1a1e";
    btn.style.color = "rgba(252,253,255,0.6)";
  });

  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });

  document.body.appendChild(btn);

  let isVisible = false;
  const threshold = 400;

  const onScroll = () => {
    const shouldShow = window.scrollY > threshold;
    if (shouldShow === isVisible) return;
    isVisible = shouldShow;

    if (shouldShow) {
      btn.style.display = "flex";
      requestAnimationFrame(() => {
        btn.style.opacity = "1";
        btn.style.transform = "translateY(0)";
      });
    } else {
      btn.style.opacity = "0";
      btn.style.transform = "translateY(10px)";
      // Hide after transition
      setTimeout(() => {
        if (!isVisible) btn.style.display = "none";
      }, 300);
    }
  };

  // Throttle scroll events
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    }
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// FAB (Floating Action Button) for terminal
// ---------------------------------------------------------------------------

function initTerminalFAB() {
  // Check if a FAB already exists in the HTML
  if (document.querySelector("[data-terminal-trigger]")) return;

  const fab = document.createElement("button");
  fab.setAttribute("data-terminal-trigger", "");
  fab.setAttribute("aria-label", "Open terminal (Ctrl+K)");
  fab.innerHTML = `<span style="font-size:1.1em">⌘</span>`;
  fab.style.cssText = `
    position:fixed;bottom:24px;left:24px;z-index:998;
    width:44px;height:44px;border-radius:50%;
    background:#09090b;border:1px solid #1a1a1e;
    color:#11ff99;font-size:1em;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:border-color 0.2s,box-shadow 0.2s,transform 0.2s;
    font-family:'Geist Mono',monospace;
    box-shadow:0 0 20px rgba(17,255,153,0.06);
  `;

  fab.addEventListener("mouseenter", () => {
    fab.style.borderColor = "#11ff99";
    fab.style.boxShadow = "0 0 24px rgba(17,255,153,0.15)";
    if (!prefersReducedMotion) fab.style.transform = "scale(1.08)";
  });
  fab.addEventListener("mouseleave", () => {
    fab.style.borderColor = "#1a1a1e";
    fab.style.boxShadow = "0 0 20px rgba(17,255,153,0.06)";
    fab.style.transform = "";
  });

  fab.addEventListener("click", (e) => {
    e.preventDefault();
    openTerminal();
  });

  document.body.appendChild(fab);
}

// ---------------------------------------------------------------------------
// Main initialization
// ---------------------------------------------------------------------------

function init() {
  try {
    // Core modules
    initTerminal();
    initGitHub();

    // UI enhancements
    initScrollAnimations();
    initCountUpAnimations();
    initSmoothScroll();
    initScrollToTop();
    initTerminalFAB();
  } catch (err) {
    console.error("[main] Initialization error:", err);
  }
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  // DOM already loaded (e.g., deferred script)
  init();
}
