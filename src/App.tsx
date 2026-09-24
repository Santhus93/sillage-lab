// ============================================================
// SILLAGE LAB - APP PRINCIPAL
// Arquivo: src/App.tsx
// v3: sem titulo duplicado + convite para instalar (PWA)
// ============================================================

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
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
  CircularProgress,
  Link,
  Snackbar,
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
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';

import theme, { cores } from './theme/theme';
import Marca from './components/Marca';
import {
  entrar as fazerLogin,
  sair as fazerLogout,
  observarLogin,
  nomeExibicao,
  recuperarSenha,
  traduzirErro,
} from './data/auth';
import {
  ehDiaDeRotina,
  listarLotes,
  listarManutencoes,
  loteEmMaceracao,
  mesmoDia,
} from './data/db';

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

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Evento de instalacao do PWA (tipagem minima)
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------
function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    setErro('');
    setAviso('');
    if (!email || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setEnviando(true);
    try {
      await fazerLogin(email, senha);
    } catch (e) {
      setErro(traduzirErro((e as { code?: string }).code ?? ''));
    } finally {
      setEnviando(false);
    }
  }

  async function esqueci() {
    setErro('');
    setAviso('');
    if (!email) {
      setErro('Digite seu e-mail para receber o link.');
      return;
    }
    try {
      await recuperarSenha(email);
      setAviso('Link de redefinicao enviado para seu e-mail.');
    } catch (e) {
      setErro(traduzirErro((e as { code?: string }).code ?? ''));
    }
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
          {saudacao()}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            autoComplete="username"
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            fullWidth
            size="small"
            autoComplete="current-password"
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
          />

          {erro && <Alert severity="error">{erro}</Alert>}
          {aviso && <Alert severity="success">{aviso}</Alert>}

          <Button variant="contained" size="large" onClick={entrar} disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </Button>

          <Link
            component="button"
            type="button"
            onClick={esqueci}
            underline="hover"
            sx={{ color: cores.cinzaMedio, fontSize: '0.8rem' }}
          >
            Esqueci minha senha
          </Link>
        </Box>

        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 3, color: alpha(cores.cinzaMedio, 0.7) }}
        >
          Dados sincronizados na nuvem.
        </Typography>
      </Paper>
    </Box>
  );
}

// ------------------------------------------------------------
// MENU
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
                sx={{ color: ativo ? cores.dourado : cores.cinzaMedio, minWidth: 40 }}
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
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
          <CloudDoneIcon sx={{ fontSize: 15, color: alpha(cores.prontoVenda, 0.8) }} />
          <Typography variant="caption" sx={{ color: alpha(cores.cinzaMedio, 0.8) }}>
            Sincronizado
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: alpha(cores.cinzaMedio, 0.55), letterSpacing: '0.1em' }}
        >
          Sillage Perfumaria
        </Typography>
      </Box>
    </>
  );
}

// ------------------------------------------------------------
// LAYOUT
// ------------------------------------------------------------
function Layout({ user }: { user: User }) {
  const [tela, setTela] = useState<Tela>('dashboard');
  const [gaveta, setGaveta] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const [instalar, setInstalar] = useState<EventoInstalacao | null>(null);

  const celular = useMediaQuery(theme.breakpoints.down('md'));
  const nome = nomeExibicao(user);

  // Captura o convite de instalacao do navegador
  useEffect(() => {
    function aoPoderInstalar(e: Event) {
      e.preventDefault();
      setInstalar(e as EventoInstalacao);
    }
    window.addEventListener('beforeinstallprompt', aoPoderInstalar);
    return () => window.removeEventListener('beforeinstallprompt', aoPoderInstalar);
  }, []);

  async function instalarApp() {
    if (!instalar) return;
    await instalar.prompt();
    setInstalar(null);
  }

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const diaRotina = await ehDiaDeRotina();
        if (!diaRotina) {
          if (ativo) setPendentes(0);
          return;
        }
        const [lotes, manutencoes] = await Promise.all([
          listarLotes(),
          listarManutencoes(),
        ]);
        const qtd = lotes.filter(
          (l) =>
            loteEmMaceracao(l) &&
            !manutencoes.some((m) => m.loteId === l.id && mesmoDia(m.data, new Date()))
        ).length;
        if (ativo) setPendentes(qtd);
      } catch {
        if (ativo) setPendentes(0);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [tela]);

  function escolher(t: Tela) {
    setTela(t);
    setGaveta(false);
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
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
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

          {celular && <Marca tamanho="pequeno" comSimbolo={false} />}

          <Box sx={{ flexGrow: 1 }} />

          {instalar && (
            <Tooltip title="Instalar como aplicativo">
              <IconButton color="inherit" onClick={instalarApp} size="small">
                <InstallMobileIcon fontSize="small" sx={{ color: cores.dourado }} />
              </IconButton>
            </Tooltip>
          )}

          <Typography
            variant="body2"
            sx={{
              color: cores.cinzaMedio,
              mr: 0.5,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {nome}
          </Typography>
          <Tooltip title="Sair">
            <IconButton color="inherit" onClick={() => fazerLogout()} size="small">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

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
        <Box key={tela} className="sillage-fade">
          {renderTela()}
        </Box>
      </Box>

      <Snackbar
        open={Boolean(instalar) && celular}
        message="Instale o Sillage Lab na tela de inicio"
        action={
          <Button size="small" onClick={instalarApp} sx={{ color: cores.dourado }}>
            Instalar
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

// ------------------------------------------------------------
// APP
// ------------------------------------------------------------
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const cancelar = observarLogin((u) => {
      setUser(u);
      setVerificando(false);
    });
    return cancelar;
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {verificando ? (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Marca tamanho="grande" />
          <CircularProgress size={26} sx={{ color: cores.dourado }} />
        </Box>
      ) : user ? (
        <Layout user={user} />
      ) : (
        <Login />
      )}
    </ThemeProvider>
  );
}
