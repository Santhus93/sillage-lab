// ============================================================
// SILLAGE LAB - MARCA
// Arquivo: src/components/Marca.tsx
// Simbolo + logotipo da Sillage. O "S" dentro de um losango
// remete ao frasco/rotulo, e o brilho dourado atravessa o texto.
// ============================================================

import { Box, Typography } from '@mui/material';
import { cores } from '../theme/theme';

// ------------------------------------------------------------
// SIMBOLO (losango com S) - desenhado em SVG puro
// ------------------------------------------------------------
export function SimboloSillage({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      sx={{ width: tamanho, height: tamanho, display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="sillageOuro" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={cores.douradoClaro} />
          <stop offset="55%" stopColor={cores.dourado} />
          <stop offset="100%" stopColor={cores.douradoEscuro} />
        </linearGradient>
      </defs>

      {/* Losango externo */}
      <rect
        x="50"
        y="6"
        width="62"
        height="62"
        rx="10"
        transform="rotate(45 50 6)"
        fill="none"
        stroke="url(#sillageOuro)"
        strokeWidth="3"
      />

      {/* "S" estilizado */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Cormorant Garamond, serif"
        fontSize="46"
        fontWeight="500"
        fill="url(#sillageOuro)"
      >
        S
      </text>
    </Box>
  );
}

// ------------------------------------------------------------
// LOGOTIPO COMPLETO
// ------------------------------------------------------------
export default function Marca({
  tamanho = 'medio',
  comSimbolo = true,
}: {
  tamanho?: 'pequeno' | 'medio' | 'grande';
  comSimbolo?: boolean;
}) {
  const escala = {
    pequeno: { texto: '1.05rem', simbolo: 26, espaco: '0.22em' },
    medio: { texto: '1.4rem', simbolo: 34, espaco: '0.26em' },
    grande: { texto: '2.6rem', simbolo: 64, espaco: '0.3em' },
  }[tamanho];

  const vertical = tamanho === 'grande';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: vertical ? 1.5 : 1.5,
      }}
    >
      {comSimbolo && <SimboloSillage tamanho={escala.simbolo} />}

      <Box sx={{ textAlign: vertical ? 'center' : 'left' }}>
        <Typography
          className="sillage-marca"
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: escala.texto,
            fontWeight: 500,
            letterSpacing: escala.espaco,
            lineHeight: 1.1,
          }}
        >
          SILLAGE
        </Typography>
        <Typography
          sx={{
            fontSize: vertical ? '0.7rem' : '0.58rem',
            letterSpacing: '0.55em',
            color: cores.dourado,
            mt: vertical ? 0.5 : 0,
            ml: '0.2em',
          }}
        >
          LAB
        </Typography>
      </Box>
    </Box>
  );
}
