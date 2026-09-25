// ============================================================
// SILLAGE LAB - EMBALAGENS
// Arquivo: src/pages/Embalagens.tsx
// Vidros, tampas, valvulas, adesivos e caixas - componentes
// do produto final, com custo e estoque proprios.
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
import AllInboxIcon from '@mui/icons-material/AllInbox';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { cores } from '../theme/theme';
import type { IEmbalagem, TipoEmbalagem } from '../models';
import { TAMANHOS_VIDRO_COMUNS } from '../models';
import {
  listarEmbalagens,
  salvarEmbalagem,
  excluirEmbalagem,
} from '../data/db';
import { moeda } from '../data/producao';
import { useDados } from '../hooks/useDados';
import { Carregando, ErroTela, Vazio, Cabecalho } from '../components/Estados';

const TIPOS: TipoEmbalagem[] = ['Vidro', 'Valvula', 'Tampa', 'Adesivo', 'Caixa', 'Outro'];

function corTipo(tipo: TipoEmbalagem): string {
  switch (tipo) {
    case 'Vidro': return cores.prontoTeste;
    case 'Valvula': return cores.dourado;
    case 'Tampa': return cores.macerando;
    case 'Adesivo': return cores.prontoVenda;
    case 'Caixa': return cores.descartado;
    default: return cores.cinzaMedio;
  }
}

function embalagemVazia(): Partial<IEmbalagem> {
  return {
    nome: '',
    tipo: 'Vidro',
    tamanhoMl: undefined,
    custoUnitario: 0,
    estoqueAtual: 0,
    estoqueMinimo: 0,
    fornecedor: '',
    observacoes: '',
    ativo: true,
  };
}

export default function Embalagens() {
  const { dados: lista, carregando, erro, recarregar } = useDados<IEmbalagem[]>(
    listarEmbalagens,
    []
  );

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<IEmbalagem>>(embalagemVazia());
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');

  function abrirNovo() {
    setForm(embalagemVazia());
    setErroForm('');
    setAberto(true);
  }

  function abrirEdicao(e: IEmbalagem) {
    setForm({ ...e });
    setErroForm('');
    setAberto(true);
  }

  async function salvar() {
    setErroForm('');
    if (!form.nome?.trim()) {
      setErroForm('Informe o nome do item.');
      return;
    }

    setSalvando(true);
    try {
      await salvarEmbalagem({
        id: form.id,
        nome: form.nome!.trim(),
        tipo: form.tipo as TipoEmbalagem,
        tamanhoMl:
          form.tipo === 'Vidro' && form.tamanhoMl
            ? Number(form.tamanhoMl)
            : undefined,
        custoUnitario: Number(form.custoUnitario) || 0,
        estoqueAtual: Number(form.estoqueAtual) || 0,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        fornecedor: form.fornecedor ?? '',
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

  async function remover(e: IEmbalagem) {
    if (window.confirm(`Excluir "${e.nome}"?`)) {
      await excluirEmbalagem(e.id);
      recarregar();
    }
  }

  if (carregando) return <Carregando />;

  const filtrada = lista.filter((e) =>
    e.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const emFalta = lista.filter((e) => e.estoqueAtual <= e.estoqueMinimo).length;

  return (
    <Box>
      <Cabecalho
        titulo="Embalagens"
        subtitulo={
          `${lista.length} item(ns) cadastrado(s)` +
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
          icone={<AllInboxIcon />}
          titulo="Nenhuma embalagem ainda."
          descricao="Cadastre vidros, tampas, valvulas, adesivos e caixas para calcular o custo do produto final. 📦"
        />
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Tamanho</TableCell>
                  <TableCell align="right">Estoque</TableCell>
                  <TableCell sx={{ width: 120 }}>Nivel</TableCell>
                  <TableCell align="right">Custo unit.</TableCell>
                  <TableCell align="right">Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrada.map((e) => {
                  const baixo = e.estoqueAtual <= e.estoqueMinimo;
                  const base = Math.max(e.estoqueMinimo * 2, 1);
                  const pct = Math.min((e.estoqueAtual / base) * 100, 100);

                  return (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {baixo && (
                            <WarningAmberIcon
                              fontSize="small"
                              sx={{ color: cores.descartado }}
                            />
                          )}
                          <Typography variant="body2">{e.nome}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={e.tipo}
                          size="small"
                          sx={{
                            bgcolor: `${corTipo(e.tipo)}22`,
                            color: corTipo(e.tipo),
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                          {e.tamanhoMl ? `${e.tamanhoMl} ml` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ color: baixo ? cores.descartado : 'inherit' }}
                        >
                          {e.estoqueAtual} un
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
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
                          {moeda(e.custoUnitario)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => abrirEdicao(e)} title="Editar">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => remover(e)}
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
        <DialogTitle>{form.id ? 'Editar Embalagem' : 'Nova Embalagem'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              value={form.nome ?? ''}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              sx={{ flex: '2 1 220px' }}
              size="small"
              placeholder="Ex: Vidro 50ml, Tampa dourada"
            />
            <TextField
              select
              label="Tipo"
              value={form.tipo ?? 'Vidro'}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoEmbalagem })}
              sx={{ flex: '1 1 150px' }}
              size="small"
            >
              {TIPOS.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>

            {form.tipo === 'Vidro' && (
              <TextField
                select
                label="Tamanho (ml)"
                value={form.tamanhoMl ?? ''}
                onChange={(e) => setForm({ ...form, tamanhoMl: Number(e.target.value) })}
                sx={{ flex: '1 1 130px' }}
                size="small"
              >
                {TAMANHOS_VIDRO_COMUNS.map((t) => (
                  <MenuItem key={t} value={t}>{t} ml</MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Custo unitario"
              type="number"
              value={form.custoUnitario ?? 0}
              onChange={(e) => setForm({ ...form, custoUnitario: Number(e.target.value) })}
              sx={{ flex: '1 1 160px' }}
              size="small"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                },
              }}
            />
            <TextField
              label="Estoque atual"
              type="number"
              value={form.estoqueAtual ?? 0}
              onChange={(e) => setForm({ ...form, estoqueAtual: Number(e.target.value) })}
              sx={{ flex: '1 1 150px' }}
              size="small"
            />
            <TextField
              label="Estoque minimo"
              type="number"
              value={form.estoqueMinimo ?? 0}
              onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })}
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
              label="Observacoes"
              value={form.observacoes ?? ''}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              sx={{ flex: '1 1 100%' }}
              size="small"
              multiline
              rows={2}
            />

            {erroForm && (
              <Typography variant="body2" sx={{ color: cores.descartado, flex: '1 1 100%' }}>
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
