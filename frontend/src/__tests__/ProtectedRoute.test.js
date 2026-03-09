import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(authValue, initialPath = '/protected') {
  mockUseAuth.mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

test('redirects unauthenticated users to /login', () => {
  renderWithRouter({ user: null, loading: false });
  expect(screen.getByText('Login Page')).toBeInTheDocument();
});

test('renders children for authenticated users', () => {
  renderWithRouter({ user: { id: 1, role: 'admin' }, loading: false });
  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});

test('shows loading state while auth is being verified', () => {
  renderWithRouter({ user: null, loading: true });
  expect(screen.getByText('common.loading')).toBeInTheDocument();
});
