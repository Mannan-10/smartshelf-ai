'use client';

import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Hook to detect hardware USB/Bluetooth barcode scanner inputs.
 * Hardware scanners behave as high-speed keyboard input devices (<50ms between keystrokes)
 * terminating with an 'Enter' key.
 */
export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxIntervalMs = 60,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore functional meta keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If key is Enter, evaluate the buffer
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          const scannedCode = bufferRef.current.join('').trim();
          if (scannedCode.length >= minChars) {
            // Prevent Enter from accidentally submitting the enclosing form
            e.preventDefault();
            e.stopPropagation();
            onScanRef.current(scannedCode);
          }
        }
        bufferRef.current = [];
        return;
      }

      // If time between keystrokes exceeds threshold, this is manual human typing; reset buffer
      if (bufferRef.current.length > 0 && interval > maxIntervalMs) {
        bufferRef.current = [];
      }

      // Record printable ASCII characters
      if (e.key.length === 1) {
        bufferRef.current.push(e.key);
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minChars, maxIntervalMs]);
}
