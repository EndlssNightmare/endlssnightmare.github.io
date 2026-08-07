import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Writeups from './pages/Writeups';
import Projects from './pages/Projects';
import Tags from './pages/Tags';
import WriteupDetail from './pages/WriteupDetail';
import TagDetail from './pages/TagDetail';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const content = document.querySelector('.content');
    if (content) content.scrollTop = 0;

    const isWriteupDetail = /^\/writeups\/[^/]+$/.test(location.pathname);
    if (isWriteupDetail) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [location.pathname]);

  return (
    <div className="App">
      <Navbar />
      <div className={`main-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/writeups" element={<Writeups />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/writeups/:id" element={<WriteupDetail />} />
            <Route path="/tags/:tag" element={<TagDetail />} />
          </Routes>
        </main>
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
