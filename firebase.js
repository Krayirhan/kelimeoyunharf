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
  saveGame(user, dateKey, game, stats) {
    if (!user) return Promise.resolve();
    return Promise.all([
      saveProfile(user, stats),
      setDoc(doc(db, 'users', user.uid, 'games', dateKey), {
        date: dateKey,
        mode: game.mode,
        level: game.level,
        seriesWins: game.seriesWins,
        seriesBest: game.seriesBest,
        puzzleNumber: game.puzzleNumber,
        guesses: game.guesses,
        gameOver: Boolean(game.gameOver),
        won: game.won,
        attempts: game.guesses.length,
        completedAt: serverTimestamp()
      }, { merge: true })
    ]);
  }
};

function saveProfile(user, stats) {
  return setDoc(doc(db, 'users', user.uid), {
    email: user.email || '',
    displayName: user.displayName || '',
    lastSeenAt: serverTimestamp(),
    stats
  }, { merge: true });
}

window.firebaseBridge = bridge;
window.dispatchEvent(new CustomEvent('firebase-ready', { detail: bridge }));
