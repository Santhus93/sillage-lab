// ============================================================
// SILLAGE LAB - AUTENTICACAO
// Arquivo: src/data/auth.ts
// Login real via Firebase (e-mail + senha).
// Os usuarios sao criados por voce no console do Firebase.
// ============================================================

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import { auth } from './firebase';

// Mantem a sessao mesmo fechando o navegador
setPersistence(auth, browserLocalPersistence);

export async function entrar(email: string, senha: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), senha);
  return cred.user;
}

export async function sair(): Promise<void> {
  await signOut(auth);
}

export async function recuperarSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

// Observa login/logout. Retorna a funcao para cancelar a escuta.
export function observarLogin(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export function usuarioAtual(): User | null {
  return auth.currentUser;
}

// Nome amigavel: parte do e-mail antes do @, com inicial maiuscula
export function nomeExibicao(user: User | null): string {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  const base = (user.email ?? '').split('@')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Traduz os codigos de erro do Firebase para portugues
export function traduzirErro(codigo: string): string {
  switch (codigo) {
    case 'auth/invalid-email':
      return 'E-mail invalido.';
    case 'auth/user-disabled':
      return 'Este usuario foi desativado.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos.';
    case 'auth/network-request-failed':
      return 'Sem conexao. Verifique sua internet.';
    case 'auth/missing-password':
      return 'Informe a senha.';
    default:
      return 'Nao foi possivel entrar. Tente novamente.';
  }
}
