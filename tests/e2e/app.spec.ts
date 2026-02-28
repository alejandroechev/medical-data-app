import { test, expect } from '@playwright/test';

test.describe('Medical Family Registry — E2E', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');
  });

  test('should show the bottom navigation bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Inicio')).toBeVisible();
    await expect(page.getByLabel('Nuevo')).toBeVisible();
    await expect(page.getByLabel('Historial')).toBeVisible();
  });

  test('should navigate to the new event page', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await expect(page.locator('header')).toContainText('Nuevo Evento');
    await expect(page.getByLabel('Fecha')).toBeVisible();
    await expect(page.getByLabel('Tipo de evento')).toBeVisible();
    await expect(page.getByLabel('Paciente')).toBeVisible();
    await expect(page.getByLabel('Descripción')).toBeVisible();
  });

  test('should navigate to the history page', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Historial').click();
    await expect(page.locator('header')).toContainText('Historial');
    await expect(page.getByLabel('Paciente')).toBeVisible();
    await expect(page.getByLabel('Tipo')).toBeVisible();
    await expect(page.getByLabel('Desde')).toBeVisible();
    await expect(page.getByLabel('Hasta')).toBeVisible();
  });

  test('should show validation errors when submitting empty form', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await expect(page.getByText('La descripción es obligatoria')).toBeVisible();
  });

  test('should go back to home with the back button', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await expect(page.locator('header')).toContainText('Nuevo Evento');
    await page.getByLabel('Volver').click();
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');
  });

  test('should have all event types available', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    const select = page.getByLabel('Tipo de evento');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Consulta Médica');
    expect(options).toContain('Consulta Dental');
    expect(options).toContain('Urgencia');
    expect(options).toContain('Cirugía');
    expect(options).toContain('Examen');
    expect(options).toContain('Otro');
  });

  test('should have family members in the patient select', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    const select = page.getByLabel('Paciente');
    const options = await select.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    expect(options.some(o => o.includes('Alejandro'))).toBe(true);
  });

  test('should have reimbursement checkboxes', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await expect(page.getByLabel('Reembolsado por ISAPRE')).toBeVisible();
    await expect(page.getByLabel('Reembolsado por Seguro Complementario')).toBeVisible();
  });

  // --- Full data flow E2E tests (uses in-memory stubs when Supabase not configured) ---

  test('full flow: create event → see on home → view detail', async ({ page }) => {
    await page.goto('/');

    // Inicio vacío
    await expect(page.getByText('Sin eventos médicos')).toBeVisible();

    // Crear evento
    await page.getByLabel('Nuevo').click();
    await page.getByLabel('Tipo de evento').selectOption('Urgencia');
    await page.getByLabel('Paciente').selectOption({ label: 'Alejandro (Padre)' });
    await page.getByLabel('Descripción').fill('Dolor abdominal severo');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();

    // Éxito y redirección a inicio
    await expect(page.getByText('✓ Evento creado exitosamente')).toBeVisible();
    await page.waitForTimeout(1500); // esperar redirección
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');

    // Evento visible en inicio
    await expect(page.getByText('Dolor abdominal severo')).toBeVisible();
    await expect(page.getByText('Urgencia')).toBeVisible();

    // Click en el evento → detalle
    await page.getByText('Dolor abdominal severo').click();
    await expect(page.locator('header')).toContainText('Detalle del Evento');
    await expect(page.getByText('Dolor abdominal severo')).toBeVisible();
    await expect(page.getByText('Urgencia')).toBeVisible();
    await expect(page.getByText('Alejandro')).toBeVisible();
    await expect(page.getByText('No reembolsada').first()).toBeVisible();
  });

  test('full flow: create event with ISAPRE reimbursement', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await page.getByLabel('Tipo de evento').selectOption('Consulta Dental');
    await page.getByLabel('Descripción').fill('Limpieza dental semestral');
    await page.getByLabel('Reembolsado por ISAPRE').check();
    await page.getByRole('button', { name: 'Guardar Evento' }).click();

    await expect(page.getByText('✓ Evento creado exitosamente')).toBeVisible();
    await page.waitForTimeout(1500);

    // Verificar badge de ISAPRE en la card
    await expect(page.getByText('ISAPRE ✓')).toBeVisible();
  });

  test('history: filter events by type', async ({ page }) => {
    await page.goto('/');

    // Crear dos eventos de tipos diferentes
    await page.getByLabel('Nuevo').click();
    await page.getByLabel('Tipo de evento').selectOption('Examen');
    await page.getByLabel('Descripción').fill('Examen de sangre');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    await page.getByLabel('Nuevo').click();
    await page.getByLabel('Tipo de evento').selectOption('Consulta Médica');
    await page.getByLabel('Descripción').fill('Control general');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Ir a historial y filtrar por Examen
    await page.getByLabel('Historial').click();
    await page.getByLabel('Tipo').selectOption('Examen');

    // Solo debe verse el examen
    await expect(page.getByText('Examen de sangre')).toBeVisible();
    await expect(page.getByText('1 evento encontrado')).toBeVisible();
  });

  test('full flow: link and unlink a photo to an event', async ({ page }) => {
    await page.goto('/');

    // Create an event first
    await page.getByLabel('Nuevo').click();
    await page.getByLabel('Descripción').fill('Examen con foto adjunta');
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await page.waitForTimeout(1500);

    // Navigate to event detail
    await page.getByText('Examen con foto adjunta').click();
    await expect(page.locator('header')).toContainText('Detalle del Evento');

    // Link a photo
    await page.getByRole('button', { name: /vincular foto/i }).click();
    await page.getByLabel('URL de Google Photos').fill('https://photos.google.com/photo/test123');
    await page.getByLabel(/descripción/i).fill('Resultado de examen');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Photo should appear
    await expect(page.getByText('Resultado de examen')).toBeVisible();
    await expect(page.getByText('Documentos (1)')).toBeVisible();

    // Unlink the photo
    await page.getByLabel(/desvincular/i).click();
    await expect(page.getByText('Documentos (0)')).toBeVisible();
    await expect(page.getByText('Sin documentos vinculados')).toBeVisible();
  });
});

