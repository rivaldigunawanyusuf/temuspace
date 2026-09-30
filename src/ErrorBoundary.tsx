import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100dvh', width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: 20, textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Terjadi Kesalahan (Oops!)</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            Maaf, halaman ini mengalami masalah dan tidak dapat ditampilkan.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            style={{
              padding: '10px 20px', background: 'var(--accent-blue)', color: '#FFF',
              border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Kembali ke Beranda
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
