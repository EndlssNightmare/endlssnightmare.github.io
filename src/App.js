import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Writeups from './pages/Writeups';
import Projects from './pages/Projects';
import Tags from './pages/Tags';
import WriteupDetail from './pages/WriteupDetail';
import TagDetail from './pages/TagDetail';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="main-container">
            <Sidebar />
            <main className="content">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/writeups" element={<Writeups />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tags" element={<Tags />} />
                  <Route path="/writeups/:id" element={<WriteupDetail />} />
                  <Route path="/tags/:tag" element={<TagDetail />} />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
