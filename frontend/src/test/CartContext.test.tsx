import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, useCart } from '@/features/cart/CartContext';
import type { CartItem } from '@/types/cart';

/**
 * Componente auxiliar de test que expone las acciones del carrito
 * para poder interactuar con el context desde los tests.
 */
function CartTestHarness() {
  const { state, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  const sampleItem: CartItem = {
    productId: 1,
    name: 'Serum Facial',
    slug: 'serum-facial',
    imageUrl: 'https://example.com/img.jpg',
    unitPrice: 68000,
    quantity: 1,
    maxStock: 25,
  };

  const secondItem: CartItem = {
    productId: 2,
    name: 'Crema Hidratante',
    slug: 'crema-hidratante',
    imageUrl: 'https://example.com/img2.jpg',
    unitPrice: 54000,
    quantity: 2,
    maxStock: 30,
  };

  return (
    <div>
      <p data-testid="total-items">{totalItems}</p>
      <p data-testid="total-price">{totalPrice}</p>
      <p data-testid="items-count">{state.items.length}</p>
      <p data-testid="items-json">{JSON.stringify(state.items)}</p>
      <button onClick={() => addItem(sampleItem)}>add-item-1</button>
      <button onClick={() => addItem(secondItem)}>add-item-2</button>
      <button onClick={() => addItem({ ...sampleItem, quantity: 3 })}>add-item-1-qty-3</button>
      <button onClick={() => removeItem(1)}>remove-item-1</button>
      <button onClick={() => updateQuantity(1, 5)}>update-qty-5</button>
      <button onClick={() => updateQuantity(1, 0)}>update-qty-0</button>
      <button onClick={() => clearCart()}>clear-cart</button>
    </div>
  );
}

function renderWithCart() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <CartTestHarness />
      </CartProvider>
    </MemoryRouter>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('empieza con carrito vacío', () => {
    renderWithCart();
    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(screen.getByTestId('total-price').textContent).toBe('0');
    expect(screen.getByTestId('items-count').textContent).toBe('0');
  });

  it('agrega un producto al carrito', async () => {
    const user = userEvent.setup();
    renderWithCart();

    await user.click(screen.getByText('add-item-1'));

    expect(screen.getByTestId('total-items').textContent).toBe('1');
    expect(screen.getByTestId('total-price').textContent).toBe('68000');
    expect(screen.getByTestId('items-count').textContent).toBe('1');
  });

  it('suma cantidad al agregar un producto que ya existe', async () => {
    const user = userEvent.setup();
    renderWithCart();

    await user.click(screen.getByText('add-item-1'));       // qty: 1
    await user.click(screen.getByText('add-item-1-qty-3')); // qty: 1+3 = 4

    expect(screen.getByTestId('total-items').textContent).toBe('4');
    expect(screen.getByTestId('total-price').textContent).toBe('272000'); // 4 × 68000
    expect(screen.getByTestId('items-count').textContent).toBe('1'); // sigue siendo 1 producto
  });

  it('no excede el maxStock al sumar cantidades', async () => {
    const user = userEvent.setup();
    renderWithCart();

    // maxStock es 25, agregar 1 + 3 + 3 + 3 + 3 + 3 + 3 + 3 + 3 + 3 = 28 → debería quedar en 25
    for (let i = 0; i < 10; i++) {
      await user.click(screen.getByText('add-item-1-qty-3'));
    }

    expect(screen.getByTestId('total-items').textContent).toBe('25');
  });

  it('elimina un producto del carrito', async () => {
    const user = userEvent.setup();
    renderWithCart();

    await user.click(screen.getByText('add-item-1'));
    await user.click(screen.getByText('add-item-2'));
    expect(screen.getByTestId('items-count').textContent).toBe('2');

    await user.click(screen.getByText('remove-item-1'));
    expect(screen.getByTestId('items-count').textContent).toBe('1');
    expect(screen.getByTestId('total-items').textContent).toBe('2'); // item-2 tiene qty:2
    expect(screen.getByTestId('total-price').textContent).toBe('108000'); // 2 × 54000
  });

  it('actualiza la cantidad de un producto', async () => {
    const user = userEvent.setup();
    renderWithCart();

    await user.click(screen.getByText('add-item-1'));
    await user.click(screen.getByText('update-qty-5'));

    expect(screen.getByTestId('total-items').textContent).toBe('5');
    expect(screen.getByTestId('total-price').textContent).toBe('340000'); // 5 × 68000
  });

  it('elimina un producto si la cantidad se actualiza a 0', async () => {
    const user = userEvent.setup();
    renderWithCart();

    await user.click(screen.getByText('add-item-1'));
    expect(screen.getByTestId('items-count').textContent).toBe('1');

    await user.click(screen.getByText('update-qty-0'));
    expect(screen.getByTestId('items-count').textContent).toBe('0');
    expect(screen.getByTestId('total-items').textContent).toBe('0');
  });

  it('vacía todo el carrito con clearCart', async () => {
    const user = userEvent.setup();
    renderWithCart();

    await user.click(screen.getByText('add-item-1'));
    await user.click(screen.getByText('add-item-2'));
    expect(screen.getByTestId('items-count').textContent).toBe('2');

    await user.click(screen.getByText('clear-cart'));
    expect(screen.getByTestId('items-count').textContent).toBe('0');
    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(screen.getByTestId('total-price').textContent).toBe('0');
  });

  it('calcula totales con múltiples productos correctamente', async () => {
    const user = userEvent.setup();
    renderWithCart();

    await user.click(screen.getByText('add-item-1'));  // 1 × 68000
    await user.click(screen.getByText('add-item-2'));  // 2 × 54000

    expect(screen.getByTestId('total-items').textContent).toBe('3');
    expect(screen.getByTestId('total-price').textContent).toBe('176000'); // 68000 + 108000
  });
});
