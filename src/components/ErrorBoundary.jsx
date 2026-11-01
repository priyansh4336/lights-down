import React from 'react';

/**
 * Top-level App ErrorBoundary:
 * Displays a styled "Projector jammed" screen with a "Reload" button
 * and the error message in small text so the page can never be blank.
 */
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Lights Down] AppErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    try {
      window.location.reload();
    } catch {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      const errMsg =
        this.state.error?.message || String(this.state.error || 'Unknown projection error');
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#08080c',
            color: '#f5f5f7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
          }}
          role="alert"
        >
          <div
            style={{
              maxWidth: '460px',
              background: 'rgba(27, 27, 39, 0.92)',
              border: '1.5px solid #ffb347',
              borderRadius: '20px',
              padding: '32px 26px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎞️</div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.75rem',
                fontWeight: 800,
                marginBottom: '10px',
                color: '#ffb347'
              }}
            >
              Projector jammed
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#a9a9bc', marginBottom: '18px' }}>
              A 35mm reel snagged in the booth. Hit Reload below to re-thread the projector.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                background: '#ffb347',
                color: '#08080c',
                fontWeight: 800,
                fontSize: '0.95rem',
                padding: '12px 24px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              ↻ Reload Booth
            </button>
            <pre
              style={{
                fontSize: '0.72rem',
                color: '#fca5a5',
                background: 'rgba(0,0,0,0.4)',
                padding: '10px',
                borderRadius: '8px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {errMsg}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * VisualEffectBoundary:
 * Wraps individual visual effects (LightRays, Noise, TargetCursor, ClickSpark, Grainient)
 * so if any canvas/WebGL/pointer effect fails, it renders fallback (default null) silently.
 */
export class VisualEffectBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('[Lights Down] Visual effect fallback triggered:', error?.message);
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback !== undefined ? this.props.fallback : null;
    }
    return this.props.children;
  }
}

