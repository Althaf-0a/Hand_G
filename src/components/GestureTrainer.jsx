import React, { useState } from 'react';
import { normalizeLandmarks } from '../utils/customGestures';

export default function GestureTrainer({ savedGestures, onSaveGesture, onDeleteGesture, currentLandmarksRef }) {
  const [gestureName, setGestureName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleCapture = () => {
    const currentLandmarks = currentLandmarksRef?.current;
    
    if (!currentLandmarks) {
      setStatusMsg('No hand detected. Show your hand to the camera first!');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    if (!gestureName.trim()) {
      setStatusMsg('Please enter a gesture name first.');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }
    
    // Format the name slightly
    const safeName = gestureName.trim().replace(/\s+/g, '_');

    // Normalize it before saving
    const normalized = normalizeLandmarks(currentLandmarks);
    
    onSaveGesture({
      name: safeName,
      normalizedLandmarks: normalized,
      timestamp: Date.now()
    });

    setStatusMsg(`Captured "${safeName}" successfully!`);
    setTimeout(() => setStatusMsg(''), 3000);
    setGestureName('');
  };

  // Group gestures by name to show counts
  const groupedGestures = savedGestures.reduce((acc, curr) => {
    acc[curr.name] = (acc[curr.name] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="glass-panel">
      <h2><span style={{ marginRight: '8px' }}>🎓</span>Teach Mode</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
        Create a custom shape. Hold your hand steady and click Capture.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input 
          type="text" 
          placeholder="e.g., Spider_Man" 
          value={gestureName}
          onChange={(e) => setGestureName(e.target.value)}
          style={{ flexGrow: 1 }}
        />
        <button onClick={handleCapture}>Capture</button>
      </div>

      {statusMsg && (
        <div style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
          {statusMsg}
        </div>
      )}

      {Object.keys(groupedGestures).length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--primary)' }}>Your Saved Shapes</h3>
          <div className="mapper-list" style={{ maxHeight: '200px' }}>
            {Object.entries(groupedGestures).map(([name, count]) => (
              <div key={name} className="mapper-item">
                <span>
                  <strong style={{ color: '#fff' }}>{name.replace('_', ' ')}</strong> 
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({count} frames)</span>
                </span>
                <button 
                    onClick={() => onDeleteGesture(name)}
                    className="danger"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                >
                    Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
