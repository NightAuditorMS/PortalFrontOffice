import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email e palavra-passe são obrigatórios.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    let message = 'Erro ao iniciar sessão.';
    if (error.code === 'auth/user-not-found') {
      message = 'Utilizador não encontrado.';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Palavra-passe incorreta.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email inválido.';
    }
    throw new Error(message);
  }
}

export function checkAuthStatus() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        const targetUrl = 'login.html';
        if (!window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('login.html')) {
          window.location.href = targetUrl;
        }
        resolve(null);
      }
    });
  });
}
