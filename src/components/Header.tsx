import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  ButtonBase,
  Box,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
  Tooltip,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { LanguageSwitcher } from './LanguageSwitcher';
import DiscordIcon from '@mui/icons-material/Chat';

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
}));

const LogoImage = styled('img')({
  height: '210px',
  width: 'auto',
  marginLeft: '20px',
  position: 'absolute',
  marginTop: '5px',
  top: '0',
  zIndex: 1101,
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '80px',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
});

const NavButtonBase = styled(ButtonBase)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
  padding: '10px 18px',
  margin: '0 12px',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  position: 'relative',
  '&:hover': {
    backgroundColor: 'rgba(255, 201, 92, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 8px rgba(255, 201, 92, 0.2)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '2px',
    left: '50%',
    width: '0',
    height: '2px',
    backgroundColor: theme.palette.primary.main,
    transition: 'width 0.3s ease, left 0.3s ease',
  },
  '&:hover::after': {
    width: '70%',
    left: '15%',
  }
}));

const MenuButtonBase = styled(ButtonBase)(({ theme }) => ({
  color: theme.palette.primary.main,
  width: '100%',
  padding: '12px 20px',
  justifyContent: 'flex-start',
  '&:hover': {
    backgroundColor: 'rgba(255, 201, 92, 0.1)',
  },
}));

const DiscordButton = styled(ButtonBase)(({ theme }) => ({
  color: '#7289DA', // Discord brand color
  padding: '10px 18px',
  margin: '0 12px',
  borderRadius: '4px',
  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(114, 137, 218, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 8px rgba(114, 137, 218, 0.3)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '2px',
    left: '50%',
    width: '0',
    height: '2px',
    backgroundColor: '#7289DA',
    transition: 'width 0.3s ease, left 0.3s ease',
  },
  '&:hover::after': {
    width: '70%',
    left: '15%',
  }
}));

const NavItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
});

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

  // Discord server URL
  const discordUrl = 'https://discord.gg/MdpGvmAbkB'; // WoW Israel Discord community

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
                    padding: '8px 0',
                  },
                },
              }}
            >
              <Link to="/download" style={{ textDecoration: 'none' }}>
                <MenuButtonBase onClick={handleClose}>
                  {t('navigation.download')}
                </MenuButtonBase>
              </Link>
              <Divider sx={{ my: 1, borderColor: 'rgba(255, 201, 92, 0.2)' }} />
              <a href={discordUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <MenuButtonBase onClick={handleClose}>
                  <DiscordIcon sx={{ mr: 1 }} />
                  {t('navigation.discord') || 'Join Discord'}
                </MenuButtonBase>
              </a>
            </Menu>
            <Box sx={{ ml: 3 }}>
              <LanguageSwitcher />
            </Box>
          </>
        ) : (
          <Box sx={{ 
            ml: 'auto', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            '& > *': { 
              mx: 1 
            }
          }}>
            <NavItem>
              <Link to="/download" style={{ textDecoration: 'none' }}>
                <NavButtonBase>
                  {t('navigation.download')}
                </NavButtonBase>
              </Link>
            </NavItem>
            
            <NavItem>
              <Tooltip title={t('navigation.discordTooltip') || 'Join our community'}>
                <a href={discordUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <DiscordButton>
                    <DiscordIcon sx={{ mr: 1 }} />
                    {t('navigation.discord') || 'Discord'}
                  </DiscordButton>
                </a>
              </Tooltip>
            </NavItem>
            
            <NavItem sx={{ ml: 1 }}>
              <LanguageSwitcher />
            </NavItem>
          </Box>
        )}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header; 