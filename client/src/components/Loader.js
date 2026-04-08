import React from 'react';

export const Loader = ({ text = 'Loading...' }) => (
  <div className="loader-wrapper">
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" />
      {text && <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</p>}
    </div>
  </div>
);

export const ErrorMessage = ({ message }) => (
  <div className="error-msg">
    <strong>Error:</strong> {message || 'Something went wrong.'}
  </div>
);

export default Loader;
