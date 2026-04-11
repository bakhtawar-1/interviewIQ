/**
 * Derives communication & confidence scores from camera + voice signals
 * collected during the video interview (no raw frames stored).
 */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(Math.max(0, v));
}

function countViolations(log, needle) {
  if (!Array.isArray(log)) return 0;
  return log.filter((line) => String(line).includes(needle)).length;
}

/**
 * @param {object} opts
 * @param {{ totalRatio: number, centerRatio: number, centerLumaStd: number }[]} opts.faceFrames
 * @param {{ meanRms: number, rmsStd: number, sampleCount: number }[]} opts.voiceSegments
 * @param {string[]} opts.violations - proctoring log lines
 * @param {number} opts.overallScore - answer-content average (0–100)
 */
export function finalizeSessionBehavior({ faceFrames = [], voiceSegments = [], violations = [], overallScore = 0 }) {
  const overall = clamp(Number(overallScore) || 0, 0, 100);

  const centers = faceFrames.map((f) => f.centerRatio).filter((x) => typeof x === 'number');
  const totals = faceFrames.map((f) => f.totalRatio).filter((x) => typeof x === 'number');
  const exprStds = faceFrames.map((f) => f.centerLumaStd).filter((x) => typeof x === 'number');

  const avgCenter = centers.length ? mean(centers) : 0.04;
  /** Forward attention toward camera (skin-in-center heuristic). */
  const attention = clamp(avgCenter * 420, 35, 100);

  /** Micro-movement / expressiveness in face ROI (luminance variation). */
  const avgExprStd = exprStds.length ? mean(exprStds) : 12;
  const expressiveness = clamp(38 + (avgExprStd - 10) * 2.2, 32, 100);

  /** Voice amplitude stability while speaking (lower CV = steadier). */
  let voiceSteadiness = 68;
  if (voiceSegments.length) {
    const cvs = voiceSegments
      .map((s) => {
        const m = Number(s.meanRms) || 0;
        const sd = Number(s.rmsStd) || 0;
        if (m < 0.004) return null;
        return sd / m;
      })
      .filter((x) => x != null);
    if (cvs.length) {
      const meanCv = mean(cvs);
      voiceSteadiness = clamp(100 - meanCv * 95, 38, 100);
    }
  }

  const eyeOff = countViolations(violations, 'Eyes off');
  const noFace = countViolations(violations, 'Face not visible');
  const tab = countViolations(violations, 'Tab switch');
  const phone = countViolations(violations, 'Phone detected');
  const violPenalty = eyeOff * 3.2 + noFace * 2.8 + tab * 4 + phone * 3;

  const facePresenceJitter = totals.length >= 3 ? stdDev(totals) : 0;
  const presencePenalty = clamp(facePresenceJitter * 140, 0, 12);

  const technical_score = overall;

  const communication_score = clamp(
    Math.round(
      0.36 * overall +
        0.26 * attention +
        0.2 * expressiveness +
        0.18 * voiceSteadiness -
        violPenalty -
        presencePenalty * 0.35
    ),
    0,
    100
  );

  const confidence_score = clamp(
    Math.round(
      0.44 * overall +
        0.28 * attention +
        0.23 * voiceSteadiness -
        violPenalty * 1.1 -
        presencePenalty * 0.5
    ),
    0,
    100
  );

  return {
    version: 2,
    technical_score,
    communication_score,
    confidence_score,
    signals: {
      face_sample_count: faceFrames.length,
      voice_segment_count: voiceSegments.length,
      attention_index: Math.round(attention),
      expressiveness_index: Math.round(expressiveness),
      voice_steadiness_index: Math.round(voiceSteadiness),
      violation_eyes_off: eyeOff,
      violation_no_face: noFace,
      violation_tab: tab,
      violation_phone: phone,
      face_presence_jitter: Math.round(facePresenceJitter * 1000) / 1000,
      notes:
        'Scores blend answer quality with camera attention, facial expressiveness in the face region, ' +
        'mic stability while speaking, and proctoring penalties. Not a clinical assessment.',
    },
  };
}
