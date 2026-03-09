import { render } from '@testing-library/react';
import App from '../App';

// Mock i18n to avoid loading translation files in tests
jest.mock('../i18n', () => ({}));

// Mock AuthContext so App renders without a real backend
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
  AuthProvider: ({ children }) => <>{children}</>,
}));

// Mock ThemeContext
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
  ThemeProvider: ({ children }) => <>{children}</>,
}));

test('renders without crashing', () => {
  render(<App />);
});
