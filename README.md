# Portfolio

Portfolio is a modular web-based utility suite designed to showcase technical projects and provide advanced data analysis tools. It integrates a command-line style terminal interface, GitHub activity visualization, and cryptographic analysis utilities into a single, cohesive developer-focused experience.

### Features

*   **Terminal Interface (`terminal.js`):** A global, lazy-loaded command-line overlay that supports keyboard shortcuts and DOM-based triggers.
*   **GitHub Integration (`github.js`):** Dynamically renders contribution heatmaps, repository statistics (language distribution, star counts), and recent commit logs using data-attribute targeting.
*   **Cryptographic Toolkit (`crypto.js`):** Provides AES-256-GCM encryption/decryption workflows, including shareable token generation via Base64 encoding/decoding.
*   **Entropy Analysis (`entropy.js`):** Implements Shannon Entropy calculations to evaluate data randomness, identifying structured vs. encrypted/compressed byte patterns.
*   **Input Scanner (`scanner.js`):** A heuristic-based input scanner that distinguishes between manual entry and high-speed hardware barcode/RFID scanning by analyzing keystroke interval timing.
*   **Hex/ASCII Inspector (`bytesToHex`):** Generates formatted memory dumps with side-by-side hexadecimal and ASCII representations.

### Tech Stack

*   **JavaScript (ES Modules):** The core logic is built using native ES6 module imports.
*   **Web Crypto API:** Utilizes `crypto.subtle` for hardware-accelerated AES-GCM operations.

### Installation

This project is a client-side JavaScript module library. No build system or package manager is required. 

1. Clone the repository.
2. Serve the files using any static web server (e.g., `npx serve` or Python's `http.server`).
3. Ensure your HTML includes the `js/main.js` script with `type="module"`.

### Usage

1.  **Terminal:** Ensure your HTML elements have the `data-terminal-trigger` attribute to open the terminal overlay upon clicking.
2.  **GitHub Stats:** Add elements with `data-github-heatmap`, `data-github-stats`, or `data-github-commits` to your page; the `initGitHub()` function will automatically detect these and populate them with data.
3.  **Crypto/Entropy:** Import `generateKey`, `encryptChunk`, or `shannonEntropy` from their respective modules to perform data analysis or secure sensitive strings.
4.  **Scanner:** Initialize the scanner by passing an input element and callback functions (`onScan`, `onManualAdd`) to `initScanner()`.

### How It Works

*   **Shannon Entropy:** The algorithm calculates the probability distribution of bytes within a dataset and applies the formula $H = -\sum p_i \log_2(p_i)$ to determine the information density, helping users verify if data is encrypted or merely structured.
*   **Scan Heuristics:** The `scanner.js` module calculates the average interval between keystrokes. If the average falls below 100ms, the system triggers the `onScan` callback, assuming the input originated from a hardware scanner rather than a human typist.
*   **AES-GCM Packing:** The `encodeShareToken` function packs the key length, raw AES key, 12-byte IV, and ciphertext into a single `Uint8Array` buffer before converting to Base64 for easy transmission.

### Contributing

Contributions are welcome. Please ensure that any new utilities follow the existing ES module structure and maintain the focus on developer-centric tools. Ensure all cryptographic implementations utilize the `crypto.subtle` interface to maintain security standards.