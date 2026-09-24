import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const app = getApps().find(existing => existing.name === '[DEFAULT]') || initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const EMPTY_GAME_STATS = Object.freeze({
  '2048': { bestScore: 0, wins: 0 },
  harfane: {
    daily: { played: 0, wins: 0, streak: 0, best: 0, distribution: [0, 0, 0, 0, 0, 0], lastPlayedDate: '' },
    sefer: { level: 1, wins: 0, best: 0, completed: false, completedRuns: 0 }
  },
  xox: { rounds: 0, xWins: 0, oWins: 0, draws: 0 },
  hafiza: {
    classic: { bestMs: null, bestMoves: null },
    expanded: { bestMs: null, bestMoves: null }
  },
  'mayin-tarlasi': {
    wins: 0,
    easy: { bestMs: null }, medium: { bestMs: null }, hard: { bestMs: null }
  }
});

export async function saveProfile(user, additions = {}) {
  if (!user) return;
  const profileRef = doc(db, 'users', user.uid);
  const existing = await getDoc(profileRef);
  await setDoc(profileRef, {
    schemaVersion: 2,
    email: user.email || '',
    displayName: user.displayName || '',
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    lastSeenAt: serverTimestamp(),
    ...(!existing.data()?.gameStats ? { gameStats: EMPTY_GAME_STATS } : {}),
    ...additions
  }, { merge: true });
}

export async function signUp(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(result.user, { displayName });
  await saveProfile(result.user);
  return result.user;
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password).then(async result => {
    await saveProfile(result.user);
    return result;
  });
}

export function signOutUser() {
  return signOut(auth);
}

export function listenToAuth(callback) {
  return onAuthStateChanged(auth, user => {
    if (user) saveProfile(user).catch(() => {});
    callback(user);
  });
}

export async function loadGame(user, gameId) {
  if (!user) return null;
  const snapshot = await getDoc(doc(db, 'users', user.uid, 'games', gameId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveGame(user, gameId, state, stats = {}) {
  if (!user) return;
  await saveProfile(user);
  const profileRef = doc(db, 'users', user.uid);
  const gameRef = doc(db, 'users', user.uid, 'games', gameId);
  await runTransaction(db, async transaction => {
    const profileSnapshot = await transaction.get(profileRef);
    transaction.set(gameRef, { gameId, schemaVersion: 1, state, stats, updatedAt: serverTimestamp() }, { merge: true });
    if (Object.keys(stats).length && profileSnapshot.exists()) {
      const existingStats = profileSnapshot.data().gameStats || {};
      transaction.set(profileRef, {
        gameStats: {
          ...EMPTY_GAME_STATS,
          ...existingStats,
          [gameId]: mergeStatValues({ ...(EMPTY_GAME_STATS[gameId] || {}), ...(existingStats[gameId] || {}) }, stats)
        },
        lastSeenAt: serverTimestamp()
      }, { merge: true });
    }
  });
}

function mergeStatValues(previous, incoming) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    if (incoming == null) return previous ?? null;
    return incoming;
  }
  const merged = { ...(previous && typeof previous === 'object' ? previous : {}) };
  for (const [key, value] of Object.entries(incoming)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) merged[key] = mergeStatValues(merged[key], value, key);
    else if (value == null) merged[key] = merged[key] ?? null;
    else if (typeof value === 'number' && typeof merged[key] === 'number') merged[key] = /bestMs|bestMoves|record|time/i.test(key) ? Math.min(merged[key], value) : Math.max(merged[key], value);
    else merged[key] = value;
  }
  return merged;
}

export function syncGameOnAccountChange(gameId, options) {
  let user = null;
  let syncGeneration = 0;
  let lastSaved = '';
  let saveTimer = 0;
  let active = true;
  const unsubscribe = listenToAuth(async nextUser => {
    user = nextUser;
    syncGeneration += 1;
    const generation = syncGeneration;
    lastSaved = '';
    if (!user) { options.onStatus?.('Oyun bu cihazda saklanıyor.'); return; }
    options.onStatus?.('Hesap kayıtları kontrol ediliyor…');
    try {
      const remote = await loadGame(user, gameId);
      if (!active || generation !== syncGeneration) return;
      const local = options.read();
      if (remote && options.isValid(remote.state)) {
        const merged = options.merge ? options.merge(local, remote.state) : remote.state;
        options.write(merged);
        options.onStatus?.('Oyun hesabınla eşitlendi.');
        scheduleSave(merged);
      } else {
        options.onStatus?.('Oyun hesabına kaydediliyor…');
        scheduleSave(local);
      }
    } catch {
      if (active && generation === syncGeneration) options.onStatus?.('Bulut okunamadı; cihaz kaydı kullanılmaya devam ediyor.');
    }
  });

  function scheduleSave(state = options.read()) {
    if (!user) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastSaved) return;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(async () => {
      const targetUser = user;
      const targetGeneration = syncGeneration;
      try {
        await saveGame(targetUser, gameId, state, options.getStats?.(state) || {});
        if (active && targetGeneration === syncGeneration) {
          lastSaved = serialized;
          options.onStatus?.('Oyun hesabınla eşitlendi.');
        }
      } catch {
        if (active && targetGeneration === syncGeneration) options.onStatus?.('Buluta kaydedilemedi; cihaz kaydı korunuyor.');
      }
    }, 400);
  }

  return {
    save: scheduleSave,
    destroy() { active = false; unsubscribe(); window.clearTimeout(saveTimer); }
  };
}

export const platformFirebase = {
  app, auth, db, saveProfile, signUp, signIn, signOut: signOutUser,
  onAuthStateChanged: listenToAuth, loadGame, saveGame
};

window.oyunArasiFirebase = platformFirebase;
