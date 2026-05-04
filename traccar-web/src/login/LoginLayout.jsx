import { useMediaQuery, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import LogoImage from './LogoImage';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
  },
  sidebar: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    background: 'linear-gradient(150deg, #111111 0%, #2c2c2c 100%)',
    width: theme.dimensions.sidebarWidth,
    [theme.breakpoints.down('lg')]: {
      width: theme.dimensions.sidebarWidthTablet,
    },
    [theme.breakpoints.down('sm')]: {
      width: '0px',
    },
  },
  blob1: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: '50%',
    background: 'rgba(198, 40, 40, 0.13)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: '50%',
    background: 'rgba(198, 40, 40, 0.09)',
    pointerEvents: 'none',
  },
  logoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: theme.spacing(2.5, 4),
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    width: '75%',
    maxWidth: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBar: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C62828',
    margin: `${theme.spacing(2.5)} 0 ${theme.spacing(1.5)}`,
  },
  sidebarCaption: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    letterSpacing: '0.06em',
    padding: theme.spacing(0, 2),
    fontSize: '0.78rem',
    textTransform: 'uppercase',
  },
  copyright: {
    position: 'absolute',
    bottom: theme.spacing(2.5),
    color: 'rgba(255,255,255,0.25)',
    fontSize: '0.68rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f7f7f7',
    [theme.breakpoints.up('lg')]: {
      padding: theme.spacing(0, 25, 0, 0),
    },
  },
  formWrapper: {
    width: '100%',
    maxWidth: theme.spacing(54),
    padding: theme.spacing(5),
  },
  pageTitle: {
    color: '#111111',
    fontWeight: 700,
    fontSize: '1.75rem',
    marginBottom: theme.spacing(0.5),
  },
  pageSubtitle: {
    color: '#999999',
    fontSize: '0.88rem',
    marginBottom: theme.spacing(3.5),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <main className={classes.root}>
      <div className={classes.sidebar}>
        <div className={classes.blob1} />
        <div className={classes.blob2} />
        {!isSmall && (
          <>
            <div className={classes.logoBox}>
              <LogoImage />
            </div>
            <div className={classes.redBar} />
            <Typography className={classes.sidebarCaption}>
              Suivi &amp; Gestion de Flotte
            </Typography>
          </>
        )}
        <Typography className={classes.copyright}>
          {`BENS Groupe © ${new Date().getFullYear()}`}
        </Typography>
      </div>

      <div className={classes.rightPanel}>
        <div className={classes.formWrapper}>
          {isSmall && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <LogoImage />
            </div>
          )}
          <Typography className={classes.pageTitle}>Connexion</Typography>
          <Typography className={classes.pageSubtitle}>
            Accédez à votre espace de gestion de flotte
          </Typography>
          <form className={classes.form}>{children}</form>
        </div>
      </div>
    </main>
  );
};

export default LoginLayout;
