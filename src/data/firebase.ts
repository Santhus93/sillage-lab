// ============================================================
// SILLAGE LAB - CONEXAO COM O FIREBASE
// Arquivo: src/data/firebase.ts
// Inicializa o app, o Firestore (banco) e o Auth (login).
//
// OBS: estas chaves sao publicas por natureza (rodam no
// navegador). Quem protege os dados sao as REGRAS do Firestore.
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDt1ls7fOxDXEsGJnoicPp1vqbIOjlMIPM',
  authDomain: 'sillage-lab-2374f.firebaseapp.com',
  projectId: 'sillage-lab-2374f',
  storageBucket: 'sillage-lab-2374f.firebasestorage.app',
  messagingSenderId: '989788371047',
  appId: '1:989788371047:web:495428a06b20f251c5bcc2',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ------------------------------------------------------------
// CAMINHOS NO FIRESTORE
// ------------------------------------------------------------
// Estrutura:
//   laboratorio/sillage                  -> documento de config
//   laboratorio/sillage/perfumes/{id}
//   laboratorio/sillage/formulas/{id}
//   laboratorio/sillage/lotes/{id}
//   laboratorio/sillage/avaliacoes/{id}
//   laboratorio/sillage/manutencoes/{id}
//   laboratorio/sillage/materiasPrimas/{id}
//
// Um unico laboratorio compartilhado entre voce e sua
// companheira - ambos veem e editam os mesmos dados.

export const LAB_ID = 'sillage';
export const LAB_PATH = `laboratorio/${LAB_ID}`;
