import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Konfigurera API
const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages',
    timeout: 10000
};

// Konfigurera axios med timeout och interceptors
const api = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout
});

// Response interceptor för bättre felhantering
api.interceptors.response.use(
    response => response,
    error => {
        // Hantera specifika HTTP-statuskoder
        if (error.response?.status === 429) {
            throw new Error('För många förfrågningar. Försök igen om en stund.');
        }
        if (error.response?.status >= 500) {
            throw new Error('Serverfel. Försök igen senare.');
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Anslutningen tog för lång tid. Kontrollera din internetanslutning.');
        }
        throw error;
    }
);

const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return "Ogiltigt datum";
        }
        
        return date.toLocaleString('sv-SE', {
            timeZone: 'Europe/Stockholm',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        console.error("Fel vid formatering av datum:", error);
        return "Datum kunde inte visas";
    }
};

// Memoized MessageItem komponent för bättre prestanda
const MessageItem = ({ message, onEdit, editingMessageId, currentMessageText, inputMessageId, updateError, onUpdate, onCloseEdit, onInputChange, onIdChange }) => {
    const { id, username, text, createdAt, updatedAt } = message;
    
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onCloseEdit();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onUpdate(id, currentMessageText);
        }
    }, [id, currentMessageText, onUpdate, onCloseEdit]);

    return (
        <li className="message-item">
            <div className="date" title={new Date(createdAt).toISOString()}>
                {formatDate(updatedAt || createdAt)}
                {updatedAt && <span className="updated-indicator"> (redigerad)</span>}
            </div>
            <div className="message">{text}</div>
            <div className="username">{username}</div>

            <button 
                onClick={() => onEdit(id, text)}
                className="edit-button"
                aria-label={`Ändra meddelande från ${username}`}
            >
                Ändra meddelandet
            </button>

            {editingMessageId === id && (
                <div 
                    className="modal-overlay" 
                    onClick={(e) => {
                        if (e.target.className === 'modal-overlay') {
                            onCloseEdit();
                        }
                    }}
                >
                    <div 
                        className="modal-content"
                        onKeyDown={handleKeyDown}
                    >
                        <h2>Ändra meddelandet</h2>
                        
                        {updateError && (
                            <div className="error-message" role="alert">
                                {updateError}
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="edit-message">Nytt meddelande</label>
                            <textarea 
                                id="edit-message"
                                placeholder="Ange nytt meddelande"
                                value={currentMessageText}
                                onChange={onInputChange}
                                className="edit-textarea"
                                autoFocus
                                maxLength={75}
                                aria-required="true"
                            />
                            <div className="char-counter" aria-live="polite">
                                <span className={currentMessageText.length >= 68 ? "near-limit" : ""}>
                                    {currentMessageText.length}/75 tecken
                                </span>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="message-id">Meddelande-ID för bekräftelse</label>
                            <input 
                                id="message-id"
                                type="text" 
                                placeholder="Ange meddelandets ID för bekräftelse"
                                value={inputMessageId}
                                onChange={onIdChange}
                                className="id-input"
                                aria-required="true"
                            />
                        </div>
                        
                        <div className="modal-buttons">
                            <button 
                                onClick={() => onUpdate(id, currentMessageText)}
                                className="save-button"
                                disabled={!currentMessageText.trim() || currentMessageText.length > 75}
                            >
                                Spara
                            </button>
                            
                            <button 
                                onClick={onCloseEdit}
                                className="cancel-button"
                            >
                                Avbryt
                            </button>
                        </div>
                        
                        <p className="keyboard-shortcut">
                            Tips: Tryck Escape för att avbryta, Enter för att spara
                        </p>
                    </div>
                </div>
            )}
        </li>
    );
};

const Anslagstavla = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [currentMessageText, setCurrentMessageText] = useState('');
    const [inputMessageId, setInputMessageId] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [filterUser, setFilterUser] = useState('');
    const [originalMessages, setOriginalMessages] = useState([]);
    const [retryCount, setRetryCount] = useState(0);
    
    // Cache för meddelanden
    const cacheRef = useRef({
        messages: null,
        timestamp: null,
        duration: 5 * 60 * 1000 // 5 minuter
    });

    // Använd useRef för att bryta cirkulära beroenden
    const closeUpdateFormRef = useRef(() => {});

    // Stäng formulär för uppdatering
    const closeUpdateForm = useCallback(() => {
        setEditingMessageId(null);
        setInputMessageId('');
        setCurrentMessageText('');
        setUpdateError('');
    }, []);

    // Spara referens till closeUpdateForm
    useEffect(() => {
        closeUpdateFormRef.current = closeUpdateForm;
    }, [closeUpdateForm]);

    // Cache helpers
    const getCachedMessages = useCallback(() => {
        const { messages, timestamp, duration } = cacheRef.current;
        if (messages && timestamp && (Date.now() - timestamp < duration)) {
            return messages;
        }
        return null;
    }, []);

    const setCachedMessages = useCallback((messages) => {
        cacheRef.current = {
            messages,
            timestamp: Date.now(),
            duration: 5 * 60 * 1000
        };
    }, []);

    // Sortera och filtrera meddelanden
    const sortAndFilterMessages = useCallback((messagesToProcess = originalMessages) => {
        let sorted = [...messagesToProcess];
        
        // Sortera efter datum (använd updatedAt om det finns, annars createdAt)
        if (sortOrder === 'newest') {
            sorted = sorted.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateB - dateA;
            });
        } else {
            sorted = sorted.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateA - dateB;
            });
        }
        
        // Filtrera efter användarnamn
        if (filterUser) {
            sorted = sorted.filter(message => 
                message.username.toLowerCase().includes(filterUser.toLowerCase())
            );
        }
        
        setMessages(sorted);
    }, [sortOrder, filterUser, originalMessages]);

    // Hämta meddelanden med retry-logik
    const fetchMessages = useCallback(async (useCache = true) => {
        // Kontrollera cache först
        if (useCache) {
            const cached = getCachedMessages();
            if (cached) {
                setOriginalMessages(cached);
                sortAndFilterMessages(cached);
                return;
            }
        }

        try {
            setLoading(true);
            setError('');
            setRetryCount(0);
            
            const response = await api.get('');
            const messagesData = response.data;
            
            setOriginalMessages(messagesData);
            setCachedMessages(messagesData);
            sortAndFilterMessages(messagesData);
            
        } catch (err) {
            console.error('Fel vid hämtning av meddelanden:', err);
            
            let errorMessage = 'Kunde inte hämta meddelanden';
            if (err.message) {
                errorMessage = err.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            
            setError(errorMessage);
            
            // Använd cache som fallback vid fel
            const cached = getCachedMessages();
            if (cached) {
                setOriginalMessages(cached);
                sortAndFilterMessages(cached);
                setError(`${errorMessage} (visar cachade data)`);
            }
        } finally {
            setLoading(false);
        }
    }, [sortAndFilterMessages, getCachedMessages, setCachedMessages]);

    // Retry-funktion
    const retryFetch = useCallback(async () => {
        if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            await fetchMessages(false); // Skippa cache vid retry
        }
    }, [retryCount, fetchMessages]);

    // Uppdatera ett meddelande
    const handleUpdate = useCallback(async (id, newText) => {
        if (!newText.trim()) {
            setUpdateError('Meddelandet kan inte vara tomt');
            return;
        }
        
        if (newText.length > 75) {
            setUpdateError('Meddelandet får vara max 75 tecken');
            return;
        }
        
        if (inputMessageId !== id) {
            setUpdateError('Autentiseringsfel: Felaktigt ID');
            return;
        }

        try {
            setUpdateError('');
            await api.put(`/${id}`, { text: newText });
            
            // Uppdatera lokalt state direkt för bättre UX
            setOriginalMessages(prev => 
                prev.map(msg => 
                    msg.id === id 
                        ? { ...msg, text: newText, updatedAt: new Date().toISOString() }
                        : msg
                )
            );
            
            // Rensa cache och hämta uppdaterade data
            cacheRef.current.messages = null;
            await fetchMessages(false);
            
            closeUpdateFormRef.current();
        } catch (err) {
            console.error('Fel vid uppdatering:', err);
            
            let errorMessage = 'Kunde inte uppdatera meddelandet';
            if (err.message) {
                errorMessage = err.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            
            setUpdateError(errorMessage);
        }
    }, [inputMessageId, fetchMessages]);

    // Öppna formulär för att uppdatera meddelande
    const openUpdateForm = useCallback((id, currentText) => {
        setEditingMessageId(id);
        setCurrentMessageText(currentText);
        setInputMessageId('');
        setUpdateError('');
    }, []);

    // Växla sorteringsordning
    const handleSortToggle = useCallback(() => {
        setSortOrder(prevOrder => prevOrder === 'newest' ? 'oldest' : 'newest');
    }, []);

    // Hantera ändringar i filterfält
    const handleFilterChange = useCallback((e) => {
        setFilterUser(e.target.value);
    }, []);

    // Rensa filter
    const clearFilter = useCallback(() => {
        setFilterUser('');
    }, []);

    // Hämta meddelanden vid komponentladdning
    useEffect(() => {
        fetchMessages();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Uppdatera sortering och filtrering när parametrar ändras
    useEffect(() => {
        sortAndFilterMessages();
    }, [sortOrder, filterUser, sortAndFilterMessages]);

    // Auto-refresh var 30:e sekund
    useEffect(() => {
        const interval = setInterval(() => {
            fetchMessages();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Event handlers för modal
    const handleMessageTextChange = useCallback((e) => {
        setCurrentMessageText(e.target.value);
    }, []);

    const handleIdChange = useCallback((e) => {
        setInputMessageId(e.target.value);
    }, []);

    return (
        <main className="tavlan" role="main">
            <h1 id="main-heading">Anslagstavlan</h1>
            
            {error && (
                <div className="error-message" role="alert">
                    {error}
                    {retryCount < 3 && (
                        <button onClick={retryFetch} className="retry-button">
                            Försök igen ({retryCount + 1}/3)
                        </button>
                    )}
                </div>
            )}
            
            <div className="header-image">
                <img src="../public/img/noticeboard.jpg" width="410" alt="Anslagstavla" />
                <img src="../img/noticeboard.jpg" width="410" alt="Anslagstavla" />
                <img src="../noticeboard.jpg" width="410" alt="Anslagstavla" />
                <img src="/img/noticeboard.jpg" width="410" alt="Anslagstavla" />
                <img src="./img/noticeboard.jpg" width="410" alt="Anslagstavla" />
            </div>
            
            <section className="controls" aria-label="Kontroller för meddelanden">
                <button 
                    onClick={handleSortToggle}
                    className="sort-button"
                    aria-label={`Nuvarande sortering: ${sortOrder === 'newest' ? 'Nyast först' : 'Äldst först'}. Klicka för att ändra`}
                >
                    Sortera: {sortOrder === 'newest' ? 'Nyast först' : 'Äldst först'}
                </button>

                <div className="filter-container">
                    <input 
                        type="text"
                        className="filter-input"
                        placeholder="Filtrera efter användarnamn"
                        value={filterUser}
                        onChange={handleFilterChange}
                        aria-label="Filtrera efter användarnamn"
                    />
                    {filterUser && (
                        <button 
                            onClick={clearFilter}
                            className="clear-filter-button"
                            aria-label="Rensa filter"
                            title="Rensa filter"
                        >
                            ✕
                        </button>
                    )}
                </div>
                
                <button 
                    onClick={() => fetchMessages(false)}
                    className="refresh-button"
                    disabled={loading}
                    aria-label="Uppdatera meddelanden"
                >
                    {loading ? 'Uppdaterar...' : 'Uppdatera'}
                </button>
            </section>

            <section aria-labelledby="messages-heading">
                <h2 id="messages-heading" className="sr-only">Meddelanden</h2>
                
                {loading && !messages.length ? (
                    <p className="loading-message" aria-live="polite">Laddar meddelanden...</p>
                ) : messages.length > 0 ? (
                    <>
                        <p className="message-count" aria-live="polite">
                            Visar {messages.length} av {originalMessages.length} meddelanden
                            {filterUser && ` för "${filterUser}"`}
                        </p>
                        <ul className="message-list">
                            {messages.map((message) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    onEdit={openUpdateForm}
                                    editingMessageId={editingMessageId}
                                    currentMessageText={currentMessageText}
                                    inputMessageId={inputMessageId}
                                    updateError={updateError}
                                    onUpdate={handleUpdate}
                                    onCloseEdit={closeUpdateForm}
                                    onInputChange={handleMessageTextChange}
                                    onIdChange={handleIdChange}
                                />
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="empty-message">
                        {filterUser 
                            ? `Inga meddelanden hittades för "${filterUser}"`
                            : 'Inga meddelanden finns ännu'
                        }
                    </p>
                )}
            </section>
        </main>
    );
};

export default Anslagstavla;