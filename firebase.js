import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const bridge = {
  onAuthStateChanged(callback) { return onAuthStateChanged(auth, callback); },
  async signUp(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(result.user, { displayName });
    await saveProfile(result.user, {});
    return result.user;
  },
  signIn(email, password) { return signInWithEmailAndPassword(auth, email, password); },
  signOut() { return signOut(auth); },
  async loadUserData(user, dateKey) {
    const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
    const gameSnapshot = await getDoc(doc(db, 'users', user.uid, 'games', dateKey));
    return {
      profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
      game: gameSnapshot.exists() ? gameSnapshot.data() : null
    };
  },
  saveGame(user, dateKey, game, profileData) {
    if (!user) return Promise.resolve();
    const profile = {
      email: user.email || '',
      displayName: user.displayName || '',
      lastSeenAt: serverTimestamp(),
      ...(profileData.legacy ? { stats: profileData.legacy } : {}),
      ...(profileData.daily || profileData.sefer ? { modeStats: {
        ...(profileData.daily ? { daily: profileData.daily } : {}),
        ...(profileData.sefer ? { sefer: profileData.sefer } : {})
      } } : {})
    };
    const profileRef = doc(db, 'users', user.uid);
    const gameRef = doc(db, 'users', user.uid, 'games', dateKey);
    return runTransaction(db, async transaction => {
      const snapshot = await transaction.get(gameRef);
      const profileSnapshot = await transaction.get(profileRef);
      const remote = snapshot.exists() ? snapshot.data() : null;
      const remoteProfile = profileSnapshot.exists() ? profileSnapshot.data() : {};
      const incomingGuesses = Array.isArray(game.guesses) ? game.guesses : [];
      const remoteGuesses = Array.isArray(remote?.guesses) ? remote.guesses : [];
      const remoteDailyIsFinal = game.mode === 'daily' && remote?.date === game.date
        && remote?.gameOver && !game.gameOver;
      const useRemote = game.mode === 'daily' && remote?.date === game.date
        && (remoteDailyIsFinal || remoteGuesses.length > incomingGuesses.length
          || (remoteGuesses.length === incomingGuesses.length && (remote?.gameOver || (remote?.current || '').length > (game.current || '').length)));
      const preservedGame = useRemote ? remote : { ...game, guesses: incomingGuesses };
      if (game.mode === 'series' && remote?.order && game.order?.join('|') !== remote.order.join('|')) {
        throw new Error('A different Sefer order is already saved for this account.');
      }

      const modeStats = { ...(remoteProfile.modeStats || {}) };
      if (profileData.daily || modeStats.daily) {
        const dailyStats = { ...(modeStats.daily || profileData.daily) };
        if (game.mode === 'daily' && preservedGame.gameOver && !remote?.gameOver && dailyStats.lastPlayedDate !== game.date) {
          const guesses = preservedGame.guesses || [];
          dailyStats.played = (Number(dailyStats.played) || 0) + 1;
          if (preservedGame.won) {
            dailyStats.wins = (Number(dailyStats.wins) || 0) + 1;
            dailyStats.streak = dailyStats.lastPlayedDate === previousDate(game.date)
              ? (Number(dailyStats.streak) || 0) + 1 : 1;
            dailyStats.best = Math.max(Number(dailyStats.best) || 0, dailyStats.streak);
            const distribution = Array.isArray(dailyStats.distribution) ? [...dailyStats.distribution] : [0, 0, 0, 0, 0, 0];
            if (guesses.length > 0 && guesses.length <= 6) distribution[guesses.length - 1] = (Number(distribution[guesses.length - 1]) || 0) + 1;
            dailyStats.distribution = distribution;
          } else dailyStats.streak = 0;
          dailyStats.lastPlayedDate = game.date;
        }
        modeStats.daily = dailyStats;
      }
      if (profileData.sefer || modeStats.sefer) modeStats.sefer = profileData.sefer || modeStats.sefer;
      if (Object.keys(modeStats).length) profile.modeStats = modeStats;
      if (profileData.legacy) profile.stats = remoteProfile.stats || profileData.legacy;

      transaction.set(profileRef, profile, { merge: true });
      transaction.set(gameRef, {
        date: preservedGame.date || dateKey,
        mode: preservedGame.mode,
        level: preservedGame.level,
        seriesWins: preservedGame.seriesWins,
        seriesBest: preservedGame.seriesBest,
        completed: Boolean(preservedGame.completed),
        completedRuns: Number(preservedGame.completedRuns) || 0,
        ...(preservedGame.mode === 'series' ? { order: preservedGame.order } : {}),
        puzzleNumber: preservedGame.puzzleNumber,
        guesses: preservedGame.guesses,
        current: preservedGame.current || '',
        levelCounted: Boolean(preservedGame.levelCounted),
        gameOver: Boolean(preservedGame.gameOver),
        won: Boolean(preservedGame.won),
        attempts: (preservedGame.guesses || []).length,
        completedAt: serverTimestamp()
      }, { merge: true });
      return preservedGame;
    });
  }
};

function previousDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function saveProfile(user, profileData = {}) {
  const profile = {
    email: user.email || '',
    displayName: user.displayName || '',
    lastSeenAt: serverTimestamp()
  };
  if (profileData.legacy) profile.stats = profileData.legacy;
  if (profileData.daily || profileData.sefer) profile.modeStats = {
    ...(profileData.daily ? { daily: profileData.daily } : {}),
    ...(profileData.sefer ? { sefer: profileData.sefer } : {})
  };
  return setDoc(doc(db, 'users', user.uid), profile, { merge: true });
}

window.firebaseBridge = bridge;
window.dispatchEvent(new CustomEvent('firebase-ready', { detail: bridge }));
