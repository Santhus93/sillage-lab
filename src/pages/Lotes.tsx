// ============================================================
// SILLAGE LAB - LOTES
// Arquivo: src/pages/Lotes.tsx
// Producao, semaforo, timeline, avaliacoes e manutencoes (nuvem)
// ============================================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Alert,
  Collapse,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RateReviewIcon from '@mui/icons-material/RateReview';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { cores } from '../theme/theme';
import type {
  ILote,
  IPerfume,
  IAvaliacao,
  IManutencao,
  StatusLote,
} from '../models';
import { MACERACAO_PADRAO } from '../models';
import {
  listarLotes,
  listarPerfumes,
  listarAvaliacoes,
  listarManutencoes,
  formulaAtiva,
  criarLote,
  atualizarLote,
  excluirLote,
  calcularStatusLote,
  diasDesdeProducao,
  salvarAvaliacao,
  loteEmMaceracao,
} from '../data/db';
import { useDados } from '../hooks/useDados';
import { Carregando, ErroTela, Vazio, Cabecalho } from '../components/Estados';

function corStatus(s: StatusLote): string {
  switch (s) {
    case 'Macerando': return cores.macerando;
    case 'Pronto para Teste': return cores.prontoTeste;
    case 'Pronto para Venda': return cores.prontoVenda;
    case 'Descartado': return cores.descartado;
    default: return cores.cinzaMedio;
  }
}

function emoji(s: StatusLote): string {
  switch (s) {
    case 'Macerando': return '🟡';
    case 'Pronto para Teste': return '🔵';
    case 'Pronto para Venda': return '🟢';
    case 'Descartado': return '🔴';
    default: return '⚪';
  }
}

function dataBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function hojeInput(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Base {
  lotes: ILote[];
  perfumes: IPerfume[];
  avaliacoes: IAvaliacao[];
  manutencoes: IManutencao[];
}

async function carregarBase(): Promise<Base> {
  const [lotes, perfumes, avaliacoes, manutencoes] = await Promise.all([
    listarLotes(),
    listarPerfumes(),
    listarAvaliacoes(),
    listarManutencoes(),
  ]);
  return { lotes, perfumes, avaliacoes, manutencoes };
}

export default function Lotes() {
  const { dados: base, carregando, erro, recarregar } = useDados<Base>(
    carregarBase,
    { lotes: [], perfumes: [], avaliacoes: [], manutencoes: [] }
  );

  const [aberto, setAberto] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Novo lote
  const [perfumeId, setPerfumeId] = useState('');
  const [volume, setVolume] = useState(500);
  const [dataProducao, setDataProducao] = useState(hojeInput());
  const [maceracaoDias, setMaceracaoDias] = useState(45);
  const [obs, setObs] = useState('');

  // Avaliacao
  const [avalAberto, setAvalAberto] = useState(false);
  const [loteAval, setLoteAval] = useState<ILote | null>(null);
  const [nota, setNota] = useState(8);
  const [fixacao, setFixacao] = useState<number | ''>('');
  const [projecao, setProjecao] = useState<number | ''>('');
  const [obsAval, setObsAval] = useState('');

  function nomePerfume(id: string): string {
    const p = base.perfumes.find((x) => x.id === id);
    return p ? `${p.codigo} — ${p.nome}` : '(perfume removido)';
  }

  function abrirNovo() {
    setPerfumeId('');
    setVolume(500);
    setDataProducao(hojeInput());
    setMaceracaoDias(45);
    setObs('');
    setErroForm('');
    setAberto(true);
  }

  function trocarPerfume(id: string) {
    setPerfumeId(id);
    const p = base.perfumes.find((x) => x.id === id);
    if (p) setMaceracaoDias(p.maceracaoDias ?? MACERACAO_PADRAO[p.concentracao]);
  }

  async function salvarLote() {
    setErroForm('');
    if (!perfumeId) {
      setErroForm('Selecione um perfume.');
      return;
    }
    if (!volume || volume <= 0) {
      setErroForm('Informe o volume produzido.');
      return;
    }

    setSalvando(true);
    try {
      const f = await formulaAtiva(perfumeId);
      if (!f) {
        setErroForm('Este perfume ainda nao tem formula ativa. Cadastre em Formulas.');
        return;
      }

      await criarLote({
        perfumeId,
        formulaId: f.id,
        volumeMl: Number(volume),
        dataProducao: new Date(dataProducao + 'T12:00:00').toISOString(),
        maceracaoDias: Number(maceracaoDias),
        observacoes: obs,
      });

      setAberto(false);
      recarregar();
    } catch {
      setErroForm('Nao foi possivel salvar. Verifique sua conexao.');
    } finally {
      setSalvando(false);
    }
  }

  async function descartar(l: ILote) {
    if (window.confirm(`Marcar o lote ${l.codigo} como Descartado?`)) {
      await atualizarLote(l.id, { statusManual: 'Descartado' });
      recarregar();
    }
  }

  async function remover(l: ILote) {
    if (
      window.confirm(`Excluir o lote ${l.codigo}? Isso apaga avaliacoes e manutencoes.`)
    ) {
      await excluirLote(l.id);
      recarregar();
    }
  }

  function abrirAvaliacao(l: ILote) {
    setLoteAval(l);
    setNota(8);
    setFixacao('');
    setProjecao('');
    setObsAval('');
    setAvalAberto(true);
  }

  async function salvarAval() {
    if (!loteAval) return;
    await salvarAvaliacao({
      loteId: loteAval.id,
      data: new Date().toISOString(),
      diaMaceracao: diasDesdeProducao(loteAval.dataProducao),
      nota: Number(nota),
      fixacao: fixacao === '' ? undefined : Number(fixacao),
      projecao: projecao === '' ? undefined : Number(projecao),
      observacao: obsAval,
    });
    setAvalAberto(false);
    recarregar();
  }

  if (carregando) return <Carregando />;

  if (base.perfumes.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>Lotes</Typography>
        <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
          Producao e acompanhamento
        </Typography>
        <Vazio
          icone={<LocalDrinkIcon />}
          titulo="Cadastre um perfume e uma formula primeiro."
        />
      </Box>
    );
  }

  return (
    <Box>
      <Cabecalho
        titulo="Lotes"
        subtitulo={`${base.lotes.length} lote(s) produzido(s)`}
        acao={
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo Lote
          </Button>
        }
      />

      {erro && <ErroTela mensagem={erro} />}

      {base.lotes.length === 0 ? (
        <Vazio
          icone={<LocalDrinkIcon />}
          titulo="Nenhum lote produzido ainda."
          descricao='Clique em "Novo Lote" para registrar sua primeira producao. 🧴'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {base.lotes.map((l) => {
            const status = calcularStatusLote(l);
            const dias = diasDesdeProducao(l.dataProducao);
            const avaliacoes = base.avaliacoes
              .filter((a) => a.loteId === l.id)
              .sort((a, b) => a.data.localeCompare(b.data));
            const manutencoes = base.manutencoes
              .filter((m) => m.loteId === l.id)
              .sort((a, b) => a.data.localeCompare(b.data));
            const aberto2 = expandido === l.id;
            const macerando = loteEmMaceracao(l);

            return (
              <Card key={l.id}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: cores.dourado, fontWeight: 600 }}
                      >
                        {l.codigo}
                      </Typography>
                      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                        {nomePerfume(l.perfumeId)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                        {l.volumeMl} ml • produzido em {dataBR(l.dataProducao)} •{' '}
                        {dias} dia(s)
                        {manutencoes.length > 0 &&
                          ` • ${manutencoes.length} manutencao(oes)`}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={`${emoji(status)} ${status}`}
                        sx={{
                          bgcolor: `${corStatus(status)}22`,
                          color: corStatus(status),
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip title="Registrar avaliacao olfativa">
                        <IconButton size="small" onClick={() => abrirAvaliacao(l)}>
                          <RateReviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Marcar como descartado">
                        <IconButton
                          size="small"
                          onClick={() => descartar(l)}
                          sx={{ color: cores.macerando }}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir lote">
                        <IconButton
                          size="small"
                          onClick={() => remover(l)}
                          sx={{ color: cores.descartado }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => setExpandido(aberto2 ? null : l.id)}
                      >
                        {aberto2 ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={aberto2}>
                    <Divider sx={{ my: 2 }} />

                    {/* Timeline */}
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      Timeline de maceracao
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        label={`Produzido • ${dataBR(l.dataProducao)}`}
                        size="small"
                        sx={{
                          bgcolor: `${cores.prontoVenda}22`,
                          color: cores.prontoVenda,
                          fontWeight: 600,
                        }}
                      />
                      {l.marcos
                        .filter((m) => m.dias <= l.maceracaoDias)
                        .map((m) => {
                          const atingido = new Date(m.data) <= new Date();
                          return (
                            <Chip
                              key={m.dias}
                              label={`${atingido ? '✅' : '⚪'} ${m.dias}d • ${dataBR(m.data)}`}
                              size="small"
                              variant={atingido ? 'filled' : 'outlined'}
                              sx={
                                atingido
                                  ? {
                                      bgcolor: 'rgba(176,141,87,0.15)',
                                      color: cores.dourado,
                                      fontWeight: 600,
                                    }
                                  : { color: cores.cinzaMedio }
                              }
                            />
                          );
                        })}
                    </Box>

                    <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                      Previsao de conclusao: <strong>{dataBR(l.dataPrevista)}</strong>
                      {l.observacoes && ` • ${l.observacoes}`}
                    </Typography>

                    {/* Manutencoes */}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AutorenewIcon fontSize="small" sx={{ color: cores.dourado }} />
                      <Typography variant="subtitle2">
                        Rotina de manutencao ({manutencoes.length})
                      </Typography>
                      {!macerando && (
                        <Chip
                          label="rotina encerrada"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: cores.cinzaMedio,
                          }}
                        />
                      )}
                    </Box>

                    {manutencoes.length === 0 ? (
                      <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                        Nenhuma manutencao registrada.
                        {macerando && ' Marque na tela de Maceracao nos dias da rotina.'}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        {manutencoes.map((m) => (
                          <Box
                            key={m.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Chip
                                label={`${m.diaMaceracao}d`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(176,141,87,0.15)',
                                  color: cores.dourado,
                                  fontWeight: 700,
                                  minWidth: 52,
                                }}
                              />
                              <Typography variant="body2">
                                {m.acoes.join(' + ')}
                              </Typography>
                              {m.observacao && (
                                <Typography
                                  variant="caption"
                                  sx={{ color: cores.cinzaClaro }}
                                >
                                  — {m.observacao}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                              {dataBR(m.data)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Avaliacoes */}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      Avaliacoes olfativas ({avaliacoes.length})
                    </Typography>

                    {avaliacoes.length === 0 ? (
                      <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                        Nenhuma avaliacao registrada.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {avaliacoes.map((a) => (
                          <Box
                            key={a.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Chip
                                label={`${a.diaMaceracao}d`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(176,141,87,0.15)',
                                  color: cores.dourado,
                                  fontWeight: 700,
                                  minWidth: 52,
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Nota {a.nota.toFixed(1)}
                              </Typography>
                              {a.fixacao !== undefined && (
                                <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                                  fixacao {a.fixacao}
                                </Typography>
                              )}
                              {a.projecao !== undefined && (
                                <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                                  projecao {a.projecao}
                                </Typography>
                              )}
                              {a.observacao && (
                                <Typography variant="caption" sx={{ color: cores.cinzaClaro }}>
                                  — {a.observacao}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                              {dataBR(a.data)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Modal novo lote */}
      <Dialog open={aberto} onClose={() => setAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Lote</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
            <TextField
              select
              label="Perfume"
              value={perfumeId}
              onChange={(e) => trocarPerfume(e.target.value)}
              size="small"
              sx={{ flex: '1 1 100%' }}
            >
              {base.perfumes.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.codigo} — {p.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Volume (ml)"
              type="number"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 150px' }}
            />
            <TextField
              label="Data de producao"
              type="date"
              value={dataProducao}
              onChange={(e) => setDataProducao(e.target.value)}
              size="small"
              sx={{ flex: '1 1 180px' }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Maceracao (dias)"
              type="number"
              value={maceracaoDias}
              onChange={(e) => setMaceracaoDias(Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 150px' }}
            />
            <TextField
              label="Observacoes"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              size="small"
              sx={{ flex: '1 1 100%' }}
              multiline
              rows={2}
            />
            {erroForm && (
              <Alert severity="warning" sx={{ flex: '1 1 100%' }}>
                {erroForm}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAberto(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={salvarLote} variant="contained" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Produzir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal avaliacao */}
      <Dialog open={avalAberto} onClose={() => setAvalAberto(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Avaliacao olfativa
          {loteAval && (
            <Typography variant="caption" sx={{ display: 'block', color: cores.cinzaMedio }}>
              {loteAval.codigo} • {diasDesdeProducao(loteAval.dataProducao)} dias
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
            <TextField
              label="Nota (0-10)"
              type="number"
              value={nota}
              onChange={(e) => setNota(Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 100%' }}
            />
            <TextField
              label="Fixacao (0-10)"
              type="number"
              value={fixacao}
              onChange={(e) => setFixacao(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 130px' }}
            />
            <TextField
              label="Projecao (0-10)"
              type="number"
              value={projecao}
              onChange={(e) => setProjecao(e.target.value === '' ? '' : Number(e.target.value))}
              size="small"
              sx={{ flex: '1 1 130px' }}
            />
            <TextField
              label="Observacao"
              value={obsAval}
              onChange={(e) => setObsAval(e.target.value)}
              size="small"
              sx={{ flex: '1 1 100%' }}
              multiline
              rows={3}
              placeholder="Ex: alcool ainda perceptivel"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvalAberto(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={salvarAval} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
