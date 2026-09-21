# Portfolio description

## English

### Short listing

API Sync Workbench is a browser-based data synchronization demo built with React, TypeScript, Vite, and IndexedDB. It fetches Products and Users from DummyJSON, validates API responses, previews changes before writing, preserves local edits, detects conflicts, and exports the resulting local data as JSON or CSV.

### Full project description

I built API Sync Workbench to demonstrate a production-minded approach to client-side API integration and data synchronization. The application treats remote data and locally edited data as separate sources, compares both against the last synchronized snapshot, and makes every pending change reviewable before it reaches IndexedDB.

The demo covers the failure cases that matter in real integration work: invalid responses, temporary request failures, local changes, simultaneous upstream changes, explicit conflict decisions, retry-safe recovery, and an auditable sync history. DummyJSON provides the live read API, while deterministic browser tests use controlled fixtures so verification does not depend on a third-party service.

Key capabilities:

- Runtime validation at the API boundary.
- Preview-first synchronization with new, updated, unchanged, conflicting, and invalid states.
- Three-way comparison that protects local edits.
- Explicit `Keep local` and `Use source` conflict decisions.
- Atomic IndexedDB persistence and durable browser-local history.
- JSON and spreadsheet-safe CSV export.
- Responsive light and dark interfaces with keyboard and accessibility checks.
- Automated unit, integration, and end-to-end verification in GitHub Actions.

Technology: React, TypeScript, Vite, IndexedDB, Zod, Vitest, Playwright, GitHub Actions, and GitHub Pages.

## Українською

### Короткий опис

API Sync Workbench — браузерний демопроєкт синхронізації даних на React, TypeScript, Vite та IndexedDB. Він отримує Products і Users з DummyJSON, перевіряє відповіді API, показує зміни до запису, зберігає локальні редагування, виявляє конфлікти та експортує локальні дані у JSON або CSV.

### Повний опис проєкту

Я створив API Sync Workbench, щоб продемонструвати надійний підхід до клієнтської API-інтеграції та синхронізації даних. Застосунок розглядає віддалені й локально відредаговані дані як окремі джерела, порівнює їх з останнім синхронізованим станом і дозволяє переглянути кожну зміну до запису в IndexedDB.

Демо охоплює важливі для реальних інтеграцій сценарії: некоректні відповіді, тимчасові помилки запитів, локальні зміни, одночасні зміни у джерелі, явне вирішення конфліктів, безпечний повторний запит і журнал синхронізацій. DummyJSON використовується як живе API для читання, а браузерні тести працюють із контрольованими даними, тому перевірка не залежить від доступності стороннього сервісу.

Основні можливості:

- Валідація даних на межі API.
- Попередній перегляд нових, оновлених, незмінених, конфліктних і некоректних записів.
- Тристороннє порівняння, яке захищає локальні редагування.
- Явний вибір між локальною версією та версією джерела.
- Атомарний запис в IndexedDB і локальна історія запусків.
- Експорт у JSON та безпечний для електронних таблиць CSV.
- Адаптивний світлий і темний інтерфейс із перевіркою клавіатурної доступності.
- Автоматичні модульні, інтеграційні та end-to-end перевірки в GitHub Actions.

Технології: React, TypeScript, Vite, IndexedDB, Zod, Vitest, Playwright, GitHub Actions і GitHub Pages.

## Suggested demo flow

1. Fetch Products and review the pending diff.
2. Apply the sync and open the IndexedDB-backed local data view.
3. Edit one local record.
4. Simulate an upstream change to the same record.
5. Review the conflict and explicitly keep either the local or source version.
6. Export the verified result as JSON or CSV.
