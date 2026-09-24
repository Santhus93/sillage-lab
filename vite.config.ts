// ============================================================
// SILLAGE LAB - CONFIG DO VITE
// Arquivo: vite.config.ts  (na RAIZ do projeto, nao dentro de src)
// O "base" e essencial para o GitHub Pages funcionar,
// porque o site fica em usuario.github.io/sillage-lab/
// ============================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: precisa ser igual ao nome do repositorio no GitHub,
  // com barra no inicio e no fim.
  base: '/sillage-lab/',
});
