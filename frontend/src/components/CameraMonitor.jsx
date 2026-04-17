import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Camera, CameraOff, Smartphone, AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CameraMonitor({ onDistractionUpdate }) {
  const videoRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [model, setModel] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Detection states
  const [isPhoneDetected, setIsPhoneDetected] = useState(false);
  const [isPersonDetected, setIsPersonDetected] = useState(true);
  
  // Tracking counts (using refs so they don't cause infinite re-renders on every frame)
  const statsTracker = useRef({
    phoneDetections: 0,
    noPersonDetections: 0,
    lastPhoneDetectTime: 0,
    lastNoPersonDetectTime: 0,
    totalFramesAnalyzed: 0
  });

  // Animation frame ref
  const requestRef = useRef();

  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  // Function to initialize camera stream with an optional deviceId
  const setupCamera = async (deviceId = null) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraError(null);
      
      // Update device list after successful permission
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Update current index based on what we actually got if possible
      // This is mostly to ensure we have *something* active
    } catch (err) {
      console.error("Error accessing camera: ", err);
      // Fallback if facingMode failed or specific device failed
      if (!deviceId) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (videoRef.current) videoRef.current.srcObject = fallbackStream;
          setCameraActive(true);
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          setDevices(allDevices.filter(d => d.kind === 'videoinput'));
          return;
        } catch (e) {}
      }
      setCameraError(err.message || "Camera access denied or device busy");
      setCameraActive(false);
    }
  };

  const handleSwitchCamera = () => {
    if (devices.length < 2) return;
    const nextIndex = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(nextIndex);
    setupCamera(devices[nextIndex].deviceId);
  };

  // Initial load
  useEffect(() => {
    setupCamera();

    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2'
        });
        setModel(loadedModel);
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Error loading CocoSsd model: ", err);
      }
    };

    loadModel();

    return () => {
      // Note: stream cleanup is now handled in setupCamera replacing the stream
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject;
         stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Run detection loop
  useEffect(() => {
    if (!isModelLoaded || !model || !cameraActive || !videoRef.current) return;

    const detectFrame = async () => {
      if (videoRef.current.readyState === 4) {
        const predictions = await model.detect(videoRef.current);
        
        let phoneFound = false;
        let personFound = false;

        predictions.forEach(prediction => {
          if (prediction.class === 'cell phone') {
            phoneFound = true;
          }
          if (prediction.class === 'person') {
            personFound = true;
          }
        });

        setIsPhoneDetected(phoneFound);
        setIsPersonDetected(personFound);

        const now = Date.now();
        const tracker = statsTracker.current;
        tracker.totalFramesAnalyzed += 1;

        // If phone detected and 3 seconds passed since last log, count it
        if (phoneFound && (now - tracker.lastPhoneDetectTime > 3000)) {
          tracker.phoneDetections += 1;
          tracker.lastPhoneDetectTime = now;
          reportUpdate();
        }

        // If NO person detected and 3 seconds passed since last log, count it
        if (!personFound && (now - tracker.lastNoPersonDetectTime > 3000)) {
          tracker.noPersonDetections += 1;
          tracker.lastNoPersonDetectTime = now;
          reportUpdate();
        }
      }
      requestRef.current = requestAnimationFrame(detectFrame);
    };

    const reportUpdate = () => {
      if (onDistractionUpdate) {
        onDistractionUpdate({
          phoneDetections: statsTracker.current.phoneDetections,
          noPersonDetections: statsTracker.current.noPersonDetections
        });
      }
    };

    detectFrame();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isModelLoaded, model, cameraActive, onDistractionUpdate]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-dark-900 border border-white/5 w-full aspect-video flex flex-col justify-center items-center group shadow-glow-sm">
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-500 bg-dark-800">
          <CameraOff size={24} className="mb-2 opacity-50" />
          <span className="text-[10px] font-mono tracking-widest uppercase mb-1">Video Offline</span>
          {cameraError && <span className="text-[9px] text-rose-400 font-mono w-full break-words">{cameraError}</span>}
        </div>
      )}
      
      {cameraActive && !isModelLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-accent-cyan bg-dark-800/80 z-10 backdrop-blur-sm">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Camera size={24} className="mb-2" />
          </motion.div>
          <span className="text-[10px] font-mono tracking-widest uppercase animate-pulse">Initializing Vision AI...</span>
        </div>
      )}

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Status Overlays */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
        <AnimatePresence>
          {isPhoneDetected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-2 py-1 bg-rose-500/80 backdrop-blur-md text-white rounded shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center gap-1.5 border border-rose-400"
            >
              <Smartphone size={12} className="animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Phone Detected</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isPersonDetected && isModelLoaded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-2 py-1 bg-amber-500/80 backdrop-blur-md text-white rounded shadow-[0_0_15px_rgba(245,158,11,0.6)] flex items-center gap-1.5 border border-amber-400"
            >
              <AlertTriangle size={12} className="animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Subject Missing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
        <div className="px-2 py-0.5 bg-dark-900/60 backdrop-blur-md text-[9px] font-mono text-brand-300 rounded uppercase tracking-widest border border-brand-500/20">
          Proctor Active
        </div>
        {(statsTracker.current.phoneDetections > 0 || statsTracker.current.noPersonDetections > 0) && (
          <div className="px-2 py-0.5 bg-dark-900/60 backdrop-blur-md text-[9px] font-mono text-rose-300 rounded uppercase tracking-widest border border-rose-500/20">
            Violations: {statsTracker.current.phoneDetections + statsTracker.current.noPersonDetections}
          </div>
        )}
      </div>

      {/* Switch Camera Button */}
      {devices.length > 1 && (
        <button 
          onClick={handleSwitchCamera}
          className="absolute bottom-2 right-2 p-2 bg-dark-900/80 hover:bg-brand-500/20 backdrop-blur-md text-brand-300 rounded-lg border border-brand-500/30 transition-all z-20 group flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(79,157,255,0.2)]"
          title="Switch Camera Device"
        >
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      )}
      
      {/* HUD Scanner lines filter overlay */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-30 box-shadow-[inset_0_0_50px_rgba(34,211,238,0.2)]">
        <div className="w-full h-full border border-accent-cyan/20 rounded-xl" />
        <motion.div
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 w-full h-[1px] bg-accent-cyan/30 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
        />
      </div>
    </div>
  );
}
