// ============================================================
// SILLAGE LAB - MATERIAS-PRIMAS
// Arquivo: src/pages/MateriasPrimas.tsx
// v5: densidade (g/ml) para conversao correta de peso/volume
// ============================================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  InputAdornment,
  Divider,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RateReviewIcon from '@mui/icons-material/RateReview';

import { cores } from '../theme/theme';
import type {
  IMateriaPrima,
  NotaPiramide,
  UnidadeMedida,
  Categoria,
  StatusAvaliacao,
} from '../models';
import { DENSIDADE_PADRAO } from '../models';
import {
  listarMateriasPrimas,
  salvarMateriaPrima,
  excluirMateriaPrima,
} from '../data/db';
import { useDados } from '../hooks/useDados';
import { Carregando, ErroTela, Vazio, Cabecalho } from '../components/Estados';

const TIPOS: NotaPiramide[] = ['Saida', 'Corpo', 'Fundo', 'Fixador', 'Solvente'];
const UNIDADES: UnidadeMedida[] = ['g', 'ml', 'un'];
const GENEROS: Categoria[] = ['Masculino', 'Feminino', 'Unissex'];
const STATUS_AVAL: StatusAvaliacao[] = ['Testando', 'Aprovado', 'Reprovado', 'Macerando'];

function corTipo(tipo: NotaPiramide): string {
  switch (tipo) {
    case 'Saida': return cores.prontoTeste;
    case 'Corpo': return cores.dourado;
    case 'Fundo': return cores.prontoVenda;
    case 'Fixador': return cores.macerando;
    case 'Solvente': return cores.cinzaMedio;
    default: return cores.cinzaMedio;
  }
}

function corStatusAvaliacao(s: StatusAvaliacao): string {
  switch (s) {
    case 'Aprovado': return cores.prontoVenda;
    case 'Reprovado': return cores.descartado;
    case 'Macerando': return cores.macerando;
    case 'Testando': return cores.prontoTeste;
    default: return cores.cinzaMedio;
  }
}

function hojeInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function materiaVazia(): Partial<IMateriaPrima> {
  return {
    nome: '',
    tipo: 'Corpo',
    unidade: 'g',
    densidade: DENSIDADE_PADRAO,
    estoqueAtual: 0,
    estoqueMinimo: 0,
    fornecedor: '',
    custoPorUnidade: undefined,
    observacoes: '',
    ativo: true,
    inspiracao: '',
    genero: undefined,
    statusAvaliacao: undefined,
    avaliadoPor: '',
    dataAvaliacao: '',
    feedbackAvaliacao: '',
  };
}

export default function MateriasPrimas() {
  const { dados: lista, carregando, erro, recarregar } = useDados<IMateriaPrima[]>(
    listarMateriasPrimas,
    []
  );

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<IMateriaPrima>>(materiaVazia());
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);

  function abrirNovo() {
    setForm(materiaVazia());
    setErroForm('');
    setMostrarAvaliacao(false);
    setAberto(true);
  }

  function abrirEdicao(m: IMateriaPrima) {
    setForm({ ...m, densidade: m.densidade ?? DENSIDADE_PADRAO });
    setErroForm('');
    setMostrarAvaliacao(
      Boolean(m.inspiracao || m.statusAvaliacao || m.feedbackAvaliacao)
    );
    setAberto(true);
  }

  async function salvar() {
    setErroForm('');
    if (!form.nome?.trim()) {
      setErroForm('Informe o nome da materia-prima.');
      return;
    }

    setSalvando(true);
    try {
      await salvarMateriaPrima({
        id: form.id,
        nome: form.nome!.trim(),
        tipo: form.tipo as NotaPiramide,
        unidade: form.unidade as UnidadeMedida,
        densidade: Number(form.densidade) || DENSIDADE_PADRAO,
        estoqueAtual: Number(form.estoqueAtual) || 0,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        fornecedor: form.fornecedor ?? '',
        custoPorUnidade: form.custoPorUnidade
          ? Number(form.custoPorUnidade)
          : undefined,
        observacoes: form.observacoes ?? '',
        ativo: form.ativo ?? true,
        inspiracao: mostrarAvaliacao ? (form.inspiracao ?? '') : '',
        genero: mostrarAvaliacao ? form.genero : undefined,
        statusAvaliacao: mostrarAvaliacao ? form.statusAvaliacao : undefined,
        avaliadoPor: mostrarAvaliacao ? (form.avaliadoPor ?? '') : '',
        dataAvaliacao: mostrarAvaliacao ? (form.dataAvaliacao ?? '') : '',
        feedbackAvaliacao: mostrarAvaliacao ? (form.feedbackAvaliacao ?? '') : '',
      });
      setAberto(false);
      recarregar();
    } catch {
      setErroForm('Nao foi possivel salvar. Verifique sua conexao.');
    } finally {
      setSalvando(false);
    }
  }

  async function remover(m: IMateriaPrima) {
    if (
      window.confirm(
        `Excluir "${m.nome}"?\nSe ela estiver em alguma formula, o item ficara sem referencia.`
      )
    ) {
      await excluirMateriaPrima(m.id);
      recarregar();
    }
  }

  function ativarAvaliacao() {
    setMostrarAvaliacao(true);
    setForm((f) => ({
      ...f,
      dataAvaliacao: f.dataAvaliacao || hojeInput(),
      statusAvaliacao: f.statusAvaliacao ?? 'Testando',
    }));
  }

  if (carregando) return <Carregando />;

  const filtrada = lista.filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (m.inspiracao ?? '').toLowerCase().includes(busca.toLowerCase())
  );
  const emFalta = lista.filter((m) => m.estoqueAtual <= m.estoqueMinimo).length;

  return (
    <Box>
      <Cabecalho
        titulo="Materias-Primas"
        subtitulo={
          `${lista.length} insumo(s) cadastrado(s)` +
          (emFalta > 0 ? ` • ${emFalta} abaixo do minimo` : '')
        }
        acao={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Buscar nome ou inspiracao..."
              size="small"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: cores.cinzaMedio }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: 190, sm: 260 } }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
              Nova
            </Button>
          </Box>
        }
      />

      {erro && <ErroTela mensagem={erro} />}

      {lista.length === 0 ? (
        <Vazio
          icone={<Inventory2Icon />}
          titulo="Nenhuma materia-prima ainda."
          descricao="Cadastre suas essencias, fixadores e solventes para montar as formulas. 🧪"
        />
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Densidade</TableCell>
                  <TableCell align="right">Estoque</TableCell>
                  <TableCell align="right">Minimo</TableCell>
                  <TableCell sx={{ width: 110 }}>Nivel</TableCell>
                  <TableCell>Fornecedor</TableCell>
                  <TableCell align="right">Custo</TableCell>
                  <TableCell align="right">Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrada.map((m) => {
                  const baixo = m.estoqueAtual <= m.estoqueMinimo;
                  const base = Math.max(m.estoqueMinimo * 2, 1);
                  const pct = Math.min((m.estoqueAtual / base) * 100, 100);
                  const temAvaliacao = Boolean(m.statusAvaliacao);
                  const densidade = m.densidade ?? DENSIDADE_PADRAO;

                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {baixo && (
                            <WarningAmberIcon
                              fontSize="small"
                              sx={{ color: cores.descartado }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2">{m.nome}</Typography>
                            {(m.inspiracao || temAvaliacao) && (
                              <Tooltip
                                title={m.feedbackAvaliacao || 'Sem observacoes'}
                                arrow
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: temAvaliacao
                                      ? corStatusAvaliacao(m.statusAvaliacao!)
                                      : cores.cinzaMedio,
                                    cursor: m.feedbackAvaliacao ? 'help' : 'default',
                                  }}
                                >
                                  {m.inspiracao ? `insp. ${m.inspiracao}` : ''}
                                  {m.inspiracao && temAvaliacao ? ' • ' : ''}
                                  {temAvaliacao ? m.statusAvaliacao : ''}
                                </Typography>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.tipo}
                          size="small"
                          sx={{
                            bgcolor: `${corTipo(m.tipo)}22`,
                            color: corTipo(m.tipo),
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              densidade !== DENSIDADE_PADRAO
                                ? cores.douradoClaro
                                : cores.cinzaMedio,
                          }}
                        >
                          {densidade.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ color: baixo ? cores.descartado : 'inherit' }}
                        >
                          {m.estoqueAtual} {m.unidade}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                          {m.estoqueMinimo} {m.unidade}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: baixo ? cores.descartado : cores.prontoVenda,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                          {m.fornecedor || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                          {m.custoPorUnidade
                            ? `R$ ${m.custoPorUnidade.toFixed(2)}`
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => abrirEdicao(m)}
                          title="Editar"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => remover(m)}
                          title="Excluir"
                          sx={{ color: cores.descartado }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Modal */}
      <Dialog open={aberto} onClose={() => setAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.id ? 'Editar Materia-Prima' : 'Nova Materia-Prima'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              value={form.nome ?? ''}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              sx={{ flex: '2 1 240px' }}
              size="small"
              placeholder="Ex: Ambroxan, ou Good Girl (contratipo)"
            />
            <TextField
              select
              label="Tipo"
              value={form.tipo ?? 'Corpo'}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as NotaPiramide })
              }
              sx={{ flex: '1 1 150px' }}
              size="small"
            >
              {TIPOS.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Unidade"
              value={form.unidade ?? 'g'}
              onChange={(e) =>
                setForm({ ...form, unidade: e.target.value as UnidadeMedida })
              }
              sx={{ flex: '1 1 110px' }}
              size="small"
            >
              {UNIDADES.map((u) => (
                <MenuItem key={u} value={u}>{u}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Densidade (g/ml)"
              type="number"
              value={form.densidade ?? DENSIDADE_PADRAO}
              onChange={(e) => setForm({ ...form, densidade: Number(e.target.value) })}
              sx={{ flex: '1 1 150px' }}
              size="small"
              slotProps={{ htmlInput: { step: 0.01, min: 0.1 } }}
              helperText="1 = agua • ~0,95 maioria dos oleos"
            />
            <TextField
              label="Estoque atual"
              type="number"
              value={form.estoqueAtual ?? 0}
              onChange={(e) =>
                setForm({ ...form, estoqueAtual: Number(e.target.value) })
              }
              sx={{ flex: '1 1 150px' }}
              size="small"
            />
            <TextField
              label="Estoque minimo"
              type="number"
              value={form.estoqueMinimo ?? 0}
              onChange={(e) =>
                setForm({ ...form, estoqueMinimo: Number(e.target.value) })
              }
              sx={{ flex: '1 1 150px' }}
              size="small"
            />
            <TextField
              label="Fornecedor"
              value={form.fornecedor ?? ''}
              onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
              sx={{ flex: '2 1 200px' }}
              size="small"
              placeholder="Ex: AZ Fragrancias, Big Essencias..."
            />
            <TextField
              label="Custo por unidade"
              type="number"
              value={form.custoPorUnidade ?? ''}
              onChange={(e) =>
                setForm({ ...form, custoPorUnidade: Number(e.target.value) })
              }
              sx={{ flex: '1 1 160px' }}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Observacoes"
              value={form.observacoes ?? ''}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              sx={{ flex: '1 1 100%' }}
              size="small"
              multiline
              rows={2}
            />

            {/* ---------- SECAO: AVALIACAO (essencia pronta / contratipo) ---------- */}
            <Box sx={{ flex: '1 1 100%' }}>
              <Divider sx={{ my: 1 }} />
              {!mostrarAvaliacao ? (
                <Button
                  size="small"
                  startIcon={<RateReviewIcon />}
                  onClick={ativarAvaliacao}
                  sx={{ color: cores.dourado }}
                >
                  + Adicionar avaliacao (essencia pronta / contratipo)
                </Button>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <RateReviewIcon fontSize="small" sx={{ color: cores.dourado }} />
                    <Typography variant="subtitle2">
                      Avaliacao (essencia pronta / contratipo)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                      label="Inspiracao (perfume original)"
                      value={form.inspiracao ?? ''}
                      onChange={(e) => setForm({ ...form, inspiracao: e.target.value })}
                      sx={{ flex: '2 1 220px' }}
                      size="small"
                      placeholder="Ex: Good Girl, Baccarat Rouge 540"
                    />
                    <TextField
                      select
                      label="Genero"
                      value={form.genero ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, genero: e.target.value as Categoria })
                      }
                      sx={{ flex: '1 1 140px' }}
                      size="small"
                    >
                      {GENEROS.map((g) => (
                        <MenuItem key={g} value={g}>{g}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Status"
                      value={form.statusAvaliacao ?? 'Testando'}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          statusAvaliacao: e.target.value as StatusAvaliacao,
                        })
                      }
                      sx={{ flex: '1 1 150px' }}
                      size="small"
                    >
                      {STATUS_AVAL.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Avaliado por"
                      value={form.avaliadoPor ?? ''}
                      onChange={(e) => setForm({ ...form, avaliadoPor: e.target.value })}
                      sx={{ flex: '1 1 160px' }}
                      size="small"
                      placeholder="Rodrigo ou sua companheira"
                    />
                    <TextField
                      label="Data da avaliacao"
                      type="date"
                      value={form.dataAvaliacao ?? hojeInput()}
                      onChange={(e) => setForm({ ...form, dataAvaliacao: e.target.value })}
                      sx={{ flex: '1 1 160px' }}
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Feedback (fixacao, projecao, observacoes)"
                      value={form.feedbackAvaliacao ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, feedbackAvaliacao: e.target.value })
                      }
                      sx={{ flex: '1 1 100%' }}
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Ex: 25% volume, fixou 7h, projecao boa por 1h30, muito similar ao original"
                    />
                  </Box>
                </>
              )}
            </Box>

            {erroForm && (
              <Typography
                variant="body2"
                sx={{ color: cores.descartado, flex: '1 1 100%' }}
              >
                {erroForm}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAberto(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={salvar} variant="contained" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
