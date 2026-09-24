// ============================================================
// SILLAGE LAB - ESTADOS DE TELA
// Arquivo: src/components/Estados.tsx
// Componentes reutilizaveis: carregando, erro e vazio.
// ============================================================

import type { ReactNode } from 'react';
import { Box, Typography, CircularProgress, Card, CardContent, Alert } from '@mui/material';
import { cores } from '../theme/theme';

// ---------- CARREGANDO ----------
export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 8,
      }}
    >
      <CircularProgress size={34} sx={{ color: cores.dourado }} />
      <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
        {texto}
      </Typography>
    </Box>
  );
}

// ---------- ERRO ----------
export function ErroTela({ mensagem }: { mensagem: string }) {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {mensagem}
    </Alert>
  );
}

// ---------- VAZIO ----------
export function Vazio({
  icone,
  titulo,
  descricao,
}: {
  icone: ReactNode;
  titulo: string;
  descricao?: string;
}) {
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 6 }}>
        <Box sx={{ color: cores.cinzaMedio, mb: 1, '& svg': { fontSize: 48 } }}>
          {icone}
        </Box>
        <Typography variant="body1" sx={{ color: cores.cinzaClaro }}>
          {titulo}
        </Typography>
        {descricao && (
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mt: 0.5 }}>
            {descricao}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- CABECALHO DE PAGINA ----------
export function Cabecalho({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {titulo}
        </Typography>
        {subtitulo && (
          <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
            {subtitulo}
          </Typography>
        )}
      </Box>
      {acao}
    </Box>
  );
}
