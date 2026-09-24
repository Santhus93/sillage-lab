// ============================================================
// SILLAGE LAB - CONFIGURACOES
// Arquivo: src/pages/Configuracoes.tsx
// Rotina de manutencao + maceracao padrao + backup/restore
// ============================================================

import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import TuneIcon from '@mui/icons-material/Tune';

import { cores } from '../theme/theme';
import type {
  DiaSemana,
  AcaoManutencao,
  Concentracao,
  IRotinaConfig,
} from '../models';
import { DIAS_CURTOS, MACERACAO_PADRAO } from '../models';
import {
  carregarConfig,
  salvarConfig,
  baixarBackup,
  importarBackup,
  resetarTudo,
} from '../data/db';

const DIAS: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];
const ACOES: AcaoManutencao[] = ['Agitar', 'Arejar'];
const CONCENTRACOES: Concentracao[] = [
  'Colonia', 'EDT', 'EDP', 'Parfum', 'Extrait',
];

export default function Configuracoes() {
  const config = carregarConfig();

  const [rotina, setRotina] = useState<IRotinaConfig>({
    ...config.rotina,
    diasSemana: [...config.rotina.diasSemana],
    acoes: [...config.rotina.acoes],
  });
  const [maceracao, setMaceracao] = useState<Record<Concentracao, number>>({
    ...MACERACAO_PADRAO,
    ...config.maceracaoPadrao,
  });
  const [marcos, setMarcos] = useState(config.marcosPadrao.join(', '));
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);

  function alternarDia(d: DiaSemana) {
    setRotina((r) => ({
      ...r,
      diasSemana: r.diasSemana.includes(d)
        ? r.diasSemana.filter((x) => x !== d)
        : [...r.diasSemana, d].sort(),
    }));
  }

  function alternarAcao(a: AcaoManutencao) {
    setRotina((r) => ({
      ...r,
      acoes: r.acoes.includes(a)
        ? r.acoes.filter((x) => x !== a)
        : [...r.acoes, a],
    }));
  }

  function salvarTudo() {
    const listaMarcos = marcos
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((x) => !isNaN(x) && x > 0)
      .sort((a, b) => a - b);

    salvarConfig({
      rotina,
      maceracaoPadrao: maceracao,
      marcosPadrao: listaMarcos.length ? listaMarcos : config.marcosPadrao,
    });
    setMsg('Configuracoes salvas. ✅');
  }

  function aoImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importarBackup(String(reader.result));
      setMsg(
        ok
          ? 'Backup importado! Recarregue a pagina para ver os dados. ✅'
          : 'Arquivo invalido. Verifique se e um backup do Sillage Lab.'
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetar() {
    resetarTudo();
    window.location.reload();
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Configuracoes</Typography>
      <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
        Regras do seu laboratorio
      </Typography>

      {/* ---------------- ROTINA DE MANUTENCAO ---------------- */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <AutorenewIcon sx={{ color: cores.dourado }} />
            <Typography variant="h6">Rotina de manutencao</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Agitar (homogeneizar) e arejar (abrir para liberar volateis) os lotes
            nos dias escolhidos. A rotina para sozinha quando a maceracao termina.
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />

          <FormControlLabel
            control={
              <Switch
                checked={rotina.ativa}
                onChange={(e) => setRotina({ ...rotina, ativa: e.target.checked })}
              />
            }
            label="Rotina ativa"
          />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Dias da semana
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {DIAS.map((d) => {
              const on = rotina.diasSemana.includes(d);
              return (
                <Chip
                  key={d}
                  label={DIAS_CURTOS[d]}
                  onClick={() => alternarDia(d)}
                  disabled={!rotina.ativa}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    minWidth: 64,
                    bgcolor: on ? 'rgba(176,141,87,0.2)' : 'rgba(255,255,255,0.05)',
                    color: on ? cores.dourado : cores.cinzaMedio,
                    border: on
                      ? `1px solid ${cores.dourado}55`
                      : '1px solid transparent',
                  }}
                />
              );
            })}
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 1 }}>
            Acoes
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ACOES.map((a) => {
              const on = rotina.acoes.includes(a);
              return (
                <Chip
                  key={a}
                  label={a}
                  onClick={() => alternarAcao(a)}
                  disabled={!rotina.ativa}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    bgcolor: on ? `${cores.prontoTeste}22` : 'rgba(255,255,255,0.05)',
                    color: on ? cores.prontoTeste : cores.cinzaMedio,
                  }}
                />
              );
            })}
          </Box>

          {rotina.ativa && rotina.diasSemana.length > 0 && (
            <Alert severity="info" sx={{ mt: 2.5 }}>
              Os lotes em maceracao aparecerao para manutencao toda{' '}
              <strong>
                {rotina.diasSemana.map((d) => DIAS_CURTOS[d]).join(', ')}
              </strong>
              .
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ---------------- MACERACAO PADRAO ---------------- */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <TuneIcon sx={{ color: cores.dourado }} />
            <Typography variant="h6">Maceracao padrao</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Dias sugeridos ao cadastrar um perfume de cada concentracao.
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {CONCENTRACOES.map((c) => (
              <TextField
                key={c}
                label={c}
                type="number"
                size="small"
                value={maceracao[c]}
                onChange={(e) =>
                  setMaceracao({ ...maceracao, [c]: Number(e.target.value) })
                }
                sx={{ flex: '1 1 130px' }}
              />
            ))}
            <TextField
              label="Marcos (dias, separados por virgula)"
              size="small"
              value={marcos}
              onChange={(e) => setMarcos(e.target.value)}
              sx={{ flex: '1 1 100%' }}
              helperText="Ex: 7, 15, 30, 45, 60, 90"
            />
          </Box>
        </CardContent>
      </Card>

      {/* ---------------- SALVAR ---------------- */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Button variant="contained" size="large" onClick={salvarTudo}>
          Salvar configuracoes
        </Button>
        {msg && (
          <Alert
            severity={msg.includes('✅') ? 'success' : 'warning'}
            sx={{ flex: '1 1 280px' }}
          >
            {msg}
          </Alert>
        )}
      </Box>

      {/* ---------------- BACKUP ---------------- */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>💾 Backup</Typography>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Seus dados ficam apenas neste navegador. Exporte de vez em quando —
            e use o mesmo arquivo para levar tudo para outro computador.
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={baixarBackup}
            >
              Exportar backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => inputFile.current?.click()}
            >
              Importar backup
            </Button>
            <input
              ref={inputFile}
              type="file"
              accept="application/json"
              hidden
              onChange={aoImportar}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ---------------- ZONA PERIGOSA ---------------- */}
      <Card sx={{ borderColor: `${cores.descartado}55` }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, color: cores.descartado }}>
            Zona perigosa
          </Typography>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Apaga todos os dados e a senha deste navegador. Nao ha volta —
            exporte um backup antes.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setConfirmReset(true)}
            sx={{ color: cores.descartado, borderColor: `${cores.descartado}77` }}
          >
            Apagar tudo
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
        <DialogTitle>Apagar todos os dados?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Perfumes, formulas, lotes, avaliacoes, manutencoes e a senha serao
            removidos deste navegador.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={resetar} sx={{ color: cores.descartado }}>
            Apagar tudo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
