import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockLogin = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
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

test('submit button is disabled when fields are empty', () => {
  renderLogin();
  expect(screen.getByRole('button', { name: 'login.signIn' })).toBeDisabled();
});

test('calls login with username and password on submit', async () => {
  mockLogin.mockResolvedValueOnce(undefined);
  renderLogin();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('login.usernameLabel'), 'admin');
  await user.type(screen.getByLabelText('login.passwordLabel'), 'password');
  await user.click(screen.getByRole('button', { name: 'login.signIn' }));
  expect(mockLogin).toHaveBeenCalledWith('admin', 'password');
});
