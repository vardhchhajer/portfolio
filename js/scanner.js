// scanner.js — Barcode scanner input detector (ES module)

/**
 * Initialize scanner detection on an input element.
 * Detects barcode scanner input by tracking keystroke timing.
 * If average time between keystrokes < 100ms and length > 3: auto-submit as scan.
 * On Enter or button click: manual add.
 *
 * @param {HTMLInputElement} inputElement - The input field to monitor
 * @param {function(string): void} onScan - Callback when a scan is detected
 * @param {function(string): void} onManualAdd - Callback for manual entry
 * @returns {function(): void} Cleanup function to remove event listeners
 */
export function initScanner(inputElement, onScan, onManualAdd) {
  const keystrokeTimes = [];
  let scanBuffer = '';
  let scanTimeout = null;

  function handleKeyDown(e) {
    const now = performance.now();

    if (e.key === 'Enter') {
      e.preventDefault();
      const value = inputElement.value.trim();
      if (!value) return;

      // Check if this was a scan based on keystroke timing
      if (keystrokeTimes.length > 3) {
        const avgInterval = calculateAverageInterval(keystrokeTimes);
        if (avgInterval < 100) {
          onScan(value);
          resetState();
          return;
        }
      }

      // Otherwise treat as manual add
      onManualAdd(value);
      resetState();
      return;
    }

    // Track keystroke timing for printable characters
    if (e.key.length === 1) {
      keystrokeTimes.push(now);
      scanBuffer += e.key;

      // Clear any pending scan check
      if (scanTimeout) clearTimeout(scanTimeout);

      // Set a timeout to check for scan completion
      // Scanners typically send all characters rapidly followed by a pause
      scanTimeout = setTimeout(() => {
        if (keystrokeTimes.length > 3) {
          const avgInterval = calculateAverageInterval(keystrokeTimes);
          if (avgInterval < 100) {
            const value = inputElement.value.trim();
            if (value) {
              onScan(value);
              resetState();
            }
          }
        }
        // Reset keystroke tracking after timeout
        keystrokeTimes.length = 0;
        scanBuffer = '';
      }, 300);
    }
  }

  function resetState() {
    inputElement.value = '';
    keystrokeTimes.length = 0;
    scanBuffer = '';
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      scanTimeout = null;
    }
  }

  function calculateAverageInterval(times) {
    if (times.length < 2) return Infinity;
    let totalInterval = 0;
    for (let i = 1; i < times.length; i++) {
      totalInterval += times[i] - times[i - 1];
    }
    return totalInterval / (times.length - 1);
  }

  inputElement.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return function cleanup() {
    inputElement.removeEventListener('keydown', handleKeyDown);
    if (scanTimeout) clearTimeout(scanTimeout);
  };
}
