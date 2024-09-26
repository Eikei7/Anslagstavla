import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const PostMessage = ({ onPostSuccess }) => {
    const [username, setUsername] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState(''); // Ny state-variabel för bekräftelse
    const [charCount, setCharCount] = useState(0); // För att hålla koll på teckenräkningen

    const postMessage = async () => {
        if (username.trim() === '' || text.trim() === '') return;
        try {
            const response = await axios.post(`${API_URL}`, { username, text });
            const { id } = response.data; // Få det returnerade id från servern

            setUsername('');
            setText('');
            setCharCount(0); // Nollställ teckenräknaren

            // Inkludera id i bekräftelsemeddelandet
            setConfirmation(`Meddelandet har publicerats! Ange detta ID om du behöver ändra ditt inlägg: ${id}`);

            if (onPostSuccess) onPostSuccess();

        } catch (err) {
            setError('Kunde inte posta meddelandet');
        }
    };

    // Hantera textinput med begränsning och teckenräkning
    const handleTextChange = (e) => {
        const value = e.target.value;
        if (value.length <= 75) { // Max 75 tecken
            setText(value);
            setCharCount(value.length); // Uppdatera teckenräknare
        }
    };

    return (
        <div className="tavlan">
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {confirmation && <p className="confirmation-message">{confirmation}</p>}

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
                onChange={handleTextChange} // Använd valideringsfunktionen
                maxLength={75} // Begränsa till max 75 tecken
            />
            <p style={{ color: 'white' }}>{charCount}/75 tecken</p> {/* Vit färg på teckenräknare */}

            <button onClick={postMessage} disabled={!username.trim() || !text.trim()}>
                Publicera
            </button>
        </div>
    );
};

export default PostMessage;
