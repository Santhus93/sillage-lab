// ============================================================
// SILLAGE LAB - FORMULAS
// Arquivo: src/pages/Formulas.tsx
// Coracao do sistema: monta a composicao do perfume usando
// as materias-primas cadastradas, com versionamento.
// ============================================================

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ScienceIcon from '@mui/icons-material/Science';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { cores } from '../theme/theme';
import type { IFormulaItem, NotaPiramide } from '../models';
import {
  listarPerfumes,
  listarMateriasPrimas,
  listarFormulasDoPerfume,
  formulaAtiva,
  salvarFormula,
} from '../data/db';

// Cor por tipo (mesma logica da tela de Materias-Primas)
function corTipo(tipo?: NotaPiramide): string {
  switch (tipo) {
    case 'Saida': return cores.prontoTeste;
    case 'Corpo': return cores.dourado;
    case 'Fundo': return cores.prontoVenda;
    case 'Fixador': return cores.macerando;
    case 'Solvente': return cores.cinzaMedio;
    default: return cores.cinzaMedio;
  }
}

export default function Formulas() {
  const perfumes = listarPerfumes();
  const materias = listarMateriasPrimas();

  // O concentrado e so o oleo puro: solventes (alcool, agua, DPG)
  // entram depois, no card de Diluicao final.
  const materiasConcentrado = materias.filter((m) => m.tipo !== 'Solvente');

  const [perfumeId, setPerfumeId] = useState<string>('');
  const [itens, setItens] = useState<IFormulaItem[]>([]);
  const [concentrado, setConcentrado] = useState<number>(25);
  const [alcool, setAlcool] = useState<number>(73);
  const [agua, setAgua] = useState<number>(2);
  const [observacoes, setObservacoes] = useState('');
  const [msg, setMsg] = useState('');

  // Campos para adicionar um novo item
  const [novaMateria, setNovaMateria] = useState('');
  const [novoPercentual, setNovoPercentual] = useState<number | ''>('');

  const versoes = perfumeId ? listarFormulasDoPerfume(perfumeId) : [];
  const ativa = perfumeId ? formulaAtiva(perfumeId) : undefined;

  // Carrega a formula ativa ao trocar de perfume
  function trocarPerfume(id: string) {
    setPerfumeId(id);
    setMsg('');
    const f = formulaAtiva(id);
    if (f) {
      setItens(f.itens);
      setConcentrado(f.percentualConcentrado);
      setAlcool(f.percentualAlcool);
      setAgua(f.percentualAgua ?? 0);
      setObservacoes(f.observacoes ?? '');
    } else {
      setItens([]);
      setConcentrado(25);
      setAlcool(73);
      setAgua(2);
      setObservacoes('');
    }
  }

  function nomeMateria(id: string): string {
    return materias.find((m) => m.id === id)?.nome ?? '(removida)';
  }

  function tipoMateria(id: string): NotaPiramide | undefined {
    return materias.find((m) => m.id === id)?.tipo;
  }

  function adicionarItem() {
    setMsg('');
    if (!novaMateria || !novoPercentual) return;
    if (itens.some((i) => i.materiaPrimaId === novaMateria)) {
      setMsg('Essa materia-prima ja esta na formula.');
      return;
    }
    setItens([
      ...itens,
      {
        materiaPrimaId: novaMateria,
        percentual: Number(novoPercentual),
        nota: tipoMateria(novaMateria),
        ordem: itens.length + 1,
      },
    ]);
    setNovaMateria('');
    setNovoPercentual('');
  }

  function removerItem(materiaPrimaId: string) {
    setItens(itens.filter((i) => i.materiaPrimaId !== materiaPrimaId));
  }

  function alterarPercentual(materiaPrimaId: string, valor: number) {
    setItens(
      itens.map((i) =>
        i.materiaPrimaId === materiaPrimaId ? { ...i, percentual: valor } : i
      )
    );
  }

  // Totais
  const totais = useMemo(() => {
    const totalItens = itens.reduce((s, i) => s + (i.percentual || 0), 0);
    const totalDiluicao = concentrado + alcool + agua;
    return {
      totalItens,
      totalDiluicao,
      itensOk: Math.abs(totalItens - 100) < 0.01,
      diluicaoOk: Math.abs(totalDiluicao - 100) < 0.01,
    };
  }, [itens, concentrado, alcool, agua]);

  function salvar() {
    setMsg('');
    if (!perfumeId) {
      setMsg('Selecione um perfume.');
      return;
    }
    if (itens.length === 0) {
      setMsg('Adicione ao menos uma materia-prima.');
      return;
    }

    const nova = salvarFormula({
      perfumeId,
      itens,
      percentualConcentrado: concentrado,
      percentualAlcool: alcool,
      percentualAgua: agua,
      ativa: true,
      observacoes,
    });

    setMsg(`Formula salva como versao ${nova.versao}. ✅`);
  }

  const perfumeSel = perfumes.find((p) => p.id === perfumeId);

  // Sem perfumes cadastrados
  if (perfumes.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Formulas
        </Typography>
        <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
          Composicao dos seus perfumes
        </Typography>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ScienceIcon sx={{ fontSize: 48, color: cores.cinzaMedio, mb: 1 }} />
            <Typography variant="body1" sx={{ color: cores.cinzaClaro }}>
              Cadastre um perfume primeiro.
            </Typography>
            <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
              A formula sempre pertence a um perfume. 🌹
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabecalho */}
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Formulas
      </Typography>
      <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 3 }}>
        Composicao dos seus perfumes
      </Typography>

      {/* Selecao do perfume */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <TextField
              select
              label="Perfume"
              value={perfumeId}
              onChange={(e) => trocarPerfume(e.target.value)}
              size="small"
              sx={{ flex: '1 1 280px' }}
            >
              {perfumes.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.codigo} — {p.nome}
                </MenuItem>
              ))}
            </TextField>

            {perfumeSel && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={perfumeSel.categoria} size="small" variant="outlined" />
                <Chip label={perfumeSel.familia} size="small" variant="outlined" />
                <Chip label={perfumeSel.concentracao} size="small" variant="outlined" />
              </Box>
            )}

            {perfumeId && versoes.length > 0 && (
              <Tooltip title={`${versoes.length} versao(oes) salva(s)`}>
                <Chip
                  icon={<HistoryIcon />}
                  label={
                    ativa ? `Versao ativa: v${ativa.versao}` : 'Sem versao ativa'
                  }
                  size="small"
                  sx={{
                    bgcolor: 'rgba(176,141,87,0.15)',
                    color: cores.dourado,
                    fontWeight: 600,
                  }}
                />
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>

      {perfumeId && (
        <>
          {/* Composicao do concentrado */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Typography variant="h6">🧪 Composicao do concentrado</Typography>
                <Chip
                  icon={totais.itensOk ? <CheckCircleIcon /> : undefined}
                  label={`Total: ${totais.totalItens.toFixed(1)}%`}
                  sx={{
                    bgcolor: totais.itensOk
                      ? `${cores.prontoVenda}22`
                      : `${cores.macerando}22`,
                    color: totais.itensOk ? cores.prontoVenda : cores.macerando,
                    fontWeight: 700,
                  }}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min(totais.totalItens, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mb: 2,
                  bgcolor: 'rgba(255,255,255,0.08)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: totais.itensOk ? cores.prontoVenda : cores.dourado,
                  },
                }}
              />

              {/* Adicionar item */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <TextField
                  select
                  label="Materia-prima"
                  value={novaMateria}
                  onChange={(e) => setNovaMateria(e.target.value)}
                  size="small"
                  sx={{ flex: '2 1 240px' }}
                  helperText="Solventes entram na diluicao final"
                >
                  {materiasConcentrado.length === 0 ? (
                    <MenuItem disabled value="">
                      Nenhuma materia-prima disponivel
                    </MenuItem>
                  ) : (
                    materiasConcentrado.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.nome} ({m.tipo})
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <TextField
                  label="%"
                  type="number"
                  value={novoPercentual}
                  onChange={(e) =>
                    setNovoPercentual(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  size="small"
                  sx={{ flex: '0 1 110px' }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={adicionarItem}
                  disabled={!novaMateria || !novoPercentual}
                >
                  Adicionar
                </Button>
              </Box>

              {/* Tabela de itens */}
              {itens.length === 0 ? (
                <Typography variant="body2" sx={{ color: cores.cinzaMedio, py: 2 }}>
                  Nenhum ingrediente na formula ainda. Adicione acima. 👆
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ingrediente</TableCell>
                        <TableCell>Nota</TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>
                          Percentual
                        </TableCell>
                        <TableCell align="right" sx={{ width: 70 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itens.map((i) => (
                        <TableRow key={i.materiaPrimaId} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {nomeMateria(i.materiaPrimaId)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tipoMateria(i.materiaPrimaId) ?? '—'}
                              size="small"
                              sx={{
                                bgcolor: `${corTipo(tipoMateria(i.materiaPrimaId))}22`,
                                color: corTipo(tipoMateria(i.materiaPrimaId)),
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={i.percentual}
                              onChange={(e) =>
                                alterarPercentual(
                                  i.materiaPrimaId,
                                  Number(e.target.value)
                                )
                              }
                              size="small"
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => removerItem(i.materiaPrimaId)}
                              sx={{ color: cores.descartado }}
                              title="Remover"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Diluicao final */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Typography variant="h6">🧴 Diluicao final</Typography>
                <Chip
                  icon={totais.diluicaoOk ? <CheckCircleIcon /> : undefined}
                  label={`Total: ${totais.totalDiluicao.toFixed(1)}%`}
                  sx={{
                    bgcolor: totais.diluicaoOk
                      ? `${cores.prontoVenda}22`
                      : `${cores.descartado}22`,
                    color: totais.diluicaoOk
                      ? cores.prontoVenda
                      : cores.descartado,
                    fontWeight: 700,
                  }}
                />
              </Box>

              <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  label="Concentrado (%)"
                  type="number"
                  value={concentrado}
                  onChange={(e) => setConcentrado(Number(e.target.value))}
                  size="small"
                  sx={{ flex: '1 1 160px' }}
                />
                <TextField
                  label="Alcool (%)"
                  type="number"
                  value={alcool}
                  onChange={(e) => setAlcool(Number(e.target.value))}
                  size="small"
                  sx={{ flex: '1 1 160px' }}
                />
                <TextField
                  label="Agua (%)"
                  type="number"
                  value={agua}
                  onChange={(e) => setAgua(Number(e.target.value))}
                  size="small"
                  sx={{ flex: '1 1 160px' }}
                />
                <TextField
                  label="Observacoes da formula"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  size="small"
                  sx={{ flex: '1 1 100%' }}
                  multiline
                  rows={2}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Acoes */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={salvar}
              size="large"
            >
              {ativa ? `Salvar como versao ${ativa.versao + 1}` : 'Salvar formula'}
            </Button>

            {!totais.itensOk && itens.length > 0 && (
              <Typography variant="caption" sx={{ color: cores.macerando }}>
                O concentrado nao soma 100% — voce pode salvar assim mesmo.
              </Typography>
            )}

            {msg && (
              <Alert
                severity={msg.includes('✅') ? 'success' : 'warning'}
                sx={{ flex: '1 1 260px' }}
              >
                {msg}
              </Alert>
            )}
          </Box>

          {/* Historico de versoes */}
          {versoes.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📚 Historico de versoes
                </Typography>
                <Divider sx={{ mb: 2, borderColor: 'rgba(176,141,87,0.12)' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {versoes
                    .slice()
                    .sort((a, b) => b.versao - a.versao)
                    .map((v) => (
                      <Box
                        key={v.id}
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
                            label={`v${v.versao}`}
                            size="small"
                            sx={{
                              bgcolor: v.ativa
                                ? `${cores.prontoVenda}22`
                                : 'rgba(255,255,255,0.06)',
                              color: v.ativa ? cores.prontoVenda : cores.cinzaMedio,
                              fontWeight: 700,
                            }}
                          />
                          <Typography variant="body2">
                            {v.itens.length} ingrediente(s) •{' '}
                            {v.percentualConcentrado}% concentrado
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: cores.cinzaMedio }}>
                          {new Date(v.criadoEm).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
