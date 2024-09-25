import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Anslagstavla from './components/Anslagstavla';  // Komponent för inläggslistan
import PostMessage from './components/PostMessage';    // Komponent för att posta meddelanden

const App = () => {
    return (
        <Router>
          <div className="tavlan">
          <nav>
                <ul>
                    <li>
                        <Link to="/">Visa Meddelanden</Link>
                    </li>
                    <li>
                        <Link to="/post">Posta Meddelande</Link>
                    </li>
                </ul>
            </nav>
        <Routes>
            <Route path="/" element={<Anslagstavla />} />
            <Route path="/post" element={<PostMessage />} />
        </Routes>
        </div>
    </Router>
    );
};

export default App;
