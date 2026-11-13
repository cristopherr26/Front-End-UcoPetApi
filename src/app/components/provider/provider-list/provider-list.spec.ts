import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Provider } from '../../../models/provider/provider.model';
import { ProviderList } from './provider-list';

const provider = (
  id: string,
  providerName: string,
  documentNumber: string,
  active = true,
): Provider => ({
  id,
  providerName,
  representName: 'Ana Gómez',
  idType: 'NIT',
  documentNumber,
  mobileNumber: null,
  address: null,
  email: null,
  active,
});

describe('ProviderList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => vi.useRealTimers());

  // Crea la pantalla, contesta el GET con los proveedores dados y devuelve ayudas para la prueba.
  async function open(providers: Provider[]) {
    const fixture = TestBed.createComponent(ProviderList);
    const backend = TestBed.inject(HttpTestingController);
    const element: HTMLElement = fixture.nativeElement;

    // Avanza el reloj simulado y deja que Angular repinte.
    const settle = async (ms: number) => {
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      fixture.detectChanges();
    };

    await settle(0);
    backend.expectOne('/api/v1/providers').flush(providers);
    await settle(0);

    return {
      rows: () => element.querySelectorAll('tbody tr').length,
      tableText: () => element.querySelector('tbody')?.textContent ?? '',
      type: async (text: string) => {
        const input = element.querySelector<HTMLInputElement>('input[type="search"]');
        input!.value = text;
        input!.dispatchEvent(new Event('input'));
        await settle(300);
      },
    };
  }

  it('filters the table by name or document while the user types', async () => {
    const screen = await open([
      provider('1', 'Distribuidora Peña', '900123456'),
      provider('2', 'Veterinaria Central', '800555777'),
    ]);
    expect(screen.rows()).toBe(2);

    await screen.type('central');
    expect(screen.rows()).toBe(1);
    expect(screen.tableText()).toContain('VETERINARIA CENTRAL');

    await screen.type('900123');
    expect(screen.rows()).toBe(1);
    expect(screen.tableText()).toContain('DISTRIBUIDORA PEÑA');

    await screen.type('zzz');
    expect(screen.tableText()).toContain('Ningún proveedor coincide');

    await screen.type('');
    expect(screen.rows()).toBe(2);
  });
});
