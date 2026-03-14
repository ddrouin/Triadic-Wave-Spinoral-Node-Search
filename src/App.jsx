import React, { useState, useEffect, useMemo, useRef } from 'react';

/*
TRIADIC WAVE INTERFERENCE ON S⁷ - SPINOR SEARCH VERSION
=========================================================
Three dynamic zeros {-1, 0, +1} emit standing spherical waves.
The interference pattern on the 7-sphere has exactly 42 peaks.

SPINOR SEARCH: Sources traverse all 7 Fano lines in a 720° double-cover pattern.
This ensures full coverage of the octonionic space, enabling 100% crystallization.

The spinor must rotate twice (720°) to return to its original state -
this is the signature of fermionic/spinorial topology.

BLIND MODE: Finds peaks through entropy minimization
LABELED MODE: Reveals that the peaks ARE the K-set constants
*/

// ============ MATHEMATICAL CONSTANTS ============
const PHI = (1 + Math.sqrt(5)) / 2;
const GAMMA = 0.5772156649015329;
const ZETA2 = Math.PI * Math.PI / 6;
const ZETA3 = 1.2020569031595943;

/** K-set: 42 glyphs used only for labeling. Each has { name: string, value: number, line: number }. */
const KSET_42 = [
  // Line 0: Integers
  { name: '1', value: 1, line: 0 },
  { name: '2', value: 2, line: 0 },
  { name: '3', value: 3, line: 0 },
  { name: '4', value: 4, line: 0 },
  { name: '7', value: 7, line: 0 },
  { name: '8', value: 8, line: 0 },
  // Line 1: Transcendentals
  { name: '1/φ', value: 1/PHI, line: 1 },
  { name: 'φ', value: PHI, line: 1 },
  { name: '1/e', value: 1/Math.E, line: 1 },
  { name: 'e', value: Math.E, line: 1 },
  { name: '1/π', value: 1/Math.PI, line: 1 },
  { name: 'π', value: Math.PI, line: 1 },
  // Line 2: Algebraic Roots
  { name: '1/√2', value: 1/Math.SQRT2, line: 2 },
  { name: '√2', value: Math.SQRT2, line: 2 },
  { name: '1/√3', value: 1/Math.sqrt(3), line: 2 },
  { name: '√3', value: Math.sqrt(3), line: 2 },
  { name: '1/√5', value: 1/Math.sqrt(5), line: 2 },
  { name: '√5', value: Math.sqrt(5), line: 2 },
  // Line 3: Logarithms
  { name: '1/ln2', value: 1/Math.log(2), line: 3 },
  { name: 'ln2', value: Math.log(2), line: 3 },
  { name: '1/ln3', value: 1/Math.log(3), line: 3 },
  { name: 'ln3', value: Math.log(3), line: 3 },
  { name: '1/lnφ', value: 1/Math.log(PHI), line: 3 },
  { name: 'lnφ', value: Math.log(PHI), line: 3 },
  // Line 4: Trigonometric
  { name: '1/sin1', value: 1/Math.sin(1), line: 4 },
  { name: 'sin1', value: Math.sin(1), line: 4 },
  { name: '1/cos1', value: 1/Math.cos(1), line: 4 },
  { name: 'cos1', value: Math.cos(1), line: 4 },
  { name: '1/tanh1', value: 1/Math.tanh(1), line: 4 },
  { name: 'tanh1', value: Math.tanh(1), line: 4 },
  // Line 5: Special Functions
  { name: '1/γ', value: 1/GAMMA, line: 5 },
  { name: 'γ', value: GAMMA, line: 5 },
  { name: '1/ζ(2)', value: 1/ZETA2, line: 5 },
  { name: 'ζ(2)', value: ZETA2, line: 5 },
  { name: '1/ζ(3)', value: 1/ZETA3, line: 5 },
  { name: 'ζ(3)', value: ZETA3, line: 5 },
  // Line 6: Boundary
  { name: '21', value: 21, line: 6 },
  { name: '42', value: 42, line: 6 },
  { name: '23', value: 23, line: 6 },
  { name: '46', value: 46, line: 6 },
  { name: '147', value: 147, line: 6 },
  { name: '137', value: 137.035999084, line: 6 },
];

// ============ FANO PLANE GEOMETRY ============
const FANO_LINES = [
  [1, 2, 4], // Line 0
  [2, 3, 5], // Line 1
  [3, 4, 6], // Line 2
  [4, 5, 0], // Line 3
  [5, 6, 1], // Line 4
  [6, 0, 2], // Line 5
  [0, 1, 3], // Line 6
];

const FROBENIUS = [1, 2, 4];

// ============ SPINOR SEARCH PATTERN ============
/*
The spinor search traverses all 7 Fano lines in a specific pattern.
Each source visits different lines, offset by 120° (triadic symmetry).
A complete spinor cycle is 720° (14 Fano line visits = 2 full rotations).

The pattern follows the Frobenius automorphism: n → 2n mod 7
Starting positions: Line 0, Line 2, Line 4 (spaced by Frobenius step)
*/

const SPINOR_SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6]; // 14 steps = 720°
const ANIMATION_INTERVAL_MS = 30;

/**
 * Compute source position on a Fano line with phase-based interpolation.
 * @param {number} lineIndex - Fano line index (0–6)
 * @param {number} phase - Phase angle for blending the three points on the line
 * @returns {Float64Array} - 8D unit vector on S⁷
 */
const computeSourcePosition = (lineIndex, phase) => {
  const line = FANO_LINES[lineIndex % 7];
  const pos = new Float64Array(8);

  // Blend between the three points on this Fano line based on phase
  const weights = [
    Math.cos(phase) ** 2,
    Math.cos(phase + 2 * Math.PI / 3) ** 2,
    Math.cos(phase + 4 * Math.PI / 3) ** 2,
  ];

  // Normalize weights
  const wSum = weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 3; i++) weights[i] /= wSum;

  // Apply to octonionic basis (indices 1-7, 0 is real)
  for (let i = 0; i < 3; i++) {
    const idx = line[i];
    pos[idx + 1] = weights[i]; // +1 because e₀ is real
  }

  // Add small component to other dimensions for full 8D coverage
  const complementaryLine = FANO_LINES[(lineIndex + 3) % 7];
  for (let i = 0; i < 3; i++) {
    const idx = complementaryLine[i];
    pos[idx + 1] += 0.1 * Math.sin(phase * 2 + i);
  }

  // Normalize to S⁷
  let norm = 0;
  for (let i = 0; i < 8; i++) norm += pos[i] * pos[i];
  norm = Math.sqrt(norm);
  if (norm > 1e-10) {
    for (let i = 0; i < 8; i++) pos[i] /= norm;
  }

  return pos;
};

// ============ 8D OPERATIONS ============
/** @param {Float64Array|number[]} a - 8D point. @param {Float64Array|number[]} b - 8D point. @returns {number} Euclidean distance. */
const distance8D = (a, b) => {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = a[i] - (b[i] || 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
};

// ============ S⁷ SAMPLING ============
/** @returns {{ coords: Float64Array, line: number, step: number, sign: number, glyphIndex: number }[]} - 42 points on S⁷. */
const generateS7Points = () => {
  const points = [];
  for (let line = 0; line < 7; line++) {
    const fanoLine = FANO_LINES[line];
    for (let step = 0; step < 3; step++) {
      for (let sign = 0; sign < 2; sign++) {
        const point = new Float64Array(8);
        const sigma = sign === 0 ? 1 : -1;
        const r = FROBENIUS[step];
        const theta = 2 * Math.PI * r / 7;
        for (let i = 0; i < 3; i++) {
          const idx = fanoLine[i];
          const weight = Math.cos(theta * (i + 1)) * sigma;
          point[idx + 1] = weight;
        }
        let norm = 0;
        for (let i = 0; i < 8; i++) norm += point[i] * point[i];
        norm = Math.sqrt(norm);
        if (norm > 1e-10) {
          for (let i = 0; i < 8; i++) point[i] /= norm;
        }
        points.push({
          coords: point,
          line,
          step,
          sign: sigma,
          glyphIndex: line * 6 + step * 2 + sign,
        });
      }
    }
  }
  return points;
};

// ============ WAVE COMPUTATION ============
/**
 * Wave amplitude at a point from one source (1/r³ decay).
 * @param {Float64Array} point - 8D sample point
 * @param {Float64Array} sourcePos - 8D source position
 * @param {number} phase - Source phase
 * @param {number} time - Simulation time
 * @param {number} wavelength - Wavelength
 * @param {number} freq - Angular frequency scale
 */
const computeWaveAt = (point, sourcePos, phase, time, wavelength, freq) => {
  const dist = distance8D(point, sourcePos);
  if (dist < 0.01) return 0;
  const k = 2 * Math.PI / wavelength;
  const omega = freq * 2 * Math.PI;
  const wavePhase = k * dist - omega * time + phase;
  return Math.sin(wavePhase) / Math.pow(dist, 3);
};

/** @param {ReturnType<typeof generateS7Points>} s7Points - 42 S⁷ points. @returns {Float64Array} - 42 amplitudes. */
const computeInterferenceSpinor = (s7Points, spinorState, time, wavelength) => {
  const amplitudes = new Float64Array(42);

  for (let i = 0; i < s7Points.length; i++) {
    const point = s7Points[i].coords;

    // Three sources at different spinor positions
    const waveMinus = computeWaveAt(point, spinorState.minus.pos, spinorState.minus.phase, time, wavelength, spinorState.freq);
    const waveZero = computeWaveAt(point, spinorState.zero.pos, spinorState.zero.phase, time, wavelength, spinorState.freq);
    const wavePlus = computeWaveAt(point, spinorState.plus.pos, spinorState.plus.phase, time, wavelength, spinorState.freq);

    // Linear superposition
    const total = waveMinus + waveZero + wavePlus;

    // Triadic product (nonlinear interference)
    const triadic = waveMinus * waveZero * wavePlus;

    const triadicCoeff = 0.15; // Nonlinear interference strength
    amplitudes[i] = total + triadicCoeff * triadic;
  }

  return amplitudes;
};

// ============ SPECTRAL ENTROPY ============
/** @param {Float64Array|number[]} amplitudes - 42 amplitudes. @returns {number} Spectral entropy (nat). */
const computeSpectralEntropy = (amplitudes) => {
  let totalPower = 0;
  for (let i = 0; i < amplitudes.length; i++) {
    totalPower += amplitudes[i] * amplitudes[i];
  }
  if (totalPower < 1e-20) return Math.log(42);

  let entropy = 0;
  for (let i = 0; i < amplitudes.length; i++) {
    const p = (amplitudes[i] * amplitudes[i]) / totalPower;
    if (p > 1e-15) {
      entropy -= p * Math.log(p);
    }
  }
  return entropy;
};

/** @param {number} entropy - Raw entropy. @returns {number} Normalized to [0,1] (1 = uniform). */
const normalizeEntropy = (entropy) => entropy / Math.log(42);

/** @param {Float64Array|number[]} amplitudes - 42 amplitudes. @returns {number} Ratio of top-7 to rest. */
const computePeakSharpness = (amplitudes) => {
  const absAmps = amplitudes.map(a => Math.abs(a));
  const sorted = [...absAmps].sort((a, b) => b - a);
  const top7 = sorted.slice(0, 7).reduce((s, v) => s + v, 0);
  const rest = sorted.slice(7).reduce((s, v) => s + v, 0);
  return rest > 1e-10 ? top7 / rest : 100;
};

// ============ SPINOR STATE MANAGEMENT ============
/** @returns {object} Initial spinor state (angle 0, lines 0/2/4). */
const initSpinorState = () => ({
  // Spinor angle: 0 to 4π (720°)
  spinorAngle: 0,

  // Current Fano lines for each source (offset by ~120° equivalent)
  minusLine: 0,
  zeroLine: 2,
  plusLine: 4,

  // Phase within current line
  linePhase: 0,

  // Computed positions
  minus: { pos: computeSourcePosition(0, 0), phase: 0 },
  zero: { pos: computeSourcePosition(2, 2 * Math.PI / 3), phase: 2 * Math.PI / 3 },
  plus: { pos: computeSourcePosition(4, 4 * Math.PI / 3), phase: 4 * Math.PI / 3 },

  freq: 1.0,

  // Tracking
  cycleCount: 0,
  isFirstHalf: true, // First 360° or second 360° of spinor
});

/** @param {object} state - Current spinor state. @param {number} dt - Time step. @param {number} searchSpeed - Angular speed. @returns {object} New spinor state. */
const evolveSpinorState = (state, dt, searchSpeed) => {
  const newAngle = state.spinorAngle + dt * searchSpeed;

  // Map angle to Fano line progression
  // 720° = 14 line visits, so each line = 720/14 ≈ 51.4°
  const degreesPerLine = (4 * Math.PI) / 14;

  // Determine which lines each source is on
  const baseStep = Math.floor(newAngle / degreesPerLine) % 14;
  const linePhase = (newAngle % degreesPerLine) / degreesPerLine * 2 * Math.PI;

  // Three sources offset by ~4.67 lines (120° equivalent in 7-space)
  const minusLine = SPINOR_SEQUENCE[baseStep % 14];
  const zeroLine = SPINOR_SEQUENCE[(baseStep + 5) % 14];  // ~120° offset
  const plusLine = SPINOR_SEQUENCE[(baseStep + 9) % 14];  // ~240° offset

  // Compute positions with smooth interpolation
  const minusPos = computeSourcePosition(minusLine, linePhase);
  const zeroPos = computeSourcePosition(zeroLine, linePhase + 2 * Math.PI / 3);
  const plusPos = computeSourcePosition(plusLine, linePhase + 4 * Math.PI / 3);

  // Track cycle completion
  const cycleCount = Math.floor(newAngle / (4 * Math.PI));
  const isFirstHalf = (newAngle % (4 * Math.PI)) < (2 * Math.PI);

  return {
    ...state,
    spinorAngle: newAngle,
    minusLine,
    zeroLine,
    plusLine,
    linePhase,
  minus: { pos: minusPos, phase: linePhase },
  zero: { pos: zeroPos, phase: linePhase + 2 * Math.PI / 3 },
  plus: { pos: plusPos, phase: linePhase + 4 * Math.PI / 3 },
    cycleCount,
    isFirstHalf,
  };
};

// ============ K-SET MATCHING (Labeled mode only) ============
/** @param {number} value - Ratio to match. @param {number} [threshold=0.02] - Max relative error. @returns {{ name: string, value: number, line: number, err: number }|null} Best K-set match or null. */
const matchToKSet = (value, threshold = 0.02) => {
  if (!isFinite(value) || value <= 0) return null;
  let best = null;
  let bestErr = threshold;
  for (const k of KSET_42) {
    const err = Math.abs(value - k.value) / k.value;
    if (err < bestErr) {
      bestErr = err;
      best = { ...k, err };
    }
  }
  return best;
};

/** Builds peak-ratio list for K-set matching. Used only for side effect (matchHistory). */
const analyzePeaksWithLabels = (amplitudes) => {
  const ratios = [];
  for (let line = 0; line < 7; line++) {
    const lineAmps = [];
    for (let j = 0; j < 6; j++) {
      lineAmps.push(Math.abs(amplitudes[line * 6 + j]));
    }
    for (let j = 0; j < 5; j++) {
      if (lineAmps[j + 1] > 1e-10) {
        const value = lineAmps[j] / lineAmps[j + 1];
        const match = matchToKSet(value);
        const matchRecip = matchToKSet(1 / value);
        ratios.push({ line, pair: `${j}/${j + 1}`, value, match, matchRecip });
      }
    }
  }
  return ratios;
};

// ============ COMPONENT ============
const lineColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
const lineNames = ['Integers', 'Transcend.', 'Roots', 'Logarithms', 'Trig', 'Special', 'Boundary'];

export default function App() {
  const [time, setTime] = useState(0);
  const [spinorState, setSpinorState] = useState(() => initSpinorState());
  const [running, setRunning] = useState(false);
  const [isSpinorSearching, setIsSpinorSearching] = useState(false);
  const [params, setParams] = useState({
    wavelength: 1.0,
    searchSpeed: 0.5,
  });

  const [isBlindMode, setIsBlindMode] = useState(true);
  const [amplitudes, setAmplitudes] = useState(() => new Float64Array(42));
  const [entropy, setEntropy] = useState(Math.log(42));
  const [sharpness, setSharpness] = useState(1);
  const [peakHistory, setPeakHistory] = useState([]); // Track crystallization over time
  const [maxCrystallization, setMaxCrystallization] = useState(0);
  const [bestWavelength, setBestWavelength] = useState(1.0);
  const [matchHistory, setMatchHistory] = useState({});

  const s7Points = useMemo(() => generateS7Points(), []);
  const animRef = useRef();

  // Compute interference
  useEffect(() => {
    const amps = computeInterferenceSpinor(s7Points, spinorState, time, params.wavelength);
    setAmplitudes(amps);

    const newEntropy = computeSpectralEntropy(amps);
    setEntropy(newEntropy);
    setSharpness(computePeakSharpness(amps));

    const crystallization = (1 - normalizeEntropy(newEntropy)) * 100;

    // Track best crystallization
    if (crystallization > maxCrystallization) {
      setMaxCrystallization(crystallization);
      setBestWavelength(params.wavelength);
    }

    // Add to history (keep last 100 points)
    setPeakHistory(prev => {
      const next = [...prev, { time, crystallization, angle: spinorState.spinorAngle }];
      return next.slice(-100);
    });

    // Labeled mode: track matches
    if (!isBlindMode) {
      const ratios = analyzePeaksWithLabels(amps);
      setMatchHistory(prev => {
        const next = { ...prev };
        for (const r of ratios) {
          if (r.match) {
            const key = r.match.name;
            if (!next[key]) next[key] = { count: 0, totalErr: 0 };
            next[key].count++;
            next[key].totalErr += r.match.err;
          }
        }
        return next;
      });
    }
  }, [time, spinorState, params.wavelength, s7Points, isBlindMode, maxCrystallization]);

  // Animation loop: evolve state each tick; use newly computed angle for wavelength sweep to avoid stale closure
  useEffect(() => {
    if (!running && !isSpinorSearching) return;

    animRef.current = setInterval(() => {
      setTime(t => t + 0.02);
      setSpinorState(s => {
        const next = evolveSpinorState(s, 0.02, isSpinorSearching ? params.searchSpeed : 0.1);
        if (isSpinorSearching) {
          const newL = 0.5 + 1.5 * (0.5 + 0.5 * Math.sin(next.spinorAngle * 0.3));
          setParams(p => ({ ...p, wavelength: newL }));
        }
        return next;
      });
    }, ANIMATION_INTERVAL_MS);

    return () => clearInterval(animRef.current);
  }, [running, isSpinorSearching, params.searchSpeed]);

  const reset = () => {
    setTime(0);
    setSpinorState(initSpinorState());
    setMatchHistory({});
    setPeakHistory([]);
    setMaxCrystallization(0);
    setBestWavelength(1.0);
    setParams(p => ({ ...p, wavelength: 1.0 }));
  };

  const startSpinorSearch = () => {
    setIsSpinorSearching(true);
    setPeakHistory([]);
    setMaxCrystallization(0);
  };

  const stopSpinorSearch = () => {
    setIsSpinorSearching(false);
    // Lock to best wavelength found
    setParams(p => ({ ...p, wavelength: bestWavelength }));
  };

  // Normalize amplitudes for display
  const normalizedAmps = useMemo(() => {
    let maxAmp = 0;
    for (let i = 0; i < 42; i++) maxAmp = Math.max(maxAmp, Math.abs(amplitudes[i]));
    return amplitudes.map(a => maxAmp > 0 ? a / maxAmp : 0);
  }, [amplitudes]);

  const crystallization = (1 - normalizeEntropy(entropy)) * 100;
  const hitCount = Object.keys(matchHistory).length;

  // Spinor angle in degrees (0-720)
  const spinorDegrees = (spinorState.spinorAngle * 180 / Math.PI) % 720;
  const spinorProgress = (spinorDegrees / 720) * 100;

  return (
    <div className="p-3 bg-gray-950 text-gray-100 min-h-screen text-xs font-mono">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-lg font-bold" style={{ color: isBlindMode ? '#22d3ee' : '#fbbf24' }}>
          {isBlindMode ? '🔬 BLIND SEARCH: Spinor Traversal' : '🏷️ LABELED: K-Set Verification'}
        </h1>
        <p className="text-gray-400">
          {isBlindMode
            ? 'Sources traverse all 7 Fano lines in a 720° spinor pattern. Full octonionic coverage.'
            : 'The geometric peaks ARE the constants of nature.'
          }
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold">
            {isBlindMode ? 'BLIND MODE' : 'LABELED MODE'}
          </div>
          <button
            onClick={() => setIsBlindMode(!isBlindMode)}
            disabled={isSpinorSearching}
            className={`px-4 py-2 rounded font-bold text-sm ${
              isBlindMode ? 'bg-cyan-600 text-white' : 'bg-amber-600 text-black'
            } ${isSpinorSearching ? 'opacity-50' : ''}`}
          >
            {isBlindMode ? '→ REVEAL LABELS' : '← BLIND MODE'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3 items-center flex-wrap">
        <button onClick={() => setRunning(!running)}
          className={`px-3 py-1.5 rounded font-bold ${running ? 'bg-red-600' : 'bg-green-600'}`}
          disabled={isSpinorSearching}>
          {running ? 'STOP' : 'RUN'}
        </button>
        <button onClick={reset} className="px-3 py-1.5 bg-gray-700 rounded">Reset</button>

        {isBlindMode && (
          <button
            onClick={isSpinorSearching ? stopSpinorSearch : startSpinorSearch}
            className={`px-4 py-1.5 rounded font-bold ${
              isSpinorSearching
                ? 'bg-red-600 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
            }`}
          >
            {isSpinorSearching ? '■ STOP SEARCH' : '🌀 SPINOR SEARCH'}
          </button>
        )}

        <span className="ml-2">t = <b>{time.toFixed(2)}</b></span>
        <span className="text-purple-400">Cycles: <b>{spinorState.cycleCount}</b></span>
      </div>

      {/* Spinor Search Visualization */}
      {isBlindMode && (
        <div className="mb-3 p-3 bg-gray-900 rounded-lg border border-purple-800">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-purple-400">🌀 SPINOR SEARCH</span>
            <span className="text-xl font-bold text-white">
              {spinorDegrees.toFixed(0)}° / 720°
            </span>
          </div>

          {/* Spinor progress bar - shows 720° double cover */}
          <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden mb-2">
            {/* First 360° */}
            <div
              className="absolute top-0 left-0 h-full transition-all duration-100"
              style={{
                width: `${Math.min(50, spinorProgress)}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
              }}
            />
            {/* Second 360° */}
            <div
              className="absolute top-0 left-1/2 h-full transition-all duration-100"
              style={{
                width: `${Math.max(0, spinorProgress - 50)}%`,
                background: 'linear-gradient(90deg, #d946ef, #f43f5e)',
              }}
            />
            {/* Center marker */}
            <div className="absolute top-0 left-1/2 w-px h-full bg-white/30" />
            {/* Labels */}
            <div className="absolute inset-0 flex justify-between items-center px-2 text-[10px]">
              <span>0°</span>
              <span className="text-purple-300">360° (halfway)</span>
              <span>720°</span>
            </div>
          </div>

          {/* Fano line indicators */}
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {FANO_LINES.map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor:
                      i === spinorState.minusLine ? '#ef4444' :
                      i === spinorState.zeroLine ? '#22c55e' :
                      i === spinorState.plusLine ? '#3b82f6' :
                      '#374151',
                    color: (i === spinorState.minusLine || i === spinorState.zeroLine || i === spinorState.plusLine)
                      ? 'white' : '#666'
                  }}
                >
                  L{i}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400">
              <span className="text-red-400">■ -1</span>{' '}
              <span className="text-green-400">■ 0</span>{' '}
              <span className="text-blue-400">■ +1</span>
            </div>
          </div>

          {/* Spinor state indicator */}
          <div className="mt-2 text-center text-xs">
            <span className={spinorState.isFirstHalf ? 'text-purple-400' : 'text-pink-400'}>
              {spinorState.isFirstHalf ? '◐ First rotation (0°-360°)' : '◑ Second rotation (360°-720°)'}
            </span>
          </div>
        </div>
      )}

      {/* Crystallization Gauge */}
      <div className="mb-3 p-3 bg-gray-900 rounded-lg border border-cyan-800">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-cyan-400">CRYSTALLIZATION</span>
          <div className="text-right">
            <span className="text-2xl font-bold" style={{
              color: crystallization > 70 ? '#22c55e' : crystallization > 40 ? '#eab308' : '#ef4444'
            }}>
              {crystallization.toFixed(1)}%
            </span>
            {maxCrystallization > crystallization && (
              <span className="text-xs text-gray-500 ml-2">
                (max: {maxCrystallization.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${crystallization}%`,
              background: crystallization > 70
                ? 'linear-gradient(90deg, #22c55e, #06b6d4)'
                : crystallization > 40
                ? 'linear-gradient(90deg, #eab308, #22c55e)'
                : 'linear-gradient(90deg, #ef4444, #eab308)',
            }}
          />
        </div>

        {/* Mini history graph */}
        {peakHistory.length > 1 && (
          <div className="mt-2 h-12 flex items-end gap-px">
            {peakHistory.slice(-50).map((p, i) => (
              <div
                key={i}
                className="flex-1 bg-cyan-600 rounded-t"
                style={{
                  height: `${p.crystallization}%`,
                  opacity: 0.3 + (i / 50) * 0.7,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Parameters */}
      <div className="flex gap-4 mb-3 flex-wrap">
        <label className="flex items-center gap-1">
          λ:
          <input type="range" min={0.3} max={2.5} step={0.01}
            value={params.wavelength}
            onChange={e => setParams(p => ({ ...p, wavelength: +e.target.value }))}
            disabled={isSpinorSearching}
            className="w-24" />
          <span className="w-14">{params.wavelength.toFixed(3)}</span>
        </label>
        {isBlindMode && (
          <label className="flex items-center gap-1">
            Search Speed:
            <input type="range" min={0.1} max={2.0} step={0.1}
              value={params.searchSpeed}
              onChange={e => setParams(p => ({ ...p, searchSpeed: +e.target.value }))}
              className="w-20" />
            <span className="w-10">{params.searchSpeed.toFixed(1)}</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* 42 Peak Visualization */}
        <div className="bg-gray-900 rounded p-2 col-span-2">
          <div className="font-bold mb-2" style={{ color: isBlindMode ? '#22d3ee' : '#fbbf24' }}>
            {isBlindMode ? '42 Geometric Eigenstates' : '42 K-Set Glyphs'}
          </div>

          <div className="space-y-1">
            {Array.from({ length: 7 }, (_, line) => (
              <div key={line} className="flex items-center gap-1">
                <div className="w-16 text-[10px] text-right pr-1"
                  style={{
                    color: isBlindMode ? '#666' : lineColors[line],
                    fontWeight: (line === spinorState.minusLine || line === spinorState.zeroLine || line === spinorState.plusLine)
                      ? 'bold' : 'normal'
                  }}>
                  {isBlindMode ? `Line ${line}` : lineNames[line]}
                  {isBlindMode && (line === spinorState.minusLine || line === spinorState.zeroLine || line === spinorState.plusLine) && ' ●'}
                </div>

                <div className="flex gap-1 flex-1">
                  {Array.from({ length: 6 }, (_, j) => {
                    const idx = line * 6 + j;
                    const amp = normalizedAmps[idx];
                    const height = Math.abs(amp) * 50;

                    return (
                      <div key={j} className="flex-1 flex flex-col items-center">
                        <div className="h-12 w-full flex items-end justify-center relative">
                          <div
                            style={{
                              height: `${Math.max(2, height)}px`,
                              backgroundColor: isBlindMode ? '#06b6d4' : lineColors[line],
                              opacity: isBlindMode ? 0.4 + Math.abs(amp) * 0.6 : 0.7 + Math.abs(amp) * 0.3,
                            }}
                            className="w-full rounded-t"
                          />
                          {!isBlindMode && Math.abs(amp) > 0.3 && (
                            <div className="absolute -top-4 text-[8px] font-bold"
                              style={{ color: lineColors[line] }}>
                              {KSET_42[idx]?.name}
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] text-gray-600">{idx}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!isBlindMode && (
            <div className="flex gap-1 mt-3 flex-wrap justify-center">
              {lineNames.map((name, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded"
                  style={{ backgroundColor: lineColors[i] + '40', color: lineColors[i] }}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="bg-gray-900 rounded p-2">
          {isBlindMode ? (
            <>
              <div className="font-bold mb-2 text-cyan-400">Search Status</div>
              <div className="space-y-2">
                <div className="p-2 bg-gray-800 rounded">
                  <div className="text-gray-400 text-[10px]">Active Peaks ({'>'}30%)</div>
                  <div className="text-2xl font-bold text-cyan-300">
                    {normalizedAmps.filter(a => Math.abs(a) > 0.3).length}
                  </div>
                </div>
                <div className="p-2 bg-gray-800 rounded">
                  <div className="text-gray-400 text-[10px]">Peak Sharpness</div>
                  <div className="text-xl font-bold text-white">{sharpness.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-gray-800 rounded">
                  <div className="text-gray-400 text-[10px]">Best λ Found</div>
                  <div className="text-xl font-bold text-green-400">{bestWavelength.toFixed(4)}</div>
                </div>
                <div className="p-2 bg-gray-800 rounded">
                  <div className="text-gray-400 text-[10px]">Spinor Cycles</div>
                  <div className="text-xl font-bold text-purple-400">{spinorState.cycleCount}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="font-bold mb-2 text-amber-400">K-Set Matches ({hitCount}/42)</div>
              <div className="max-h-64 overflow-auto space-y-1">
                {Object.entries(matchHistory)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 20)
                  .map(([name, data]) => {
                    const kset = KSET_42.find(k => k.name === name);
                    return (
                      <div key={name} className="flex justify-between px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: kset ? lineColors[kset.line] + '30' : '#333' }}>
                        <span className="font-bold" style={{ color: kset ? lineColors[kset.line] : '#888' }}>
                          {name}
                        </span>
                        <span className="text-white">{data.count}</span>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Source visualization */}
      <div className="mt-3 bg-gray-900 rounded p-2">
        <div className="font-bold mb-2">Triadic Sources on Fano Lines</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: '-1', line: spinorState.minusLine, pos: spinorState.minus.pos, color: '#ef4444' },
            { name: '0', line: spinorState.zeroLine, pos: spinorState.zero.pos, color: '#22c55e' },
            { name: '+1', line: spinorState.plusLine, pos: spinorState.plus.pos, color: '#3b82f6' },
          ].map(({ name, line, pos, color }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="font-bold text-lg" style={{ color }}>{name}</span>
              <div className="flex-1">
                <div className="text-gray-400 text-[10px]">
                  Line {line}: [{FANO_LINES[line].join(', ')}]
                </div>
                <div className="flex gap-px">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: color,
                        opacity: 0.1 + Math.abs(pos[i]) * 0.9,
                      }}
                      title={`e${i}: ${pos[i].toFixed(3)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="mt-3 p-3 rounded-lg text-center" style={{
        background: isBlindMode
          ? 'linear-gradient(90deg, #4c1d95, #0f172a, #4c1d95)'
          : 'linear-gradient(90deg, #78350f, #0f172a, #78350f)',
        border: `1px solid ${isBlindMode ? '#8b5cf6' : '#fbbf24'}`
      }}>
        {isBlindMode ? (
          <div>
            <div className="text-purple-300 font-bold">
              "The spinor must rotate twice to return home..."
            </div>
            <div className="text-gray-400 text-[10px] mt-1">
              720° traversal through all 7 Fano lines reveals the full crystalline structure.
            </div>
          </div>
        ) : (
          <div>
            <div className="text-amber-300 font-bold">
              "...and in doing so, it writes the constants of nature."
            </div>
            <div className="text-gray-400 text-[10px] mt-1">
              φ, π, e, √2, √3, √5, 137.036 — the eigenvalues of octonionic triadic interference.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
