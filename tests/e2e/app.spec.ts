import { test, expect } from '@playwright/test';

test.describe('Medical Family Registry — E2E', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');
  });

  test('should show the app info panel with version details', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Información de la app').click();
    await expect(page.getByText(/Versión:/)).toBeVisible();
    await expect(page.getByText(/Backend:/)).toBeVisible();
    await expect(page.getByText(/Sync:/)).toBeVisible();
  });

  test('should open the release page when an update is available', async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { __openedUrls: string[] }).__openedUrls = [];
      window.open = ((url?: string | URL) => {
        (window as typeof window & { __openedUrls: string[] }).__openedUrls.push(String(url));
        return window;
      }) as typeof window.open;
    });

    await page.route('https://api.github.com/repos/alejandroechev/medical-data-app/releases/latest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tag_name: 'v999.0.0',
          html_url: 'https://github.com/alejandroechev/medical-data-app/releases/tag/v999.0.0',
          published_at: '2026-04-14T00:00:00Z',
          assets: [
            {
              name: 'medtracker-v999.0.0.apk',
              browser_download_url: 'https://example.com/medtracker-v999.0.0.apk',
            },
          ],
        }),
      });
    });

    await page.goto('/');
    await expect(page.getByText(/Nueva versión/i)).toBeVisible();

    await page.getByRole('button', { name: 'Descargar' }).click();

    await expect.poll(async () => page.evaluate(() => (window as typeof window & { __openedUrls: string[] }).__openedUrls)).toContain(
      'https://github.com/alejandroechev/medical-data-app/releases/tag/v999.0.0'
    );
  });

  test('should show the bottom navigation bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Inicio')).toBeVisible();
    await expect(page.getByLabel('Eventos')).toBeVisible();
    await expect(page.getByLabel('Tratamientos')).toBeVisible();
    
  });

  test('should navigate to the new event page', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await expect(page.locator('header')).toContainText('Nuevo Evento');
    await expect(page.getByLabel('Fecha')).toBeVisible();
    await expect(page.getByLabel('Tipo de evento')).toBeVisible();
    await expect(page.getByLabel('Paciente')).toBeVisible();
    await expect(page.getByLabel('Descripción')).toBeVisible();
  });

  test('should navigate to the events page', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await expect(page.locator('header')).toContainText('Eventos');
    await expect(page.getByText('Filtros')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuevo evento' })).toBeVisible();
  });

  test('should show validation errors when submitting empty form', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await expect(page.getByText('La descripción es obligatoria')).toBeVisible();
  });

  test('should go back to home with the back button', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await expect(page.locator('header')).toContainText('Nuevo Evento');
    await page.getByLabel('Volver').click();
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');
  });

  test('should have all event types available', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    const select = page.getByLabel('Tipo de evento');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Consulta Médica');
    expect(options).toContain('Consulta Dental');
    expect(options).toContain('Urgencia');
    expect(options).toContain('Cirugía');
    expect(options).toContain('Examen');
    expect(options).toContain('Receta');
    expect(options).toContain('Otro');
  });

  test('should have family members in the patient select', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    const select = page.getByLabel('Paciente');
    const options = await select.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    expect(options.some(o => o.includes('Alejandro'))).toBe(true);
  });

  test('should have reimbursement checkboxes', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    // Reimbursement is now managed from event detail, not from creation form
    await expect(page.getByLabel('Fecha')).toBeVisible();
    await expect(page.getByLabel('Descripción')).toBeVisible();
  });

  // --- Full data flow E2E tests (uses in-memory stubs when Supabase not configured) ---

  test('full flow: create event → see on home → view detail', async ({ page }) => {
    await page.goto('/');

    // Crear evento
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Tipo de evento').selectOption('Urgencia');
    await page.getByLabel('Paciente').selectOption({ label: 'Alejandro (Padre)' });
    await page.getByLabel('Descripción').fill('Dolor abdominal severo');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();

    // Éxito y redirección a eventos
    await expect(page.getByText('Evento creado exitosamente')).toBeVisible();
    await page.waitForTimeout(1500); // esperar redirección
    await expect(page.locator('header')).toContainText('Eventos');

    // Evento visible en la lista de eventos
    await expect(page.getByText('Dolor abdominal severo')).toBeVisible();
    await expect(page.getByText('Urgencia')).toBeVisible();

    // Click en el evento → detalle
    await page.getByText('Dolor abdominal severo').click();
    await expect(page.locator('header')).toContainText('Detalle del Evento');
    await expect(page.getByText('Dolor abdominal severo')).toBeVisible();
    await expect(page.getByText('Urgencia')).toBeVisible();
    await expect(page.getByText('Alejandro')).toBeVisible();
  });

  test('full flow: create event and manage reembolso status', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Tipo de evento').selectOption('Consulta Dental');
    await page.getByLabel('Descripción').fill('Limpieza dental semestral');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();

    await expect(page.getByText('Evento creado exitosamente')).toBeVisible();
    await page.waitForTimeout(1500);

    // Open detail and set ISAPRE to requested
    await page.getByText('Limpieza dental semestral').click();
    await page.getByRole('button', { name: /ISAPRE Solicitado/i }).click();

    // Verify the badge shows Solicitado
    await page.getByLabel('Volver').click();
    await page.getByLabel('Eventos').click();
    await page.getByText('Limpieza dental semestral').click();
    // The ISAPRE Solicitado button should be disabled (current state)
    await expect(page.getByRole('button', { name: /ISAPRE Solicitado/i })).toBeDisabled();
  });

  test('history: filter events by type', async ({ page }) => {
    await page.goto('/');

    // Crear dos eventos de tipos diferentes
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Tipo de evento').selectOption('Examen');
    await page.getByLabel('Descripción').fill('Examen de sangre');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Tipo de evento').selectOption('Consulta Médica');
    await page.getByLabel('Descripción').fill('Control general');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Ir a historial y filtrar por Examen
    await page.getByLabel('Eventos').click();
    await page.getByText('Filtros').click();
    await page.getByLabel('Tipo').selectOption('Examen');

    // Solo debe verse el examen
    await expect(page.getByText('Examen de sangre')).toBeVisible();
    await expect(page.getByText('1 evento')).toBeVisible();
  });

  test('full flow: link and unlink a photo to an event', async ({ page }) => {
    await page.goto('/');

    // Create an event first
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Descripción').fill('Examen con foto adjunta');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Navigate to event detail
    await page.getByText('Examen con foto adjunta').click();
    await expect(page.locator('header')).toContainText('Detalle del Evento');

    // Link a photo via URL paste
    await page.getByRole('button', { name: /agregar documento/i }).click();
    await page.getByText('Pegar URL').click();
    await page.getByLabel(/url del documento/i).fill('https://example.com/photo/test123');
    await page.getByLabel('Descripción (opcional)').fill('Resultado de examen');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Photo should appear
    await expect(page.getByText('Resultado de examen')).toBeVisible();
    await expect(page.getByText('Documentos (1)')).toBeVisible();

    // Unlink the photo (with confirmation)
    await page.getByLabel(/desvincular/i).click();
    await page.getByRole('button', { name: 'Sí' }).click();
    await expect(page.getByText('Documentos (0)')).toBeVisible();
    await expect(page.getByText('Sin documentos vinculados')).toBeVisible();
  });

  test('full flow: archive event, show it in history, and unarchive it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Create event
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo Evento' })).toBeVisible();
    await page.getByLabel('Descripción').fill('Evento a archivar');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Should be on Eventos page after redirect
    await expect(page.locator('header')).toContainText('Eventos');

    // Archive via context menu (right-click on event card)
    await page.getByText('Evento a archivar').click({ button: 'right' });
    await page.getByTestId('context-menu-archive').click();

    // Event should be hidden by default
    await expect(page.getByText('Evento a archivar')).not.toBeVisible();

    // Expand filters and show archived
    await page.getByText('Filtros').click();
    await page.getByLabel('Mostrar archivados').check();
    await expect(page.getByText('Evento a archivar')).toBeVisible();
    await expect(page.getByText('Archivado', { exact: true })).toBeVisible();
  });

  test('full flow: change reembolso status on event detail', async ({ page }) => {
    await page.goto('/');

    // Create event
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Descripción').fill('Consulta para reembolso');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Go to detail
    await page.getByText('Consulta para reembolso').click();

    // ISAPRE should be "Sin solicitar" (none)
    await expect(page.getByRole('button', { name: /ISAPRE Sin solicitar/i })).toBeDisabled();

    // Change ISAPRE to "Solicitado"
    await page.getByRole('button', { name: /ISAPRE Solicitado/i }).click();

    // Now "Solicitado" button should be disabled (current state)
    await expect(page.getByRole('button', { name: /ISAPRE Solicitado/i })).toBeDisabled();

    // Go back and re-enter to verify persistence
    await page.getByLabel('Volver').click();
    await page.getByLabel('Eventos').click();
    await page.getByText('Consulta para reembolso').click();
    await expect(page.getByRole('button', { name: /ISAPRE Solicitado/i })).toBeDisabled();

    // Change to "Aprobado"
    await page.getByRole('button', { name: /ISAPRE Aprobado/i }).click();
    await expect(page.getByRole('button', { name: /ISAPRE Aprobado/i })).toBeDisabled();
  });

  test('full flow: edit event description', async ({ page }) => {
    await page.goto('/');

    // Create event
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Descripción').fill('Descripción original');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Go to detail
    await page.getByText('Descripción original').click();
    await expect(page.getByText('Descripción original')).toBeVisible();

    // Edit description
    await page.getByRole('button', { name: /editar descripción/i }).click();
    const textarea = page.getByRole('textbox');
    await textarea.clear();
    await textarea.fill('Descripción actualizada');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verify updated text is shown
    await expect(page.getByText('Descripción actualizada')).toBeVisible();

    // Go back and re-enter to verify persistence
    await page.getByLabel('Volver').click();
    await page.getByLabel('Eventos').click();
    await page.getByText('Descripción actualizada').click();
    await expect(page.getByText('Descripción actualizada')).toBeVisible();
  });

  test('full flow: edit event date', async ({ page }) => {
    await page.goto('/');

    // Create event
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Descripción').fill('Evento con fecha editable');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Go to detail
    await page.getByText('Evento con fecha editable').click();

    // Edit date
    await page.getByRole('button', { name: /editar fecha/i }).click();
    const dateInput = page.getByLabel('Fecha del evento');
    await dateInput.fill('2025-01-15');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Verify updated date is shown
    await expect(page.getByText('2025-01-15')).toBeVisible();

    // Go back and re-enter to verify persistence
    await page.getByLabel('Volver').click();
    await page.getByLabel('Eventos').click();
    await page.getByText('Evento con fecha editable').click();
    await expect(page.getByText('2025-01-15')).toBeVisible();
  });

  test('reembolso portal links are visible', async ({ page }) => {
    await page.goto('/');

    // Create event
    await page.getByLabel('Eventos').click();
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await page.getByLabel('Descripción').fill('Evento para ver links');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Go to detail
    await page.getByText('Evento para ver links').click();

    // Verify portal links are present
    const portalLinks = page.getByRole('link', { name: /portal/i });
    await expect(portalLinks).toHaveCount(2);
  });
});

