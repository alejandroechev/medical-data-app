import { test, expect } from '@playwright/test';

test.describe('Pickup Alert Notifications — E2E', () => {
  test('should not show notification banner when no drugs exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toContainText('Registro Médico Familiar');
    await expect(page.locator('text=retiro de')).not.toBeVisible();
  });

  test('should show notification banner after creating a drug with upcoming pickup date', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Tratamientos').click();
    await expect(page.locator('header')).toContainText('Tratamientos');

    // Create a new drug with pickup date set to today
    await page.getByRole('button', { name: /Nuevo tratamiento/i }).click();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel('Medicamento').fill('TestDrug');
    await page.getByLabel('Dosis').fill('10mg');
    await page.getByRole('button', { name: 'Permanente' }).click();
    await page.getByLabel('Receta permanente (retiro periódico)').check();
    await page.getByLabel('Próximo retiro').fill(today);
    await page.getByRole('button', { name: /Agregar tratamiento/i }).click();

    // The custom event 'medapp:drugs-changed' triggers the hook to re-check
    // Alert banner should appear automatically
    await expect(page.locator('text=retiro de').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=TestDrug').first()).toBeVisible();
  });

  test('should dismiss alert when close button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Tratamientos').click();
    await page.getByRole('button', { name: /Nuevo tratamiento/i }).click();

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel('Medicamento').fill('DismissTestDrug');
    await page.getByLabel('Dosis').fill('5mg');
    await page.getByRole('button', { name: 'Permanente' }).click();
    await page.getByLabel('Receta permanente (retiro periódico)').check();
    await page.getByLabel('Próximo retiro').fill(today);
    await page.getByRole('button', { name: /Agregar tratamiento/i }).click();

    // Wait for banner to appear via custom event
    await expect(page.locator('text=DismissTestDrug').first()).toBeVisible({ timeout: 5000 });

    // Dismiss
    await page.getByLabel('Cerrar alerta').click();
    await expect(page.locator('text=retiro de')).not.toBeVisible();
  });
});
