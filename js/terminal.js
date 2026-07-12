// ============================================================================
// terminal.js — Interactive Terminal REPL Overlay
// The portfolio's signature feature: a fully functional terminal emulator
// with command history, typewriter animation, focus trap, and ARIA support.
// ============================================================================

import { profile, projects } from "./content.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HISTORY_KEY = "portfolio-terminal-history";
const MAX_HISTORY = 50;
const TYPEWRITER_SPEED_MS = 18;
const PROMPT_TEXT = "vardh@terminal:~$ ";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let overlayEl = null;
let outputEl = null;
let inputEl = null;
let previouslyFocused = null;
let commandHistory = [];
let historyIndex = -1;
let isOpen = false;
let isAnimating = false;

// ---------------------------------------------------------------------------
// Command registry
// ---------------------------------------------------------------------------
const commands = {
  help: {
    desc: "List available commands",
    run: cmdHelp,
  },
  about: {
    desc: "Who is Vardh?",
    run: cmdAbout,
  },
  skills: {
    desc: "Technical skill tree",
    run: cmdSkills,
  },
  projects: {
    desc: "Featured projects",
    run: cmdProjects,
  },
  github: {
    desc: "GitHub stats overview",
    run: cmdGitHub,
  },
  contact: {
    desc: "Get in touch",
    run: cmdContact,
  },
  sudo: {
    desc: "Elevate privileges",
    run: cmdSudo,
  },
  clear: {
    desc: "Clear terminal output",
    run: cmdClear,
  },
};

// ---------------------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------------------
function cmdHelp() {
  const rows = Object.entries(commands)
    .map(
      ([name, { desc }]) =>
        `<tr>
          <td style="color:#11ff99;padding:2px 16px 2px 0;white-space:nowrap;font-weight:600">${name}</td>
          <td style="color:rgba(252,253,255,0.7)">${desc}</td>
        </tr>`
    )
    .join("");

  return `<table style="border-collapse:collapse;margin:4px 0">${rows}</table>
<span style="color:rgba(252,253,255,0.45);font-size:0.8em">Tip: Use ↑↓ to cycle through command history</span>`;
}

function cmdAbout() {
  const edu = profile.education[0];
  return `<div style="margin:4px 0">
  <div style="color:#11ff99;font-weight:600;font-size:1.05em;margin-bottom:6px">
    ${profile.name} — ${profile.title}
  </div>
  <div style="color:rgba(252,253,255,0.86);margin-bottom:8px;max-width:60ch;line-height:1.5">
    ${profile.bio}
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:16px;color:rgba(252,253,255,0.6);font-size:0.85em">
    <span>Education: ${edu.institution} · ${edu.degree} in ${edu.field} (${edu.period})</span>
    <span>Building: ${profile.currentlyBuilding}</span>
    <span>Status: ${profile.availability}</span>
  </div>
</div>`;
}

function cmdSkills() {
  const categories = Object.entries(profile.skills)
    .map(
      ([category, items]) =>
        `<div style="margin-bottom:8px">
        <div style="color:#3b9eff;font-weight:600;font-size:0.85em;margin-bottom:3px">${category}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${items
            .map(
              (s) =>
                `<span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);padding:2px 8px;border-radius:4px;font-size:0.82em;color:rgba(252,253,255,0.86)">${s}</span>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");

  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:4px 0">${categories}</div>`;
}

function cmdProjects() {
  return projects
    .map((p) => {
      const statusColor = p.status === "live" ? "#11ff99" : "#3b9eff";
      const statusLabel = p.status === "live" ? "● Live" : "◌ Building";
      const tags = p.techStack
        .map(
          (t) =>
            `<span style="background:rgba(255,255,255,0.05);padding:1px 6px;border-radius:3px;font-size:0.78em;color:rgba(252,253,255,0.6)">${t}</span>`
        )
        .join(" ");

      return `<div style="border:1px solid #1a1a1e;border-radius:8px;padding:12px 14px;margin:4px 0;background:#09090b">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="color:#fcfdff;font-weight:600">${p.title}</span>
          <span style="color:${statusColor};font-size:0.78em;margin-left:auto">${statusLabel}</span>
        </div>
        <div style="color:rgba(252,253,255,0.7);font-size:0.85em;margin-bottom:6px;line-height:1.45">${p.description}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${tags}</div>
      </div>`;
    })
    .join("");
}

function cmdGitHub() {
  // Try to read cached GitHub data if available
  try {
    const cached = localStorage.getItem("portfolio-github-cache");
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      const ageStr =
        age < 60000
          ? "just now"
          : age < 3600000
            ? `${Math.floor(age / 60000)}m ago`
            : `${Math.floor(age / 3600000)}h ago`;

      const totalStars = (data.repos || []).reduce(
        (sum, r) => sum + (r.stargazers_count || 0),
        0
      );
      const repoCount = data.profile?.public_repos ?? (data.repos || []).length;

      // Compute most used language
      const langCount = {};
      (data.repos || []).forEach((r) => {
        if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
      });
      const topLang =
        Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "N/A";

      // Recent pushes
      const pushes = (data.events || []).filter(
        (e) => e.type === "PushEvent"
      ).length;

      return `<div style="margin:4px 0">
        <div style="color:#11ff99;font-weight:600;margin-bottom:8px">GitHub · VardhChhajer</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">
          <div style="background:#09090b;border:1px solid #1a1a1e;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.4em;color:#fcfdff;font-weight:700">⭐ ${totalStars}</div>
            <div style="color:rgba(252,253,255,0.5);font-size:0.78em">Total Stars</div>
          </div>
          <div style="background:#09090b;border:1px solid #1a1a1e;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.4em;color:#fcfdff;font-weight:700">📦 ${repoCount}</div>
            <div style="color:rgba(252,253,255,0.5);font-size:0.78em">Public Repos</div>
          </div>
          <div style="background:#09090b;border:1px solid #1a1a1e;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.4em;color:#fcfdff;font-weight:700">💻 ${topLang}</div>
            <div style="color:rgba(252,253,255,0.5);font-size:0.78em">Top Language</div>
          </div>
          <div style="background:#09090b;border:1px solid #1a1a1e;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.4em;color:#fcfdff;font-weight:700">🔥 ${pushes}</div>
            <div style="color:rgba(252,253,255,0.5);font-size:0.78em">Recent Pushes</div>
          </div>
        </div>
        <div style="color:rgba(252,253,255,0.35);font-size:0.75em;margin-top:6px">Cached ${ageStr} · Visit the GitHub section for the full graph</div>
      </div>`;
    }
  } catch {
    // Cache read failed, fall through
  }

  return `<div style="margin:4px 0">
  <div style="color:#11ff99;font-weight:600;margin-bottom:4px">GitHub · VardhChhajer</div>
  <div style="color:rgba(252,253,255,0.6);font-size:0.85em">
    Fetching latest stats… Scroll to the GitHub section on the page for the live contribution graph and stats.
  </div>
  <div style="margin-top:6px">
    <a href="https://github.com/VardhChhajer" target="_blank" rel="noopener" style="color:#3b9eff;text-decoration:none;font-size:0.85em">→ github.com/VardhChhajer</a>
  </div>
</div>`;
}

function cmdContact() {
  const { github, linkedin, email } = profile.socials;
  return `<div style="margin:4px 0">
  <div style="color:#11ff99;font-weight:600;margin-bottom:8px">Let's connect</div>
  <div style="display:flex;flex-direction:column;gap:6px">
    <a href="${github}" target="_blank" rel="noopener" style="color:#3b9eff;text-decoration:none">GitHub — ${github.replace("https://", "")}</a>
    <a href="${linkedin}" target="_blank" rel="noopener" style="color:#3b9eff;text-decoration:none">LinkedIn — ${linkedin.replace("https://", "")}</a>
    <a href="mailto:${email}" style="color:#3b9eff;text-decoration:none">Email — ${email}</a>
  </div>
  <div style="color:rgba(252,253,255,0.4);font-size:0.8em;margin-top:8px">${profile.availability}</div>
</div>`;
}

function cmdSudo() {
  return `<span style="color:#ff5555">Nice try. Access denied. (403)</span>`;
}

function cmdClear() {
  // Sentinel — handled specially in executeCommand
  return null;
}

// ---------------------------------------------------------------------------
// DOM construction
// ---------------------------------------------------------------------------
function buildTerminalDOM() {
  // Overlay
  overlayEl = document.createElement("div");
  overlayEl.id = "terminal-overlay";
  overlayEl.setAttribute("role", "dialog");
  overlayEl.setAttribute("aria-modal", "true");
  overlayEl.setAttribute("aria-label", "Interactive terminal");
  overlayEl.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:none;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);
    padding:16px;
  `;

  // Terminal window
  const termWin = document.createElement("div");
  termWin.style.cssText = `
    width:100%;max-width:740px;max-height:80vh;
    background:#050507;border:1px solid #1a1a1e;border-radius:12px;
    display:flex;flex-direction:column;overflow:hidden;
    box-shadow:0 0 60px rgba(17,255,153,0.06),0 24px 48px rgba(0,0,0,0.5);
    font-family:'Geist Mono',monospace;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    display:flex;align-items:center;justify-content:space-between;
    padding:10px 16px;background:#09090b;border-bottom:1px solid #1a1a1e;
    flex-shrink:0;user-select:none;
  `;
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="display:flex;gap:6px">
        <span style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></span>
        <span style="width:12px;height:12px;border-radius:50%;background:#febc2e"></span>
        <span style="width:12px;height:12px;border-radius:50%;background:#28c840"></span>
      </span>
      <span style="color:rgba(252,253,255,0.5);font-size:0.78em;margin-left:6px">vardh@terminal — Terminal</span>
    </div>
  `;
  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Close terminal");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = `
    background:none;border:none;color:rgba(252,253,255,0.5);
    font-size:1.3em;cursor:pointer;padding:0 4px;line-height:1;
    transition:color 0.15s;
  `;
  closeBtn.addEventListener("mouseenter", () => (closeBtn.style.color = "#fcfdff"));
  closeBtn.addEventListener("mouseleave", () => (closeBtn.style.color = "rgba(252,253,255,0.5)"));
  closeBtn.addEventListener("click", closeTerminal);
  header.appendChild(closeBtn);

  // Output area
  outputEl = document.createElement("div");
  outputEl.setAttribute("aria-live", "polite");
  outputEl.setAttribute("role", "log");
  outputEl.style.cssText = `
    flex:1;overflow-y:auto;padding:12px 16px;
    color:#11ff99;font-size:0.85em;line-height:1.6;
    scrollbar-width:thin;scrollbar-color:#1a1a1e transparent;
  `;

  // Welcome message
  const welcomeHTML = `<div style="margin-bottom:8px">
  <span style="color:#11ff99;font-weight:600">Vardh Chhajer Portfolio Terminal</span><span style="color:rgba(252,253,255,0.4)"> v1.0.0</span>
  <div style="color:rgba(252,253,255,0.5);font-size:0.9em;margin-top:2px">Type <span style="color:#11ff99">help</span> to see available commands. Press <span style="color:rgba(252,253,255,0.7)">Esc</span> to close.</div>
</div>`;
  outputEl.innerHTML = welcomeHTML;

  // Input row
  const inputRow = document.createElement("div");
  inputRow.style.cssText = `
    display:flex;align-items:center;
    padding:8px 16px 12px;border-top:1px solid #1a1a1e;
    background:#050507;flex-shrink:0;
  `;

  const promptSpan = document.createElement("span");
  promptSpan.textContent = PROMPT_TEXT;
  promptSpan.style.cssText = `color:#11ff99;white-space:nowrap;font-size:0.85em;user-select:none`;

  inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.setAttribute("aria-label", "Terminal command input");
  inputEl.setAttribute("autocomplete", "off");
  inputEl.setAttribute("spellcheck", "false");
  inputEl.style.cssText = `
    flex:1;background:none;border:none;outline:none;
    color:#fcfdff;font-family:'Geist Mono',monospace;
    font-size:0.85em;caret-color:#11ff99;
    padding:0;margin:0;
  `;

  inputRow.appendChild(promptSpan);
  inputRow.appendChild(inputEl);

  termWin.appendChild(header);
  termWin.appendChild(outputEl);
  termWin.appendChild(inputRow);
  overlayEl.appendChild(termWin);
  document.body.appendChild(overlayEl);

  // Optional scanline effect (reduced-motion safe)
  if (!prefersReducedMotion) {
    const scanline = document.createElement("div");
    scanline.style.cssText = `
      position:absolute;inset:0;pointer-events:none;border-radius:12px;overflow:hidden;
      background:repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      );
      z-index:1;
    `;
    termWin.style.position = "relative";
    termWin.appendChild(scanline);
  }

  // Event listeners
  inputEl.addEventListener("keydown", handleInputKeydown);
  overlayEl.addEventListener("click", handleOverlayClick);
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------
function handleInputKeydown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const raw = inputEl.value.trim();
    if (raw.length > 0) {
      executeCommand(raw);
      pushHistory(raw);
    }
    inputEl.value = "";
    historyIndex = -1;
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (commandHistory.length === 0) return;
    if (historyIndex < commandHistory.length - 1) historyIndex++;
    inputEl.value = commandHistory[commandHistory.length - 1 - historyIndex];
    // Move cursor to end
    requestAnimationFrame(() => {
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    });
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      inputEl.value = commandHistory[commandHistory.length - 1 - historyIndex];
    } else {
      historyIndex = -1;
      inputEl.value = "";
    }
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    closeTerminal();
    return;
  }

  // Focus trap — keep Tab within terminal
  if (e.key === "Tab") {
    e.preventDefault();
    // Only two focusable elements: input and close button
    const closeBtn = overlayEl.querySelector('button[aria-label="Close terminal"]');
    if (document.activeElement === inputEl) {
      closeBtn?.focus();
    } else {
      inputEl?.focus();
    }
  }
}

function handleOverlayClick(e) {
  // Close when clicking the backdrop (not the terminal window itself)
  if (e.target === overlayEl) {
    closeTerminal();
  }
}

// ---------------------------------------------------------------------------
// Command execution
// ---------------------------------------------------------------------------
function executeCommand(raw) {
  const cmd = raw.toLowerCase().split(/\s+/)[0];

  // Echo the prompt + command
  const entryEl = document.createElement("div");
  entryEl.style.marginTop = "4px";

  const promptLine = document.createElement("div");
  promptLine.innerHTML = `<span style="color:#11ff99">${PROMPT_TEXT}</span><span style="color:#fcfdff">${escapeHTML(raw)}</span>`;
  entryEl.appendChild(promptLine);

  // Handle clear specially
  if (cmd === "clear") {
    outputEl.innerHTML = "";
    return;
  }

  const handler = commands[cmd];
  const resultHTML = handler
    ? handler.run()
    : `<span style="color:#ff5555">Command not found: <span style="color:#fcfdff">${escapeHTML(cmd)}</span>. Type <span style="color:#11ff99">help</span> for available commands.</span>`;

  if (resultHTML !== null) {
    const outputBlock = document.createElement("div");
    outputBlock.style.cssText = "margin:2px 0 6px 0";

    if (prefersReducedMotion || isAnimating === false) {
      // Instant render (or reduced motion)
      outputBlock.innerHTML = resultHTML;
      entryEl.appendChild(outputBlock);
      outputEl.appendChild(entryEl);
      scrollToBottom();
    } else {
      entryEl.appendChild(outputBlock);
      outputEl.appendChild(entryEl);
      scrollToBottom();
      // We still want a small typewriter feel even though content is HTML
      // We'll fade it in instead of char-by-char for HTML content
      outputBlock.innerHTML = resultHTML;
      outputBlock.style.opacity = "0";
      outputBlock.style.transition = "opacity 0.2s ease";
      requestAnimationFrame(() => {
        outputBlock.style.opacity = "1";
        scrollToBottom();
      });
    }

    // For simple text outputs, use actual typewriter
    if (!handler && !prefersReducedMotion) {
      typewriteText(outputBlock, resultHTML);
    } else if (!prefersReducedMotion) {
      // Fade in for HTML-rich outputs
      outputBlock.style.opacity = "0";
      outputBlock.style.transition = "opacity 0.25s ease";
      requestAnimationFrame(() => {
        outputBlock.style.opacity = "1";
      });
    }
  } else {
    outputEl.appendChild(entryEl);
  }

  scrollToBottom();
}

/**
 * Typewriter effect for plain text / simple HTML.
 * For complex HTML we use a fade-in instead.
 */
function typewriteText(container, html) {
  // For richly structured HTML, we just render it instantly
  // and rely on the fade-in set above.
  // True typewriter only fires for single-line text responses.
  container.innerHTML = html;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
function loadHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    commandHistory = stored ? JSON.parse(stored) : [];
  } catch {
    commandHistory = [];
  }
}

function pushHistory(cmd) {
  // Avoid duplicating the last entry
  if (commandHistory[commandHistory.length - 1] !== cmd) {
    commandHistory.push(cmd);
  }
  if (commandHistory.length > MAX_HISTORY) {
    commandHistory = commandHistory.slice(-MAX_HISTORY);
  }
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(commandHistory));
  } catch {
    // Storage full — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Open / Close
// ---------------------------------------------------------------------------
export function openTerminal() {
  if (isOpen) return;
  if (!overlayEl) buildTerminalDOM();

  previouslyFocused = document.activeElement;
  isOpen = true;
  overlayEl.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Animate in (reduced-motion safe)
  if (!prefersReducedMotion) {
    overlayEl.style.opacity = "0";
    overlayEl.style.transition = "opacity 0.2s ease";
    requestAnimationFrame(() => {
      overlayEl.style.opacity = "1";
    });
  }

  requestAnimationFrame(() => inputEl?.focus());
}

export function closeTerminal() {
  if (!isOpen) return;
  isOpen = false;
  document.body.style.overflow = "";

  const finish = () => {
    overlayEl.style.display = "none";
    overlayEl.style.transition = "";
    overlayEl.style.opacity = "";
    // Restore focus to previously focused element
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  };

  if (!prefersReducedMotion) {
    overlayEl.style.transition = "opacity 0.15s ease";
    overlayEl.style.opacity = "0";
    overlayEl.addEventListener("transitionend", finish, { once: true });
    // Fallback timeout in case transitionend doesn't fire
    setTimeout(finish, 200);
  } else {
    finish();
  }
}

// ---------------------------------------------------------------------------
// Global keyboard shortcut
// ---------------------------------------------------------------------------
function handleGlobalKeydown(e) {
  // Ctrl+K / Cmd+K to toggle terminal
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    if (isOpen) {
      closeTerminal();
    } else {
      openTerminal();
    }
    return;
  }

  // Escape to close (also handled in input keydown, but needed for when
  // focus is on the close button or overlay)
  if (e.key === "Escape" && isOpen) {
    e.preventDefault();
    closeTerminal();
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
export function initTerminal() {
  loadHistory();
  isAnimating = true;

  // Global keyboard shortcut
  document.addEventListener("keydown", handleGlobalKeydown);

  // Hook up any existing trigger buttons in the DOM
  document.querySelectorAll("[data-terminal-trigger]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openTerminal();
    });
  });

  // Build DOM lazily — we'll create on first open to keep initial load fast
  // But pre-build if user is on a fast connection
  if (navigator.connection?.effectiveType === "4g" || !navigator.connection) {
    requestIdleCallback
      ? requestIdleCallback(() => buildTerminalDOM())
      : setTimeout(() => buildTerminalDOM(), 200);
  }
}
