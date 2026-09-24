// ============================================================
// SILLAGE LAB - TEMA (Material UI)
// Arquivo: src/theme/theme.ts
// Paleta baseada no logo da Sillage Perfumaria:
// preto, cinza e um dourado discreto (luxo nicho)
// ============================================================

import { createTheme } from '@mui/material/styles';

// Paleta oficial Sillage Lab
export const cores = {
  pretoPrincipal: '#1A1A1A',
  cinzaEscuro:    '#3D3D3D',
  cinzaMedio:     '#7A7A7A',
  cinzaClaro:     '#D9D9D9',
  branco:         '#FFFFFF',
  dourado:        '#B08D57', // detalhes premium

  // Cores de status (semaforo da maceracao)
  macerando:      '#C9A227', // amarelo/dourado
  prontoTeste:    '#4A7BA6', // azul
  prontoVenda:    '#3E8E5A', // verde
  descartado:     '#9E4A4A', // vermelho discreto
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: cores.dourado,
      contrastText: cores.branco,
    },
    secondary: {
      main: cores.cinzaMedio,
    },
    background: {
      default: cores.pretoPrincipal,
      paper: cores.cinzaEscuro,
    },
    text: {
      primary: cores.branco,
      secondary: cores.cinzaClaro,
    },
  },

  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 300, letterSpacing: '0.15em' },
    h2: { fontWeight: 300, letterSpacing: '0.12em' },
    h3: { fontWeight: 400, letterSpacing: '0.08em' },
    h4: { fontWeight: 400, letterSpacing: '0.05em' },
    button: { textTransform: 'none', fontWeight: 500 },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: cores.cinzaEscuro,
          border: `1px solid rgba(176, 141, 87, 0.15)`, // linha dourada sutil
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 18,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: cores.pretoPrincipal,
          borderBottom: `1px solid rgba(176, 141, 87, 0.2)`,
        },
      },
    },
  },
});

export default theme;
