// ============================================================
// SILLAGE LAB - APP PRINCIPAL
// Arquivo: src/App.tsx
// Tema + Login local + Menu lateral + Navegacao
// Todas as telas plugadas (MVP completo)
// ============================================================

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  Paper,
  IconButton,
  Divider,
  Alert,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SpaIcon from '@mui/icons-material/Spa';
import ScienceIcon from '@mui/icons-material/Science';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import EventIcon from '@mui/icons-material/Event';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

import theme, { cores } from './theme/theme';
import { carregarConfig, salvarConfig, lotesPendentesRotina } from './data/db';
import Dashboard from './pages/Dashboard';
import Perfumes from './pages/Perfumes';
import Formulas from './pages/Formulas';
import Lotes from './pages/Lotes';
import Maceracao from './pages/Maceracao';
import MateriasPrimas from './pages/MateriasPrimas';
import Configuracoes from './pages/Configuracoes';

const LARGURA_MENU = 240;

type Tela =
  | 'dashboard'
  | 'perfumes'
  | 'formulas'
  | 'lotes'
  | 'maceracao'
  | 'materias'
  | 'config';

const MENU: { id: Tela; texto: string; icone: ReactNode }[] = [
  { id: 'dashboard', texto: 'Dashboard', icone: <DashboardIcon /> },
  { id: 'perfumes', texto: 'Perfumes', icone: <SpaIcon /> },
  { id: 'formulas', texto: 'Formulas', icone: <ScienceIcon /> },
  { id: 'lotes', texto: 'Lotes', icone: <LocalDrinkIcon /> },
  { id: 'maceracao', texto: 'Maceracao', icone: <EventIcon /> },
  { id: 'materias', texto: 'Materias-Primas', icone: <Inventory2Icon /> },
  { id: 'config', texto: 'Configuracoes', icone: <SettingsIcon /> },
];

// Hash simples (NAO e seguranca de banco, so evita senha em texto puro)
function hashSimples(txt: string): string {
  let h = 0;
  for (let i = 0; i < txt.length; i++) {
    h = (h << 5) - h + txt.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

// ------------------------------------------------------------
// TELA DE LOGIN
// ------------------------------------------------------------
function Login({ onEntrar }: { onEntrar: () => void }) {
  const config = carregarConfig();
  const primeiroAcesso = !config.senhaHash;

  const [usuario, setUsuario] = useState(config.usuario || 'Rodrigo');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [erro, setErro] = useState('');

  function entrar() {
    setErro('');

    if (primeiroAcesso) {
      if (senha.length < 4) {
        setErro('A senha precisa ter ao menos 4 caracteres.');
        return;
      }
      if (senha !== senha2) {
        setErro('As senhas nao coincidem.');
        return;
      }
      salvarConfig({ usuario, senhaHash: hashSimples(senha) });
      onEntrar();
      return;
    }

    if (hashSimples(senha) !== config.senhaHash) {
      setErro('Senha incorreta.');
      return;
    }
    onEntrar();
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: cores.pretoPrincipal,
        p: 2,
      }}
    >
      <Paper sx={{ p: 5, width: 380, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ letterSpacing: '0.3em', mb: 0.5 }}>
          SILLAGE
        </Typography>
        <Typography
          variant="overline"
          sx={{ color: cores.dourado, letterSpacing: '0.4em' }}
        >
          LAB
        </Typography>

        <Divider sx={{ my: 3, borderColor: 'rgba(176,141,87,0.3)' }} />

        <Typography variant="body2" sx={{ color: cores.cinzaClaro, mb: 3 }}>
          {primeiroAcesso
            ? 'Primeiro acesso — defina sua senha'
            : 'Bem-vindo de volta'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            fullWidth
            size="small"
            onKeyDown={(e) => e.key === 'Enter' && !primeiroAcesso && entrar()}
          />
          {primeiroAcesso && (
            <TextField
              label="Confirmar senha"
              type="password"
              value={senha2}
              onChange={(e) => setSenha2(e.target.value)}
              fullWidth
              size="small"
            />
          )}

          {erro && <Alert severity="error">{erro}</Alert>}

          <Button variant="contained" size="large" onClick={entrar}>
            {primeiroAcesso ? 'Criar acesso' : 'Entrar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

// ------------------------------------------------------------
// LAYOUT PRINCIPAL (menu + conteudo)
// ------------------------------------------------------------
function Layout({ onSair }: { onSair: () => void }) {
  const [tela, setTela] = useState<Tela>('dashboard');
  const config = carregarConfig();

  // Quantos lotes esperam a rotina hoje (badge no menu)
  const pendentes = lotesPendentesRotina().length;

  function renderTela() {
    switch (tela) {
      case 'dashboard':
        return <Dashboard onNavegar={(t) => setTela(t as Tela)} />;
      case 'perfumes':
        return <Perfumes />;
      case 'formulas':
        return <Formulas />;
      case 'lotes':
        return <Lotes />;
      case 'maceracao':
        return <Maceracao />;
      case 'materias':
        return <MateriasPrimas />;
      case 'config':
        return <Configuracoes />;
      default:
        return null;
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Barra superior */}
      <AppBar position="fixed" sx={{ zIndex: 1201 }} elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ letterSpacing: '0.25em', flexGrow: 1 }}>
            SILLAGE <span style={{ color: cores.dourado }}>LAB</span>
          </Typography>
          <Typography variant="body2" sx={{ color: cores.cinzaClaro, mr: 1 }}>
            {config.usuario}
          </Typography>
          <IconButton color="inherit" onClick={onSair} title="Sair">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Menu lateral */}
      <Drawer
        variant="permanent"
        sx={{
          width: LARGURA_MENU,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: LARGURA_MENU,
            boxSizing: 'border-box',
            bgcolor: cores.pretoPrincipal,
            borderRight: '1px solid rgba(176,141,87,0.15)',
          },
        }}
      >
        <Toolbar />
        <List sx={{ mt: 1 }}>
          {MENU.map((item) => (
            <ListItemButton
              key={item.id}
              selected={tela === item.id}
              onClick={() => setTela(item.id)}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(176,141,87,0.15)',
                  '&:hover': { bgcolor: 'rgba(176,141,87,0.22)' },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: tela === item.id ? cores.dourado : cores.cinzaMedio,
                  minWidth: 40,
                }}
              >
                {item.id === 'maceracao' && pendentes > 0 ? (
                  <Badge
                    badgeContent={pendentes}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: cores.dourado,
                        color: cores.pretoPrincipal,
                        fontWeight: 700,
                      },
                    }}
                  >
                    {item.icone}
                  </Badge>
                ) : (
                  item.icone
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: tela === item.id ? cores.branco : cores.cinzaClaro,
                    }}
                  >
                    {item.texto}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Conteudo */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <Toolbar />
        {renderTela()}
      </Box>
    </Box>
  );
}

// ------------------------------------------------------------
// APP (decide entre Login e Layout)
// ------------------------------------------------------------
export default function App() {
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('sillage_logado') === '1') {
      setLogado(true);
    }
  }, []);

  function entrar() {
    sessionStorage.setItem('sillage_logado', '1');
    setLogado(true);
  }

  function sair() {
    sessionStorage.removeItem('sillage_logado');
    setLogado(false);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {logado ? <Layout onSair={sair} /> : <Login onEntrar={entrar} />}
    </ThemeProvider>
  );
}
