# UcoPet · Front

Front de la clínica veterinaria multisede UcoPet. Angular 22, Bootstrap 5.3 y ng-bootstrap 21, con la paleta y la
tipografía (Urbanist) del mockup del equipo.

Esta rama trae una **base borrador para todos**: el layout, la sesión, las piezas visuales compartidas y una
página de borrador por cada módulo de los cinco procesadores. El catálogo (Inventario) está construido entero y
sirve de ejemplo.

## Levantarlo

Necesita Node 22.22 o superior y la API corriendo en `http://localhost:8080`.

```bash
npm ci
npm start
```

Abrir `http://localhost:4200`. `npm start` ya usa `proxy.conf.js`: manda `/api` a la API y le quita la cabecera
`Origin`, así que no hace falta tocar el CORS del back. Si el 4200 está ocupado: `npm start -- --port 4301`.

```bash
npm run build
npm test            # Vitest
npm run format      # Prettier; antes de cada commit
```

## Cómo está organizado

Igual que la API: **capa primero, entidad después**. Cada capa tiene una carpeta por entidad, con el nombre del
paquete de la API en minúsculas y con guiones (`tutorPet` en la API es `tutor-pet` aquí; el catálogo es `product`).

```
src/app/
  app.routes.ts      login, el layout y una ruta por módulo, generadas desde navigation.ts
  components/        pantallas y modales            components/product/product-list/product-list.ts
  services/          llamadas a la API y estado      services/product/product.service.ts
  models/            interfaces de lo que responde la API (los DTO)   models/product/product.model.ts
  routes/            las rutas de cada módulo        routes/product/product.routes.ts
  guards/            quién puede entrar              guards/session/session.guards.ts
  interceptors/      el token en cada petición       interceptors/session/auth.interceptor.ts
  directives/        directivas                      directives/shared/sort-header.ts
  pipes/             formatos                        pipes/shared/price.pipe.ts
  utils/             funciones sueltas               utils/shared/table-state.ts
  config/            navigation.ts: los cinco procesadores, sus módulos, roles y rutas de la API
```

Las entidades que no son de un módulo:

| Entidad       | Qué es                                                                               |
| ------------- | ------------------------------------------------------------------------------------ |
| `shared`      | lo que usa todo el mundo: piezas visuales, avisos, confirmación, tablas, errores     |
| `layout`      | barra lateral, barra superior, menú de sede y de usuario                             |
| `placeholder` | la página de borrador de cada módulo y un modal de ejemplo                           |
| `dashboard`   | Inicio                                                                               |
| `session`     | sesión PROVISIONAL: login, token y sede en cookies (ver "La sesión")                 |
| `headquarter` | las sedes. Hoy solo la lista en caché que usa el menú; el módulo de Sedes crece aquí |

Cada módulo del equipo ya tiene su entidad en `navigation.ts` (`entity`), sus carpetas en `components/`,
`services/` y `models/` (con un `.gitkeep` mientras estén vacías) y su archivo de rutas en `routes/`.

## Agregar tu módulo

1. Busca tu módulo en `config/navigation/navigation.ts` y mira su `entity`. Por ejemplo, Agenda es `appointment`.
2. Escribe tus archivos en las carpetas de tu entidad, una por capa: `components/appointment/`,
   `services/appointment/`, `models/appointment/`.
3. En `routes/appointment/appointment.routes.ts` cambia `ModulePlaceholder` por tus pantallas:

   ```ts
   export const APPOINTMENT_ROUTES: Routes = [
     { path: '', component: AppointmentList, title: 'Agenda · UcoPet' },
   ];
   ```

4. Cuando esté lista, ponle `ready: true` a tu módulo en `navigation.ts`. Solo quita la marca de borrador del menú
   y de Inicio.

La ruta, el permiso por rol, el menú y la carga diferida ya están armados. No hay que tocar `app.routes.ts`, y
cada uno escribe en sus propias carpetas, así que no chocan al fusionar. El catálogo (`product`) es el ejemplo
completo.

## La sesión

Todo lo de la entidad `session` es provisional (`components/session/login`, `services/session`,
`models/session`, `guards/session`, `interceptors/session` y `utils/session/testing.ts`): lo reemplaza el
módulo de login. El resto de la app usa **solo** esto de `SessionService`, y es lo que el reemplazo tiene que conservar con el mismo nombre:

| Miembro                                                | Qué es                                                 |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `token()`                                              | el JWT o `null` (signal)                               |
| `profile()`                                            | `{ personId, fullName, roles }` o `null` (signal)      |
| `isLoggedIn()`, `isAdmin()`                            | signals derivados                                      |
| `headquarterId()`                                      | la sede activa, o `null` para toda la clínica (signal) |
| `selectHeadquarter(id \| null)`, `logout()`, `clear()` | cambiar de sede, cerrar sesión, olvidar todo           |

Más `authInterceptor` (pone el token en todo lo que empieza por `/api`, con o sin `v1`; un 401 cierra la sesión
y un 403 no), `sessionGuard` y `guestGuard`. Nadie más lee cookies.

Para probar, dos cosas:

- **Cerrar sesión cierra todas las sesiones de esa cuenta.** El `/persons/logout` de la API sube su
  `token_version`. Si dos personas prueban con el mismo admin, una saca a la otra.
- **La sesión dura 12 horas**, igual que el token.

## Piezas compartidas (entidad `shared`)

| Pieza                 | Para qué                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `PageHeader`          | título, subtítulo y acciones de cada página                                                   |
| `ModalFrame`          | el marco de todo modal: ícono, título, subtítulo, cuerpo y pie con botones (`modalFooter`)    |
| `KpiCard`             | número grande con etiqueta, ayuda y alcance (`Toda la clínica`, `Sede activa`)                |
| `EmptyState`          | lo que se ve cuando no hay datos                                                              |
| `ToastService`        | avisos: `success`, `error`, `info`                                                            |
| `injectConfirm()`     | confirmación en modal antes de una acción que no se deshace                                   |
| `Brand`               | el logo                                                                                       |
| `PricePipe` (`price`) | pesos colombianos: `$ 25.000`                                                                 |
| `apiErrorMessage()`   | el mensaje para el usuario según la respuesta de la API (0, 403, 503 o el `message` del back) |
| `createTableState()`  | orden y paginación en el navegador para una lista que llega completa de la API                |
| `th[appSortHeader]`   | cabecera de columna que ordena al hacer clic (flecha y `aria-sort`)                           |
| `TablePager`          | pie de tabla: "Mostrando 1–10 de 35", filas por página y páginas                              |

Clases de estilo: `uc-tag` (`is-ok`, `is-warn`, `is-danger`, `is-info`, `is-neutral`) para estados, `uc-mark` para los
íconos en cuadro, y `table-card` para las tablas dentro de una tarjeta.

## Tablas: orden y paginación

```ts
protected readonly table = createTableState(this.visible, {
  sortKey: 'name',
  accessors: { name: item => item.name, price: item => item.price }
});
```

```html
<th appSortHeader="name" [table]="table">Nombre</th>
@for (item of table.rows(); track item.id) { ... }
<app-table-pager [total]="table.total()" [(page)]="table.page" [(pageSize)]="table.pageSize" />
```

Al cambiar los datos, el orden o el tamaño, vuelve a la página 1. Los vacíos quedan al final en los dos sentidos, y
el texto se compara sin distinguir mayúsculas ni tildes. Si tu API ya pagina (como `/purchases`, con `page` y `size`),
usa solo `TablePager`, con el `total` y la página que responde el servidor.

## Convenciones

- Componentes standalone, `inject()` y plantillas con `@if` / `@for`.
- La app no usa zone.js: el estado de cada pantalla va en **signals**. Un campo normal asignado dentro de un
  `subscribe` no repinta la vista.
- Rutas de pantalla en español (`/catalogo/productos`); el código y la API en inglés.
- La sede activa se lee con `SessionService.headquarterId()`. Nadie lee las cookies directamente.
- Los permisos de verdad los pone la API. Ocultar un botón en el front no protege nada.
