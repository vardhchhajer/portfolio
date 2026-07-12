# Vardh Chhajer — Developer Portfolio (vardh.me)

This repository contains the source code for my developer portfolio, hosted live at [vardh.me](https://vardh.me).

The site is built with a premium dark aesthetic, featuring modular vanilla CSS, native JavaScript ES6 modules, and an interactive browser-based terminal. It is optimized for zero-dependency loading, responsive layouts across devices, and real-time developer telemetry.

---

## Key Features

### 1. Interactive Terminal Overlay
*   **Access**: Press `Ctrl + K` or click the "Open Terminal" button on the homepage. Press `Esc` to close.
*   **REPL Commands**: Features a custom-built command-line interpreter with history parsing and auto-scrolling. Supported commands:
    *   `help`: Lists all available terminal options.
    *   `about`: High-level summary of my background.
    *   `skills`: Interactive breakdown of my programming stack.
    *   `projects`: Summarized listings of featured builds.
    *   `github`: Fetches real-time cache details from the GitHub telemetry provider.
    *   `contact`: Outputs my social links and direct mail routing.
    *   `resume`: Opens `vardh_resume.pdf` in a new tab.
    *   `clear`: Resets the terminal screen history.

### 2. GitHub Activity Telemetry
*   **Dynamic Data Feeding**: Interchanges live API payloads from `api.github.com/users/VardhChhajer` to populate stars, public repository counts, and top languages.
*   **SVG Contribution Heatmap**: Renders an SVG grid representing my public repository commits, wrapped in a mobile-optimized touch-scrolling container.
*   **Commit Log Feed**: Parses recent public commits (featuring event telemetry fallbacks for headless pushes) and displays them as a stacked list on mobile and a row list on desktop.

### 3. Integrated Project Showcases
*   **hides.app**: A secure client-side zero-knowledge encryption application utilizing the Web Crypto API for hardware-accelerated AES-GCM operations, including Shannon entropy analysis (measuring information density to detect encrypted vs. plain structured data).
*   **Store Parts**: A simulated inventory dashboard featuring in-browser SQL queries (via sql.js), barcode rendering, and a heuristic scanner script that differentiates hardware scanner inputs from manual keyboard typing based on keystroke interval time.
*   **AutoGit**: A developer helper tool mock-up for structural codebase auditing.

---

## Behind the Build

This portfolio was built with a clear performance objective: create an engaging, highly interactive developer workspace with zero framework bloat. 

### Design Co-Pilot
The visual layout and theme were conceived using generative AI as a design partner. I collaborated with AI to sketch the premium dark aesthetic, outline custom color systems (like the HSL atmospheric green/blue glows), and calibrate the glassmorphism parameters for the Bento grids. 

### Core Engineering & Logic
While AI served as a styling and design guide, the entire codebase, systems integration, and program logic were fully built and wired by hand:
*   **Modular Architecture**: Designed from scratch using native ES6 module structures (`main.js`, `terminal.js`, `github.js`, `content.js`) to guarantee strict encapsulation and lightning-fast load times.
*   **Terminal REPL**: Built the input key event handlers, command execution parser, history stack, and custom CSS viewport bindings in vanilla JavaScript.
*   **GitHub Telemetry Engine**: Coded the direct API payload fetch parser, localStorage caching mechanics, and created the logic to parse event telemetry (handling fallback push structures for headless commits) so the feed updates in real-time.
*   **Showcase Implementations**: Hand-coded the mathematical formulas for Shannon entropy calculations, configured the browser Web Crypto API pipelines for hides.app, and wrote the timing-interval heuristics that distinguish physical barcode hardware inputs from human typing.

---

## Directory Structure

```text
portfolio/
├── css/
│   ├── globals.css      # Custom design tokens, base layouts, utility rules
│   ├── components.css   # Hero, About, Bento grid cards, footer styling
│   ├── github.css       # Contribution heatmap and commit telemetry layouts
│   ├── terminal.css     # Terminal overlay structure and interactive inputs
│   └── showcase.css     # Interactive show-page grids and split-panes
├── js/
│   ├── main.js          # Core entry orchestrator
│   ├── content.js       # Local database of projects, skills, and contact metadata
│   ├── terminal.js      # Terminal REPL core logic and commands registry
│   └── github.js        # GitHub API fetch, SVG render, and caching logic
├── showcase/
│   ├── hides.html       # hides.app interface
│   ├── store-parts.html # Store Parts inventory dashboard
│   └── autogit.html     # AutoGit CLI mockup page
├── DEPLOY.md            # Cloudflare Pages / Vercel deployment checklist
├── DESIGN.md            # Styling guidelines and custom utility reference
├── index.html           # Homepage entry point
└── vardh_resume.pdf     # Personal resume document
```

---

## Local Development

Since the site is built entirely using vanilla HTML/CSS/JavaScript with ES Modules, it does not require an intensive compilation or building pipeline.

To start a local server, navigate to the project directory and serve the static files:

### Python 3 Server
```bash
python -m http.server 3000
```

### Node.js (via npx)
```bash
npx serve -p 3000
```

Once running, navigate to `http://localhost:3000` in your web browser.

---

## Deployment

The application is deployed to **Cloudflare Pages** and is bound to a Cloudflare Worker custom domain trigger for `vardh.me`, `www.vardh.me`, and `portfolio.vardh.me`.

Refer to [DEPLOY.md](file:///c:/Users/Vardh/Desktop/portfolio/DEPLOY.md) for detailed instructions on configuring DNS parameters, setting CNAME proxy rules, and managing email forwarding for `connect@vardh.me`.