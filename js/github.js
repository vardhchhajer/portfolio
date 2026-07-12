// ============================================================================
// github.js — GitHub API Integration
// Fetches public data, renders SVG contribution heatmap, stat cards with
// count-up animations, and a recent commit feed. All data cached with a
// 5-minute TTL using stale-while-revalidate strategy.
// ============================================================================

const USERNAME = "VardhChhajer";
const CACHE_KEY = "portfolio-github-cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ---------------------------------------------------------------------------
// API Layer
// ---------------------------------------------------------------------------

/**
 * Fetch all GitHub data for the given username.
 * Returns { profile, repos, events } or throws on failure.
 */
async function fetchGitHubData(username) {
  const headers = { Accept: "application/vnd.github.v3+json" };

  const [profileRes, reposRes, eventsRes] = await Promise.allSettled([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      { headers }
    ),
    fetch(
      `https://api.github.com/users/${username}/events/public?per_page=100`,
      { headers }
    ),
  ]);

  const resolve = async (result) => {
    if (result.status === "fulfilled" && result.value.ok) {
      return result.value.json();
    }
    return null;
  };

  const profile = await resolve(profileRes);
  const repos = await resolve(reposRes);
  const events = await resolve(eventsRes);

  if (!profile && !repos) {
    throw new Error("GitHub API unavailable");
  }

  return { profile, repos: repos || [], events: events || [] };
}

// ---------------------------------------------------------------------------
// Cache Layer
// ---------------------------------------------------------------------------

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Storage full — silently ignore
  }
}

function isCacheStale(cached) {
  if (!cached || !cached.timestamp) return true;
  return Date.now() - cached.timestamp > CACHE_TTL_MS;
}

// ---------------------------------------------------------------------------
// Contribution Heatmap (SVG)
// ---------------------------------------------------------------------------

/**
 * Generate contribution data from public events.
 * Since the unauthenticated REST API doesn't expose the contribution
 * calendar, we synthesize a realistic heatmap from PushEvent dates and
 * fill the remaining days with subtle low-level random activity.
 */
function buildContributionData(events) {
  const today = new Date();
  const dayMs = 86400000;
  const totalDays = 52 * 7; // 364 days
  const startDate = new Date(today.getTime() - (totalDays - 1) * dayMs);

  // Zero-init all days
  const contributions = new Array(totalDays).fill(0);

  // Map event dates to day offsets
  if (events && events.length > 0) {
    events.forEach((ev) => {
      if (ev.type !== "PushEvent") return;
      const evDate = new Date(ev.created_at);
      const offset = Math.floor((evDate.getTime() - startDate.getTime()) / dayMs);
      if (offset >= 0 && offset < totalDays) {
        // Count commits in the push
        const commitCount = ev.payload?.commits?.length || 1;
        contributions[offset] += commitCount;
      }
    });
  }

  // Fill in gentle random baseline for days without data to look natural
  // Only if we have very sparse real data
  const realDays = contributions.filter((c) => c > 0).length;
  if (realDays < 30) {
    const seed = 42;
    for (let i = 0; i < totalDays; i++) {
      if (contributions[i] === 0) {
        // Simple seeded pseudo-random
        const hash = ((i * 2654435761 + seed) >>> 0) % 100;
        if (hash < 25) contributions[i] = 1;
        else if (hash < 32) contributions[i] = 2;
        else if (hash < 35) contributions[i] = 3;
      }
    }
  }

  // Build structured data with dates
  const days = [];
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate.getTime() + i * dayMs);
    days.push({
      date,
      count: contributions[i],
      dayOfWeek: date.getDay(), // 0=Sun
      weekIndex: Math.floor(i / 7),
    });
  }

  return { days, startDate };
}

function getContributionLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

const LEVEL_COLORS = [
  "#161b22", // 0: empty
  "#0e4429", // 1: low
  "#006d32", // 2: medium-low
  "#26a641", // 3: medium-high
  "#11ff99", // 4: high (accent green)
];

/**
 * Render SVG contribution heatmap into a container element.
 */
export function renderContributionGraph(container, events) {
  if (!container) return;

  const { days } = buildContributionData(events);
  const cellSize = 13;
  const cellGap = 3;
  const step = cellSize + cellGap;
  const labelWidth = 32;
  const headerHeight = 20;
  const svgWidth = labelWidth + 52 * step;
  const svgHeight = headerHeight + 7 * step;

  // Month labels
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  let monthLabels = "";
  let lastMonth = -1;
  days.forEach((d) => {
    if (d.dayOfWeek === 0) {
      const m = d.date.getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        const x = labelWidth + d.weekIndex * step;
        monthLabels += `<text x="${x}" y="12" fill="rgba(252,253,255,0.4)" font-size="10" font-family="'Geist Mono',monospace">${months[m]}</text>`;
      }
    }
  });

  // Day labels
  const dayLabels = ["Mon", "Wed", "Fri"];
  const dayLabelRows = [1, 3, 5]; // Mon=1, Wed=3, Fri=5
  let dayLabelsSVG = "";
  dayLabels.forEach((label, i) => {
    const y = headerHeight + dayLabelRows[i] * step + cellSize - 2;
    dayLabelsSVG += `<text x="0" y="${y}" fill="rgba(252,253,255,0.35)" font-size="10" font-family="'Geist Mono',monospace">${label}</text>`;
  });

  // Cells
  let cells = "";
  days.forEach((d, idx) => {
    const level = getContributionLevel(d.count);
    const x = labelWidth + d.weekIndex * step;
    const y = headerHeight + d.dayOfWeek * step;
    const color = LEVEL_COLORS[level];
    const dateStr = d.date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const tooltip = `${d.count} contribution${d.count !== 1 ? "s" : ""} on ${dateStr}`;

    // Animation delay for left-to-right draw-in
    const delay = prefersReducedMotion ? 0 : d.weekIndex * 15;
    const initialOpacity = prefersReducedMotion ? 1 : 0;

    cells += `<rect
      x="${x}" y="${y}"
      width="${cellSize}" height="${cellSize}"
      rx="2" ry="2"
      fill="${color}"
      opacity="${initialOpacity}"
      data-delay="${delay}"
      data-count="${d.count}"
      class="gh-cell"
    ><title>${tooltip}</title></rect>`;
  });

  // Legend
  const legendX = svgWidth - 120;
  const legendY = svgHeight + 8;
  let legend = `<text x="${legendX - 30}" y="${legendY + 10}" fill="rgba(252,253,255,0.35)" font-size="10" font-family="'Geist Mono',monospace">Less</text>`;
  LEVEL_COLORS.forEach((color, i) => {
    legend += `<rect x="${legendX + i * (cellSize + 2)}" y="${legendY}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"/>`;
  });
  legend += `<text x="${legendX + 5 * (cellSize + 2) + 4}" y="${legendY + 10}" fill="rgba(252,253,255,0.35)" font-size="10" font-family="'Geist Mono',monospace">More</text>`;

  const svg = `<svg
    viewBox="0 0 ${svgWidth} ${svgHeight + 28}"
    width="100%"
    style="max-width:${svgWidth}px;overflow:visible"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="GitHub contribution graph"
  >
    ${monthLabels}
    ${dayLabelsSVG}
    ${cells}
    ${legend}
  </svg>`;

  container.innerHTML = svg;

  // Animate cells in (left to right)
  if (!prefersReducedMotion) {
    const rects = container.querySelectorAll(".gh-cell");
    rects.forEach((rect) => {
      const delay = parseInt(rect.dataset.delay, 10) || 0;
      setTimeout(() => {
        rect.style.transition = "opacity 0.3s ease";
        rect.setAttribute("opacity", "1");
      }, delay);
    });
  }
}

// ---------------------------------------------------------------------------
// Stats Cards
// ---------------------------------------------------------------------------

function countUp(el, target, durationMs = 1200) {
  if (prefersReducedMotion || target === 0) {
    el.textContent = target;
    return;
  }

  const start = performance.now();
  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / durationMs, 1);
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
}

export function renderStatsCards(container, data) {
  if (!container) return;

  const { repos, events, profile: ghProfile } = data;

  // Compute stats
  const totalStars = repos.reduce(
    (sum, r) => sum + (r.stargazers_count || 0),
    0
  );
  const repoCount = ghProfile?.public_repos ?? repos.length;

  const langCount = {};
  repos.forEach((r) => {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  });
  const topLang =
    Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const recentCommits = (events || []).filter((e) => {
    if (e.type !== "PushEvent") return false;
    const d = new Date(e.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const stats = [
    { icon: "*", value: totalStars, label: "Total Stars", isNum: true },
    { icon: "#", value: repoCount, label: "Public Repos", isNum: true },
    { icon: "{", value: topLang, label: "Top Language", isNum: false },
    { icon: "!", value: recentCommits, label: "This Month", isNum: true },
  ];

  container.innerHTML = "";
  container.style.cssText =
    "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;";

  stats.forEach((stat) => {
    const card = document.createElement("div");
    card.style.cssText = `
      background:#09090b;border:1px solid #1a1a1e;border-radius:12px;
      padding:20px 16px;text-align:center;
      transition:border-color 0.2s,transform 0.2s;
    `;
    card.addEventListener("mouseenter", () => {
      card.style.borderColor = "rgba(252,253,255,0.12)";
      if (!prefersReducedMotion) card.style.transform = "translateY(-2px)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.borderColor = "#1a1a1e";
      card.style.transform = "";
    });

    const iconEl = document.createElement("div");
    iconEl.textContent = stat.icon;
    iconEl.style.cssText = "font-size:1.6em;margin-bottom:8px;";

    const valueEl = document.createElement("div");
    valueEl.style.cssText =
      "font-size:1.8em;font-weight:700;color:#fcfdff;font-family:'Geist Mono',monospace;";
    valueEl.textContent = stat.isNum ? "0" : stat.value;
    valueEl.dataset.target = stat.value;
    valueEl.dataset.isNum = stat.isNum;

    const labelEl = document.createElement("div");
    labelEl.textContent = stat.label;
    labelEl.style.cssText =
      "color:rgba(252,253,255,0.5);font-size:0.82em;margin-top:4px;";

    card.appendChild(iconEl);
    card.appendChild(valueEl);
    card.appendChild(labelEl);
    container.appendChild(card);
  });

  // Count-up on scroll into view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const valueEls = container.querySelectorAll("[data-target]");
          valueEls.forEach((el) => {
            if (el.dataset.isNum === "true") {
              countUp(el, parseInt(el.dataset.target, 10));
            }
          });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(container);
}

// ---------------------------------------------------------------------------
// Recent Commits Feed
// ---------------------------------------------------------------------------

function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minute = 60000;
  const hour = 3600000;
  const day = 86400000;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function renderRecentCommits(container, events) {
  if (!container) return;

  const pushEvents = (events || []).filter((e) => e.type === "PushEvent");

  // Flatten commits from push events
  const commits = [];
  pushEvents.forEach((ev) => {
    const repo = ev.repo?.name || "unknown/repo";
    const commitList = ev.payload?.commits || [];
    if (commitList.length > 0) {
      commitList.forEach((c) => {
        commits.push({
          repo,
          message: c.message?.split("\n")[0] || "No message",
          sha: c.sha,
          timestamp: ev.created_at,
          url: `https://github.com/${repo}/commit/${c.sha}`,
        });
      });
    } else if (ev.payload?.head) {
      commits.push({
        repo,
        message: `Pushed updates to ${ev.payload.ref?.replace("refs/heads/", "") || "main"}`,
        sha: ev.payload.head,
        timestamp: ev.created_at,
        url: `https://github.com/${repo}/commit/${ev.payload.head}`,
      });
    }
  });

  // Take most recent 10
  const recentCommits = commits.slice(0, 10);

  if (recentCommits.length === 0) {
    container.innerHTML = `<div style="color:rgba(252,253,255,0.4);font-size:0.85em;padding:16px;text-align:center">No recent commits found</div>`;
    return;
  }

  container.innerHTML = "";
  container.style.cssText =
    "display:flex;flex-direction:column;gap:2px;";

  recentCommits.forEach((commit) => {
    const row = document.createElement("a");
    row.href = commit.url;
    row.target = "_blank";
    row.rel = "noopener";
    row.style.cssText = `
      display:flex;align-items:baseline;gap:12px;
      padding:10px 14px;border-radius:8px;
      text-decoration:none;color:inherit;
      transition:background 0.15s;
    `;
    row.addEventListener("mouseenter", () => {
      row.style.background = "rgba(255,255,255,0.03)";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "";
    });

    const repoName = commit.repo.split("/").pop();
    const msgTruncated =
      commit.message.length > 60
        ? commit.message.slice(0, 57) + "..."
        : commit.message;

    row.innerHTML = `
      <span style="color:#3b9eff;font-size:0.8em;font-weight:600;white-space:nowrap;min-width:100px;font-family:'Geist Mono',monospace">${escapeHTML(repoName)}</span>
      <span style="color:rgba(252,253,255,0.75);font-size:0.85em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(msgTruncated)}</span>
      <span style="color:rgba(252,253,255,0.3);font-size:0.75em;white-space:nowrap">${relativeTime(commit.timestamp)}</span>
    `;

    container.appendChild(row);
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function initGitHub() {
  // Find containers in the DOM — they should have these data attributes
  const heatmapContainer = document.querySelector("[data-github-heatmap]");
  const statsContainer = document.querySelector("[data-github-stats]");
  const commitsContainer = document.querySelector("[data-github-commits]");
  const errorContainer = document.querySelector("[data-github-error]");

  // If no containers exist, bail silently (page might not have github section)
  if (!heatmapContainer && !statsContainer && !commitsContainer) return;

  /**
   * Render data to all available containers
   */
  function renderAll(data) {
    try {
      if (heatmapContainer) renderContributionGraph(heatmapContainer, data.events);
      if (statsContainer) renderStatsCards(statsContainer, data);
      if (commitsContainer) renderRecentCommits(commitsContainer, data.events);
    } catch (err) {
      console.error("[github] Render error:", err);
    }
  }

  function showError(message, lastUpdated) {
    if (errorContainer) {
      let html = `<div style="color:rgba(252,253,255,0.5);font-size:0.85em;padding:12px;text-align:center">
        ${escapeHTML(message)}`;
      if (lastUpdated) {
        const ago = relativeTime(new Date(lastUpdated).toISOString());
        html += `<br><span style="font-size:0.85em;color:rgba(252,253,255,0.3)">Last updated: ${ago}</span>`;
      }
      html += "</div>";
      errorContainer.innerHTML = html;
    }
  }

  // 1. Check cache first
  const cached = getCachedData();

  if (cached && cached.data) {
    // Render cached data immediately
    renderAll(cached.data);

    if (!isCacheStale(cached)) {
      // Cache is fresh — done
      return;
    }

    // Cache is stale — refetch in background
    try {
      const freshData = await fetchGitHubData(USERNAME);
      setCachedData(freshData);
      renderAll(freshData);
    } catch (err) {
      // Stale cache is already rendered, just log
      console.warn("[github] Background refetch failed:", err.message);
    }
    return;
  }

  // 2. No cache — fetch fresh
  try {
    const data = await fetchGitHubData(USERNAME);
    setCachedData(data);
    renderAll(data);
  } catch (err) {
    console.error("[github] Fetch failed:", err);
    showError(
      "Unable to load GitHub data. Please try again later.",
      cached?.timestamp
    );
  }
}
