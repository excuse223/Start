import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      // Navigate happens in AuthContext after successful login
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 429) {
        setError(t('login.error429'));
      } else if (err.response?.status === 401) {
        setError(t('login.error401'));
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(t('login.errorGeneral'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>⏰ {t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t('login.usernameLabel')}</label>
            <input
              id="username"
              type="text"
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.passwordLabel')}</label>
            <input
              id="password"
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading || !username || !password}
          >
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>

        <div className="login-footer">
          {process.env.NODE_ENV === 'development' && (
            <>
              <p>{t('login.devCredentials')}</p>
              <code>admin / admin123</code>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
