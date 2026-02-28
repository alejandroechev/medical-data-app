import { test, expect } from '@playwright/test';

test.describe('Registro Médico Familiar — E2E', () => {
  test('debe cargar la página de inicio', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');
  });

  test('debe mostrar la barra de navegación inferior', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Inicio')).toBeVisible();
    await expect(page.getByLabel('Nuevo')).toBeVisible();
    await expect(page.getByLabel('Historial')).toBeVisible();
  });

  test('debe navegar a la página de nuevo evento', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await expect(page.locator('header')).toContainText('Nuevo Evento');
    await expect(page.getByLabel('Fecha')).toBeVisible();
    await expect(page.getByLabel('Tipo de evento')).toBeVisible();
    await expect(page.getByLabel('Paciente')).toBeVisible();
    await expect(page.getByLabel('Descripción')).toBeVisible();
  });

  test('debe navegar a la página de historial', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Historial').click();
    await expect(page.locator('header')).toContainText('Historial');
    await expect(page.getByLabel('Paciente')).toBeVisible();
    await expect(page.getByLabel('Tipo')).toBeVisible();
    await expect(page.getByLabel('Desde')).toBeVisible();
    await expect(page.getByLabel('Hasta')).toBeVisible();
  });

  test('debe mostrar errores de validación al enviar formulario vacío', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await page.getByRole('button', { name: 'Guardar Evento' }).click();
    await expect(page.getByText('La descripción es obligatoria')).toBeVisible();
  });

  test('debe volver a inicio con el botón de volver', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await expect(page.locator('header')).toContainText('Nuevo Evento');
    await page.getByLabel('Volver').click();
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');
  });

  test('debe tener los tipos de evento disponibles', async ({ page }) => {
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

  test('debe tener los miembros de familia en el select de paciente', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    const select = page.getByLabel('Paciente');
    const options = await select.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    expect(options.some(o => o.includes('Alejandro'))).toBe(true);
  });

  test('debe tener checkboxes de reembolso', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Nuevo').click();
    await expect(page.getByLabel('Reembolsado por ISAPRE')).toBeVisible();
    await expect(page.getByLabel('Reembolsado por Seguro Complementario')).toBeVisible();
  });
});
