import React, { useState, useEffect, useRef } from 'react';
import GestureRecognizerComponent from './components/GestureRecognizer';
import MeaningMapper from './components/MeaningMapper';
import CommunicationLog from './components/CommunicationLog';
import GestureTrainer from './components/GestureTrainer';
import './index.css';

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

function App() {
  const currentLandmarksRef = useRef(null);

  const [mapping, setMapping] = useState(() => {
    const saved = localStorage.getItem('gestureMapping');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_MAPPING;
      }
    }
    return DEFAULT_MAPPING;
  });

  const [savedGestures, setSavedGestures] = useState(() => {
    const saved = localStorage.getItem('savedGestures');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [sentence, setSentence] = useState([]);

  useEffect(() => {
    localStorage.setItem('gestureMapping', JSON.stringify(mapping));
  }, [mapping]);

  useEffect(() => {
    localStorage.setItem('savedGestures', JSON.stringify(savedGestures));
    
    // Automatically add empty mappings for new gestures if they don't exist
    setMapping(prev => {
        const newMapping = { ...prev };
        let changed = false;
        savedGestures.forEach(g => {
            if (newMapping[g.name] === undefined) {
                newMapping[g.name] = '';
                changed = true;
            }
        });
        return changed ? newMapping : prev;
    });
  }, [savedGestures]);

  const handleGestureRecognized = (gestureName) => {
    if (gestureName === 'None') return;
    
    const word = mapping[gestureName];
    if (word && word.trim() !== '') {
      setSentence(prev => [...prev, word]);
    }
  };

  const handleSaveGesture = (gestureData) => {
    setSavedGestures(prev => [...prev, gestureData]);
  };

  const handleDeleteGesture = (name) => {
    setSavedGestures(prev => prev.filter(g => g.name !== name));
  };

  const clearSentence = () => {
    setSentence([]);
  };

  const removeLastWord = () => {
    setSentence(prev => prev.slice(0, -1));
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Hand Symbol Recognition</h1>
        <p>Translate your gestures into communication</p>
      </header>
      
      <main className="main-content">
        <GestureRecognizerComponent 
            onGestureRecognized={handleGestureRecognized} 
            savedGestures={savedGestures}
            currentLandmarksRef={currentLandmarksRef}
        />
        <CommunicationLog 
          sentence={sentence.join(' ')} 
          clearSentence={clearSentence}
          removeLastWord={removeLastWord}
        />
      </main>

      <aside className="sidebar">
        <GestureTrainer 
            savedGestures={savedGestures}
            onSaveGesture={handleSaveGesture}
            onDeleteGesture={handleDeleteGesture}
            currentLandmarksRef={currentLandmarksRef}
        />
        <MeaningMapper 
          mapping={mapping} 
          setMapping={setMapping} 
        />
      </aside>
    </div>
  );
}

export default App;
