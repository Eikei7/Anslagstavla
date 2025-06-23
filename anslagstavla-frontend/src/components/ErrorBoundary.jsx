// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="tavlan">
                    <div className="error-message">
                        <h2>Något gick fel</h2>
                        <p>Applikationen stötte på ett oväntat fel. Försök ladda om sidan.</p>
                        <button onClick={() => window.location.reload()}>
                            Ladda om sidan
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;