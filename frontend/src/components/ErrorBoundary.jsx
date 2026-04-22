import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-fallback">
          <div className="card empty-state" role="alert">
            <h3>Something went wrong</h3>
            <p>
              The app hit an unexpected error. Reload the workspace to recover the session safely.
            </p>
            <button className="btn btn-primary btn-sm" type="button" onClick={this.handleReload}>
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
