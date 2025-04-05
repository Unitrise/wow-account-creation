import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { RegistrationForm } from '../components/RegistrationForm';

const PageContainer = styled(Box)(() => ({
  minHeight: '100%',
  padding: '3%',
  paddingTop: '6%',
  marginTop: '0',
  backgroundImage: 'url("/images/wow-background.jpg")',
  backgroundSize: 'cover',
  backgroundAttachment: 'fixed',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflowY: 'auto',
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Cinzel, serif',
  fontWeight: 700,
  color: theme.palette.primary.main,
  textShadow: `0 0 1vh ${theme.palette.primary.main}`,
  marginBottom: '1%',
  textAlign: 'center',
  fontSize: 'clamp(2rem, 4vw, 3rem)',
}));

const PageSubtitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Cinzel, serif',
  fontWeight: 600,
  color: theme.palette.secondary.main,
  marginBottom: '3%',
  textAlign: 'center',
  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  marginTop: '2%',
  padding: '1% 3%',
  fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
  backgroundColor: theme.palette.secondary.main,
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
  },
}));

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <PageContainer>
      <PageTitle>
        {t('homePage.title')}
      </PageTitle>
      <PageSubtitle>
        {t('homePage.subtitle')}
      </PageSubtitle>
      <RegistrationForm />
      <Box sx={{ mt: '3%' }}>
        <Box component={RouterLink} to="/download" sx={{ textDecoration: 'none' }}>
          <DownloadButton
            variant="contained"
            color="secondary"
          >
            {t('homePage.downloadButton')}
          </DownloadButton>
        </Box>
      </Box>
    </PageContainer>
  );
}; 