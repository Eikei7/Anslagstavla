import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const PostMessage = ({ onPostSuccess }) => {
    const [username, setUsername] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState(''); // Ny state-variabel för bekräftelse

    const postMessage = async () => {
        if (username.trim() === '' || text.trim() === '') return;
        try {
            await axios.post(`${API_URL}`, { username, text });
            setUsername('');
            setText('');
            setConfirmation('Meddelandet har publicerats!'); // Sätt bekräftelsen
            if (onPostSuccess) onPostSuccess();

            // Nollställ bekräftelsen efter 3 sekunder
            setTimeout(() => {
                setConfirmation('');
            }, 3000);
        } catch (err) {
            setError('Kunde inte posta meddelandet');
        }
    };

    return (
        <div className="tavlan">
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {confirmation && <p className="confirmation-message">{confirmation}</p>} {/* Bekräftelsemeddelande */}

            <input 
                type="text" 
                placeholder="Användarnamn" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
            <textarea 
                className='message-input'
                placeholder="Skriv ditt meddelande här..." 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
            />
            <button onClick={postMessage} disabled={!username.trim() || !text.trim()}>
                Publicera
            </button>
        </div>
    );
};

export default PostMessage;
