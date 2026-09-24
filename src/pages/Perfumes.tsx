// ============================================================
// SILLAGE LAB - PERFUMES
// Arquivo: src/pages/Perfumes.tsx
// Lista + cadastro/edicao/exclusao (nuvem)
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SpaIcon from '@mui/icons-material/Spa';

import { cores } from '../theme/theme';
import type {
  IPerfume,
  Categoria,
  FamiliaOlfativa,
  Concentracao,
  StatusPerfume,
} from '../models';
import { MACERACAO_PADRAO } from '../models';
import { listarPerfumes, salvarPerfume, excluirPerfume } from '../data/db';
import { useDados } from '../hooks/useDados';
import { Carregando, ErroTela, Vazio, Cabecalho } from '../components/Estados';

const CATEGORIAS: Categoria[] = ['Masculino', 'Feminino', 'Unissex'];

const FAMILIAS: FamiliaOlfativa[] = [
  'Citrico', 'Floral', 'Amadeirado', 'Oriental', 'Aromatico',
  'Chipre', 'Fougere', 'Gourmand', 'Aquatico', 'Couro',
];

const CONCENTRACOES: Concentracao[] = [
  'Colonia', 'EDT', 'EDP', 'Parfum', 'Extrait',
];

const STATUS: StatusPerfume[] = ['Ativo', 'Em Desenvolvimento', 'Arquivado'];

function perfumeVazio(): Partial<IPerfume> {
  return {
    codigo: '',
    nome: '',
    categoria: 'Unissex',
    familia: 'Amadeirado',
    concentracao: 'EDP',
    maceracaoDias: MACERACAO_PADRAO['EDP'],
    status: 'Ativo',
    descricao: '',
    observacoes: '',
  };
}

function corStatus(status: StatusPerfume): string {
  switch (status) {
    case 'Ativo': return cores.prontoVenda;
    case 'Em Desenvolvimento': return cores.macerando;
    case 'Arquivado': return cores.cinzaMedio;
    default: return cores.cinzaMedio;
  }
}

export default function Perfumes() {
  const { dados: lista, carregando, erro, recarregar } = useDados<IPerfume[]>(
    listarPerfumes,
    []
  );

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<IPerfume>>(perfumeVazio());
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  function abrirNovo() {
    setForm(perfumeVazio());
    setErroForm('');
    setAberto(true);
  }

  function abrirEdicao(p: IPerfume) {
    setForm({ ...p });
    setErroForm('');
    setAberto(true);
  }

  function mudarConcentracao(c: Concentracao) {
    setForm((f) => ({ ...f, concentracao: c, maceracaoDias: MACERACAO_PADRAO[c] }));
  }

  async function salvar() {
    setErroForm('');
    if (!form.codigo?.trim() || !form.nome?.trim()) {
      setErroForm('Preencha ao menos o codigo e o nome.');
      return;
    }

    setSalvando(true);
    try {
      await salvarPerfume({
        id: form.id,
        codigo: form.codigo!.trim(),
        nome: form.nome!.trim(),
        categoria: form.categoria as Categoria,
        familia: form.familia as FamiliaOlfativa,
        concentracao: form.concentracao as Concentracao,
        maceracaoDias: Number(form.maceracaoDias) || undefined,
        status: form.status as StatusPerfume,
        descricao: form.descricao ?? '',
        observacoes: form.observacoes ?? '',
      });
      setAberto(false);
      recarregar();
    } catch {
      setErroForm('Nao foi possivel salvar. Verifique sua conexao.');
    } finally {
      setSalvando(false);
    }
  }

  async function remover(p: IPerfume) {
    if (
      window.confirm(
        `Excluir o perfume "${p.nome}"?\nSuas formulas e lotes tambem serao removidos.`
      )
    ) {
      await excluirPerfume(p.id);
      recarregar();
    }
  }

  if (carregando) return <Carregando />;

  return (
    <Box>
      <Cabecalho
        titulo="Perfumes"
        subtitulo={`${lista.length} perfume(s) cadastrado(s)`}
        acao={
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo Perfume
          </Button>
        }
      />

      {erro && <ErroTela mensagem={erro} />}

      {lista.length === 0 ? (
        <Vazio
          icone={<SpaIcon />}
          titulo="Nenhum perfume ainda."
          descricao='Clique em "Novo Perfume" para comecar seu catalogo. 🌹'
        />
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {lista.map((p) => (
            <Card key={p.id} sx={{ flex: '1 1 300px', maxWidth: { sm: 380 } }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: cores.dourado, fontWeight: 600 }}
                    >
                      {p.codigo}
                    </Typography>
                    <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                      {p.nome}
                    </Typography>
                  </Box>
                  <Chip
                    label={p.status}
                    size="small"
                    sx={{
                      bgcolor: `${corStatus(p.status)}22`,
                      color: corStatus(p.status),
                      fontWeight: 600,
                    }}
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  <Chip label={p.categoria} size="small" variant="outlined" />
                  <Chip label={p.familia} size="small" variant="outlined" />
                  <Chip label={p.concentracao} size="small" variant="outlined" />
                  <Chip
                    label={`${p.maceracaoDias ?? MACERACAO_PADRAO[p.concentracao]} dias`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 0.5,
                    mt: 1.5,
                  }}
                >
                  <IconButton size="small" onClick={() => abrirEdicao(p)} title="Editar">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => remover(p)}
                    title="Excluir"
                    sx={{ color: cores.descartado }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Modal */}
      <Dialog open={aberto} onClose={() => setAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? 'Editar Perfume' : 'Novo Perfume'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
            <TextField
              label="Codigo"
              value={form.codigo ?? ''}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              sx={{ flex: '1 1 140px' }}
              size="small"
            />
            <TextField
              label="Nome"
              value={form.nome ?? ''}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              sx={{ flex: '2 1 240px' }}
              size="small"
            />
            <TextField
              select
              label="Categoria"
              value={form.categoria ?? 'Unissex'}
              onChange={(e) =>
                setForm({ ...form, categoria: e.target.value as Categoria })
              }
              sx={{ flex: '1 1 160px' }}
              size="small"
            >
              {CATEGORIAS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Familia Olfativa"
              value={form.familia ?? 'Amadeirado'}
              onChange={(e) =>
                setForm({ ...form, familia: e.target.value as FamiliaOlfativa })
              }
              sx={{ flex: '1 1 160px' }}
              size="small"
            >
              {FAMILIAS.map((f) => (
                <MenuItem key={f} value={f}>{f}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Concentracao"
              value={form.concentracao ?? 'EDP'}
              onChange={(e) => mudarConcentracao(e.target.value as Concentracao)}
              sx={{ flex: '1 1 160px' }}
              size="small"
            >
              {CONCENTRACOES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Maceracao (dias)"
              type="number"
              value={form.maceracaoDias ?? ''}
              onChange={(e) =>
                setForm({ ...form, maceracaoDias: Number(e.target.value) })
              }
              sx={{ flex: '1 1 140px' }}
              size="small"
            />
            <TextField
              select
              label="Status"
              value={form.status ?? 'Ativo'}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as StatusPerfume })
              }
              sx={{ flex: '1 1 160px' }}
              size="small"
            >
              {STATUS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Descricao"
              value={form.descricao ?? ''}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              sx={{ flex: '1 1 100%' }}
              size="small"
              multiline
              rows={2}
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
