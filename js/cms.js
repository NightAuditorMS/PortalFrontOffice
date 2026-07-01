import './common.js';
import { checkAuthStatus, checkRole } from './auth.js';
import { getTranslation } from './lang.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace with real Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth Status and Role
    const user = await checkAuthStatus();
    if (!user || !checkRole(user.email)) {
        const lang = localStorage.getItem('portal-lang') || 'pt';
        alert(getTranslation(lang, 'msg_unauthorized_admin'));
        window.location.href = 'index.html';
        return;
    }

    const formCms = document.getElementById('form-cms');
    const btnPublicar = document.getElementById('btn-publicar');
    const msgSucesso = document.getElementById('mensagem-sucesso');

    if (formCms) {
        formCms.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const textoOriginal = btnPublicar.innerText;
            btnPublicar.innerText = "A Publicar...";
            btnPublicar.disabled = true;

            const titulo = document.getElementById('titulo').value;
            const categoria = document.getElementById('categoria').value;
            const conteudo = document.getElementById('conteudo').value;

            try {
                const docRef = await addDoc(collection(db, "publicacoes"), {
                    titulo: titulo,
                    categoria: categoria,
                    conteudo: conteudo,
                    dataCriacao: serverTimestamp(),
                    autor: "Duty Manager" 
                });

                console.log("Documento gravado com o ID: ", docRef.id);

                formCms.reset();
                msgSucesso.style.display = "block";
                btnPublicar.innerText = textoOriginal;
                btnPublicar.disabled = false;

                setTimeout(() => {
                    msgSucesso.style.display = "none";
                }, 4000);

            } catch (error) {
                console.error("Erro ao publicar: ", error);
                alert("Erro ao ligar à base de dados. Verifique a consola.");
                btnPublicar.innerText = textoOriginal;
                btnPublicar.disabled = false;
            }
        });
    }
});
