import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../App.css';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const PostMessage = ({ onPostSuccess }) => {
    const [username, setUsername] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const MAX_CHARS = 75;

    // Återställ felmeddelande när användaren börjar skriva
    useEffect(() => {
        if (error) setError('');
    }, [username, text, error]); // Inkluderade 'error' som beroende

    // Återställ bekräftelsemeddelande när användaren börjar skriva ett nytt meddelande
    useEffect(() => {
        if (confirmation && (username || text)) {
            setConfirmation('');
        }
    }, [username, text, confirmation]); // Inkluderade 'confirmation' som beroende

    const postMessage = useCallback(async () => {
        // Validera indata
        if (username.trim() === '') {
            setError('Användarnamn kan inte vara tomt');
            return;
        }
        
        if (text.trim() === '') {
            setError('Meddelande kan inte vara tomt');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            
            const response = await axios.post(API_URL, { 
                username: username.trim(), 
                text: text.trim() 
            });
            
            const { id } = response.data;

            // Återställ formuläret
            setUsername('');
            setText('');
            setCharCount(0);
            
            // Visa bekräftelse med ID för senare redigering
            setConfirmation(`Meddelandet har publicerats! Ange detta ID om du behöver ändra ditt inlägg: ${id}`);
            
            // Kopiera ID till urklipp
            try {
                await navigator.clipboard.writeText(id);
                setConfirmation(`Meddelandet har publicerats! ID:t (${id}) har kopierats till urklipp.`);
            } catch (clipboardErr) {
                // Om kopiering till urklipp misslyckas, visa bara ID:t
                console.log('Kunde inte kopiera till urklipp:', clipboardErr);
            }

            // Meddela föräldrakomponenten att ett nytt meddelande har publicerats
            if (onPostSuccess) onPostSuccess();

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Kunde inte publicera meddelandet';
            setError(`Fel: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [username, text, onPostSuccess]); // Inkluderade alla beroenden för postMessage

    const handleTextChange = useCallback((e) => {
        const value = e.target.value;
        if (value.length <= MAX_CHARS) {
            setText(value);
            setCharCount(value.length);
        }
    }, [MAX_CHARS]);

    const handleKeyDown = useCallback((e) => {
        // Skicka formuläret när användaren trycker Ctrl+Enter eller Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
            e.preventDefault();
            if (username.trim() && text.trim()) {
                postMessage();
            }
        }
    }, [isSubmitting, username, text, postMessage]);

    return (
        <div className="tavlan post-message-form">
            <h2>Skriv ett nytt meddelande</h2>
            
            {error && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}
            
            {confirmation && (
                <div className="confirmation-message" role="status">
                    {confirmation}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="username">Användarnamn</label>
                <input 
                    id="username"
                    type="text" 
                    placeholder="Ditt namn" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={50}
                    aria-required="true"
                    disabled={isSubmitting}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="message-text">Meddelande</label>
                <textarea 
                    id="message-text"
                    className="message-input"
                    placeholder="Skriv ditt meddelande här..." 
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    maxLength={MAX_CHARS}
                    aria-required="true"
                    disabled={isSubmitting}
                    rows={3}
                />
                <div className="char-counter" aria-live="polite">
                    <span className={charCount >= MAX_CHARS * 0.9 ? "near-limit" : ""}>
                        {charCount}/{MAX_CHARS} tecken
                    </span>
                </div>
            </div>

            <button 
                onClick={postMessage} 
                disabled={!username.trim() || !text.trim() || isSubmitting}
                className="submit-button"
                aria-busy={isSubmitting}
            >
                {isSubmitting ? 'Publicerar...' : 'Publicera'}
            </button>
            
            <p className="keyboard-shortcut">
                Tips: Tryck på Ctrl+Enter (eller Cmd+Enter) för att publicera snabbt
            </p>
        </div>
    );
};

export default PostMessage;