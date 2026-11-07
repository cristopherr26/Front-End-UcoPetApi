import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Space } from '../../../models/space/space.model';
import { clearCookies, setSessionCookies } from '../../../utils/session/testing';
import { SpaceList } from './space-list';

describe('SpaceList', () => {
  let backend: HttpTestingController;
  const sedes = [
    { id: 'h1', name: 'Norte', address: 'Calle 1', isActive: true },
    { id: 'h2', name: 'Sur', address: 'Calle 2', isActive: true },
  ];
  const spaces: Space[] = [
    {
      id: 's1',
      code: 'CON-101',
      type: 'Consultorio',
      description: 'Medicina general',
      active: true,
      headquarterId: 'h1',
    },
    {
      id: 's2',
      code: 'LAB-401',
      type: 'Laboratorio',
      description: 'Análisis clínicos',
      active: true,
      headquarterId: 'h2',
    },
    {
      id: 's3',
      code: 'QUI-201',
      type: 'Quirófano',
      description: 'Cirugía menor',
      active: false,
      headquarterId: 'h1',
    },
    {
      id: 's4',
      code: 'OLD-001',
      type: 'Consultorio',
      description: 'Sin sede asignada',
      active: true,
    },
  ];

  async function open(url = '/api/v1/spaces') {
    const fixture = TestBed.createComponent(SpaceList);
    fixture.detectChanges();
    backend.expectOne('/api/v1/headquarter').flush(sedes);
    backend.expectOne(url).flush(spaces);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const rows = (fixture: { nativeElement: HTMLElement }) =>
    [...fixture.nativeElement.querySelectorAll('tbody tr')].map((row) =>
      row.textContent?.replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    clearCookies();
    setSessionCookies('t', ['ADMIN']);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('shows the active spaces first, with the name of their headquarter', async () => {
    const fixture = await open();
    const shown = rows(fixture);
    expect(shown).toHaveLength(3);
    expect(shown.join('|')).toContain('CON-101');
    expect(shown.join('|')).toContain('Norte');
    expect(shown.join('|')).not.toContain('QUI-201');
  });

  it('marks a space created before the headquarters as "Sin sede"', async () => {
    const fixture = await open();
    const old = rows(fixture).find((row) => row?.includes('OLD-001'));
    expect(old).toContain('Sin sede');
  });

  it('shows the deactivated spaces when asked', async () => {
    const fixture = await open();
    fixture.componentInstance['setStatus']('inactive');
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(1);
    expect(rows(fixture)[0]).toContain('QUI-201');

    fixture.componentInstance['setStatus']('all');
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(4);
  });

  it('filters by type and by text', async () => {
    const fixture = await open();
    fixture.componentInstance['setType']('Consultorio');
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(2);

    fixture.componentInstance['search'].set('general');
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(1);
    expect(rows(fixture)[0]).toContain('CON-101');
  });

  it('builds the type filter from the spaces it received', async () => {
    const fixture = await open();
    expect(fixture.componentInstance['types']()).toEqual([
      'Consultorio',
      'Laboratorio',
      'Quirófano',
    ]);
  });

  it('asks only for the spaces of the active headquarter when there is one', async () => {
    document.cookie = 'ucopet_headquarter=h1; Path=/';
    const fixture = await open('/api/v1/spaces/headquarter/h1');
    expect(fixture.nativeElement.textContent).toContain('Espacios de la sede');
    expect(fixture.nativeElement.textContent).toContain('Norte');
  });

  it('asks the API to activate a space and shows it active right away', async () => {
    const fixture = await open();
    fixture.componentInstance['setStatus']('inactive');
    fixture.detectChanges();

    fixture.componentInstance['activate'](spaces[2]);
    const request = backend.expectOne({ method: 'PATCH', url: '/api/v1/spaces/s3' });
    expect(request.request.body).toEqual({ active: true });
    request.flush({ ...spaces[2], active: true }, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();

    expect(rows(fixture).join('|')).not.toContain('QUI-201');
    fixture.componentInstance['setStatus']('all');
    fixture.detectChanges();
    const updated = rows(fixture).find((row) => row?.includes('QUI-201'));
    expect(updated).toContain('Activo');
  });

  it('links each code to the detail of the space, with the code as a route parameter', async () => {
    const fixture = await open();
    const links = [...fixture.nativeElement.querySelectorAll('tbody a')].map((link) =>
      (link as HTMLAnchorElement).getAttribute('href'),
    );
    expect(links).toContain('/espacios/CON-101');
    expect(links).toContain('/espacios/LAB-401');
  });

  it('preselects the type that arrives in the URL (?type=...)', async () => {
    const fixture = TestBed.createComponent(SpaceList);
    fixture.componentRef.setInput('type', 'Consultorio');
    fixture.detectChanges();
    backend.expectOne('/api/v1/headquarter').flush(sedes);
    backend.expectOne('/api/v1/spaces').flush(spaces);
    await fixture.whenStable();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      'select[aria-label="Tipo"]',
    ) as HTMLSelectElement;
    expect(select.value).toBe('Consultorio');
    expect(rows(fixture)).toHaveLength(2);
  });

  it('shows the error when the list cannot be loaded', async () => {
    const fixture = TestBed.createComponent(SpaceList);
    fixture.detectChanges();
    backend.expectOne('/api/v1/headquarter').flush(sedes);
    backend.expectOne('/api/v1/spaces').flush(null, { status: 0, statusText: 'Unknown' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alert-danger')?.textContent).toContain(
      'No hay conexión con la API',
    );
  });
});
