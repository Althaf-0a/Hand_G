import React from 'react';

const DEFAULT_MAPPING = {
  'None': '',
  'Closed_Fist': 'Stop',
  'Open_Palm': 'Hello',
  'Pointing_Up': 'Look',
  'Thumb_Down': 'No',
  'Thumb_Up': 'Yes',
  'Victory': 'Peace',
  'ILoveYou': 'Love',
  'OK_Sign': 'OK',
  'Rock_On': 'Rock',
  'Call_Me': 'Call'
};

export default function MeaningMapper({ mapping, setMapping }) {
  
  const handleMappingChange = (gesture, value) => {
    setMapping(prev => ({
      ...prev,
      [gesture]: value
    }));
  };

  const resetToDefault = () => {
    setMapping(DEFAULT_MAPPING);
  };

  return (
    <div className="glass-panel">
      <h2><span style={{ marginRight: '8px' }}>⚙️</span>Gesture Meanings</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
        Map default MediaPipe gestures to custom words for communication.
      </p>
      
      <div className="mapper-list">
        {Object.entries(mapping).map(([gesture, word]) => {
          if (gesture === 'None') return null; // Don't allow mapping 'None'
          return (
            <div key={gesture} className="mapper-item">
              <span className="gesture-name">{gesture.replace('_', ' ')}</span>
              <input 
                type="text" 
                value={word} 
                onChange={(e) => handleMappingChange(gesture, e.target.value)}
                placeholder="Enter meaning..."
              />
            </div>
          )
        })}
      </div>
      
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="secondary" onClick={resetToDefault}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
