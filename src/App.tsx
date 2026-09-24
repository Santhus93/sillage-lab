// ============================================================
// SILLAGE LAB - APP PRINCIPAL
// Arquivo: src/App.tsx
// Tema + Login + Menu RESPONSIVO + Navegacao
// No celular o menu vira gaveta (botao ☰); no desktop fica fixo.
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
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SpaIcon from '@mui/icons-material/Spa';
import ScienceIcon from '@mui/icons-material/Science';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import EventIcon from '@mui/icons-material/Event';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

import theme, { cores } from './theme/theme';
import Marca from './components/Marca';
import { carregarConfig, salvarConfig, lotesPendentesRotina } from './data/db';
import Dashboard from './pages/Dashboard';
import Perfumes from './pages/Perfumes';
import Formulas from './pages/Formulas';
import Lotes from './pages/Lotes';
import Maceracao from './pages/Maceracao';
import MateriasPrimas from './pages/MateriasPrimas';
import Configuracoes from './pages/Configuracoes';

const LARGURA_MENU = 248;

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

const TITULOS: Record<Tela, string> = {
  dashboard: 'Dashboard',
  perfumes: 'Perfumes',
  formulas: 'Formulas',
  lotes: 'Lotes',
  maceracao: 'Maceracao',
  materias: 'Materias-Primas',
  config: 'Configuracoes',
};

// Hash simples (NAO e seguranca de banco, so evita senha em texto puro)
function hashSimples(txt: string): string {
  let h = 0;
  for (let i = 0; i < txt.length; i++) {
    h = (h << 5) - h + txt.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

// Saudacao pelo horario - detalhe humano
function saudacao(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
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
        p: 2,
      }}
    >
      <Paper
        className="sillage-fade"
        sx={{
          p: { xs: 3.5, sm: 5 },
          width: '100%',
          maxWidth: 390,
          textAlign: 'center',
          border: `1px solid ${alpha(cores.dourado, 0.2)}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Marca tamanho="grande" />
        </Box>

        <Typography
          variant="caption"
          sx={{ color: cores.cinzaMedio, letterSpacing: '0.16em' }}
        >
          LABORATORIO DE FORMULACAO
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" sx={{ color: cores.cinzaClaro, mb: 3 }}>
          {primeiroAcesso
            ? 'Primeiro acesso — defina sua senha'
            : `${saudacao()}, ${config.usuario}`}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {primeiroAcesso && (
            <TextField
              label="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              fullWidth
              size="small"
            />
          )}
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />
          {primeiroAcesso && (
            <TextField
              label="Confirmar senha"
              type="password"
              value={senha2}
              onChange={(e) => setSenha2(e.target.value)}
              fullWidth
              size="small"
              onKeyDown={(e) => e.key === 'Enter' && entrar()}
            />
          )}

          {erro && <Alert severity="error">{erro}</Alert>}

          <Button variant="contained" size="large" onClick={entrar}>
            {primeiroAcesso ? 'Criar acesso' : 'Entrar'}
          </Button>
        </Box>

        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 3, color: alpha(cores.cinzaMedio, 0.7) }}
        >
          Seus dados ficam apenas neste dispositivo.
        </Typography>
      </Paper>
    </Box>
  );
}

// ------------------------------------------------------------
// CONTEUDO DO MENU (compartilhado entre desktop e celular)
// ------------------------------------------------------------
function ConteudoMenu({
  tela,
  aoEscolher,
  pendentes,
}: {
  tela: Tela;
  aoEscolher: (t: Tela) => void;
  pendentes: number;
}) {
  return (
    <>
      <Toolbar sx={{ px: 2.5 }}>
        <Marca tamanho="pequeno" />
      </Toolbar>
      <Divider />

      <List sx={{ mt: 1, px: 1 }}>
        {MENU.map((item) => {
          const ativo = tela === item.id;
          return (
            <ListItemButton
              key={item.id}
              selected={ativo}
              onClick={() => aoEscolher(item.id)}
              sx={{
                borderRadius: 2.5,
                mb: 0.5,
                position: 'relative',
                transition: 'background-color .2s ease',
                '&.Mui-selected': {
                  bgcolor: alpha(cores.dourado, 0.14),
                  '&:hover': { bgcolor: alpha(cores.dourado, 0.2) },
                  // marcador dourado na lateral
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '22%',
                    height: '56%',
                    width: 3,
                    borderRadius: 4,
                    background: `linear-gradient(${cores.douradoClaro}, ${cores.dourado})`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: ativo ? cores.dourado : cores.cinzaMedio,
                  minWidth: 40,
                }}
              >
                {item.id === 'maceracao' && pendentes > 0 ? (
                  <Badge
                    badgeContent={pendentes}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: cores.dourado,
                        color: '#17140F',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        minWidth: 18,
                        height: 18,
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
                      fontWeight: ativo ? 600 : 400,
                      color: ativo ? cores.branco : cores.cinzaClaro,
                    }}
                  >
                    {item.texto}
                  </Typography>
                }
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Typography
        variant="caption"
        sx={{
          p: 2.5,
          color: alpha(cores.cinzaMedio, 0.6),
          letterSpacing: '0.1em',
        }}
      >
        Sillage Perfumaria
      </Typography>
    </>
  );
}

// ------------------------------------------------------------
// LAYOUT PRINCIPAL
// ------------------------------------------------------------
function Layout({ onSair }: { onSair: () => void }) {
  const [tela, setTela] = useState<Tela>('dashboard');
  const [gaveta, setGaveta] = useState(false);
  const config = carregarConfig();

  // < 900px = celular/tablet -> menu vira gaveta
  const celular = useMediaQuery(theme.breakpoints.down('md'));

  const pendentes = lotesPendentesRotina().length;

  function escolher(t: Tela) {
    setTela(t);
    setGaveta(false); // fecha a gaveta ao navegar no celular
  }

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
      {/* ---------- BARRA SUPERIOR ---------- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          // no desktop a barra comeca depois do menu
          width: { md: `calc(100% - ${LARGURA_MENU}px)` },
          ml: { md: `${LARGURA_MENU}px` },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {celular && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setGaveta(true)}
              sx={{ mr: 0.5 }}
            >
              <Badge
                variant="dot"
                invisible={pendentes === 0}
                sx={{ '& .MuiBadge-badge': { bgcolor: cores.dourado } }}
              >
                <MenuIcon />
              </Badge>
            </IconButton>
          )}

          {celular ? (
            <Marca tamanho="pequeno" comSimbolo={false} />
          ) : (
            <Typography
              variant="h5"
              sx={{ flexGrow: 1, color: cores.branco }}
            >
              {TITULOS[tela]}
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Typography
            variant="body2"
            sx={{
              color: cores.cinzaMedio,
              mr: 0.5,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {config.usuario}
          </Typography>
          <Tooltip title="Sair">
            <IconButton color="inherit" onClick={onSair} size="small">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ---------- MENU CELULAR (gaveta temporaria) ---------- */}
      <Drawer
        variant="temporary"
        open={gaveta}
        onClose={() => setGaveta(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: LARGURA_MENU,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <ConteudoMenu tela={tela} aoEscolher={escolher} pendentes={pendentes} />
      </Drawer>

      {/* ---------- MENU DESKTOP (fixo) ---------- */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: LARGURA_MENU,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: LARGURA_MENU,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <ConteudoMenu tela={tela} aoEscolher={escolher} pendentes={pendentes} />
      </Drawer>

      {/* ---------- CONTEUDO ---------- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          minWidth: 0,
          width: { md: `calc(100% - ${LARGURA_MENU}px)` },
        }}
      >
        <Toolbar />
        {/* key faz a animacao rodar a cada troca de tela */}
        <Box key={tela} className="sillage-fade">
          {renderTela()}
        </Box>
      </Box>
    </Box>
  );
}

// ------------------------------------------------------------
// APP
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
