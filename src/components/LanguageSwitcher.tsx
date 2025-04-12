import React from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  useTheme,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguageStore } from '../store/languageStore';
import { styled } from '@mui/material/styles';

const LanguageButton = styled(Button)(({ theme }) => ({
  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
  textTransform: 'none',
  padding: '8px 16px',
  color: theme.palette.primary.main,
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 201, 92, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 8px rgba(255, 201, 92, 0.2)',
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.primary.main,
  padding: '10px 20px',
  '&:hover': {
    backgroundColor: 'rgba(255, 201, 92, 0.1)',
  },
  '&.Mui-selected': {
    backgroundColor: 'rgba(255, 201, 92, 0.2)',
    '&:hover': {
      backgroundColor: 'rgba(255, 201, 92, 0.3)',
    },
  },
}));

export const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { language, setLanguage } = useLanguageStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    handleClose();
  };
  
  return (
    <Box>
      <Tooltip title={t('navigation.languageTooltip') || 'Change language'}>
        <LanguageButton
          color="primary"
          startIcon={<LanguageIcon />}
          onClick={handleClick}
        >
          {language === 'en' ? t('navigation.english') : t('navigation.hebrew')}
        </LanguageButton>
      </Tooltip>
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
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: '6px',
              mt: 1,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
              minWidth: '150px',
            }
          }
        }}
      >
        <StyledMenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
        >
          {t('navigation.english')}
        </StyledMenuItem>
        <StyledMenuItem 
          onClick={() => handleLanguageChange('he')}
          selected={language === 'he'}
        >
          {t('navigation.hebrew')}
        </StyledMenuItem>
      </Menu>
    </Box>
  );
}; 