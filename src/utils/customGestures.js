// Utility functions for hand landmarks

// Calculate Euclidean distance between two 3D points
function calculateDistance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

// Check if a finger is extended based on distance from wrist (0)
function isFingerExtended(landmarks, tipIdx, pipIdx) {
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  
  const distTip = calculateDistance(wrist, tip);
  const distPip = calculateDistance(wrist, pip);
  
  return distTip > distPip * 1.2;
}

function isThumbExtended(landmarks) {
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const pinkyBase = landmarks[17];
  
  const distTip = calculateDistance(pinkyBase, thumbTip);
  const distMcp = calculateDistance(pinkyBase, thumbMcp);
  
  return distTip > distMcp * 1.2;
}

// -------------------------------------------------------------------
// DYNAMIC TEACH MODE LOGIC
// -------------------------------------------------------------------

// Normalizes landmarks to be scale and translation invariant
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return [];
  
  const wrist = landmarks[0];
  
  // 1. Translate so wrist is at (0,0,0)
  const translated = landmarks.map(point => ({
    x: point.x - wrist.x,
    y: point.y - wrist.y,
    z: point.z - wrist.z
  }));
  
  // 2. Find max distance from wrist
  let maxDist = 0;
  for (let i = 1; i < translated.length; i++) {
    const dist = Math.sqrt(
      translated[i].x ** 2 + 
      translated[i].y ** 2 + 
      translated[i].z ** 2
    );
    if (dist > maxDist) maxDist = dist;
  }
  
  // 3. Scale all points by max distance
  if (maxDist === 0) return translated;
  
  return translated.map(point => ({
    x: point.x / maxDist,
    y: point.y / maxDist,
    z: point.z / maxDist
  }));
}

// Compares current normalized landmarks against saved templates
export function findClosestGesture(normalizedLive, savedTemplates) {
  if (!savedTemplates || savedTemplates.length === 0) return { name: 'None', score: 0 };
  
  let bestMatch = 'None';
  let minAvgDist = Infinity;
  
  // Lower is better (distance)
  const MATCH_THRESHOLD = 0.15; // Tweak this for strictness

  for (const template of savedTemplates) {
    const tLandmarks = template.normalizedLandmarks;
    let totalDist = 0;
    
    // Sum distance of all 21 points
    for (let i = 0; i < 21; i++) {
      totalDist += calculateDistance(normalizedLive[i], tLandmarks[i]);
    }
    
    const avgDist = totalDist / 21;
    
    if (avgDist < minAvgDist) {
      minAvgDist = avgDist;
      bestMatch = template.name;
    }
  }

  if (minAvgDist < MATCH_THRESHOLD) {
    // Return a mock confidence score (0-100) where 0 dist is 100%
    const score = Math.max(0, (1 - (minAvgDist / MATCH_THRESHOLD))) * 100;
    return { name: bestMatch, score: score };
  }

  return { name: 'None', score: 0 };
}

// Main fallback function
export function detectCustomGestures(landmarks, savedTemplates = []) {
  if (!landmarks || landmarks.length === 0) return 'None';

  // 1. Try to match against User-Taught templates first
  if (savedTemplates.length > 0) {
    const normalized = normalizeLandmarks(landmarks);
    const match = findClosestGesture(normalized, savedTemplates);
    if (match.name !== 'None') {
      return match.name;
    }
  }

  // 2. Fallback to hardcoded heuristic gestures
  const thumbExt = isThumbExtended(landmarks);
  const indexExt = isFingerExtended(landmarks, 8, 6);
  const middleExt = isFingerExtended(landmarks, 12, 10);
  const ringExt = isFingerExtended(landmarks, 16, 14);
  const pinkyExt = isFingerExtended(landmarks, 20, 18);

  const pinchDist = calculateDistance(landmarks[4], landmarks[8]);
  const isPinching = pinchDist < 0.05;

  if (isPinching && middleExt && ringExt && pinkyExt) return 'OK_Sign';
  if (indexExt && pinkyExt && !middleExt && !ringExt && !thumbExt) return 'Rock_On';
  if (thumbExt && pinkyExt && !indexExt && !middleExt && !ringExt) return 'Call_Me';

  return 'None';
}
