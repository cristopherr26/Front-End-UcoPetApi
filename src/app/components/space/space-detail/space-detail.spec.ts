import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Space } from '../../../models/space/space.model';
import { clearCookies, setSessionCookies } from '../../../utils/session/testing';
import { SpaceDetail } from './space-detail';

describe('SpaceDetail', () => {
  let backend: HttpTestingController;
  const sedes = [{ id: 'h1', name: 'Norte', address: 'Calle 1', isActive: true }];
  const space: Space = {
    id: 's1',
    code: 'CON-101',
    type: 'Consultorio',
    description: 'Consultorio de medicina general',
    active: true,
    headquarterId: 'h1',
  };

  async function open(code: string, answer: Space | { status: number }) {
    const fixture = TestBed.createComponent(SpaceDetail);
    fixture.componentRef.setInput('code', code);
    fixture.detectChanges();
    backend.expectOne('/api/v1/headquarter').flush(sedes);
    const request = backend.expectOne(`/api/v1/spaces/code/${code}`);
    if ('status' in answer) {
      request.flush(null, { status: answer.status, statusText: 'Error' });
    } else {
      request.flush(answer);
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const text = (fixture: { nativeElement: HTMLElement }) =>
    fixture.nativeElement.textContent?.replace(/\s+/g, ' ');

  beforeEach(() => {
    clearCookies();
    setSessionCookies('t', ['ADMIN']);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('loads the space whose code comes from the route', async () => {
    const fixture = await open('CON-101', space);
    expect(text(fixture)).toContain('CON-101');
    expect(text(fixture)).toContain('Consultorio de medicina general');
    expect(text(fixture)).toContain('Norte');
    expect(text(fixture)).toContain('Activo');
  });

  it('links back to the list, and to the spaces of the same type with a query parameter', async () => {
    const fixture = await open('CON-101', space);
    const links = [...fixture.nativeElement.querySelectorAll('a')].map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );
    expect(links).toContain('/espacios');
    expect(links).toContain('/espacios?type=Consultorio');
  });

  it('says so when there is no space with that code', async () => {
    const fixture = await open('XXX-999', { status: 404 });
    expect(text(fixture)).toContain('No encontramos un espacio con el código');
    expect(text(fixture)).toContain('XXX-999');
  });

  it('shows the API error when it cannot load the space', async () => {
    const fixture = await open('CON-101', { status: 0 });
    expect(fixture.nativeElement.querySelector('.alert-danger')?.textContent).toContain(
      'No hay conexión con la API',
    );
  });

  it('offers to activate a deactivated space and sends the PATCH', async () => {
    const fixture = await open('CON-101', { ...space, active: false });
    expect(text(fixture)).toContain('Desactivado');

    fixture.componentInstance['activate']();
    const request = backend.expectOne({ method: 'PATCH', url: '/api/v1/spaces/s1' });
    expect(request.request.body).toEqual({ active: true });
    request.flush({ ...space, active: true }, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();
    expect(text(fixture)).toContain('Activo');
  });
});