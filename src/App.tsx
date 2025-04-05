import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, styled } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import Header from './components/Header';
import { HomePage } from './pages/HomePage';
import { DownloadPage } from './pages/DownloadPage';
import { ConfigProvider } from './context/ConfigContext';
import './i18n';

// Styled components for layout
const RootContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
});

const MainContent = styled(Box)({
  flex: 1,
  position: 'relative',
});

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <RootContainer>
            <Header />
            <MainContent>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/download" element={<DownloadPage />} />
              </Routes>
            </MainContent>
          </RootContainer>
        </Router>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;
