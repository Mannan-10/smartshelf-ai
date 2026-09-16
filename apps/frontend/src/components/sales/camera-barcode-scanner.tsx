'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Sparkles, Volume2, AlertCircle } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (barcode: string) => void;
};

export function CameraBarcodeScanner({ open, onOpenChange, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const animFrameRef = useRef<number | null>(null);

  // Synthesize pleasant scan beep using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // A6 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted or unavailable
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile/tablet
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setError(msg);
      setIsScanning(false);
    }
  }, []);

  // Frame detection loop with BarcodeDetector API
  useEffect(() => {
    if (!open || !isScanning || !videoRef.current) return;

    let detector: { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> } | null = null;
    const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: new (opts?: { formats: string[] }) => typeof detector }).BarcodeDetector;

    if (BarcodeDetectorClass) {
      try {
        detector = new BarcodeDetectorClass({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'],
        });
      } catch {
        detector = null;
      }
    }

    let active = true;

    async function scanLoop() {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) {
        if (active) animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            const raw = barcodes[0].rawValue.trim();
            playBeep();
            onDetected(raw);
            onOpenChange(false);
            return;
          }
        } catch {
          // ignore detection errors frame by frame
        }
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [open, isScanning, onDetected, onOpenChange, playBeep]);

  // Lifecycle start / stop on dialog open/close
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      playBeep();
      onDetected(manualCode.trim());
      setManualCode('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="h-5 w-5 text-primary" />
            Scan Product Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}. Please verify camera permissions or type SKU manually below.</span>
            </div>
          ) : (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Viewfinder Target Laser Line */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-3/4 h-32 border-2 border-emerald-400 rounded-lg relative flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  {/* Animated laser line */}
                  <div className="w-full h-0.5 bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="absolute bottom-1 text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded">
                    Align barcode within frame
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Manual / Fallback SKU input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or type/paste SKU or Barcode..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded-md text-sm bg-background"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!manualCode.trim()}>
              Add
            </Button>
          </form>

          <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Auto-detects Code 128, EAN & QR
            </span>
            <span className="flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              Audio Beep On
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
