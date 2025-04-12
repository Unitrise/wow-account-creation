import React from 'react';
import { Box, Typography, Button, Paper, Divider, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { RegistrationForm } from '../components/RegistrationForm';
import DiscordIcon from '@mui/icons-material/Chat';
import ForumIcon from '@mui/icons-material/Forum';
import GroupIcon from '@mui/icons-material/Group';

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
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 100%)',
    pointerEvents: 'none',
  }
}));

const WelcomeSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: '2rem',
  position: 'relative',
  width: '100%',
  maxWidth: '900px',
  padding: '0 16px',
});

const PageTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Cinzel, serif',
  fontWeight: 700,
  color: theme.palette.primary.main,
  textShadow: `0 0 20px ${theme.palette.primary.main}, 0 0 10px rgba(0, 0, 0, 0.8)`,
  marginBottom: '1.5rem',
  textAlign: 'center',
  fontSize: 'clamp(2.5rem, 6vw, 4rem)',
  position: 'relative',
  letterSpacing: '0.05em',
  padding: '0.5rem 1rem',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    width: '120px',
    height: '3px',
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  '&::before': {
    width: '180px',
    height: '1px',
    bottom: '-5px',
  }
}));

const PageSubtitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Cinzel, serif',
  fontWeight: 600,
  color: theme.palette.common.white,
  marginBottom: '3%',
  textAlign: 'center',
  fontSize: 'clamp(1.25rem, 2.2vw, 1.8rem)',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
  maxWidth: '800px',
  position: 'relative',
  padding: '0 1rem',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 10px ${theme.palette.primary.main}`,
    top: '50%',
    transform: 'translateY(-50%)',
    opacity: 0.7,
  },
  '&::before': {
    left: '-40px',
    background: `radial-gradient(circle, ${theme.palette.primary.main}50 0%, transparent 70%)`,
  },
  '&::after': {
    right: '-40px',
    background: `radial-gradient(circle, ${theme.palette.primary.main}50 0%, transparent 70%)`,
  }
}));

const GlowingAccent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  background: `radial-gradient(circle, ${theme.palette.primary.main}40 0%, transparent 70%)`,
  top: '-70px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: -1,
  animation: 'pulse 6s infinite alternate',
  '@keyframes pulse': {
    '0%': {
      opacity: 0.3,
      transform: 'translateX(-50%) scale(0.8)',
    },
    '100%': {
      opacity: 0.7,
      transform: 'translateX(-50%) scale(1.2)',
    },
  },
}));

const TitleDecorator = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '60px',
  height: '60px',
  margin: '0 auto 20px',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    background: `conic-gradient(from 0deg, ${theme.palette.primary.main}20, ${theme.palette.primary.main}, ${theme.palette.primary.main}20)`,
    borderRadius: '50%',
    animation: 'spin 10s linear infinite',
  },
  '&::after': {
    animation: 'spin 10s linear infinite reverse',
    width: '70%',
    height: '70%',
    top: '15%',
    left: '15%',
    background: `conic-gradient(from 180deg, ${theme.palette.primary.main}20, ${theme.palette.primary.main}, ${theme.palette.primary.main}20)`,
  },
  '@keyframes spin': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: '24px',
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 10px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${theme.palette.primary.main}`,
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '50%',
  padding: '16px',
  marginBottom: '16px',
  color: theme.palette.primary.main,
  border: `2px solid ${theme.palette.primary.main}`,
  boxShadow: `0 0 10px ${theme.palette.primary.main}`,
}));

const DiscordButton = styled(Button)(({ theme }) => ({
  marginTop: '16px',
  backgroundColor: '#7289DA', // Discord brand color
  color: '#FFFFFF',
  '&:hover': {
    backgroundColor: '#5d73bc',
  },
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
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

const ContentSection = styled(Box)(({ theme }) => ({
  marginTop: '5%',
  marginBottom: '5%',
  width: '100%',
  maxWidth: '1200px',
  position: 'relative',
  padding: '0 16px',
}));

const FeaturesContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '32px',
  justifyContent: 'center',
  width: '100%',
});

const FeatureItem = styled(Box)({
  flex: '1 1 300px',
  maxWidth: '400px',
  minWidth: '280px',
});

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Discord server URL
  const discordUrl = 'https://discord.gg/MdpGvmAbkB'; // WoW Israel Discord community
  
  return (
    <PageContainer>
      <WelcomeSection>
        <GlowingAccent />
        <TitleDecorator />
        <PageTitle>
          {t('homePage.title')}
        </PageTitle>
        <PageSubtitle>
          {t('homePage.subtitle')}
        </PageSubtitle>
      </WelcomeSection>
      
      <RegistrationForm />
      
      <ContentSection>
        <Divider sx={{ 
          my: 5, 
          borderColor: theme.palette.primary.main,
          '&::before, &::after': {
            borderColor: theme.palette.primary.main,
          },
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            height: '6px',
            width: '6px',
            backgroundColor: theme.palette.primary.main,
            borderRadius: '50%',
            top: '-3px',
            left: '50%',
            marginLeft: '-3px',
            boxShadow: `0 0 5px ${theme.palette.primary.main}`,
          }
        }}>
          <Typography variant="h5" component="span" sx={{ px: 2 }}>
            {t('homePage.communitySection') || 'Join Our Community'}
          </Typography>
        </Divider>
        
        <FeaturesContainer>
          <FeatureItem>
            <FeatureCard>
              <IconWrapper>
                <DiscordIcon fontSize="large" />
              </IconWrapper>
              <Typography variant="h5" gutterBottom>
                {t('homePage.discordTitle') || 'Discord Community'}
              </Typography>
              <Typography variant="body1" paragraph>
                {t('homePage.discordDescription') || 'Join our vibrant Discord community to connect with fellow players, get support, and stay updated with the latest server news.'}
              </Typography>
              <a href={discordUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <DiscordButton variant="contained">
                  <DiscordIcon />
                  {t('homePage.joinDiscord') || 'Join Discord'}
                </DiscordButton>
              </a>
            </FeatureCard>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureCard>
              <IconWrapper>
                <ForumIcon fontSize="large" />
              </IconWrapper>
              <Typography variant="h5" gutterBottom>
                {t('homePage.forumsTitle') || 'Forums & Guides'}
              </Typography>
              <Typography variant="body1">
                {t('homePage.forumsDescription') || 'Access helpful guides, strategies, and discussions. Share your experiences and learn from veteran players.'}
              </Typography>
            </FeatureCard>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureCard>
              <IconWrapper>
                <GroupIcon fontSize="large" />
              </IconWrapper>
              <Typography variant="h5" gutterBottom>
                {t('homePage.eventsTitle') || 'Events & Tournaments'}
              </Typography>
              <Typography variant="body1">
                {t('homePage.eventsDescription') || 'Participate in regular in-game events, PvP tournaments, and special seasonal activities with exciting rewards.'}
              </Typography>
            </FeatureCard>
          </FeatureItem>
        </FeaturesContainer>
      </ContentSection>

      <Box sx={{ mt: '3%' }}>
        <Box component={RouterLink} to="/download" sx={{ textDecoration: 'none' }}>
          <DownloadButton
            variant="contained"
            color="secondary"
            size="large"
          >
            {t('homePage.downloadButton')}
          </DownloadButton>
        </Box>
      </Box>
    </PageContainer>
  );
}; 