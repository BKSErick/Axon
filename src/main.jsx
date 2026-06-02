import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Global ErrorBoundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#330000', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h2>Algo deu errado (Global Error)</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
