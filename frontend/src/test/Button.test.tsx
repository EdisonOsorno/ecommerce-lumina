import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Agregar al carrito</Button>);
    expect(screen.getByRole('button', { name: /agregar al carrito/i })).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Comprar ahora</Button>);

    await user.click(screen.getByRole('button', { name: /comprar ahora/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('sets disabled and prevents click when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button disabled onClick={handleClick}>Agotado</Button>);

    const button = screen.getByRole('button', { name: /agotado/i });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('displays loading state with aria-busy when isLoading is true', () => {
    render(<Button isLoading>Procesando</Button>);
    const button = screen.getByRole('button', { name: /procesando/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });
});
