import { useMemo } from 'react';
import { useMediaQuery, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme, createTheme, ThemeProvider } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import LogoImage from './LogoImage';
import palette from '../common/theme/palette';
import dimensions from '../common/theme/dimensions';
import components from '../common/theme/components';

const RED = '#C62828';

// Breakpoints :
// - >= lg : sidebar 28% avec logo, carte à droite sur la vidéo
// - md-lg : sidebar 36% (logo réduit)
// - < md  : pas de sidebar, vidéo plein écran, logo dans la carte
// - < sm  : carte pleine largeur (gouttières 16px), paddings réduits
// - hauteur < 560px (mobile paysage) : espacements compacts, zone scrollable
const SHORT = '@media (max-height: 560px)';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    minHeight: '100dvh',
    backgroundColor: '#0b0b0b',
    overflow: 'hidden',
  },
  sidebar: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    background: 'linear-gradient(160deg, #1c1c1c 0%, #151515 55%, #101010 100%)',
    boxShadow: '8px 0 40px rgba(0,0,0,0.6)',
    width: theme.dimensions.sidebarWidth,
    minWidth: 300,
    [theme.breakpoints.down('lg')]: {
      width: '36%',
      minWidth: 280,
    },
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    background:
      'radial-gradient(circle, rgba(198,40,40,0.45) 0%, rgba(198,40,40,0.18) 60%, rgba(198,40,40,0) 100%)',
    filter: 'blur(2px)',
    animation: 'bensFloat 14s ease-in-out infinite',
  },
  streak: {
    position: 'absolute',
    left: '-10%',
    bottom: '22%',
    width: '120%',
    height: 90,
    pointerEvents: 'none',
    transform: 'rotate(-24deg)',
    background:
      'linear-gradient(90deg, rgba(198,40,40,0) 0%, rgba(198,40,40,0.35) 45%, rgba(255,255,255,0.25) 70%, rgba(255,255,255,0) 100%)',
    filter: 'blur(14px)',
    opacity: 0.55,
    animation: 'bensStreak 7s ease-in-out infinite',
  },
  logoBox: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: theme.spacing(3, 4),
    boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
    width: '72%',
    maxWidth: 290,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('lg')]: {
      padding: theme.spacing(2, 2.5),
      width: '78%',
    },
    [SHORT]: {
      padding: theme.spacing(1, 2),
    },
  },
  redBar: {
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: RED,
    boxShadow: `0 0 12px ${RED}`,
    margin: `${theme.spacing(3)} 0 ${theme.spacing(1.5)}`,
    [SHORT]: {
      margin: `${theme.spacing(1.5)} 0 ${theme.spacing(1)}`,
    },
  },
  sidebarCaption: {
    position: 'relative',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    letterSpacing: '0.12em',
    padding: theme.spacing(0, 2),
    fontSize: '0.78rem',
    textTransform: 'uppercase',
  },
  copyright: {
    position: 'absolute',
    bottom: theme.spacing(2.5),
    color: 'rgba(255,255,255,0.25)',
    fontSize: '0.68rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    [SHORT]: {
      display: 'none',
    },
  },
  rightPanel: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: '#0b0b0b',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.55) 100%), linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 30%)',
    [theme.breakpoints.down('md')]: {
      background:
        'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.65) 100%)',
    },
  },
  cornerOrb: {
    position: 'absolute',
    bottom: -140,
    right: -140,
    width: 420,
    height: 420,
    borderRadius: '50%',
    pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(198,40,40,0.35) 0%, rgba(198,40,40,0) 70%)',
    [theme.breakpoints.down('sm')]: {
      width: 260,
      height: 260,
      bottom: -100,
      right: -100,
    },
  },
  options: {
    position: 'absolute',
    zIndex: 2,
    top: theme.spacing(2),
    right: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(14,14,14,0.55)',
      backdropFilter: 'blur(8px)',
    },
    [theme.breakpoints.down('sm')]: {
      top: theme.spacing(1.5),
      right: theme.spacing(1.5),
      gap: theme.spacing(0.5),
      // Drapeau seul sur téléphone : le nom de la langue prend trop de place
      '& .MuiSelect-select .bens-lang-name': { display: 'none' },
    },
  },
  // Zone scrollable au-dessus de la vidéo : la carte reste centrée
  // mais n'est jamais coupée sur les petits écrans / en paysage.
  scroller: {
    position: 'absolute',
    inset: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(9, 2, 3),
    [SHORT]: {
      padding: theme.spacing(8, 2, 2),
    },
  },
  card: {
    position: 'relative',
    margin: 'auto 0',
    width: '100%',
    maxWidth: 420,
    padding: theme.spacing(4.5, 4.5, 4),
    borderRadius: 16,
    background: 'rgba(14,14,14,0.62)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
    animation: 'bensRise 0.7s cubic-bezier(.2,.7,.2,1) both',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 36,
      width: 48,
      height: 3,
      borderRadius: '0 0 3px 3px',
      backgroundColor: RED,
      boxShadow: `0 0 14px ${RED}`,
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(3.5, 2.5, 3),
      borderRadius: 14,
      '&::before': { left: 20 },
    },
    [SHORT]: {
      padding: theme.spacing(2.5, 3, 2.5),
    },
  },
  mobileLogo: {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: theme.spacing(3),
    '& img': {
      maxHeight: 72,
      margin: theme.spacing(1.5),
    },
    [SHORT]: {
      display: 'none',
    },
  },
  pageTitle: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1.9rem',
    marginBottom: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.6rem',
    },
    [SHORT]: {
      fontSize: '1.4rem',
    },
  },
  pageSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.88rem',
    marginBottom: theme.spacing(3.5),
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(2.5),
    },
    [SHORT]: {
      marginBottom: theme.spacing(2),
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255,255,255,0.04)',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
    },
    // 16px minimum : évite le zoom automatique d'iOS au focus
    [theme.breakpoints.down('sm')]: {
      '& .MuiInputBase-input': { fontSize: 16 },
    },
    '& .MuiButton-containedSecondary': {
      height: 44,
      fontWeight: 600,
      letterSpacing: '0.08em',
      boxShadow: '0 8px 24px rgba(198,40,40,0.35)',
      '&:hover': { boxShadow: '0 10px 30px rgba(198,40,40,0.5)' },
    },
  },
  mobileCopyright: {
    marginTop: theme.spacing(3),
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.68rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    textAlign: 'center',
    [SHORT]: {
      display: 'none',
    },
  },
}));

const keyframes = `
@keyframes bensFloat { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-18px) scale(1.06); } }
@keyframes bensStreak { 0%,100% { opacity: 0.25; transform: rotate(-24deg) translateX(-6%); } 50% { opacity: 0.6; transform: rotate(-24deg) translateX(6%); } }
@keyframes bensRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .bens-anim { animation: none !important; } }
`;

const LoginLayout = ({
  children,
  options,
  title = 'Connexion',
  subtitle = 'Accédez à votre espace de gestion de flotte',
}) => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const server = useSelector((state) => state.session.server);

  const darkTheme = useMemo(
    () =>
      createTheme({
        typography: theme.typography,
        palette: { ...palette(server, true), primary: { main: '#ffffff' } },
        direction: theme.direction,
        dimensions,
        components,
      }),
    [server, theme.typography, theme.direction],
  );

  const copyright = `BENS Groupe © ${new Date().getFullYear()}`;

  return (
    <main className={classes.root}>
      <style>{keyframes}</style>
      {!isCompact && (
        <div className={classes.sidebar}>
          <div
            className={cx(classes.orb, 'bens-anim')}
            style={{ top: -70, left: -70, width: 230, height: 230 }}
          />
          <div
            className={cx(classes.orb, 'bens-anim')}
            style={{ top: 70, left: 70, width: 90, height: 90, animationDelay: '-5s' }}
          />
          <div
            className={cx(classes.orb, 'bens-anim')}
            style={{ bottom: -130, right: -110, width: 320, height: 320, animationDelay: '-9s' }}
          />
          <div className={cx(classes.streak, 'bens-anim')} />
          <div className={classes.logoBox}>
            <LogoImage />
          </div>
          <div className={classes.redBar} />
          <Typography className={classes.sidebarCaption}>Suivi &amp; Gestion de Flotte</Typography>
          <Typography className={classes.copyright}>{copyright}</Typography>
        </div>
      )}

      <ThemeProvider theme={darkTheme}>
        <div className={classes.rightPanel}>
          <video
            className={classes.video}
            src="/assets/login-bg.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className={classes.overlay} />
          <div className={classes.cornerOrb} />
          {options && <div className={classes.options}>{options}</div>}
          <div className={classes.scroller}>
            <div className={cx(classes.card, 'bens-anim')}>
              {isCompact && (
                <div className={classes.mobileLogo}>
                  <LogoImage />
                </div>
              )}
              <Typography className={classes.pageTitle}>{title}</Typography>
              <Typography className={classes.pageSubtitle}>{subtitle}</Typography>
              <form className={classes.form}>{children}</form>
            </div>
            {isCompact && <Typography className={classes.mobileCopyright}>{copyright}</Typography>}
          </div>
        </div>
      </ThemeProvider>
    </main>
  );
};

export default LoginLayout;
