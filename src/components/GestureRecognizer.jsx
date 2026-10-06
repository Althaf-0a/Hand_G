import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import { detectCustomGestures } from '../utils/customGestures';

export default function GestureRecognizerComponent({ onGestureRecognized, savedGestures = [], currentLandmarksRef }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [recognizer, setRecognizer] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGesture, setCurrentGesture] = useState('None');
  
  const webcamRunningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);

  // Track latest props to avoid stale closures in the predictWebcam loop
  const latestOnGestureRecognized = useRef(onGestureRecognized);
  const latestSavedGestures = useRef(savedGestures);

  useEffect(() => {
    latestOnGestureRecognized.current = onGestureRecognized;
    latestSavedGestures.current = savedGestures;
  }, [onGestureRecognized, savedGestures]);

  // Track last gesture time to debounce repeated recognitions
  const lastGestureTimeRef = useRef(0);
  const lastGestureNameRef = useRef('None');

  useEffect(() => {
    async function loadModel() {
      try {
        setIsLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setRecognizer(gestureRecognizer);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading MediaPipe model:", error);
        setIsLoading(false);
      }
    }
    
    loadModel();
  }, []);

  const predictWebcam = useCallback(async () => {
    if (!videoRef.current || !recognizer || !webcamRunningRef.current) return;

    const video = videoRef.current;
    
    // Only process if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        window.requestAnimationFrame(predictWebcam);
        return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        let startTimeMs = performance.now();
        const results = recognizer.recognizeForVideo(video, startTimeMs);

        if (results.gestures.length > 0) {
          if (currentLandmarksRef) {
              currentLandmarksRef.current = results.landmarks[0];
          }

          let categoryName = results.gestures[0][0].categoryName;
          const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
          
          // Custom gesture fallback if MediaPipe is uncertain or says 'None'
          if (categoryName === 'None' || categoryScore < 60) {
              const customGesture = detectCustomGestures(results.landmarks[0], latestSavedGestures.current);
              if (customGesture !== 'None') {
                  categoryName = customGesture;
              }
          }

          setCurrentGesture(categoryName);
          
          const now = Date.now();
          if (
            categoryName !== 'None' && 
            (categoryName !== lastGestureNameRef.current || now - lastGestureTimeRef.current > 2000)
          ) {
            lastGestureNameRef.current = categoryName;
            lastGestureTimeRef.current = now;
            latestOnGestureRecognized.current(categoryName);
          }
          
          if (categoryName === 'None') {
              if (now - lastGestureTimeRef.current > 1000) {
                 lastGestureNameRef.current = 'None';
              }
          }

          drawLandmarks(results.landmarks);
        } else {
            setCurrentGesture('None');
            const canvasCtx = canvasRef.current.getContext('2d');
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }

    if (webcamRunningRef.current) {
      window.requestAnimationFrame(predictWebcam);
    }
  }, [recognizer]);

  const enableCam = async () => {
    if (!recognizer) {
      console.warn("Gesture Recognizer is not yet loaded");
      return;
    }

    if (webcamRunningRef.current) {
      webcamRunningRef.current = false;
      setWebcamRunning(false);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    const constraints = { video: { width: 1280, height: 720 } };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Use onloadeddata instead of addEventListener to prevent multiple listeners
        videoRef.current.onloadeddata = () => {
            webcamRunningRef.current = true;
            setWebcamRunning(true);
            predictWebcam();
        };
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Error accessing webcam. Please make sure you have granted permissions.");
    }
  };

  const drawLandmarks = (landmarks) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const canvasCtx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks && landmarks.length > 0) {
          for (const hand of landmarks) {
              canvasCtx.strokeStyle = '#10b981';
              canvasCtx.lineWidth = 4;
              
              const drawLine = (p1, p2) => {
                  canvasCtx.beginPath();
                  canvasCtx.moveTo(hand[p1].x * canvas.width, hand[p1].y * canvas.height);
                  canvasCtx.lineTo(hand[p2].x * canvas.width, hand[p2].y * canvas.height);
                  canvasCtx.stroke();
              };

              drawLine(0, 1); drawLine(1, 2); drawLine(2, 3); drawLine(3, 4);
              drawLine(0, 5); drawLine(5, 6); drawLine(6, 7); drawLine(7, 8);
              drawLine(5, 9); drawLine(9, 10); drawLine(10, 11); drawLine(11, 12);
              drawLine(9, 13); drawLine(13, 14); drawLine(14, 15); drawLine(15, 16);
              drawLine(13, 17); drawLine(0, 17); drawLine(17, 18); drawLine(18, 19); drawLine(19, 20);

              canvasCtx.fillStyle = '#8b5cf6';
              for (const point of hand) {
                  canvasCtx.beginPath();
                  canvasCtx.arc(point.x * canvas.width, point.y * canvas.height, 6, 0, 2 * Math.PI);
                  canvasCtx.fill();
                  canvasCtx.strokeStyle = 'white';
                  canvasCtx.lineWidth = 2;
                  canvasCtx.stroke();
              }
          }
      }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginBottom: 0 }}><span style={{ marginRight: '8px' }}>🎥</span>Camera View</h2>
        <button 
          onClick={enableCam} 
          disabled={isLoading}
          className={webcamRunning ? 'danger' : ''}
        >
          {isLoading ? 'Loading AI Model...' : (webcamRunning ? 'Stop Camera' : 'Start Camera')}
        </button>
      </div>

      <div className="video-wrapper">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Initializing AI Models...</p>
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
        />
        <canvas 
          ref={canvasRef} 
        />
        
        {webcamRunning && currentGesture && (
            <div className="overlay-info">
                <span className="gesture-badge">
                    Detected: {currentGesture.replace('_', ' ')}
                </span>
            </div>
        )}
      </div>
    </div>
  );
}

