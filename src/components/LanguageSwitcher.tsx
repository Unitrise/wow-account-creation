import React from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  useTheme 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguageStore } from '../store/languageStore';

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
      <Button
        color="primary"
        startIcon={<LanguageIcon />}
        onClick={handleClick}
        sx={{
          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
          textTransform: 'none',
        }}
      >
        {language === 'en' ? t('navigation.english') : t('navigation.hebrew')}
      </Button>
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
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            border: `1px solid ${theme.palette.primary.main}`,
          },
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{ 
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: 'rgba(0, 168, 225, 0.1)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 168, 225, 0.2)',
            },
          }}
        >
          {t('navigation.english')}
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('he')}
          selected={language === 'he'}
          sx={{ 
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: 'rgba(0, 168, 225, 0.1)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 168, 225, 0.2)',
            },
          }}
        >
          {t('navigation.hebrew')}
        </MenuItem>
      </Menu>
    </Box>
  );
}; 