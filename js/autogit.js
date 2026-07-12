// ============================================================================
// autogit.js — Autogit AI Documentation Showcase Controller
// Resolves GitHub directory structures, parses files, formats interactive trees,
// and streams OpenAI documentation and commit outputs.
// ============================================================================

import { initTerminal } from "./terminal.js";

// DOM References
let repoUrlInput, repoAnalyzeBtn, openaiKeyInput;
let analyzerStatusCard, analyzerStatusText;
let treeStatusText, fileTreeRoot, repoTreeHeader;
let readmeGenerateBtn, readmeOutputText, readmeCopyBtn;
let diffInputText, demoDiff1, demoDiff2, commitGenerateBtn, commitOutputText, commitCopyBtn;

// State variables
let analyzedRepoData = null;
let currentTab = "analyzer";

// ---------------------------------------------------------------------------
// Tab controllers
// ---------------------------------------------------------------------------
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
      currentTab = activePanelId.replace("panel-", "");
    });
  });
}

// ---------------------------------------------------------------------------
// GitHub API Repository Analyzer
// ---------------------------------------------------------------------------
async function analyzeRepository() {
  const url = repoUrlInput.value.trim();
  if (!url) {
    alert("Please inject a valid public GitHub URL.");
    return;
  }

  // Parse owner/repo
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    alert("Invalid URL structure. Ensure format is: https://github.com/owner/repo");
    return;
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  repoAnalyzeBtn.disabled = true;
  analyzerStatusCard.classList.remove("hidden");
  fileTreeRoot.classList.add("hidden");
  treeStatusText.classList.add("hidden");
  
  analyzerStatusText.textContent = `Resolving repository metadata for ${owner}/${repo}...`;

  try {
    // 1. Fetch repo metadata to get default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) {
      if (repoRes.status === 404) throw new Error("Repository not found (or is private).");
      if (repoRes.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later.");
      throw new Error(`GitHub API returned status ${repoRes.status}`);
    }
    const repoMeta = await repoRes.json();
    const defaultBranch = repoMeta.default_branch || "main";

    // 2. Fetch recursive git tree
    analyzerStatusText.textContent = `Loading recursive file index for branch [${defaultBranch}]...`;
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    if (!treeRes.ok) {
      throw new Error(`Failed to load file tree indices (Status ${treeRes.status})`);
    }
    const treeData = await treeRes.json();

    if (!treeData.tree || treeData.tree.length === 0) {
      throw new Error("Repository contains no files or tree payload is empty.");
    }

    // Process and sort file index
    analyzedRepoData = {
      owner,
      repo,
      defaultBranch,
      tree: treeData.tree,
      meta: repoMeta
    };

    repoTreeHeader.textContent = `${owner}/${repo} (${defaultBranch})`;
    renderFileTreeStructure(treeData.tree);
    
    // Update next tabs descriptions
    readmeOutputText.textContent = `Repository [${owner}/${repo}] loaded. Click Generate to build README.md...`;
    
  } catch (err) {
    console.error("[autogit] Analysis failed:", err);
    treeStatusText.textContent = `Analysis failed: ${err.message}`;
    treeStatusText.classList.remove("hidden");
  } finally {
    repoAnalyzeBtn.disabled = false;
    analyzerStatusCard.classList.add("hidden");
  }
}

// Draw file tree recursively inside DOM container
function renderFileTreeStructure(flatTree) {
  fileTreeRoot.innerHTML = "";
  fileTreeRoot.classList.remove("hidden");

  // Build nested object representing directories
  const root = { files: [], dirs: {} };

  // Filter out git files or non-important items
  const filtered = flatTree.filter(item => {
    return !item.path.startsWith(".git/") && !item.path.startsWith("node_modules/");
  });

  filtered.forEach(item => {
    const parts = item.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      if (!current.dirs[dirName]) {
        current.dirs[dirName] = { name: dirName, files: [], dirs: {} };
      }
      current = current.dirs[dirName];
    }

    const fileName = parts[parts.length - 1];
    if (item.type === "blob") {
      current.files.push({
        name: fileName,
        path: item.path,
        size: item.size || 0,
        url: item.url
      });
    }
  });

  // Render tree node helper
  function drawNode(parentElement, node, depth = 0) {
    // 1. Render directories first
    const sortedDirs = Object.keys(node.dirs).sort();
    sortedDirs.forEach(dirName => {
      const dirNode = node.dirs[dirName];
      const dirEl = document.createElement("div");
      dirEl.className = "file-tree__item file-tree__item--dir";
      dirEl.style.paddingLeft = `${depth * 16}px`;
      
      // Directory Folder Icon SVG
      dirEl.innerHTML = `
        <svg class="file-tree__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <span class="file-tree__name">${dirName}/</span>
      `;

      const childContainer = document.createElement("div");
      childContainer.style.display = "block";
      
      dirEl.addEventListener("click", () => {
        const isCollapsed = childContainer.style.display === "none";
        childContainer.style.display = isCollapsed ? "block" : "none";
        dirEl.querySelector("svg").style.opacity = isCollapsed ? "1" : "0.5";
      });

      parentElement.appendChild(dirEl);
      parentElement.appendChild(childContainer);

      drawNode(childContainer, dirNode, depth + 1);
    });

    // 2. Render files
    const sortedFiles = node.files.sort((a, b) => a.name.localeCompare(b.name));
    sortedFiles.forEach(file => {
      const fileEl = document.createElement("div");
      fileEl.className = "file-tree__item";
      fileEl.style.paddingLeft = `${depth * 16}px`;

      const ext = file.name.split(".").pop();
      const sizeStr = (file.size / 1024).toFixed(1) + " KB";
      
      // File Icon SVG
      fileEl.innerHTML = `
        <svg class="file-tree__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span class="file-tree__name">${file.name}</span>
        <span class="file-tree__meta font-mono">${sizeStr}</span>
      `;

      parentElement.appendChild(fileEl);
    });
  }

  drawNode(fileTreeRoot, root);
}

// ---------------------------------------------------------------------------
// OpenAI API Stream Pipeline (README & Commit message builder)
// ---------------------------------------------------------------------------
async function generateReadmePayload() {
  if (!analyzedRepoData) {
    alert("Analyze a public GitHub repository first.");
    return;
  }

  const apiKey = openaiKeyInput.value.trim();
  readmeGenerateBtn.disabled = true;
  readmeOutputText.textContent = "Formatting repository structures and building README prompts...";
  readmeCopyBtn.classList.add("hidden");

  // Format some file details for the prompt context
  const filesList = analyzedRepoData.tree
    .filter(item => item.type === "blob")
    .slice(0, 40)
    .map(item => `- ${item.path} (${item.size} bytes)`)
    .join("\n");

  const prompt = `Write a professional GitHub README.md for the following repository:
Repository: ${analyzedRepoData.owner}/${analyzedRepoData.repo}
Description: ${analyzedRepoData.meta?.description || "No description provided"}
Default branch: ${analyzedRepoData.defaultBranch}

Here is a list of key files in the repository:
${filesList}

The README should include a clear project summary, installation steps, features, project structure, and usage guides. Return clean markdown.`;

  if (!apiKey) {
    // Simulation fallback with pre-generated text
    setTimeout(() => {
      const simulatedReadme = `# ${analyzedRepoData.repo}

An elegant system developed by ${analyzedRepoData.owner}.

## Features
- Dynamic system telemetry and file indices
- Fully functional local zero-knowledge encryption algorithms
- Modern minimal UI interfaces

## Installation
\`\`\`bash
git clone https://github.com/${analyzedRepoData.owner}/${analyzedRepoData.repo}.git
cd ${analyzedRepoData.repo}
\`\`\`

## Technologies Used
- JavaScript (ES6 Modules)
- CSS Custom Variables
- HTML5 templates

---
*Note: This is a simulation payload. Inject your OpenAI API key in the Repo Analyzer tab to stream live README outputs.*`;

      renderMarkdownToElement(readmeOutputText, simulatedReadme);
      readmeGenerateBtn.disabled = false;
      readmeCopyBtn.classList.remove("hidden");
    }, 1500);
    return;
  }

  // Live streaming using fetch
  try {
    const stream = await callOpenAiApi(apiKey, prompt);
    readmeOutputText.textContent = ""; // Clear text for stream
    
    let fullText = "";
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.trim() !== "");

      for (const line of lines) {
        if (line.includes("[DONE]")) break;
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.substring(6));
            const content = parsed.choices[0]?.delta?.content || "";
            fullText += content;
            readmeOutputText.textContent = fullText;
          } catch(e) {
            // Ignore parse errors from partial lines
          }
        }
      }
    }
    readmeCopyBtn.classList.remove("hidden");
  } catch (err) {
    console.error("OpenAI stream failed:", err);
    readmeOutputText.textContent = `API Error: ${err.message}. Ensure your key has adequate credit limit quotas.`;
  } finally {
    readmeGenerateBtn.disabled = false;
  }
}

async function generateCommitMessage() {
  const diff = diffInputText.value.trim();
  if (!diff) {
    alert("Please inject a valid code diff payload first.");
    return;
  }

  const apiKey = openaiKeyInput.value.trim();
  commitGenerateBtn.disabled = true;
  commitOutputText.textContent = "Analyzing code adjustments and generating conventional summary...";
  commitCopyBtn.classList.add("hidden");

  const prompt = `Generate a conventional commit message from this git diff:
\`\`\`diff
${diff}
\`\`\`
Follow conventional commits structure (e.g. feat(scope): short description followed by details if necessary). Return ONLY the commit message.`;

  if (!apiKey) {
    // Simulation fallback with pre-generated text
    setTimeout(() => {
      const simulatedCommit = `feat(analytics): integrate shannon entropy graphs in crypt-telemetry

- Calculate bits per byte dynamically on chunk encrypt iterations
- Animate telemetry bars to reflect randomness metrics
- Update documentation cards with Web Crypto specifications`;

      commitOutputText.textContent = simulatedCommit;
      commitGenerateBtn.disabled = false;
      commitCopyBtn.classList.remove("hidden");
    }, 1000);
    return;
  }

  try {
    const stream = await callOpenAiApi(apiKey, prompt);
    commitOutputText.textContent = "";
    
    let fullText = "";
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.trim() !== "");

      for (const line of lines) {
        if (line.includes("[DONE]")) break;
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.substring(6));
            const content = parsed.choices[0]?.delta?.content || "";
            fullText += content;
            commitOutputText.textContent = fullText;
          } catch(e) {
            // Ignore partial parse
          }
        }
      }
    }
    commitCopyBtn.classList.remove("hidden");
  } catch (err) {
    console.error("OpenAI stream failed:", err);
    commitOutputText.textContent = `API Error: ${err.message}`;
  } finally {
    commitGenerateBtn.disabled = false;
  }
}

// OpenAI Direct Fetch Handler
async function callOpenAiApi(apiKey, prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
  }

  return response.body;
}

// Simple markdown formatter renderer helper
function renderMarkdownToElement(el, text) {
  // Simple layout replacements to present mock formats
  el.textContent = text;
}

// ---------------------------------------------------------------------------
// Setup Demo payloads
// ---------------------------------------------------------------------------
function setupDemoDiffs() {
  demoDiff1 = document.getElementById("demo-diff-1");
  demoDiff2 = document.getElementById("demo-diff-2");
  diffInputText = document.getElementById("diff-input-text");

  if (!demoDiff1 || !demoDiff2 || !diffInputText) return;

  const diff1 = `diff --git a/js/hides.js b/js/hides.js
index b5f32ea..0ea4f11 100644
--- a/js/hides.js
+++ b/js/hides.js
@@ -34,6 +34,14 @@ function updateEntropyMeter(value) {
   const bar = document.getElementById("entropy-bar");
   const pct = (value / 8) * 100;
   bar.style.width = \`\${pct}%\`;
+  
+  // Color scale shifting based on entropy values
+  if (value > 7.5) {
+    bar.style.background = "linear-gradient(90deg, var(--accent-green), var(--accent-blue))";
+  } else {
+    bar.style.background = "var(--accent-blue)";
+  }
+  document.getElementById("entropy-badge").textContent = value.toFixed(2);
 }`;

  const diff2 = `diff --git a/js/sql-worker.js b/js/sql-worker.js
index b83f12a..b01a2f1 100644
--- a/js/sql-worker.js
+++ b/js/sql-worker.js
@@ -12,4 +12,8 @@ self.onmessage = function(e) {
     case 'exec':
       const query = payload.query;
+      if (query.match(/DROP|DELETE|UPDATE|INSERT/i)) {
+        self.postMessage({ type: 'error', error: 'Write statements forbidden.' });
+        return;
+      }
       try {
         const res = db.exec(query);`;

  demoDiff1.onclick = () => { diffInputText.value = diff1; };
  demoDiff2.onclick = () => { diffInputText.value = diff2; };
}

// ---------------------------------------------------------------------------
// Dom Ready
// ---------------------------------------------------------------------------
function initAutogit() {
  repoUrlInput = document.getElementById("repo-url-input");
  repoAnalyzeBtn = document.getElementById("repo-analyze-btn");
  openaiKeyInput = document.getElementById("openai-key-input");
  analyzerStatusCard = document.getElementById("analyzer-status-card");
  analyzerStatusText = document.getElementById("analyzer-status-text");
  treeStatusText = document.getElementById("tree-status-text");
  fileTreeRoot = document.getElementById("file-tree-root");
  repoTreeHeader = document.getElementById("repo-tree-header");

  readmeGenerateBtn = document.getElementById("readme-generate-btn");
  readmeOutputText = document.getElementById("readme-output-text");
  readmeCopyBtn = document.getElementById("readme-copy-btn");

  commitGenerateBtn = document.getElementById("commit-generate-btn");
  commitOutputText = document.getElementById("commit-output-text");
  commitCopyBtn = document.getElementById("commit-copy-btn");

  initTabs();
  setupDemoDiffs();

  repoAnalyzeBtn?.addEventListener("click", analyzeRepository);
  readmeGenerateBtn?.addEventListener("click", generateReadmePayload);
  commitGenerateBtn?.addEventListener("click", generateCommitMessage);

  readmeCopyBtn?.addEventListener("click", () => {
    navigator.clipboard.writeText(readmeOutputText.textContent);
    const originalText = readmeCopyBtn.textContent;
    readmeCopyBtn.textContent = "Copied";
    setTimeout(() => { readmeCopyBtn.textContent = originalText; }, 2000);
  });

  commitCopyBtn?.addEventListener("click", () => {
    navigator.clipboard.writeText(commitOutputText.textContent);
    const originalText = commitCopyBtn.textContent;
    commitCopyBtn.textContent = "Copied";
    setTimeout(() => { commitCopyBtn.textContent = originalText; }, 2000);
  });

  // Load API key from memory if saved
  const savedKey = sessionStorage.getItem("portfolio-openai-key");
  if (savedKey && openaiKeyInput) {
    openaiKeyInput.value = savedKey;
  }

  openaiKeyInput?.addEventListener("change", () => {
    sessionStorage.setItem("portfolio-openai-key", openaiKeyInput.value.trim());
  });

  // Global terminal overlay hook
  initTerminal();
}

// Run init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAutogit);
} else {
  initAutogit();
}
export { initAutogit };
