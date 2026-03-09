import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, forcePasswordChange } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        {t('common.loading')}
      </div>
    );
  }

  if (!user) {
    // Redirect to login and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect users who must change their password
  if (forcePasswordChange) {
    return <Navigate to="/force-password-change" replace />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: '16px'
      }}>
        <h2>{t('common.accessDenied')}</h2>
        <p>{t('common.accessDeniedRole')}</p>
        <p>{t('common.accessDeniedRequired', { role: requiredRole })}</p>
      </div>
    );
  }

  return children;
}
