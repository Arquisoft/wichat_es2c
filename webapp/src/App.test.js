import { render, screen } from '@testing-library/react';
import Home from "./Home";


test('renders welcome message', () => {
  render(<Home />);
  const welcomeMessage = screen.getByText(/Welcome to the 2025 edition of the Software Architecture course/i);
  expect(welcomeMessage).toBeInTheDocument();
});


