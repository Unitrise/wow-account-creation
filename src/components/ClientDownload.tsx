import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Divider, 
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';

// Styled components
const DownloadContainer = styled(Paper)({
  padding: '3%',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
});

const DownloadTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Friz Quadrata, serif',
  fontWeight: 700,
  color: theme.palette.text.secondary,
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
  marginBottom: '2%',
  textAlign: 'center',
  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
}));

const StepTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Friz Quadrata, serif',
  fontWeight: 600,
  color: theme.palette.secondary.main,
  marginBottom: '1%',
  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
}));

const StepDescription = styled(Typography)(({ theme }) => ({
  color: '#E8D3A9',
  marginBottom: '2%',
  fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
}));

const CodeBox = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: `1px solid ${theme.palette.secondary.main}`,
  borderRadius: '4px',
  padding: '2%',
  marginBottom: '2%',
  fontFamily: 'monospace',
}));

const CodeText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
}));

const ClientDownload: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const serverIP = 'wow-israel.com'; // Replace with your actual server IP

  return (
    <DownloadContainer>
      <DownloadTitle>
        {t('clientDownload.title')}
      </DownloadTitle>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: '3%' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          href="https://example.com/wow-client.zip"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)' }}
        >
          {t('clientDownload.downloadButton')}
        </Button>
      </Box>
      
      <StepTitle>
        {t('clientDownload.step1.title')}
      </StepTitle>
      <StepDescription>
        {t('clientDownload.step1.description')}
      </StepDescription>
      
      <StepTitle>
        {t('clientDownload.step2.title')}
      </StepTitle>
      <StepDescription>
        {t('clientDownload.step2.description')}
      </StepDescription>
      
      <CodeBox>
        <CodeText>
          set realmlist wow-israel.com
        </CodeText>
      </CodeBox>
      
      <StepTitle>
        {t('clientDownload.step3.title')}
      </StepTitle>
      <StepDescription>
        {t('clientDownload.step3.description')}
      </StepDescription>
    </DownloadContainer>
  );
};

export default ClientDownload; 