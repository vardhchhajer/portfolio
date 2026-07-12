// ============================================================================
// store-parts.js — Store Parts Inventory Showcase Controller
// Controls SQLite WASM worker, virtual scanner triggers, label canvas print preview,
// and Plotly dashboard graphing.
// ============================================================================

import { initScanner } from "./scanner.js";
import { initTerminal } from "./terminal.js";

// DOM Element references
let scannerInput, scannerSubmitBtn, scannerLogBody;
let sqlQueryEditor, sqlRunBtn, sqlResetBtn, sqlResultsContainer;
let labelPartNum, labelDesc, labelQty, labelGenerateBtn, labelPrintBtn, labelCanvas;
let worker = null;
let seedSqlText = "";
let pendingQueries = new Map();
let queryIdCounter = 0;

// Tab controllers
function initTabs() {
  const tabs = document.querySelectorAll(".tabs__tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach((p) => p.classList.remove("is-active"));

      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      
      const activePanelId = tab.getAttribute("aria-controls");
      document.getElementById(activePanelId).classList.add("is-active");

      // Redraw charts if dashboard tab is selected (Plotly needs correct container dimensions)
      if (activePanelId === "panel-dashboard") {
        setTimeout(renderDashboard, 100);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// sql.js Web Worker Bridge
// ---------------------------------------------------------------------------
async function initSqlWorker() {
  try {
    // Fetch seed.sql first
    const res = await fetch("../sql/seed.sql");
    if (!res.ok) throw new Error("Could not download seed database file");
    seedSqlText = await res.text();

    // Create worker thread
    worker = new Worker("../js/sql-worker.js");
    
    worker.onmessage = function (e) {
      const { id, type, data, error } = e.data;
      const promise = pendingQueries.get(id);
      if (!promise) return;

      pendingQueries.delete(id);

      if (type === "error") {
        promise.reject(new Error(error));
      } else {
        promise.resolve(data);
      }
    };

    // Initialize worker with seed SQL
    await postToWorker("init", { seedSql: seedSqlText });
    
    // Initial run
    runCurrentQuery();
  } catch (err) {
    console.error("[sql-worker] Initialization collapsed:", err);
    if (sqlResultsContainer) {
      sqlResultsContainer.innerHTML = `<div style="color:#ff5555;padding:24px;text-align:center">Worker Error: ${err.message}</div>`;
    }
  }
}

function postToWorker(type, payload = {}) {
  return new Promise((resolve, reject) => {
    const id = ++queryIdCounter;
    pendingQueries.set(id, { resolve, reject });
    worker.postMessage({ id, type, payload });
  });
}

// Run query from editor
async function runCurrentQuery() {
  const query = sqlQueryEditor.value.trim();
  if (!query) return;

  sqlRunBtn.disabled = true;
  sqlResultsContainer.innerHTML = `<div class="flex items-center justify-center text-muted" style="height:220px">
    <div class="animate-spin" style="width:20px;height:20px;border:2px solid rgba(17,255,153,0.2);border-top-color:var(--accent-green);border-radius:50%;margin-right:8px"></div>
    Executing local query...
  </div>`;

  try {
    const res = await postToWorker("exec", { query });
    renderQueryResults(res);
  } catch (err) {
    sqlResultsContainer.innerHTML = `<div style="color:#ff5555;padding:20px;font-family:var(--font-mono);font-size:0.8em;white-space:pre-wrap">SQL Error: ${err.message}</div>`;
  } finally {
    sqlRunBtn.disabled = false;
  }
}

function renderQueryResults(res) {
  if (!res || res.length === 0) {
    sqlResultsContainer.innerHTML = `<div style="color:var(--muted);padding:24px;text-align:center">Empty set (0 rows returned)</div>`;
    return;
  }

  const { columns, values } = res[0];
  const headerHtml = columns.map(c => `<th>${c}</th>`).join("");
  const rowsHtml = values.map(row => {
    const tdHtml = row.map(val => `<td>${val === null ? '<span style="color:var(--faint)">NULL</span>' : val}</td>`).join("");
    return `<tr>${tdHtml}</tr>`;
  }).join("");

  sqlResultsContainer.innerHTML = `
    <div class="data-table-scroll">
      <table class="data-table">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Virtual Scanner controller
// ---------------------------------------------------------------------------
function setupScanner() {
  scannerInput = document.getElementById("scanner-input");
  scannerSubmitBtn = document.getElementById("scanner-submit-btn");
  scannerLogBody = document.getElementById("scanner-log-body");

  if (!scannerInput) return;

  // Init keystroke scanner detector callback
  const cleanup = initScanner(
    scannerInput,
    (scannedCode) => commitScannedPart(scannedCode, "automated"),
    (manualCode) => commitScannedPart(manualCode, "manual")
  );

  scannerSubmitBtn.addEventListener("click", () => {
    const val = scannerInput.value.trim();
    if (val) {
      commitScannedPart(val, "manual");
      scannerInput.value = "";
    }
  });

  // Demo shortcut scan buttons
  document.querySelectorAll(".demo-scan-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      // Simulate quick keystroke scans typing
      scannerInput.value = code;
      scannerInput.focus();
      // Directly trigger scan callback
      commitScannedPart(code, "automated");
      scannerInput.value = "";
    });
  });
}

async function commitScannedPart(partNumber, method) {
  const timestamp = new Date().toLocaleTimeString();
  
  // Clean first row if empty placeholder
  if (scannerLogBody.innerHTML.includes("No scanner input logged")) {
    scannerLogBody.innerHTML = "";
  }

  // Create temporary log entry
  const newRow = document.createElement("tr");
  newRow.style.opacity = "0";
  newRow.style.transform = "translateY(10px)";
  newRow.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  
  newRow.innerHTML = `
    <td class="font-mono" style="color:var(--faint)">${timestamp}</td>
    <td class="font-mono text-primary font-semibold">${partNumber}</td>
    <td><span style="color:var(--accent-green)">+1 (recv)</span></td>
    <td><span class="tag ${method === "automated" ? "tag--green" : "tag--blue"}">${method}</span></td>
  `;

  scannerLogBody.insertBefore(newRow, scannerLogBody.firstChild);

  // Trigger redraw animation
  requestAnimationFrame(() => {
    newRow.style.opacity = "1";
    newRow.style.transform = "translateY(0)";
  });

  // Actually commit the change to the local database Web Worker!
  if (worker) {
    try {
      const sqlUpdate = `
        INSERT OR IGNORE INTO parts (part_number, description, quantity, min_quantity, category, last_updated)
        VALUES ('${partNumber}', 'Scanned Component', 0, 5, 'Consumables', '2026-07-12');
        
        UPDATE parts 
        SET quantity = quantity + 1, last_updated = '2026-07-12' 
        WHERE part_number = '${partNumber}';

        INSERT INTO transactions (part_id, type, quantity, timestamp, notes)
        SELECT id, 'received', 1, datetime('now'), 'Scanner checkout'
        FROM parts WHERE part_number = '${partNumber}';
      `;
      await postToWorker("insert", { sql: sqlUpdate });
    } catch(err) {
      console.warn("Database insert failure from scan:", err.message);
    }
  }
}

// ---------------------------------------------------------------------------
// Barcode & Label drawing (Code 39)
// ---------------------------------------------------------------------------
function setupLabelCanvas() {
  labelPartNum = document.getElementById("label-part-num");
  labelDesc = document.getElementById("label-desc");
  labelQty = document.getElementById("label-qty");
  labelGenerateBtn = document.getElementById("label-generate-btn");
  labelPrintBtn = document.getElementById("label-print-btn");
  labelCanvas = document.getElementById("label-canvas");

  if (!labelCanvas) return;

  labelGenerateBtn.addEventListener("click", drawLabel);
  labelPrintBtn.addEventListener("click", () => {
    // Print window using simple style print media overrides
    window.print();
  });

  drawLabel();
}

// Clean Code 39 generator drawing routine
function drawLabel() {
  const ctx = labelCanvas.getContext("2d");
  const partNumber = labelPartNum.value.trim().toUpperCase() || "PART-NUM";
  const desc = labelDesc.value.trim() || "Item Description";
  const qty = labelQty.value.trim() || "0";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

  // Layout: 3 labels across
  const labelWidth = 135;
  const labelHeight = 120;
  const gap = 15;
  const topPadding = 15;

  for (let l = 0; l < 3; l++) {
    const x = gap + l * (labelWidth + gap);
    
    // Draw boundary line
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, topPadding, labelWidth, labelHeight);

    // Text Header
    ctx.fillStyle = "#000000";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("PART NUMBER:", x + 8, topPadding + 14);

    ctx.font = "bold 13px monospace";
    ctx.fillText(partNumber, x + 8, topPadding + 28);

    ctx.font = "600 8px sans-serif";
    ctx.fillText(desc.length > 20 ? desc.slice(0, 20) + "..." : desc, x + 8, topPadding + 40);

    // Draw simulated Code 39 Barcode
    drawBarcode39(ctx, partNumber, x + 8, topPadding + 50, labelWidth - 16, 32);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`*${partNumber}*`, x + 34, topPadding + 94);

    // Bottom block
    ctx.font = "700 8px sans-serif";
    ctx.fillText(`QTY: ${qty}`, x + 8, topPadding + 108);
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, x + 62, topPadding + 108);
  }
}

// Simplified drawing matching Code 39 pattern structure
function drawBarcode39(ctx, text, x, y, width, height) {
  ctx.fillStyle = "#000000";
  
  // Start/Stop character is '*'
  const fullText = `*${text}*`;
  
  // Basic patterns map of digits/caps for Code 39 (narrow=1px, wide=3px)
  const code39Map = {
    '0': 'N N N W W N W N N', '1': 'W N N W N N N N W', '2': 'N N W W N N N N W',
    '3': 'W N W W N N N N N', '4': 'N N N W W N N N W', '5': 'W N N W W N N N N',
    '6': 'N N W W W N N N N', '7': 'N N N W N N W N W', '8': 'W N N W N N W N N',
    '9': 'N N W W N N W N N', 'A': 'W N N N N W N N W', 'B': 'N N W N N W N N W',
    'C': 'W N W N N W N N N', 'D': 'N N N N W W N N W', 'E': 'W N N N W W N N N',
    'F': 'N N W N W W N N N', 'G': 'N N N N N W W N W', 'H': 'W N N N N W W N N',
    'I': 'N N W N N W W N N', 'J': 'N N N N W W W N N', '-': 'N N N W N N N W W',
    '*': 'N W N N W N W N N'
  };

  const gap = 1;
  let cursor = x;

  for (let c = 0; c < fullText.length; c++) {
    const char = fullText[c];
    const pattern = code39Map[char] || code39Map['*'];
    const elements = pattern.split(" ");
    
    elements.forEach((el, index) => {
      const isBar = (index % 2 === 0);
      const isWide = (el === "W");
      const elWidth = isWide ? 3 : 1;

      if (isBar) {
        ctx.fillRect(cursor, y, elWidth, height);
      }
      cursor += elWidth + gap;
    });

    cursor += 2; // space between characters
  }
}

// ---------------------------------------------------------------------------
// Plotly.js charts rendering
// ---------------------------------------------------------------------------
function renderDashboard() {
  if (typeof Plotly === "undefined") {
    console.warn("Plotly is not loaded yet.");
    return;
  }

  // Common styles
  const darkThemeLayout = {
    paper_bgcolor: "#09090b",
    plot_bgcolor: "#050507",
    font: {
      color: "#fcfdff",
      family: "system-ui, sans-serif"
    },
    margin: { t: 30, b: 40, l: 40, r: 20 },
    xaxis: {
      gridcolor: "#1a1a1e",
      zerolinecolor: "#1a1a1e"
    },
    yaxis: {
      gridcolor: "#1a1a1e",
      zerolinecolor: "#1a1a1e"
    }
  };

  // Chart 1: Levels
  const trace1 = {
    x: ["BRG-2205", "BRG-6204", "BLT-M8", "NUT-M8", "FLT-HEPA", "MOT-NEMA17", "SEN-PROX"],
    y: [24, 18, 150, 200, 6, 12, 10],
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#11ff99", width: 2 },
    marker: { color: "#3b9eff", size: 6 }
  };
  
  Plotly.newPlot("chart-levels", [trace1], {
    ...darkThemeLayout,
    title: "Primary Components Quantity Levels"
  }, { displayModeBar: false, responsive: true });

  // Chart 2: Low Stock
  const trace2 = {
    y: ["HEPA Filter", "Stepper Motor", "Flow Sensor", "Argon Cyl", "Way Oil"],
    x: [6, 12, 2, 2, 8],
    type: "bar",
    orientation: "h",
    marker: {
      color: ["#11ff99", "#3b9eff", "#ff5555", "#ff5555", "#3b9eff"],
      width: 1
    }
  };

  Plotly.newPlot("chart-lowstock", [trace2], {
    ...darkThemeLayout,
    title: "Reorder Trigger Stock Thresholds",
    margin: { t: 30, b: 40, l: 80, r: 20 }
  }, { displayModeBar: false, responsive: true });

  // Chart 3: Distribution
  const trace3 = {
    x: ["CNC Mill", "Lathe Bravo", "3D Printer", "Laser Cutter", "Press Echo"],
    y: [120, 85, 34, 45, 60],
    type: "bar",
    marker: {
      color: "#7928ca"
    }
  };

  Plotly.newPlot("chart-distribution", [trace3], {
    ...darkThemeLayout,
    title: "Inward Parts Allocation by Bay Machines"
  }, { displayModeBar: false, responsive: true });
}

// ---------------------------------------------------------------------------
// Main Init
// ---------------------------------------------------------------------------
function initStoreParts() {
  // SQL element hooks
  sqlQueryEditor = document.getElementById("sql-query-editor");
  sqlRunBtn = document.getElementById("sql-run-btn");
  sqlResetBtn = document.getElementById("sql-reset-btn");
  sqlResultsContainer = document.getElementById("sql-results-container");

  initTabs();
  initSqlWorker();
  setupScanner();
  setupLabelCanvas();

  sqlRunBtn?.addEventListener("click", runCurrentQuery);
  sqlResetBtn?.addEventListener("click", async () => {
    if (confirm("Reset local database to initial seeded configuration?")) {
      await postToWorker("reset", { seedSql: seedSqlText });
      runCurrentQuery();
    }
  });

  // Setup presets SQL query clips
  document.querySelectorAll(".sql-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sqlQueryEditor.value = btn.dataset.query;
      runCurrentQuery();
    });
  });

  // Global terminal overlay hook
  initTerminal();
}

// Run init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStoreParts);
} else {
  initStoreParts();
}
export { initStoreParts };
