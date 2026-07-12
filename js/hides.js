// ============================================================================
// hides.js — Hides Cryptographic Showcase Controller
// Handles file upload, Web Crypto AES-GCM encryption, entropy telemetry,
// hex previews, and base64 token generation.
// ============================================================================

import { generateKey, encryptChunk, decryptChunk, encodeShareToken, decodeShareToken, bytesToHex } from "./crypto.js";
import { shannonEntropy, entropyLabel } from "./entropy.js";
import { initTerminal } from "./terminal.js";

// Page elements
let dropZone, fileInput, fileInfoContainer, selectedFileName, selectedFileSize, removeFileBtn, encryptSubmitBtn;
let plaintextHex, ciphertextHex, plaintextEntropyVal, plaintextEntropyBar, plaintextEntropyLabel;
let ciphertextEntropyVal, ciphertextEntropyBar, ciphertextEntropyLabel;
let encryptionProgressCard, encryptProgressBar, encryptProgressPct;
let tokenCard, shareTokenInput, copyTokenBtn;

// Decrypt elements
let decryptTokenInput, decryptSubmitBtn, demoBtn1, demoBtn2;
let decryptionProgressCard, decryptProgressBar, decryptProgressPct;
let decryptedPreview, downloadFileBtn;

// State variables
let activeFile = null;
let encryptedPayload = null;

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
    });
  });
}

// Init drag and drop
function initDragAndDrop() {
  dropZone = document.getElementById("encrypt-dropzone");
  fileInput = document.getElementById("encrypt-file-input");
  fileInfoContainer = document.getElementById("file-info-container");
  selectedFileName = document.getElementById("selected-file-name");
  selectedFileSize = document.getElementById("selected-file-size");
  removeFileBtn = document.getElementById("remove-file-btn");
  encryptSubmitBtn = document.getElementById("encrypt-submit-btn");

  if (!dropZone) return;

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("is-active");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("is-active");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("is-active");
    if (e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  });

  removeFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearFile();
  });
}

function setFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    alert("Simulation limit: File size cannot exceed 5MB.");
    return;
  }
  activeFile = file;
  selectedFileName.textContent = file.name;
  
  const sizeKb = (file.size / 1024).toFixed(1);
  selectedFileSize.textContent = `${sizeKb} KB · ${file.type || "Unknown Type"}`;
  
  dropZone.classList.add("hidden");
  fileInfoContainer.classList.remove("hidden");

  // Read plaintext preview and compute entropy
  const reader = new FileReader();
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    const uint8 = new Uint8Array(arrayBuffer);
    
    // Preview hex
    plaintextHex.textContent = bytesToHex(uint8, 256);
    
    // Compute entropy
    const entropy = shannonEntropy(uint8);
    plaintextEntropyVal.textContent = `${entropy.toFixed(4)} bits`;
    plaintextEntropyBar.style.width = `${(entropy / 8) * 100}%`;
    plaintextEntropyLabel.textContent = `Structure: ${entropyLabel(entropy)}`;
  };
  reader.readAsArrayBuffer(file);
}

function clearFile() {
  activeFile = null;
  fileInput.value = "";
  dropZone.classList.remove("hidden");
  fileInfoContainer.classList.add("hidden");
  plaintextHex.textContent = "Drop a file to view hexadecimal structure...";
  ciphertextHex.textContent = "Run encryption to generate random bytes...";
  
  plaintextEntropyVal.textContent = "0.00 bits";
  plaintextEntropyBar.style.width = "0%";
  plaintextEntropyLabel.textContent = "No file analyzed";
  
  ciphertextEntropyVal.textContent = "0.00 bits";
  ciphertextEntropyBar.style.width = "0%";
  ciphertextEntropyLabel.textContent = "No encryption run";

  tokenCard.classList.add("hidden");
}

// Chunked encryption simulator
async function runEncryption() {
  if (!activeFile) return;

  encryptSubmitBtn.disabled = true;
  encryptionProgressCard.style.display = "block";
  tokenCard.classList.add("hidden");

  try {
    const key = await generateKey();
    const fileData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsArrayBuffer(activeFile);
    });

    const uint8 = new Uint8Array(fileData);
    const totalBytes = uint8.length;
    const chunkSize = 64 * 1024; // 64KB chunks
    const totalChunks = Math.ceil(totalBytes / chunkSize);
    
    // Simulate chunked encryption progress
    let encryptedChunks = [];
    let currentByte = 0;
    
    // Fresh IV generated inside encryptChunk
    let lastIv = null;
    let fullCiphertext = new Uint8Array(0);

    for (let c = 0; c < totalChunks; c++) {
      const start = c * chunkSize;
      const end = Math.min(start + chunkSize, totalBytes);
      const chunk = uint8.slice(start, end);
      
      const { iv, ciphertext } = await encryptChunk(chunk, key);
      lastIv = iv; // Keep track of the last IV for the token (or full token)
      
      // Accumulate ciphertext bytes
      const ctBytes = new Uint8Array(ciphertext);
      const newCt = new Uint8Array(fullCiphertext.length + ctBytes.length);
      newCt.set(fullCiphertext);
      newCt.set(ctBytes, fullCiphertext.length);
      fullCiphertext = newCt;

      // Update progress
      const pct = Math.floor(((c + 1) / totalChunks) * 100);
      encryptProgressBar.style.width = `${pct}%`;
      encryptProgressPct.textContent = `${pct}%`;
      
      // Throttle slightly for visual pacing
      await new Promise(r => setTimeout(r, 40));
    }

    // Done encrypting
    ciphertextHex.textContent = bytesToHex(fullCiphertext, 256);
    
    // Calculate final entropy
    const entropy = shannonEntropy(fullCiphertext);
    ciphertextEntropyVal.textContent = `${entropy.toFixed(4)} bits`;
    ciphertextEntropyBar.style.width = `${(entropy / 8) * 100}%`;
    ciphertextEntropyLabel.textContent = `Structure: ${entropyLabel(entropy)}`;
    
    // Generate token
    const token = await encodeShareToken(key, lastIv, fullCiphertext.buffer);
    shareTokenInput.value = token;
    tokenCard.classList.remove("hidden");
    
    // Save for decryption page downloads
    encryptedPayload = {
      name: activeFile.name,
      type: activeFile.type,
      token: token
    };

    document.getElementById("entropy-badge").textContent = "Encrypted";
  } catch (err) {
    console.error("Encryption failed:", err);
    alert("Symmetric encryption thread collapsed.");
  } finally {
    encryptSubmitBtn.disabled = false;
    encryptionProgressCard.style.display = "none";
  }
}

// Decryption Pipeline
async function runDecryption() {
  const token = decryptTokenInput.value.trim();
  if (!token) {
    alert("Please inject a valid share token first.");
    return;
  }

  decryptSubmitBtn.disabled = true;
  decryptionProgressCard.style.display = "block";
  decryptedPreview.textContent = "Initializing decryption threads...";
  downloadFileBtn.classList.add("hidden");

  try {
    const { key, iv, ciphertext } = await decodeShareToken(token);
    
    // Simulate chunked decryption progression
    const totalBytes = ciphertext.byteLength;
    const chunkSize = 64 * 1024;
    const totalChunks = Math.ceil(totalBytes / chunkSize);
    let fullPlaintext = new Uint8Array(0);

    for (let c = 0; c < totalChunks; c++) {
      const start = c * chunkSize;
      const end = Math.min(start + chunkSize, totalBytes);
      const chunk = ciphertext.slice(start, end);
      
      const plaintext = await decryptChunk(chunk, key, iv);
      const ptBytes = new Uint8Array(plaintext);
      
      const newPt = new Uint8Array(fullPlaintext.length + ptBytes.length);
      newPt.set(fullPlaintext);
      newPt.set(ptBytes, fullPlaintext.length);
      fullPlaintext = newPt;

      const pct = Math.floor(((c + 1) / totalChunks) * 100);
      decryptProgressBar.style.width = `${pct}%`;
      decryptProgressPct.textContent = `${pct}%`;
      
      await new Promise(r => setTimeout(r, 45));
    }

    // Try showing as text preview
    const decoder = new TextDecoder("utf-8");
    const previewText = decoder.decode(fullPlaintext.slice(0, 1024));
    decryptedPreview.textContent = previewText + (fullPlaintext.length > 1024 ? "\n... (remaining data truncated)" : "");
    
    // Show download button
    downloadFileBtn.classList.remove("hidden");
    
    // Store decrypted buffer for download
    downloadFileBtn.onclick = () => {
      let fileName = "decrypted_file";
      let fileType = "application/octet-stream";
      
      // Match current session token or guess
      if (encryptedPayload && encryptedPayload.token === token) {
        fileName = encryptedPayload.name;
        fileType = encryptedPayload.type;
      } else if (token.length > 200) {
        fileName = "decrypted_document.txt";
        fileType = "text/plain";
      }
      
      const blob = new Blob([fullPlaintext], { type: fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    };

  } catch (err) {
    console.error("Decryption failed:", err);
    decryptedPreview.textContent = "AUTHENTICATION ERROR: Payload integrity check failed. The token is invalid or has been modified.";
  } finally {
    decryptSubmitBtn.disabled = false;
    decryptionProgressCard.style.display = "none";
  }
}

// Demo Payloads creation
async function loadDemoPayloads() {
  demoBtn1 = document.getElementById("demo-payload-1");
  demoBtn2 = document.getElementById("demo-payload-2");

  if (!demoBtn1 || !demoBtn2) return;

  // Pre-generate tokens for demo payloads
  const payloadText = "CONFIDENTIAL: Secure system transmission is fully operational. All system telemetry is online. We are monitoring the quantum loops.";
  const payloadJson = JSON.stringify({
    timestamp: "2026-07-12T01:50:00Z",
    status: "SYSTEMS_STABLE",
    auth: "SECURE_AES_256",
    nodes: ["Alpha", "Bravo", "Charlie"]
  }, null, 2);

  try {
    const key1 = await generateKey();
    const iv1 = crypto.getRandomValues(new Uint8Array(12));
    const ct1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv1 }, key1, new TextEncoder().encode(payloadText));
    const token1 = await encodeShareToken(key1, iv1, ct1);

    const key2 = await generateKey();
    const iv2 = crypto.getRandomValues(new Uint8Array(12));
    const ct2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv2 }, key2, new TextEncoder().encode(payloadJson));
    const token2 = await encodeShareToken(key2, iv2, ct2);

    demoBtn1.onclick = () => {
      decryptTokenInput.value = token1;
    };

    demoBtn2.onclick = () => {
      decryptTokenInput.value = token2;
    };
  } catch(e) {
    console.warn("Demo payload token pregeneration collapsed:", e);
  }
}

// Dom Ready init
function initHides() {
  // Plaintext display refs
  plaintextHex = document.getElementById("plaintext-hex");
  ciphertextHex = document.getElementById("ciphertext-hex");
  
  plaintextEntropyVal = document.getElementById("plaintext-entropy-val");
  plaintextEntropyBar = document.getElementById("plaintext-entropy-bar");
  plaintextEntropyLabel = document.getElementById("plaintext-entropy-label");
  
  ciphertextEntropyVal = document.getElementById("ciphertext-entropy-val");
  ciphertextEntropyBar = document.getElementById("ciphertext-entropy-bar");
  ciphertextEntropyLabel = document.getElementById("ciphertext-entropy-label");

  encryptionProgressCard = document.getElementById("encryption-progress-card");
  encryptProgressBar = document.getElementById("encrypt-progress-bar");
  encryptProgressPct = document.getElementById("encrypt-progress-pct");

  tokenCard = document.getElementById("token-card");
  shareTokenInput = document.getElementById("share-token-input");
  copyTokenBtn = document.getElementById("copy-token-btn");

  // Decrypt displays
  decryptTokenInput = document.getElementById("decrypt-token-input");
  decryptSubmitBtn = document.getElementById("decrypt-submit-btn");
  decryptionProgressCard = document.getElementById("decryption-progress-card");
  decryptProgressBar = document.getElementById("decrypt-progress-bar");
  decryptProgressPct = document.getElementById("decrypt-progress-pct");
  decryptedPreview = document.getElementById("decrypted-preview");
  downloadFileBtn = document.getElementById("download-file-btn");

  initTabs();
  initDragAndDrop();
  loadDemoPayloads();

  encryptSubmitBtn?.addEventListener("click", runEncryption);
  decryptSubmitBtn?.addEventListener("click", runDecryption);

  copyTokenBtn?.addEventListener("click", () => {
    shareTokenInput.select();
    document.execCommand("copy");
    const originalText = copyTokenBtn.textContent;
    copyTokenBtn.textContent = "Copied";
    copyTokenBtn.classList.add("glow-green");
    setTimeout(() => {
      copyTokenBtn.textContent = originalText;
      copyTokenBtn.classList.remove("glow-green");
    }, 2000);
  });

  // Global terminal overlay hook
  initTerminal();
}

// Run init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHides);
} else {
  initHides();
}
export { initHides };
