import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Hoisted mocks — must use vi.hoisted() because vi.mock is hoisted
const { mockOnAuthStateChanged } = vi.hoisted(() => ({
  mockOnAuthStateChanged: vi.fn((_auth: any, cb: any) => {
    cb(null); // simulate no user
    return vi.fn(); // unsubscribe
  }),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  // AuthContext calls signInAnonymously on the no-user path; the rejection
  // exercises its `.catch(() => setLoading(false))` so the "No user" state renders.
  signInAnonymously: vi.fn(() => Promise.reject(new Error('test: anonymous auth disabled'))),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// Must mock firebase lib BEFORE any code uses it
vi.mock('../../lib/firebase', () => ({
  auth: { app: {} },
  db: {},
  storage: {},
  handleFirestoreError: vi.fn(),
  OperationType: { GET: 'GET', WRITE: 'WRITE', DELETE: 'DELETE' },
  FirestoreError: class extends Error {},
}));

// Test consumer component
function TestConsumer() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div>{user ? user.name : 'No user'}</div>;
}

describe('AuthProvider', () => {
  it('renders children', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>,
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('provides context with no user initially', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    // After auth state resolves with null user
    const el = await screen.findByText('No user');
    expect(el).toBeDefined();
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for expected throw
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function BadComponent() {
      useAuth();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
