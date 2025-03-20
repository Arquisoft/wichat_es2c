
import { render, screen } from '@testing-library/react';
import Home from "./Home";


test('renders welcome message', () => {
  render(<Home />);
 const welcomeMessage = screen.getByText(/Log in to play/i);
  expect(welcomeMessage).toBeInTheDocument();
});


