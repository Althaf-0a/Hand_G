import React from 'react';

export default function CommunicationLog({ sentence, clearSentence, removeLastWord }) {
  return (
    <div className="glass-panel log-panel">
      <h2 style={{ marginBottom: '16px' }}><span style={{ marginRight: '8px' }}>💬</span>Communication Log</h2>
      
      <div className="sentence-display">
        {sentence || <span style={{ color: 'var(--text-muted)' }}>Start gesturing to form a sentence...</span>}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          onClick={removeLastWord}
          className="secondary"
          disabled={!sentence}
        >
          Undo Last
        </button>
        <button 
          onClick={clearSentence}
          className="danger"
          disabled={!sentence}
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
