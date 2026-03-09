import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

test('renders username input', () => {
  renderLogin();
  expect(screen.getByLabelText('login.usernameLabel')).toBeInTheDocument();
});

test('renders password input', () => {
  renderLogin();
  expect(screen.getByLabelText('login.passwordLabel')).toBeInTheDocument();
});

test('renders submit button', () => {
  renderLogin();
  expect(screen.getByRole('button', { name: 'login.signIn' })).toBeInTheDocument();
});
