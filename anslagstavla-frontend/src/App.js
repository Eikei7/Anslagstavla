import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Anslagstavla from './components/Anslagstavla';
import PostMessage from './components/PostMessage';
import Navigation from './components/Navigation';

const App = () => {
    return (
      <Router>
        <Navigation />
        <Routes>
            <Route path="/" element={<Anslagstavla />} />
            <Route path="/post" element={<PostMessage />} />
        </Routes>
        
    </Router>
    );
};

export default App;
