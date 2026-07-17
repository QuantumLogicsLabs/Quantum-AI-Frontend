import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
}

/** Camera capture modal — takes a still photo and returns a JPEG File. */
export function CameraCapture({ open, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return undefined;
    }

    let cancelled = false;
    setError('');

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera is not supported in this browser');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        if (!cancelled) setError('Could not access camera — check permissions');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  }

  if (!open) return null;

  return (
    <div className="camera-overlay" role="dialog" aria-modal="true" aria-label="Camera capture">
      <div className="camera-panel">
        <div className="camera-header">
          <strong>Take a photo</strong>
          <button type="button" className="camera-close" onClick={onClose} aria-label="Close camera">
            ×
          </button>
        </div>
        {error ? (
          <p className="camera-error">{error}</p>
        ) : (
          <video ref={videoRef} className="camera-video" playsInline muted autoPlay />
        )}
        <div className="camera-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCapture}
            disabled={!ready || Boolean(error)}
          >
            Capture
          </button>
        </div>
        <p className="camera-hint">Photo is uploaded for vision analysis with QuantumAI</p>
      </div>
    </div>
  );
}
