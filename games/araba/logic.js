// Araba Yarışı — pure game rules. step() advances the world by a time slice and returns a new game;
// nothing here touches the DOM. Distances are in metres: the visible road is VIEW metres long,
// y = 0 is the top of the screen and the player's car sits at PLAYER_Y.

export const LANES = 4;
export const VIEW = 100;
export const PLAYER_Y = 80;
export const CAR_LENGTH = 11;
export const CAR_WIDTH = 0.62;          // share of a lane
export const TRAFFIC_SPEED = 10;        // m/s, every other car drives at the same pace
export const START_SPEED = 22;          // m/s
export const MAX_SPEED = 58;
export const COIN_POINTS = 50;
const LANE_CHANGE_SPEED = 9;            // lanes per second
const SPAWN_Y = -CAR_LENGTH - 4;

// Small seeded random generator (LCG) kept in the game so a run can be replayed in tests.
function nextRandom(game) {
  game.rng = (game.rng * 1664525 + 1013904223) % 4294967296;
  return game.rng / 4294967296;
}

export function createGame(seed = Math.floor(Math.random() * 4294967296)) {
  return {
    status: 'ready',
    lane: 1,
    x: 1,                 // drawn position in lanes, slides toward lane
    speed: START_SPEED,
    distance: 0,
    coins: 0,
    elapsed: 0,
    cars: [],             // { lane, y, color }
    pickups: [],          // { lane, y }
    sinceSpawn: 0,        // metres the road moved since the last wave
    nextGap: 30,
    open: [0, 1, 2, 3],   // lanes left free by the last wave
    waves: 0,
    rng: seed % 4294967296
  };
}

export function score(game) {
  return Math.floor(game.distance) + game.coins * COIN_POINTS;
}

// Speed and traffic grow with distance: gaps between waves shrink and more lanes get blocked.
export function speedFor(distance) {
  return Math.min(MAX_SPEED, START_SPEED + distance / 90);
}

function waveGap(game) {
  const base = Math.max(30, 44 - game.distance / 250);
  return base + nextRandom(game) * 12;
}

function spawnWave(game) {
  const r = nextRandom(game);
  const maxBlocked = game.distance < 400 ? 1 : game.distance < 1500 ? 2 : 3;
  const blockedCount = 1 + Math.floor(r * maxBlocked);
  // Next to every lane the last wave left open, one lane stays open again, so whichever gap the
  // player took, the way through never needs a jump across several lanes at full speed.
  const keep = new Set(game.open.map(lane => Math.max(0, Math.min(LANES - 1, lane + Math.floor(nextRandom(game) * 3) - 1))));
  const lanes = Array.from({ length: LANES }, (_, lane) => lane).filter(lane => !keep.has(lane));
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(game) * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  const blocked = lanes.slice(0, Math.min(blockedCount, LANES - 1));
  const open = [...keep, ...lanes.slice(blocked.length)];
  game.open = open;
  blocked.forEach(lane => game.cars.push({ lane, y: SPAWN_Y - nextRandom(game) * 3, color: Math.floor(nextRandom(game) * 5) }));
  if (nextRandom(game) < 0.45) game.pickups.push({ lane: open[Math.floor(nextRandom(game) * open.length)], y: SPAWN_Y + 3 });
  game.waves += 1;
  game.sinceSpawn = 0;
  game.nextGap = waveGap(game);
}

export function startGame(game) {
  return game.status === 'ready' || game.status === 'paused' ? { ...game, status: 'playing' } : game;
}

export function pauseGame(game) {
  return game.status === 'playing' ? { ...game, status: 'paused' } : game;
}

export function steer(game, direction) {
  if (game.status !== 'playing') return game;
  const lane = Math.max(0, Math.min(LANES - 1, game.lane + Math.sign(direction)));
  return lane === game.lane ? game : { ...game, lane };
}

// Jumps straight to a lane (touch: tap where you want to be, one lane at a time).
export function steerToward(game, laneFloat) {
  const target = Math.round(laneFloat);
  if (target === game.lane) return game;
  return steer(game, target - game.lane);
}

export function collides(game, car) {
  const sideways = Math.abs(car.lane - game.x) < CAR_WIDTH;
  const lengthwise = Math.abs(car.y - PLAYER_Y) < CAR_LENGTH * 0.92;
  return sideways && lengthwise;
}

export function step(game, dt) {
  if (game.status !== 'playing' || dt <= 0) return game;
  const next = { ...game, cars: game.cars.map(car => ({ ...car })), pickups: game.pickups.map(p => ({ ...p })) };
  const slice = Math.min(dt, 0.05);
  next.elapsed += slice;
  next.speed = speedFor(next.distance);
  next.distance += next.speed * slice;

  // Slide toward the chosen lane.
  const delta = next.lane - next.x;
  const move = LANE_CHANGE_SPEED * slice;
  next.x = Math.abs(delta) <= move ? next.lane : next.x + Math.sign(delta) * move;

  // Everything on the road comes toward the player at the speed difference.
  const approach = next.speed - TRAFFIC_SPEED;
  next.cars.forEach(car => { car.y += approach * slice; });
  next.pickups.forEach(pickup => { pickup.y += approach * slice; });
  next.sinceSpawn += approach * slice;
  if (next.sinceSpawn >= next.nextGap) spawnWave(next);

  next.pickups = next.pickups.filter(pickup => {
    if (Math.abs(pickup.lane - next.x) < 0.5 && Math.abs(pickup.y - PLAYER_Y) < CAR_LENGTH * 0.8) { next.coins += 1; return false; }
    return pickup.y < VIEW + 10;
  });
  next.cars = next.cars.filter(car => car.y < VIEW + CAR_LENGTH);
  if (next.cars.some(car => collides(next, car))) next.status = 'over';
  return next;
}

// Runs step() in slices no longer than 50 ms so fast frames and slow frames play the same.
export function advance(game, seconds) {
  let current = game;
  let left = Math.min(seconds, 0.25);
  while (left > 0 && current.status === 'playing') {
    const slice = Math.min(left, 0.05);
    current = step(current, slice);
    left -= slice;
  }
  return current;
}
