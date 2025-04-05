import { createTheme } from '@mui/material/styles';

// Define WoW color palette
const wowPalette = {
  blue: '#0787AC',
  navy: '#00437A',
  yellow: '#EDE944',
  darkOrange: '#CD650E',
  gold: '#C7833D',
  black: '#000000',
  offWhite: '#E8D3A9',
  lightBlue: '#33B7E7',
  darkBlue: '#0076A3',
  lightGold: '#F7C95C',
  darkGold: '#C7833D',
  lightOrange: '#FFB800',
};

// Common styles for WoW-style components
const wowButtonStyle = {
  backgroundImage: 'url("/images/wow-button-bg.png")',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  borderRadius: '4px',
  border: `1px solid ${wowPalette.yellow}`,
  color: wowPalette.offWhite,
  fontFamily: 'Friz Quadrata, serif',
  fontWeight: 450,
  // textShadow: '1px 1px 1px rgba(0, 0, 0, 0.8)',
  transition: 'all 0.2s',
  padding: '10px 20px',
  minWidth: '120px',
  '&:hover': {
    filter: 'brightness(1.2)',
    borderColor: wowPalette.darkOrange,
    backgroundColor: 'transparent',
  },
};

const wowFormStyle = {
  backgroundImage: 'url("/images/wow-form-bg.png")',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  borderRadius: '8px',
  border: `1px solid ${wowPalette.black}`,
  padding: '16px',
  boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
};

// Create MUI theme
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: wowPalette.lightGold,
      light: wowPalette.blue,
      dark: wowPalette.blue,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: wowPalette.darkOrange,
      contrastText: '#FFFFFF',
    },
    background: {
      default: wowPalette.black,
      paper: wowPalette.navy,
    },
    text: {
      primary: '#FFFFFF',
      secondary: wowPalette.yellow,
    },
    error: {
      main: '#E53935',
    },
    warning: {
      main: wowPalette.darkOrange,
    },
    info: {
      main: wowPalette.blue,
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: 'Friz Quadrata, serif',
    h1: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'Friz Quadrata, serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontFamily: 'Friz Quadrata, serif',
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
            border: `1px solid ${wowPalette.darkOrange}`,
          },
          '&.MuiButton-containedSecondary': {
            border: `1px solid ${wowPalette.darkOrange}`,
          },
        },
        outlined: {
          ...wowButtonStyle,
          backgroundColor: 'transparent',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
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
              borderColor: `rgba(${wowPalette.gold}, 0.5)`,
            },
            '&:hover fieldset': {
              borderColor: `rgba(${wowPalette.gold}, 0.8)`,
            },
            '&.Mui-focused fieldset': {
              borderColor: wowPalette.gold,
            },
            '& input': {
              color: wowPalette.offWhite,
            },
          },
          '& .MuiInputLabel-root': {
            color: wowPalette.offWhite,
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: `rgba(${wowPalette.gold}, 0.5)`,
            },
            '&:hover fieldset': {
              borderColor: `rgba(${wowPalette.gold}, 0.8)`,
            },
            '&.Mui-focused fieldset': {
              borderColor: wowPalette.gold,
            },
          },
          '& .MuiInputLabel-root': {
            color: wowPalette.offWhite,
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
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
        },
      },
    },
  },
}); 