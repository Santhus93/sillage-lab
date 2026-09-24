// ============================================================
// SILLAGE LAB - CONFIGURACOES
// Arquivo: src/pages/Configuracoes.tsx
// v3: opcao de baixa automatica de estoque
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Inventory2Icon from '@mui/icons-material/Inventory2';

import { cores } from '../theme/theme';
import type {
  DiaSemana,
  AcaoManutencao,
  Concentracao,
  IRotinaConfig,
  IConfig,
} from '../models';
import { DIAS_CURTOS, MACERACAO_PADRAO } from '../models';
import {
  carregarConfig,
  salvarConfig,
  baixarBackup,
  importarBackup,
  migrarDoLocalStorage,
  resetarTudo,
} from '../data/db';
import { useDados } from '../hooks/useDados';
import { Carregando } from '../components/Estados';

const DIAS: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];
const ACOES: AcaoManutencao[] = ['Agitar', 'Arejar'];
const CONCENTRACOES: Concentracao[] = ['Colonia', 'EDT', 'EDP', 'Parfum', 'Extrait'];

export default function Configuracoes() {
  const { dados: config, carregando } = useDados<IConfig | null>(carregarConfig, null);

  const [rotina, setRotina] = useState<IRotinaConfig | null>(null);
  const [maceracao, setMaceracao] = useState<Record<Concentracao, number> | null>(null);
  const [marcos, setMarcos] = useState('');
  const [baixaAuto, setBaixaAuto] = useState<boolean | null>(null);
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);

  if (carregando || !config) return <Carregando />;

  const rotinaAtual = rotina ?? {
    ...config.rotina,
    diasSemana: [...config.rotina.diasSemana],
    acoes: [...config.rotina.acoes],
  };
  const maceracaoAtual = maceracao ?? { ...MACERACAO_PADRAO, ...config.maceracaoPadrao };
  const marcosAtual = marcos || config.marcosPadrao.join(', ');
  const baixaAtual = baixaAuto ?? config.baixaEstoqueAutomatica ?? true;

  function alternarDia(d: DiaSemana) {
    setRotina({
      ...rotinaAtual,
      diasSemana: rotinaAtual.diasSemana.includes(d)
        ? rotinaAtual.diasSemana.filter((x) => x !== d)
        : [...rotinaAtual.diasSemana, d].sort(),
    });
  }

  function alternarAcao(a: AcaoManutencao) {
    setRotina({
      ...rotinaAtual,
      acoes: rotinaAtual.acoes.includes(a)
        ? rotinaAtual.acoes.filter((x) => x !== a)
        : [...rotinaAtual.acoes, a],
    });
  }

  async function salvarTudo() {
    setSalvando(true);
    setMsg('');
    try {
      const listaMarcos = marcosAtual
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => !isNaN(x) && x > 0)
        .sort((a, b) => a - b);

      await salvarConfig({
        rotina: rotinaAtual,
        maceracaoPadrao: maceracaoAtual,
        marcosPadrao: listaMarcos.length ? listaMarcos : config!.marcosPadrao,
        baixaEstoqueAutomatica: baixaAtual,
      });
      setMsg('Configuracoes salvas. ✅');
    } catch {
      setMsg('Nao foi possivel salvar. Verifique sua conexao.');
    } finally {
      setSalvando(false);
    }
  }

  async function aoImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const texto = await file.text();
    const ok = await importarBackup(texto);
    setMsg(
      ok
        ? 'Backup importado! Recarregue a pagina para ver os dados. ✅'
        : 'Arquivo invalido. Verifique se e um backup do Sillage Lab.'
    );
    e.target.value = '';
  }

  async function migrar() {
    setMsg('');
    const ok = await migrarDoLocalStorage();
    setMsg(
      ok
        ? 'Dados locais enviados para a nuvem! Recarregue a pagina. ✅'
        : 'Nenhum dado local encontrado neste navegador.'
    );
  }

  async function resetar() {
    await resetarTudo();
    window.location.reload();
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
        Regras do seu laboratorio
      </Typography>

      {/* ROTINA */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <AutorenewIcon sx={{ color: cores.dourado }} />
            <Typography variant="h6">Rotina de manutencao</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Agitar (homogeneizar) e arejar (abrir para liberar volateis) os lotes nos
            dias escolhidos. A rotina para sozinha quando a maceracao termina.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={rotinaAtual.ativa}
                onChange={(e) => setRotina({ ...rotinaAtual, ativa: e.target.checked })}
              />
            }
            label="Rotina ativa"
          />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Dias da semana
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {DIAS.map((d) => {
              const on = rotinaAtual.diasSemana.includes(d);
              return (
                <Chip
                  key={d}
                  label={DIAS_CURTOS[d]}
                  onClick={() => alternarDia(d)}
                  disabled={!rotinaAtual.ativa}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    minWidth: 62,
                    bgcolor: on ? 'rgba(176,141,87,0.2)' : 'rgba(255,255,255,0.05)',
                    color: on ? cores.dourado : cores.cinzaMedio,
                    border: on ? `1px solid ${cores.dourado}55` : '1px solid transparent',
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
              const on = rotinaAtual.acoes.includes(a);
              return (
                <Chip
                  key={a}
                  label={a}
                  onClick={() => alternarAcao(a)}
                  disabled={!rotinaAtual.ativa}
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

          {rotinaAtual.ativa && rotinaAtual.diasSemana.length > 0 && (
            <Alert severity="info" sx={{ mt: 2.5 }}>
              Os lotes em maceracao aparecerao para manutencao toda{' '}
              <strong>{rotinaAtual.diasSemana.map((d) => DIAS_CURTOS[d]).join(', ')}</strong>.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* PRODUCAO */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Inventory2Icon sx={{ color: cores.dourado }} />
            <Typography variant="h6">Producao e estoque</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Ao produzir um lote, o sistema calcula as quantidades e pode descontar
            automaticamente das materias-primas.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={baixaAtual}
                onChange={(e) => setBaixaAuto(e.target.checked)}
              />
            }
            label="Descontar do estoque ao produzir"
          />
          <Typography
            variant="caption"
            sx={{ display: 'block', color: cores.cinzaMedio, mt: 0.5 }}
          >
            Ao excluir um lote, o estoque consumido e devolvido automaticamente.
          </Typography>
        </CardContent>
      </Card>

      {/* MACERACAO PADRAO */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <TuneIcon sx={{ color: cores.dourado }} />
            <Typography variant="h6">Maceracao padrao</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Dias sugeridos ao cadastrar um perfume de cada concentracao.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {CONCENTRACOES.map((c) => (
              <TextField
                key={c}
                label={c}
                type="number"
                size="small"
                value={maceracaoAtual[c]}
                onChange={(e) =>
                  setMaceracao({ ...maceracaoAtual, [c]: Number(e.target.value) })
                }
                sx={{ flex: '1 1 130px' }}
              />
            ))}
            <TextField
              label="Marcos (dias, separados por virgula)"
              size="small"
              value={marcosAtual}
              onChange={(e) => setMarcos(e.target.value)}
              sx={{ flex: '1 1 100%' }}
              helperText="Ex: 7, 15, 30, 45, 60, 90"
            />
          </Box>
        </CardContent>
      </Card>

      {/* SALVAR */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Button variant="contained" size="large" onClick={salvarTudo} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar configuracoes'}
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

      {/* MIGRACAO */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <CloudUploadIcon sx={{ color: cores.dourado }} />
            <Typography variant="h6">Trazer dados deste navegador</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Se voce usou o Sillage Lab neste dispositivo antes da nuvem, envie aqueles
            cadastros para a nuvem. Faca isso uma unica vez.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={migrar}>
            Enviar dados locais para a nuvem
          </Button>
        </CardContent>
      </Card>

      {/* BACKUP */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>💾 Backup</Typography>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Seus dados ja ficam seguros na nuvem, mas voce pode guardar uma copia em
            arquivo quando quiser.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => baixarBackup()}
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

      {/* ZONA PERIGOSA */}
      <Card sx={{ borderColor: `${cores.descartado}55` }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, color: cores.descartado }}>
            Zona perigosa
          </Typography>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
            Apaga todos os dados do laboratorio na nuvem — para voce e para quem
            compartilha o acesso. Nao ha volta; exporte um backup antes.
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
            Perfumes, formulas, lotes, avaliacoes, manutencoes e materias-primas serao
            removidos da nuvem para todos os usuarios.
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
