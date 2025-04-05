import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  ButtonBase,
  Box,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { LanguageSwitcher } from './LanguageSwitcher';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  // borderBottom: 'none',
  // boxShadow: 'none',
  position: 'sticky',
  top: 0,
  zIndex: 1100,
}));

const LogoImage = styled('img')({
  height: '210px',
  width: 'auto',
  marginLeft: '10px',
  // filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))',
  position: 'absolute',
  marginTop: '5px',
  top: '0',
  zIndex: 1101,
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '80px',
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
});

const NavButtonBase = styled(ButtonBase)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginLeft: '2%',
  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
  padding: '8px 16px',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: 'rgba(0, 168, 225, 0.1)',
  },
}));

const MenuButtonBase = styled(ButtonBase)(({ theme }) => ({
  color: theme.palette.primary.main,
  width: '100%',
  padding: '8px 16px',
  justifyContent: 'flex-start',
  '&:hover': {
    backgroundColor: 'rgba(0, 168, 225, 0.1)',
  },
}));

const Header: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <LogoImage src="/images/wow-israel-logo.png" alt="WoW Israel Logo" />
          </Link>
        </Box>
        
        {isMobile ? (
          <>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
              sx={{ ml: 'auto' }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              slotProps={{
                paper: {
                  sx: {
                    backgroundColor: 'rgba(10, 10, 10, 0.95)',
                    border: `1px solid ${theme.palette.primary.dark}`,
                  },
                },
              }}
            >
              <Link to="/download" style={{ textDecoration: 'none' }}>
                <MenuButtonBase onClick={handleClose}>
                  {t('navigation.download')}
                </MenuButtonBase>
              </Link>
            </Menu>
            <Box sx={{ ml: 2 }}>
              <LanguageSwitcher />
            </Box>
          </>
        ) : (
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Link to="/download" style={{ textDecoration: 'none' }}>
              <NavButtonBase>
                {t('navigation.download')}
              </NavButtonBase>
            </Link>
            <LanguageSwitcher />
          </Box>
        )}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header; 