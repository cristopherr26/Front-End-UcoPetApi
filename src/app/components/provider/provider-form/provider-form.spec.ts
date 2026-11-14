import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Provider } from '../../../models/provider/provider.model';
import { ProviderForm } from './provider-form';

const saved: Provider = {
  id: 'p1',
  providerName: 'Veterinaria Central',
  representName: 'Ana Gómez',
  idType: 'NIT',
  documentNumber: '900123456',
  mobileNumber: null,
  address: null,
  email: null,
  active: true,
};

describe('ProviderForm (modal)', () => {
  const modal = { close: vi.fn(), dismiss: vi.fn() };

  beforeEach(() => {
    modal.close.mockReset();
    modal.dismiss.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: modal },
      ],
    });
  });

  function open() {
    const fixture = TestBed.createComponent(ProviderForm);
    const backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    backend.expectOne('/api/v1/persons/document-types').flush([{ value: 'NIT', label: 'NIT' }]);
    fixture.detectChanges();
    return { fixture, backend, element: fixture.nativeElement as HTMLElement };
  }

  function fill(element: HTMLElement) {
    const set = (id: string, value: string) => {
      const control = element.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
      control.value = value;
      control.dispatchEvent(new Event(control.tagName === 'SELECT' ? 'change' : 'input'));
    };
    set('provider-name', 'Veterinaria Central');
    set('provider-represent', 'Ana Gómez');
    set('provider-id-type', 'NIT');
    set('provider-document', '900123456');
  }

  it('creates a provider and closes the modal returning it', () => {
    const { fixture, backend, element } = open();
    expect(element.textContent).toContain('Nuevo proveedor');
    fill(element);

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    backend.expectOne({ method: 'POST', url: '/api/v1/providers' }).flush(saved);
    fixture.detectChanges();

    expect(modal.close).toHaveBeenCalledWith(saved);
  });

  it('keeps the modal open and shows the message when the document already exists', () => {
    const { fixture, backend, element } = open();
    fill(element);

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    backend
      .expectOne({ method: 'POST', url: '/api/v1/providers' })
      .flush(
        { message: 'Ya existe un proveedor con ese documento' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    expect(modal.close).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Ya existe un proveedor con ese documento');
  });

  it('edits the provider received from the list with a PUT', () => {
    const { fixture, backend, element } = open();
    (fixture.componentInstance as unknown as { edit: (p: Provider) => void }).edit(saved);
    fixture.detectChanges();
    expect(element.textContent).toContain('Editar proveedor');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    backend.expectOne({ method: 'PUT', url: '/api/v1/providers/p1' }).flush(saved);

    expect(modal.close).toHaveBeenCalledWith(saved);
  });

  it('blocks saving an inactive provider', () => {
    const { fixture, element } = open();
    (fixture.componentInstance as unknown as { edit: (p: Provider) => void }).edit({
      ...saved,
      active: false,
    });
    fixture.detectChanges();

    expect(element.textContent).toContain('está inactivo');
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });
});
