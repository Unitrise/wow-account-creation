import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import ClientDownload from '../components/ClientDownload';

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
  marginBottom: '3%',
  textAlign: 'center',
  fontSize: 'clamp(2rem, 4vw, 3rem)',
}));

export const DownloadPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <PageContainer>
      <PageTitle>
        {t('downloadPage.title')}
      </PageTitle>
      <ClientDownload />
    </PageContainer>
  );
}; 