import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const RESULTS_PATH = path.join(DATA_DIR, 'results.json');
const GEO_PATH = path.join(DATA_DIR, 'brazil-states.json');
const RESULTS_URL = 'https://www.poliwave.com/br/live/presidente-2026';
const GEO_URL = 'https://cdn.jsdelivr.net/gh/codeforamerica/click_that_hood@master/public/data/brazil-states.geojson';

function extractObjectAt(source, markerIndex) {
  const start = source.indexOf('{', markerIndex);
  if (start < 0) throw new Error('Missing object after marker');
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error('Unclosed object after marker');
}

function parseLiteral(literal) {
  const json = literal
    .replace(/([{,])\s*([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/([:\[,])\.(\d)/g, (_, prefix, digit) => `${prefix}0.${digit}`)
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(json);
}

function findObject(source, marker, validate) {
  let cursor = 0;
  while (cursor < source.length) {
    const markerIndex = source.indexOf(marker, cursor);
    if (markerIndex < 0) break;
    try {
      const parsed = parseLiteral(extractObjectAt(source, markerIndex));
      if (validate(parsed)) return parsed;
    } catch {
      // The page can repeat partial component payloads. Keep looking for the full object.
    }
    cursor = markerIndex + marker.length;
  }
  throw new Error(`Could not find a valid ${marker.replace(':', '')} payload`);
}

function assertFinite(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${label}: ${value}`);
  return value;
}

function sqDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function sqSegmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyOpen(points, tolerance) {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;
  const markers = new Uint8Array(points.length);
  const stack = [[0, points.length - 1]];
  markers[0] = 1;
  markers[points.length - 1] = 1;
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDistance = 0;
    let index = -1;
    for (let cursor = first + 1; cursor < last; cursor += 1) {
      const distance = sqSegmentDistance(points[cursor], points[first], points[last]);
      if (distance > maxDistance) {
        index = cursor;
        maxDistance = distance;
      }
    }
    if (index >= 0 && maxDistance > sqTolerance) {
      markers[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, index) => markers[index]);
}

function simplifyRing(ring, tolerance) {
  let points = ring;
  if (sqDistance(points[0], points.at(-1)) < 1e-16) points = points.slice(0, -1);
  if (points.length < 8) return [...points, points[0]];
  let left = 0;
  let right = 0;
  for (let index = 1; index < points.length; index += 1) {
    if (points[index][0] < points[left][0]) left = index;
    if (points[index][0] > points[right][0]) right = index;
  }
  if (left > right) [left, right] = [right, left];
  const firstArc = points.slice(left, right + 1);
  const secondArc = points.slice(right).concat(points.slice(0, left + 1));
  const simplified = simplifyOpen(firstArc, tolerance).concat(simplifyOpen(secondArc, tolerance).slice(1, -1));
  if (simplified.length < 3) return [...points, points[0]];
  simplified.push(simplified[0]);
  return simplified;
}

function roundPoint(point) {
  return [Number(point[0].toFixed(3)), Number(point[1].toFixed(3))];
}

function simplifyGeometry(geometry) {
  const polygon = coordinates => coordinates.map(ring => simplifyRing(ring, .035).map(roundPoint));
  return geometry.type === 'Polygon'
    ? { type: 'Polygon', coordinates: polygon(geometry.coordinates) }
    : { type: 'MultiPolygon', coordinates: geometry.coordinates.map(polygon) };
}

async function ensureGeometry() {
  try {
    await fs.access(GEO_PATH);
    return;
  } catch {
    // First run only.
  }
  const response = await fetch(GEO_URL);
  if (!response.ok) throw new Error(`Geometry request failed: ${response.status}`);
  const raw = await response.json();
  const simplified = {
    type: 'FeatureCollection',
    features: raw.features.map(feature => ({
      type: 'Feature',
      properties: { sigla: feature.properties.sigla, name: feature.properties.name },
      geometry: simplifyGeometry(feature.geometry)
    }))
  };
  await fs.writeFile(GEO_PATH, JSON.stringify(simplified) + '\n');
}

const response = await fetch(`${RESULTS_URL}?update=${Date.now()}`, {
  headers: { 'cache-control': 'no-cache', 'user-agent': 'brazil-election-live/1.0' }
});
if (!response.ok) throw new Error(`Results request failed: ${response.status}`);
const page = await response.text();
const firstRound = findObject(page, 'firstRound:', value => value?.round === 1 && value?.national && value?.regions);
const latest = findObject(page, 'latest:', value => value?.slug === 'presidente-2026' && value?.national && value?.regions);

await fs.mkdir(DATA_DIR, { recursive: true });
await ensureGeometry();
const geometry = JSON.parse(await fs.readFile(GEO_PATH, 'utf8'));
const nameByCode = Object.fromEntries(geometry.features.map(feature => [feature.properties.sigla.toLowerCase(), feature.properties.name]));
nameByCode.df = 'Distrito Federal';
nameByCode.zz = 'Overseas';

const regionCodes = {
  North: ['ac', 'am', 'ap', 'pa', 'ro', 'rr', 'to'],
  Northeast: ['al', 'ba', 'ce', 'ma', 'pb', 'pe', 'pi', 'rn', 'se'],
  Southeast: ['es', 'mg', 'rj', 'sp'],
  South: ['pr', 'rs', 'sc'],
  'Center-West': ['df', 'go', 'ms', 'mt'],
  Overseas: ['zz']
};

const states = Object.keys(firstRound.regions).map(code => {
  const previous = firstRound.regions[code];
  const current = latest.regions[code] || { counted: 0, valid: 0, votes: { 13: 0, 22: 0 }, polls: { reported: 0, total: previous.polls?.total || 0 } };
  const firstL = assertFinite(Number(previous.votes?.['13'] || 0), `${code} first-round Lula vote`);
  const firstF = assertFinite(Number(previous.votes?.['22'] || 0), `${code} first-round Flávio vote`);
  const firstTwoWay = firstL + firstF;
  const baselineL = firstTwoWay ? firstL / firstTwoWay : .5;
  const baselineF = 1 - baselineL;
  const currentValid = assertFinite(Number(current.valid || 0), `${code} current valid vote`);
  const expectedValid = Math.max(assertFinite(Number(previous.valid || 0), `${code} expected valid vote`), currentValid);
  const remaining = Math.max(0, expectedValid - currentValid);
  const currentL = assertFinite(Number(current.votes?.['13'] || 0), `${code} Lula vote`);
  const currentF = assertFinite(Number(current.votes?.['22'] || 0), `${code} Flávio vote`);
  const projectedL = currentL + remaining * baselineL;
  const projectedF = currentF + remaining * baselineF;
  return {
    code,
    abbr: code === 'zz' ? 'EXT' : code.toUpperCase(),
    name: nameByCode[code] || code.toUpperCase(),
    countedPct: assertFinite(Number(current.counted || 0), `${code} count percent`),
    reported: assertFinite(Number(current.polls?.reported || 0), `${code} stations reported`),
    totalPolls: assertFinite(Number(current.polls?.total || previous.polls?.total || 0), `${code} total stations`),
    currentValid,
    currentL,
    currentF,
    expectedValid,
    remaining,
    remainingL: remaining * baselineL,
    remainingF: remaining * baselineF,
    baselineL,
    baselineF,
    projectedL,
    projectedF,
    projectedLeader: projectedL >= projectedF ? 'Lula' : 'Flávio',
    projectedMargin: expectedValid ? Math.abs(projectedL - projectedF) / expectedValid : 0
  };
});

const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
const expectedValid = sum(states, 'expectedValid');
const currentL = assertFinite(Number(latest.national.votes?.['13'] || 0), 'national Lula vote');
const currentF = assertFinite(Number(latest.national.votes?.['22'] || 0), 'national Flávio vote');
const currentValid = assertFinite(Number(latest.national.valid || currentL + currentF), 'national valid vote');
const countedPct = assertFinite(Number(latest.national.counted || 0), 'national count percent');
const reported = assertFinite(Number(latest.national.polls?.reported || 0), 'national stations reported');
const totalPolls = assertFinite(Number(latest.national.polls?.total || 0), 'national total stations');
const projectedL = sum(states, 'projectedL');
const projectedF = sum(states, 'projectedF');
const majority = Math.floor(expectedValid / 2) + 1;
const final = countedPct >= 99.999 || (totalPolls > 0 && reported >= totalPolls);

const regions = Object.entries(regionCodes).map(([name, codes]) => {
  const rows = states.filter(row => codes.includes(row.code));
  const remainingL = sum(rows, 'remainingL');
  const remainingF = sum(rows, 'remainingF');
  return { name, remaining: remainingL + remainingF, remainingL, remainingF };
}).sort((a, b) => b.remaining - a.remaining);

const topRemaining = states
  .filter(row => row.code !== 'zz')
  .sort((a, b) => b.remaining - a.remaining)
  .slice(0, 7)
  .map(row => ({ code: row.code, name: row.name, remaining: row.remaining, projectedLeader: row.projectedLeader }));

const output = {
  meta: {
    election: 'Brazil presidential election',
    round: 2,
    sourceLabel: 'TSE results via Poliwave public tracker',
    sourceUrl: RESULTS_URL,
    sourceTime: latest.sourceTime,
    final
  },
  national: {
    countedPct,
    reported,
    totalPolls,
    currentValid,
    currentL,
    currentF,
    expectedValid,
    projectedL,
    projectedF,
    majority
  },
  states,
  regions,
  topRemaining
};

if (!output.meta.sourceTime || !Number.isFinite(new Date(output.meta.sourceTime).getTime())) {
  throw new Error('The results payload did not contain a valid source timestamp');
}

let prior = null;
try {
  prior = JSON.parse(await fs.readFile(RESULTS_PATH, 'utf8'));
} catch {
  // First result snapshot.
}

const unchanged = prior && prior.meta?.sourceTime === output.meta.sourceTime && prior.meta?.final === output.meta.final;
if (!unchanged) await fs.writeFile(RESULTS_PATH, JSON.stringify(output, null, 2) + '\n');

console.log(JSON.stringify({
  changed: !unchanged,
  sourceTime: output.meta.sourceTime,
  countedPct,
  final,
  leader: currentL >= currentF ? 'Lula' : 'Flávio'
}));
