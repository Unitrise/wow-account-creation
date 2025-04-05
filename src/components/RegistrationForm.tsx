import React from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  // useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { useRegistrationStore } from '../store/registrationStore.js';
import { registerUser } from '../services/api.js';
import { getConfigValue, loadConfig } from '../services/configService.js';
import { theme as appTheme } from '../theme/theme.js';

// Load configuration
const config = loadConfig();

// Styled components
const FormContainer = styled(Paper)({
  padding: '3%',
  width: '100%',
  maxWidth: '500px',
  margin: '0 auto',
});

const FormTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Friz Quadrata, serif',
  fontWeight: 700,
  color: theme.palette.text.secondary,
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
  marginBottom: '2%',
  textAlign: 'center',
  fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: '2%',
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(237, 233, 68, 0.5)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(237, 233, 68, 0.8)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.secondary.main,
    },
    '& input': {
      color: '#E8D3A9',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#E8D3A9',
  },
}));

const SubmitButton = styled(Button)({
  marginTop: '2%',
  color: appTheme.palette.primary.main,
  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
  minWidth: '200px',
});

export const RegistrationForm: React.FC = () => {
  const { t } = useTranslation();
  // const theme = useTheme();
  
  const { 
    username, 
    email, 
    password, 
    confirmPassword, 
    error, 
    isLoading, 
    setUsername, 
    setEmail, 
    setPassword, 
    setConfirmPassword, 
    setError, 
    setLoading 
  } = useRegistrationStore();

  // Get server name from config for form title
  const serverName = getConfigValue<string>(config, 'SERVER_NAME', 'WoW Israel');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account creation is enabled
    if (!getConfigValue<boolean>(config, 'FEATURE_ACCOUNT_CREATION', true)) {
      setError(t('registration.errors.accountCreationDisabled'));
      return;
    }
    
    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      setError(t('registration.errors.missingFields'));
      return;
    }
    
    if (username.length < 3 || username.length > 32) {
      setError(t('registration.errors.usernameLength'));
      return;
    }
    
    if (password.length < 8) {
      setError(t('registration.errors.passwordLength'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('registration.errors.passwordsMatch'));
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const success = await registerUser({ 
        username, 
        email, 
        password
      });
      
      if (success) {
        // Clear form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Show success message
        alert(t('registration.success', { serverName }));
      } else {
        setError(t('registration.errors.registrationFailed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('registration.errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <FormTitle>
        {t('registration.title', { serverName })}
      </FormTitle>
      
      <form onSubmit={handleSubmit}>
        <StyledTextField
          label={t('registration.username')}
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={!!error && !username}
          helperText={error && !username ? error : ''}
          disabled={isLoading}
        />
        
        <StyledTextField
          label={t('registration.email')}
          variant="outlined"
          fullWidth
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!error && !email}
          helperText={error && !email ? error : ''}
          disabled={isLoading}
        />
        
        <StyledTextField
          label={t('registration.password')}
          variant="outlined"
          fullWidth
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!error && !password}
          helperText={error && !password ? error : ''}
          disabled={isLoading}
        />
        
        <StyledTextField
          label={t('registration.confirmPassword')}
          variant="outlined"
          fullWidth
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!error && password !== confirmPassword}
          helperText={error && password !== confirmPassword ? error : ''}
          disabled={isLoading}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: '2%' }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <SubmitButton
            type="submit"
            variant="contained"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? t('common.loading') : t('registration.submit')}
          </SubmitButton>
        </Box>
      </form>
    </FormContainer>
  );
}; 