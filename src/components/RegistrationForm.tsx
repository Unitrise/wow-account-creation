import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  FormControlLabel,
  Switch,
  // useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { useRegistrationStore } from '../store/registrationStore.js';
import { registerAccount, registerAccountWithSoap, checkUsername, checkEmail } from '../services/authService.js';  // Direct import
import { getConfigValue } from '../services/configService.js';
import { theme as appTheme } from '../theme/theme.js';

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

  // Additional states
  const [isBattleNet, setIsBattleNet] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // Get server name from config for form title
  const serverName = getConfigValue<string>('SERVER_NAME', 'WoW Israel');
  const srp6Support = getConfigValue<boolean>('SRP6_SUPPORT', false);
  const srp6Version = getConfigValue<number>('SRP6_VERSION', 0);
  const multipleEmailUse = getConfigValue<boolean>('MULTIPLE_EMAIL_USE', false);

  // Effect to check username existence after typing stops
  useEffect(() => {
    if (!username || username.length < 2 || isBattleNet) return;
    
    const timer = setTimeout(async () => {
      const exists = await checkUsername(username);
      setUsernameExists(exists);
      if (exists) {
        setError(t('registration.errors.usernameExists'));
      } else if (error === t('registration.errors.usernameExists')) {
        setError('');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username, isBattleNet, error, t, setError]);

  // Effect to check email existence after typing stops
  useEffect(() => {
    if (!email || !email.includes('@')) return;
    
    const timer = setTimeout(async () => {
      const exists = await checkEmail(email);
      setEmailExists(exists);
      if (exists && !multipleEmailUse) {
        setError(t('registration.errors.emailExists'));
      } else if (error === t('registration.errors.emailExists')) {
        setError('');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email, error, multipleEmailUse, t, setError]);

  // Password validation based on SRP6 version
  const validatePassword = (password: string): boolean => {
    if (srp6Support && srp6Version === 2) {
      return password.length >= 4 && password.length <= 128;
    } else {
      return password.length >= 4 && password.length <= 16;
    }
  };

  // Username validation
  const validateUsername = (username: string): boolean => {
    if (isBattleNet) return true; // No username for Battle.net accounts
    return username.length >= 2 && username.length <= 16 && /^[0-9A-Za-z-_]+$/.test(username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { username: isBattleNet ? email : username, email, isBattleNet });
    
    // Check if account creation is enabled
    if (!getConfigValue<boolean>('FEATURE_ACCOUNT_CREATION', true)) {
      setError(t('registration.errors.accountCreationDisabled'));
      return;
    }
    
    // Basic validation
    if ((isBattleNet && (!email || !password || !confirmPassword)) || 
        (!isBattleNet && (!username || !email || !password || !confirmPassword))) {
      setError(t('registration.errors.missingFields'));
      return;
    }
    
    // Username validation for non-Battle.net accounts
    if (!isBattleNet) {
      if (!validateUsername(username)) {
        setError(t('registration.errors.usernameFormat'));
        return;
      }

      if (usernameExists) {
        setError(t('registration.errors.usernameExists'));
        return;
      }
    }
    
    // Email validation
    if (!email.includes('@')) {
      setError(t('registration.errors.invalidEmail'));
      return;
    }
    
    // Check email existence if not allowing multiple accounts with same email
    if (emailExists && !multipleEmailUse) {
      setError(t('registration.errors.emailExists'));
      return;
    }
    
    // Password validation
    if (!validatePassword(password)) {
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
      
      // First try SOAP method for more reliable account creation
      const useSoap = getConfigValue<boolean>('USE_SOAP_REGISTRATION', true);
      
      let accountData = { 
        username: isBattleNet ? '' : username, 
        email, 
        password,
        isBattleNet,
        language: 'en',
        expansion: getConfigValue<number>('EXPANSION', 2)
      };
      
      console.log(`Using ${useSoap ? 'SOAP' : 'database'} method for account creation`);
      
      let result;
      let soapError = null;
      
      // Try SOAP first if enabled
      if (useSoap) {
        try {
          result = await registerAccountWithSoap(accountData);
        } catch (err: any) {
          console.error('SOAP registration error:', err);
          soapError = err.message || 'SOAP connection failed';
          // Don't set result yet - we'll try the fallback
        }
      }
      
      // If SOAP failed or was not enabled, use database method
      if (!useSoap || (soapError && getConfigValue<boolean>('ENABLE_DB_FALLBACK', true))) {
        console.log('Using database method for account creation');
        
        if (soapError) {
          console.log(`SOAP registration failed (${soapError}), falling back to database method`);
        }
        
        result = await registerAccount(accountData);
      }
      
      console.log('Registration result:', result);
      
      if (!result) {
        throw new Error('No registration result returned');
      }
      
      if (result.success) {
        // Clear form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsBattleNet(false);
        
        let successMessage = t('registration.success', { serverName });
        
        // If SOAP failed but DB worked, add a note about it
        if (soapError) {
          successMessage += `\n\n${t('registration.soapWarning', { message: soapError })}`;
        }
        
        // Show success message
        alert(successMessage);
      } else {
        // If SOAP failed AND DB failed, show both errors
        if (soapError) {
          setError(`${result.message || t('registration.errors.registrationFailed')} (SOAP error: ${soapError})`);
        } else {
          setError(result.message || t('registration.errors.registrationFailed'));
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || t('registration.errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <FormTitle>
        {t('registration.title', { serverName })}
      </FormTitle>
      
      <form onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Battle.net toggle switch */}
          <FormControlLabel
            control={
              <Switch 
                checked={isBattleNet}
                onChange={(e) => setIsBattleNet(e.target.checked)}
                disabled={isLoading}
              />
            }
            label={t('registration.battleNetAccount')}
          />
          
          {/* Username field - only shown for non-Battle.net accounts */}
          {!isBattleNet && (
            <StyledTextField
              label={t('registration.username')}
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!error && (!username || !validateUsername(username) || usernameExists)}
              helperText={
                error && !username 
                  ? error 
                  : usernameExists 
                    ? t('registration.errors.usernameExists')
                    : !validateUsername(username) && username
                      ? t('registration.errors.usernameFormat')
                      : ''
              }
              disabled={isLoading}
              required
            />
          )}
          
          <StyledTextField
            label={t('registration.email')}
            variant="outlined"
            fullWidth
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error && (!email || emailExists && !multipleEmailUse)}
            helperText={
              error && !email 
                ? error 
                : emailExists && !multipleEmailUse
                  ? t('registration.errors.emailExists')
                  : ''
            }
            disabled={isLoading}
            required
          />
          
          <StyledTextField
            label={t('registration.password')}
            variant="outlined"
            fullWidth
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error && (!password || !validatePassword(password))}
            helperText={
              error && !password 
                ? error 
                : !validatePassword(password) && password
                  ? t('registration.errors.passwordLength')
                  : ''
            }
            disabled={isLoading}
            required
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
            required
          />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
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