import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBGRBrpZi5y-eE5u4qR1QJFN2t9RDBv1Pw',
  authDomain: 'portalfrontoffice-ms.firebaseapp.com',
  projectId: 'portalfrontoffice-ms',
  storageBucket: 'portalfrontoffice-ms.firebasestorage.app',
  messagingSenderId: '288095166790',
  appId: '1:288095166790:web:1ce98a98009e61d59f4547'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const emailStorageKey = 'emailForSignIn';

export async function sendMagicLink(email) {
  if (!email) {
    throw new Error('Email é obrigatório.');
  }

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem(emailStorageKey, email);
    return true;
  } catch (error) {
    console.error('Erro ao enviar link mágico:', error);
    let message = 'Não foi possível enviar o link de acesso. Tente novamente.';
    if (error.code === 'auth/invalid-email') {
      message = 'Email inválido.';
    } else if (error.code === 'auth/user-disabled') {
      message = 'Conta desativada.';
    }
    throw new Error(message);
  }
}

export async function initializeAuth() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem(emailStorageKey);
    if (!email) {
      email = window.prompt('Por favor insira o email usado para pedir o link de acesso:');
    }

    if (!email) {
      throw new Error('Email necessário para completar o login via link.');
    }

    try {
      const userCredential = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem(emailStorageKey);
      window.location.href = 'index.html';
      return userCredential.user;
    } catch (error) {
      console.error('Erro ao completar sign-in com link:', error);
      throw new Error('Não foi possível efetuar login com o link. Verifique a sua caixa de entrada e tente novamente.');
    }
  }

  return null;
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao sair:', error);
    throw new Error('Não foi possível sair. Tente novamente.');
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
