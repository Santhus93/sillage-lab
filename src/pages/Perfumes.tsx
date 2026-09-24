// ============================================================
// SILLAGE LAB - PERFUMES
// Arquivo: src/pages/Perfumes.tsx
// Lista + cadastro/edicao/exclusao de perfumes (modal)
// (Sem Stack: usa Box + flexbox, compativel com MUI novo)
// ============================================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
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

const CATEGORIAS: Categoria[] = ['Masculino', 'Feminino', 'Unissex'];

const FAMILIAS: FamiliaOlfativa[] = [
  'Citrico', 'Floral', 'Amadeirado', 'Oriental', 'Aromatico',
  'Chipre', 'Fougere', 'Gourmand', 'Aquatico', 'Couro',
];

const CONCENTRACOES: Concentracao[] = [
  'Colonia', 'EDT', 'EDP', 'Parfum', 'Extrait',
];

const STATUS: StatusPerfume[] = ['Ativo', 'Em Desenvolvimento', 'Arquivado'];

// Estado inicial de um formulario vazio
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

// Cor do chip de status
function corStatus(status: StatusPerfume): string {
  switch (status) {
    case 'Ativo': return cores.prontoVenda;
    case 'Em Desenvolvimento': return cores.macerando;
    case 'Arquivado': return cores.cinzaMedio;
    default: return cores.cinzaMedio;
  }
}

export default function Perfumes() {
  const [lista, setLista] = useState<IPerfume[]>(listarPerfumes());
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<IPerfume>>(perfumeVazio());
  const [erro, setErro] = useState('');

  function recarregar() {
    setLista(listarPerfumes());
  }

  function abrirNovo() {
    setForm(perfumeVazio());
    setErro('');
    setAberto(true);
  }

  function abrirEdicao(p: IPerfume) {
    setForm({ ...p });
    setErro('');
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
  }

  // Quando muda a concentracao, sugere a maceracao padrao
  function mudarConcentracao(c: Concentracao) {
    setForm((f) => ({
      ...f,
      concentracao: c,
      maceracaoDias: MACERACAO_PADRAO[c],
    }));
  }

  function salvar() {
    setErro('');
    if (!form.codigo?.trim() || !form.nome?.trim()) {
      setErro('Preencha ao menos o codigo e o nome.');
      return;
    }

    salvarPerfume({
      id: form.id,
      codigo: form.codigo!.trim(),
      nome: form.nome!.trim(),
      categoria: form.categoria as Categoria,
      familia: form.familia as FamiliaOlfativa,
      concentracao: form.concentracao as Concentracao,
      maceracaoDias: Number(form.maceracaoDias) || undefined,
      status: form.status as StatusPerfume,
      descricao: form.descricao,
      observacoes: form.observacoes,
    });

    recarregar();
    setAberto(false);
  }

  function remover(p: IPerfume) {
    if (
      window.confirm(
        `Excluir o perfume "${p.nome}"?\nSuas formulas e lotes tambem serao removidos.`
      )
    ) {
      excluirPerfume(p.id);
      recarregar();
    }
  }

  return (
    <Box>
      {/* Cabecalho */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Perfumes
          </Typography>
          <Typography variant="body2" sx={{ color: cores.cinzaMedio }}>
            {lista.length} perfume(s) cadastrado(s)
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Novo Perfume
        </Button>
      </Box>

      {/* Lista de perfumes */}
      {lista.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SpaIcon sx={{ fontSize: 48, color: cores.cinzaMedio, mb: 1 }} />
            <Typography variant="body1" sx={{ color: cores.cinzaClaro }}>
              Nenhum perfume ainda.
            </Typography>
            <Typography variant="body2" sx={{ color: cores.cinzaMedio, mb: 2 }}>
              Clique em "Novo Perfume" para comecar seu catalogo. 🌹
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {lista.map((p) => (
            <Card key={p.id} sx={{ flex: '1 1 300px', maxWidth: 380 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
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

                <Divider sx={{ my: 1.5, borderColor: 'rgba(176,141,87,0.12)' }} />

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

      {/* Modal de cadastro/edicao */}
      <Dialog open={aberto} onClose={fechar} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.id ? 'Editar Perfume' : 'Novo Perfume'}
        </DialogTitle>
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

            {erro && (
              <Typography variant="body2" sx={{ color: cores.descartado, flex: '1 1 100%' }}>
                {erro}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={fechar} color="secondary">
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
