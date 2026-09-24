// ============================================================
// SILLAGE LAB - TEMA (Material UI)
// Arquivo: src/theme/theme.ts
// Paleta da Sillage Perfumaria: preto quente, dourado velho
// e acabamento de vitrine (vidro + sombra profunda).
// ============================================================

import { createTheme, alpha } from '@mui/material/styles';

// ------------------------------------------------------------
// PALETA
// ------------------------------------------------------------
export const cores = {
  // Preto levemente quente (nao e preto puro, tem alma)
  pretoPrincipal: '#12100E',
  cinzaEscuro:    '#1E1B17',
  cinzaMedio:     '#8A8279',
  cinzaClaro:     '#D9D4CC',
  branco:         '#FFFFFF',

  // Dourados
  dourado:        '#B08D57',
  douradoClaro:   '#E8CFA3',
  douradoEscuro:  '#7A6039',

  // Semaforo da maceracao
  macerando:      '#C9A227', // ambar
  prontoTeste:    '#5B8FB9', // azul sereno
  prontoVenda:    '#4C9A6A', // verde equilibrado
  descartado:     '#A85A5A', // terracota
};

// Linha dourada translucida usada nas bordas
const linhaDourada = alpha(cores.dourado, 0.18);

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: cores.dourado,
      light: cores.douradoClaro,
      dark: cores.douradoEscuro,
      contrastText: '#17140F',
    },
    secondary: {
      main: cores.cinzaMedio,
    },
    success: { main: cores.prontoVenda },
    info: { main: cores.prontoTeste },
    warning: { main: cores.macerando },
    error: { main: cores.descartado },
    background: {
      default: cores.pretoPrincipal,
      paper: cores.cinzaEscuro,
    },
    text: {
      primary: cores.cinzaClaro,
      secondary: cores.cinzaMedio,
    },
    divider: linhaDourada,
  },

  typography: {
    fontFamily: '"Jost", "Helvetica", "Arial", sans-serif',

    // Titulos em serifada: cara de rotulo de perfume
    h1: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, letterSpacing: '0.18em' },
    h2: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, letterSpacing: '0.14em' },
    h3: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, letterSpacing: '0.12em' },
    h4: {
      fontFamily: '"Cormorant Garamond", serif',
      fontWeight: 500,
      letterSpacing: '0.06em',
      color: cores.branco,
      fontVariantNumeric: 'lining-nums',
    },
    h5: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, letterSpacing: '0.04em' },
    h6: { fontWeight: 500, letterSpacing: '0.02em', fontSize: '1.05rem' },

    subtitle2: { fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' },
    overline: { letterSpacing: '0.3em' },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.02em' },
    caption: { letterSpacing: '0.02em' },
  },

  shape: { borderRadius: 14 },

  components: {
    // ---------- CARDS: efeito vitrine ----------
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(160deg, ${alpha('#FFFFFF', 0.035)}, transparent 55%)`,
          backgroundColor: cores.cinzaEscuro,
          border: `1px solid ${linhaDourada}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
          transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
          '&:hover': {
            borderColor: alpha(cores.dourado, 0.32),
            boxShadow: '0 14px 38px rgba(0,0,0,0.55)',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },

    // ---------- BOTOES ----------
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 20, paddingBlock: 8 },
        contained: {
          background: `linear-gradient(135deg, ${cores.douradoClaro}, ${cores.dourado} 55%, ${cores.douradoEscuro})`,
          color: '#17140F',
          fontWeight: 600,
          '&:hover': {
            background: `linear-gradient(135deg, ${cores.douradoClaro}, ${cores.dourado})`,
            boxShadow: `0 6px 20px ${alpha(cores.dourado, 0.35)}`,
          },
        },
        outlined: {
          borderColor: alpha(cores.dourado, 0.4),
          '&:hover': {
            borderColor: cores.dourado,
            backgroundColor: alpha(cores.dourado, 0.08),
          },
        },
      },
    },

    // ---------- APP BAR: vidro fosco ----------
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(cores.pretoPrincipal, 0.82),
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${linhaDourada}`,
          backgroundImage: 'none',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: alpha(cores.pretoPrincipal, 0.94),
          backdropFilter: 'blur(14px)',
          borderRight: `1px solid ${linhaDourada}`,
          backgroundImage: 'none',
        },
      },
    },

    // ---------- CHIPS ----------
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        outlined: { borderColor: alpha(cores.dourado, 0.28) },
      },
    },

    // ---------- CAMPOS ----------
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: alpha('#FFFFFF', 0.02),
          '& fieldset': { borderColor: alpha(cores.dourado, 0.2) },
          '&:hover fieldset': { borderColor: alpha(cores.dourado, 0.4) },
        },
      },
    },

    // ---------- TABELAS ----------
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: alpha(cores.dourado, 0.1) },
        head: {
          color: cores.cinzaMedio,
          fontWeight: 600,
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        hover: {
          '&:hover': { backgroundColor: `${alpha(cores.dourado, 0.06)} !important` },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, backgroundColor: alpha('#FFFFFF', 0.07) },
        bar: { borderRadius: 999 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2A251E',
          border: `1px solid ${linhaDourada}`,
          fontSize: '0.75rem',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          border: `1px solid ${linhaDourada}`,
          backgroundImage: `linear-gradient(160deg, ${alpha('#FFFFFF', 0.04)}, transparent 50%)`,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1.5rem',
          letterSpacing: '0.04em',
        },
      },
    },
  },
});

export default theme;
