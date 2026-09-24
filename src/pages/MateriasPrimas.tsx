// ============================================================
// SILLAGE LAB - MATERIAS-PRIMAS
// Arquivo: src/pages/MateriasPrimas.tsx
// Biblioteca de insumos (nuvem)
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { cores } from '../theme/theme';
import type { IMateriaPrima, NotaPiramide, UnidadeMedida } from '../models';
import {
  listarMateriasPrimas,
  salvarMateriaPrima,
  excluirMateriaPrima,
} from '../data/db';
import { useDados } from '../hooks/useDados';
import { Carregando, ErroTela, Vazio, Cabecalho } from '../components/Estados';

const TIPOS: NotaPiramide[] = ['Saida', 'Corpo', 'Fundo', 'Fixador', 'Solvente'];
const UNIDADES: UnidadeMedida[] = ['g', 'ml', 'un'];

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

function materiaVazia(): Partial<IMateriaPrima> {
  return {
    nome: '',
    tipo: 'Corpo',
    unidade: 'g',
    estoqueAtual: 0,
    estoqueMinimo: 0,
    fornecedor: '',
    custoPorUnidade: undefined,
    observacoes: '',
    ativo: true,
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

  function abrirNovo() {
    setForm(materiaVazia());
    setErroForm('');
    setAberto(true);
  }

  function abrirEdicao(m: IMateriaPrima) {
    setForm({ ...m });
    setErroForm('');
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
        estoqueAtual: Number(form.estoqueAtual) || 0,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        fornecedor: form.fornecedor ?? '',
        custoPorUnidade: form.custoPorUnidade
          ? Number(form.custoPorUnidade)
          : undefined,
        observacoes: form.observacoes ?? '',
        ativo: form.ativo ?? true,
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

  if (carregando) return <Carregando />;

  const filtrada = lista.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
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
              placeholder="Buscar..."
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
              sx={{ width: { xs: 160, sm: 220 } }}
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
                  <TableCell align="right">Estoque</TableCell>
                  <TableCell align="right">Minimo</TableCell>
                  <TableCell sx={{ width: 130 }}>Nivel</TableCell>
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
                          <Typography variant="body2">{m.nome}</Typography>
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
              placeholder="Ex: Ambroxan"
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
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
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
