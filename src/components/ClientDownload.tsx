import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  Card,
  CardContent,
  Divider,
  Link,
  Stack,
  Alert,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import GoogleIcon from '@mui/icons-material/Google';

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
  fontWeight: 700,
  color: theme.palette.primary.main,
  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9)',
  marginBottom: '1%',
  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
  padding: '8px 0',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '-15px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '6px',
    height: '70%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '3px',
  }
}));

const StepDescription = styled(Typography)({
  color: '#E8D3A9',
  marginBottom: '2%',
  fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
});

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

const DownloadCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderColor: theme.palette.primary.main,
  marginBottom: theme.spacing(3),
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 6px 12px rgba(0,0,0,0.5), 0 0 10px ${theme.palette.primary.main}`,
  },
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  width: '100%',
  fontWeight: 'bold',
  padding: '12px',
}));

const ClientDownload: React.FC = () => {
  const { t } = useTranslation();
  
  // Server configuration
  const realmAddress = 'set realmlist 134.255.233.119';
  
  // Google Drive file IDs
  const googleDriveLinks = {
    fullClientId: '1JBjz5z74lehXpoAdRR9BcCQSfTh6I_W0', // WoW client file
    patchesId: 'YOUR_GOOGLE_DRIVE_FILE_ID_FOR_PATCHES',
  };
  
  // Create download URLs
  const downloadLinks = {
    fullClient: `https://drive.google.com/uc?export=download&id=${googleDriveLinks.fullClientId}`,
    patches: `https://drive.google.com/uc?export=download&id=${googleDriveLinks.patchesId}`,
    // Link to view file in Google Drive
    viewInDrive: `https://drive.google.com/file/d/${googleDriveLinks.fullClientId}/view`
  };

  return (
    <DownloadContainer>
      <DownloadTitle>
        {t('clientDownload.title')}
      </DownloadTitle>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        {t('clientDownload.infoMessage') || 'Make sure you have enough disk space (at least 20GB) before downloading the client.'}
      </Alert>
      
      <Typography variant="h6" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
        {t('clientDownload.downloadOptions') || 'Download Options'}
      </Typography>
      
      <Box sx={{ mb: 4, mx: 'auto', maxWidth: '600px' }}>
        <DownloadCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CloudDownloadIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                {t('clientDownload.fullClient') || 'Full Client'}
              </Typography>
              <Chip 
                label={t('clientDownload.recommended') || 'Recommended'} 
                size="small" 
                color="primary"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('clientDownload.fullClientDescription') || 'Complete game client with all necessary files. Download this if you are installing for the first time.'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                <SpeedIcon sx={{ fontSize: 'small', mr: 0.5, verticalAlign: 'middle' }} />
                {t('clientDownload.size') || 'Size'}: ~15GB
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <StorageIcon sx={{ fontSize: 'small', mr: 0.5, verticalAlign: 'middle' }} />
                {t('clientDownload.version') || 'Version'}: 3.3.5a
              </Typography>
            </Box>
            <Stack spacing={1}>
              <Link href={downloadLinks.fullClient} underline="none" sx={{ display: 'block' }}>
                <DownloadButton 
                  variant="contained" 
                  color="primary"
                  startIcon={<DownloadIcon />}
                >
                  {t('clientDownload.download') || 'Download'}
                </DownloadButton>
              </Link>
              <Link href={downloadLinks.viewInDrive} target="_blank" rel="noopener noreferrer" underline="none">
                <Button 
                  fullWidth
                  variant="text" 
                  startIcon={<GoogleIcon />}
                  size="small"
                >
                  {t('clientDownload.viewInDrive') || 'View in Google Drive'}
                </Button>
              </Link>
            </Stack>
            <Alert severity="warning" sx={{ mt: 2, fontSize: '0.8rem' }}>
              {t('clientDownload.googleDriveNote') || 'For large files, Google Drive may warn about virus scanning. Click "Download anyway" to proceed.'}
            </Alert>
          </CardContent>
        </DownloadCard>
      </Box>
      
      <Divider sx={{ mb: 4 }}>
        <Chip label={t('clientDownload.installationGuide') || 'Installation Guide'} />
      </Divider>
      
      <StepTitle>
        {t('clientDownload.step1.title')}
      </StepTitle>
      <StepDescription>
        {t('clientDownload.step1.description')}
      </StepDescription>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        {t('clientDownload.driveInstructions') || 'If you see a Google Drive message about virus scanning, click "Download anyway" to proceed with the download.'}
      </Alert>
      
      <StepTitle>
        {t('clientDownload.step2.title')}
      </StepTitle>
      <StepDescription>
        {t('clientDownload.step2.description')}
      </StepDescription>
      
      <CodeBox>
        <CodeText>
          {realmAddress}
        </CodeText>
      </CodeBox>
      
      <StepTitle>
        {t('clientDownload.step3.title')}
      </StepTitle>
      <StepDescription>
        {t('clientDownload.step3.description')}
      </StepDescription>
      
      <Alert severity="warning" sx={{ mt: 4 }}>
        <Typography variant="body2">
          {t('clientDownload.helpText') || 'Having trouble? Join our Discord community for installation support.'}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Link href="https://discord.gg/MdpGvmAbkB" underline="none" target="_blank" rel="noopener noreferrer">
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<HelpOutlineIcon />}
            >
              {t('clientDownload.discord') || 'Discord Support'}
            </Button>
          </Link>
        </Stack>
      </Alert>
    </DownloadContainer>
  );
};

export default ClientDownload; 