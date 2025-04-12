import { createTheme } from '@mui/material/styles';

// Define WoW color palette
const wowPalette = {
  blue: '#0787AC',
  navy: '#00437A',
  yellow: '#F7D23E',
  darkOrange: '#CD650E',
  gold: '#FFC940',
  black: '#000000',
  offWhite: '#F0E6D2',
  lightBlue: '#33B7E7',
  darkBlue: '#0076A3',
  lightGold: '#FFD54F',
  darkGold: '#D4A13F',
  lightOrange: '#FFB800',
  purple: '#7E57C2',
  silver: '#CDD1D6',
};

// Common styles for WoW-style components
const wowButtonStyle = {
  backgroundImage: 'url("/images/wow-button-bg.png")',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  borderRadius: '4px',
  border: `1px solid ${wowPalette.gold}`,
  color: wowPalette.offWhite,
  fontFamily: 'Friz Quadrata, serif',
  fontWeight: 500,
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
  transition: 'all 0.2s',
  padding: '10px 20px',
  minWidth: '120px',
  '&:hover': {
    filter: 'brightness(1.3)',
    borderColor: wowPalette.yellow,
    backgroundColor: 'transparent',
    transform: 'scale(1.03)',
  },
};

const wowFormStyle = {
  backgroundImage: 'url("/images/wow-form-bg.png")',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  borderRadius: '8px',
  border: `1px solid ${wowPalette.darkGold}`,
  padding: '18px',
  boxShadow: '0 0 20px rgba(0, 0, 0, 0.7)',
};

// Create MUI theme
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: wowPalette.lightGold,
      light: wowPalette.gold,
      dark: wowPalette.darkGold,
      contrastText: '#000000',
    },
    secondary: {
      main: wowPalette.darkOrange,
      light: wowPalette.lightOrange,
      dark: '#B45A0C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0A0A0A',
      paper: 'rgba(0, 38, 77, 0.9)',
    },
    text: {
      primary: wowPalette.offWhite,
      secondary: wowPalette.yellow,
    },
    error: {
      main: '#FF5252',
    },
    warning: {
      main: wowPalette.darkOrange,
    },
    info: {
      main: wowPalette.lightBlue,
    },
    success: {
      main: '#66BB6A',
    },
  },
  typography: {
    fontFamily: 'Friz Quadrata, "Segoe UI", Roboto, Arial, sans-serif',
    fontSize: 14,
    h1: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 700,
      letterSpacing: '0.02em',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
      color: wowPalette.gold,
    },
    h2: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 700,
      letterSpacing: '0.01em',
      textShadow: '1px 1px 3px rgba(0, 0, 0, 0.7)',
      color: wowPalette.gold,
    },
    h3: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
      color: wowPalette.yellow,
    },
    h4: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
      color: wowPalette.silver,
    },
    h5: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
      color: wowPalette.lightGold,
    },
    h6: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
      color: wowPalette.offWhite,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontFamily: 'Friz Quadrata, serif',
      letterSpacing: '0.02em',
    },
    body1: {
      color: wowPalette.offWhite,
      lineHeight: 1.6,
    },
    body2: {
      color: wowPalette.silver,
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          ...wowButtonStyle,
        },
        contained: {
          ...wowButtonStyle,
          '&.MuiButton-containedPrimary': {
            border: `1px solid ${wowPalette.gold}`,
            boxShadow: '0 0 10px rgba(255, 201, 92, 0.3)',
          },
          '&.MuiButton-containedSecondary': {
            border: `1px solid ${wowPalette.darkOrange}`,
            boxShadow: '0 0 10px rgba(205, 101, 14, 0.3)',
          },
        },
        outlined: {
          ...wowButtonStyle,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
        },
        elevation1: {
          ...wowFormStyle,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: `rgba(215, 170, 60, 0.6)`,
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: wowPalette.gold,
              borderWidth: 2,
            },
            '&.Mui-focused fieldset': {
              borderColor: wowPalette.lightGold,
              borderWidth: 2,
              boxShadow: '0 0 5px rgba(255, 201, 92, 0.5)',
            },
            '& input': {
              color: wowPalette.offWhite,
            },
          },
          '& .MuiInputLabel-root': {
            color: wowPalette.silver,
            '&.Mui-focused': {
              color: wowPalette.gold,
            },
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: `rgba(215, 170, 60, 0.6)`,
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: wowPalette.gold,
            },
            '&.Mui-focused fieldset': {
              borderColor: wowPalette.lightGold,
              boxShadow: '0 0 5px rgba(255, 201, 92, 0.5)',
            },
          },
          '& .MuiInputLabel-root': {
            color: wowPalette.silver,
            '&.Mui-focused': {
              color: wowPalette.gold,
            },
          },
          '& .MuiSelect-select': {
            color: wowPalette.offWhite,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...wowFormStyle,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          borderLeft: '4px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(102, 187, 106, 0.2)',
          borderLeftColor: '#66BB6A',
        },
        standardError: {
          backgroundColor: 'rgba(255, 82, 82, 0.2)',
          borderLeftColor: '#FF5252',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 184, 0, 0.2)',
          borderLeftColor: wowPalette.lightOrange,
        },
        standardInfo: {
          backgroundColor: 'rgba(51, 183, 231, 0.2)',
          borderLeftColor: wowPalette.lightBlue,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: `rgba(215, 170, 60, 0.3)`,
        },
      },
    },
  },
}); 