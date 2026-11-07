import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Space } from '../../../models/space/space.model';
import { clearCookies, setSessionCookies } from '../../../utils/session/testing';
import { SpaceForm } from './space-form';

describe('SpaceForm', () => {
  let backend: HttpTestingController;
  const modal = { close: vi.fn(), dismiss: vi.fn() };
  const sedes = [
    { id: 'h1', name: 'Norte', address: 'Calle 1', isActive: true },
    { id: 'h2', name: 'Sur', address: 'Calle 2', isActive: false },
  ];
  const existing: Space = {
    id: 's1',
    code: 'CON-101',
    type: 'Consultorio',
    description: 'Consultorio de medicina general',
    active: true,
    headquarterId: 'h1',
  };

  function create() {
    const fixture = TestBed.createComponent(SpaceForm);
    backend.expectOne('/api/v1/headquarter').flush(sedes);
    return fixture;
  }

  beforeEach(() => {
    clearCookies();
    setSessionCookies('t', ['ADMIN']);
    modal.close.mockReset();
    modal.dismiss.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: modal },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('offers only active headquarters when creating', async () => {
    const fixture = create();
    await fixture.whenStable();
    const options = [...fixture.nativeElement.querySelectorAll('#space-headquarter option')].map(
      (option) => (option as HTMLOptionElement).textContent?.trim(),
    );
    expect(options).toEqual(['Elige una sede', 'Norte']);
  });

  it('does not send an invalid space', async () => {
    const fixture = create();
    await fixture.whenStable();
    fixture.componentInstance['form'].patchValue({ code: 'con-101', type: 'Sala' });
    fixture.componentInstance['save']();
    backend.expectNone('/api/v1/spaces');
    expect(fixture.componentInstance['form'].invalid).toBe(true);
  });

  it('creates a space with trimmed values and its headquarter', async () => {
    const fixture = create();
    await fixture.whenStable();
    fixture.componentInstance['form'].patchValue({
      code: ' LAB-401 ',
      type: ' Laboratorio ',
      description: ' Análisis clínicos ',
      headquarterId: 'h1',
    });
    fixture.componentInstance['save']();
    const request = backend.expectOne({ method: 'POST', url: '/api/v1/spaces' });
    expect(request.request.body).toEqual({
      code: 'LAB-401',
      type: 'Laboratorio',
      description: 'Análisis clínicos',
      headquarterId: 'h1',
    });
    request.flush({ ...request.request.body, id: 's9', active: true });
    expect(modal.close).toHaveBeenCalled();
  });

  it('shows the reason the API gives when it rejects the space', async () => {
    const fixture = create();
    await fixture.whenStable();
    fixture.componentInstance['form'].patchValue({
      code: 'LAB-401',
      type: 'Laboratorio',
      description: 'Análisis clínicos',
      headquarterId: 'h1',
    });
    fixture.componentInstance['save']();
    backend
      .expectOne('/api/v1/spaces')
      .flush(
        { detail: 'La sede indicada está inactiva.' },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(fixture.componentInstance['error']()).toBe('La sede indicada está inactiva.');
    expect(modal.close).not.toHaveBeenCalled();
  });

  it('on edit locks the code and the headquarter and patches only what changed', async () => {
    const fixture = create();
    fixture.componentInstance.edit(existing);
    await fixture.whenStable();
    const form = fixture.componentInstance['form'];
    expect(form.controls.code.disabled).toBe(true);
    expect(form.controls.headquarterId.disabled).toBe(true);

    form.patchValue({ description: 'Consultorio de pediatría' });
    fixture.componentInstance['save']();
    const request = backend.expectOne({ method: 'PATCH', url: '/api/v1/spaces/s1' });
    expect(request.request.body).toEqual({ description: 'Consultorio de pediatría' });
    request.flush({ ...existing, description: 'Consultorio de pediatría' });
    expect(modal.close).toHaveBeenCalled();
  });

  it('on edit closes without calling the API when nothing changed', async () => {
    const fixture = create();
    fixture.componentInstance.edit(existing);
    await fixture.whenStable();
    fixture.componentInstance['save']();
    backend.expectNone('/api/v1/spaces/s1');
    expect(modal.dismiss).toHaveBeenCalled();
  });
});