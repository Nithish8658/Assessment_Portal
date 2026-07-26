import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertTriangle, ShieldCheck, RefreshCw, Cpu } from 'lucide-react';
import apiClient from '../../api/client';

interface WebcamProctorProps {
  attemptId?: number;
  onViolation?: (type: string, details: string, snapshotBase64?: string) => void;
  isActive: boolean;
  onCameraStatusChange?: (enabled: boolean) => void;
}

export const WebcamProctor: React.FC<WebcamProctorProps> = ({
  attemptId,
  onViolation,
  isActive,
  onCameraStatusChange
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<any[]>([]);
  const [annotatedSnapshot, setAnnotatedSnapshot] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isActive]);

  // Periodic AI Frame Analysis Loop (Every 2.5 seconds)
  useEffect(() => {
    let interval: any;
    if (isActive && cameraActive && attemptId) {
      interval = setInterval(() => {
        runAIFrameAnalysis();
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isActive, cameraActive, attemptId]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });

      // Handle async race condition: if unmounted or deactivated while getUserMedia was resolving
      if (!isMountedRef.current || !isActive) {
        mediaStream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
      if (onCameraStatusChange) onCameraStatusChange(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          setCameraActive(false);
          if (onCameraStatusChange) onCameraStatusChange(false);
        };
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('Webcam permission or access failed:', err);
      setCameraError('Camera access denied or device unavailable.');
      setCameraActive(false);
      if (onCameraStatusChange) onCameraStatusChange(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      setStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const activeStream = videoRef.current.srcObject as MediaStream;
      activeStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setAnnotatedSnapshot(null);
    if (onCameraStatusChange) onCameraStatusChange(false);
  };

  const captureSnapshot = (): string | undefined => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return undefined;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.6);
    }
    return undefined;
  };

  const runAIFrameAnalysis = async () => {
    if (!attemptId || !cameraActive || aiAnalyzing) return;
    const frameB64 = captureSnapshot();
    if (!frameB64) return;

    setAiAnalyzing(true);
    try {
      const res = await apiClient.post('/assessments/ai-analyze-frame', {
        attempt_id: attemptId,
        frame_data: frameB64
      });

      if (res.data.success) {
        setDetectedObjects(res.data.detected_objects || []);
        if (res.data.annotated_snapshot) {
          setAnnotatedSnapshot(res.data.annotated_snapshot);
        }
        
        // Trigger modal alerts only for severe malpractice detections
        if (res.data.violations && res.data.violations.length > 0) {
          res.data.violations.forEach((v: any) => {
            if (onViolation && (v.type === 'PHONE_DETECTED' || v.type === 'MULTIPLE_PERSONS_DETECTED')) {
              onViolation(v.type, v.details, res.data.annotated_snapshot);
            }
          });
        }
      }
    } catch (err) {
      console.warn('AI Frame analysis request failed:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const triggerViolation = (type: string, details: string) => {
    const snapshot = captureSnapshot();
    if (onViolation) {
      onViolation(type, details, snapshot);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end select-none">
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Video Proctoring Card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden w-64 text-slate-100 backdrop-blur-md">
        {/* Card Header */}
        <div className="bg-slate-800/90 px-3 py-2 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cameraActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cameraActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-200">
              {cameraActive ? 'YOLO AI Proctoring' : 'Camera Off'}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-slate-200 text-xs px-1 font-mono font-bold"
          >
            {isMinimized ? '+' : '_'}
          </button>
        </div>

        {/* Video Viewport / Annotated Feed */}
        {!isMinimized && (
          <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {annotatedSnapshot && (
                  <img
                    src={annotatedSnapshot}
                    alt="YOLO AI Overlay"
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-90 pointer-events-none"
                  />
                )}
              </>
            ) : (
              <div className="p-4 text-center space-y-2">
                <CameraOff className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                <p className="text-[11px] text-slate-400 font-medium leading-tight">
                  {cameraError || 'Webcam is disabled or permission pending.'}
                </p>
                <button
                  onClick={startCamera}
                  className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg flex items-center justify-center space-x-1 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}

            {/* YOLO Detection Tags Overlay */}
            {cameraActive && (
              <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                {detectedObjects.length > 0 ? (
                  detectedObjects.map((obj: any, idx: number) => {
                    const isDanger = ['cell phone', 'book', 'laptop'].includes(obj.class_name);
                    return (
                      <span
                        key={idx}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border backdrop-blur-sm ${
                          isDanger
                            ? 'bg-rose-950/90 text-rose-300 border-rose-700 animate-pulse'
                            : 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                        }`}
                      >
                        {obj.class_name.toUpperCase()} {obj.confidence}%
                      </span>
                    );
                  })
                ) : (
                  <span className="bg-emerald-950/80 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-700/60">
                    YOLO GUARD ACTIVE
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Clean Institutional AI Status Footer */}
        {!isMinimized && cameraActive && (
          <div className="p-2 bg-slate-900 border-t border-slate-800 text-[10px] flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold" title="YOLOv8 AI Detection Engine Active">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>YOLOv8 AI Real-Time Guard</span>
            </span>
            <span className="text-[9px] text-emerald-400 font-mono font-bold animate-pulse">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
};
