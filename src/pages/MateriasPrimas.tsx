// ============================================================
// SILLAGE LAB - MATERIAS-PRIMAS
// Arquivo: src/pages/MateriasPrimas.tsx
// Biblioteca de insumos: essencias, fixadores, solventes.
// E a base das Formulas (cada item da formula aponta pra ca).
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
  carregarDB,
  salvarDB,
} from '../data/db';

const TIPOS: NotaPiramide[] = ['Saida', 'Corpo', 'Fundo', 'Fixador', 'Solvente'];
const UNIDADES: UnidadeMedida[] = ['g', 'ml', 'un'];

// Cor por tipo (piramide olfativa)
function corTipo(tipo: NotaPiramide): string {
  switch (tipo) {
    case 'Saida': return cores.prontoTeste;   // azul (volatil)
    case 'Corpo': return cores.dourado;       // dourado (coracao)
    case 'Fundo': return cores.prontoVenda;   // verde (base)
    case 'Fixador': return cores.macerando;   // amarelo
    case 'Solvente': return cores.cinzaMedio; // cinza
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
  const [lista, setLista] = useState<IMateriaPrima[]>(listarMateriasPrimas());
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<IMateriaPrima>>(materiaVazia());
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  function recarregar() {
    setLista(listarMateriasPrimas());
  }

  function abrirNovo() {
    setForm(materiaVazia());
    setErro('');
    setAberto(true);
  }

  function abrirEdicao(m: IMateriaPrima) {
    setForm({ ...m });
    setErro('');
    setAberto(true);
  }

  function salvar() {
    setErro('');
    if (!form.nome?.trim()) {
      setErro('Informe o nome da materia-prima.');
      return;
    }

    salvarMateriaPrima({
      id: form.id,
      nome: form.nome!.trim(),
      tipo: form.tipo as NotaPiramide,
      unidade: form.unidade as UnidadeMedida,
      estoqueAtual: Number(form.estoqueAtual) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
      fornecedor: form.fornecedor,
      custoPorUnidade: form.custoPorUnidade
        ? Number(form.custoPorUnidade)
        : undefined,
      observacoes: form.observacoes,
      ativo: form.ativo ?? true,
    });

    recarregar();
    setAberto(false);
  }

  function remover(m: IMateriaPrima) {
    if (
      window.confirm(
        `Excluir "${m.nome}"?\nSe ela estiver em alguma formula, o item ficara sem referencia.`
      )
    ) {
      const db = carregarDB();
      db.materiasPrimas = db.materiasPrimas.filter((x) => x.id !== m.id);
      salvarDB(db);
      recarregar();
    }
  }

  // Filtro da busca
  const filtrada = lista.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const emFalta = lista.filter((m) => m.estoqueAtual <= m.estoqueMinimo).length;

  return (
    <Box>
      {/* Cabecalho */}
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
            Materias-Primas
          </Typography>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
            {lista.length} insumo(s) cadastrado(s)
            {emFalta > 0 && ` • ${emFalta} abaixo do minimo`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            placeholder="Buscar..."
            size="small"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: cores.cinzaMedio }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 220 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Nova Materia-Prima
          </Button>
        </Box>
      </Box>

      {/* Lista */}
      {lista.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Inventory2Icon
              sx={{ fontSize: 48, color: cores.cinzaMedio, mb: 1 }}
            />
            <Typography variant="body1" sx={{ color: cores.cinzaClaro }}>
              Nenhuma materia-prima ainda.
            </Typography>
            <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
              Cadastre suas essencias, fixadores e solventes para montar as
              formulas. 🧪
            </Typography>
          </CardContent>
        </Card>
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
                  // nivel visual: quanto do "dobro do minimo" ainda tem
                  const base = Math.max(m.estoqueMinimo * 2, 1);
                  const pct = Math.min((m.estoqueAtual / base) * 100, 100);

                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
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
                        <Typography
                          variant="body2"
                          sx={{ color: cores.cinzaMedio }}
                        >
                          {m.estoqueMinimo} {m.unidade}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.08)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: baixo
                                ? cores.descartado
                                : cores.prontoVenda,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: cores.cinzaMedio }}
                        >
                          {m.fornecedor || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ color: cores.cinzaMedio }}
                        >
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

      {/* Modal de cadastro/edicao */}
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

            {erro && (
              <Typography
                variant="body2"
                sx={{ color: cores.descartado, flex: '1 1 100%' }}
              >
                {erro}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAberto(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={salvar} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
