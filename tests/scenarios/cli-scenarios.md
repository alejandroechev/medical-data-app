# Escenarios CLI — Registro Médico Familiar

Estos escenarios están diseñados para ser ejecutados por un agente AI usando el CLI.

## Pre-requisitos
- Supabase configurado con el schema ejecutado
- Variables de entorno configuradas en `.env`

## Escenario 1: Listar miembros de familia

```bash
npm run cli -- miembros listar
```

**Resultado esperado:** Una tabla con los miembros de familia configurados (al menos 1 miembro con id, nombre y parentesco).

---

## Escenario 2: Crear un evento médico

```bash
npm run cli -- evento crear --tipo "Consulta Médica" --paciente "Alejandro" --fecha "2024-06-15" --descripcion "Control anual con médico general"
```

**Resultado esperado:** Mensaje de éxito con el JSON del evento creado, incluyendo id, fecha, tipo, descripcion, pacienteId, y los campos de reembolso en false por defecto.

---

## Escenario 3: Crear evento con reembolso

```bash
npm run cli -- evento crear --tipo "Consulta Dental" --paciente "Alejandro" --fecha "2024-07-20" --descripcion "Limpieza dental" --reembolso-isapre
```

**Resultado esperado:** Evento creado con reembolsoIsapre: true y reembolsoSeguro: false.

---

## Escenario 4: Listar eventos sin filtro

```bash
npm run cli -- evento listar
```

**Resultado esperado:** Tabla con todos los eventos creados, ordenados por fecha descendente.

---

## Escenario 5: Listar eventos filtrados por paciente

```bash
npm run cli -- evento listar --paciente "Alejandro"
```

**Resultado esperado:** Solo eventos del paciente "Alejandro".

---

## Escenario 6: Ver detalle de un evento

```bash
npm run cli -- evento ver <EVENT_ID>
```

**Resultado esperado:** Detalle completo del evento incluyendo paciente, tipo, descripción, estado de reembolsos y fotos vinculadas.

---

## Escenario 7: Editar un evento (cambiar reembolso)

```bash
npm run cli -- evento editar <EVENT_ID> --reembolso-isapre si
```

**Resultado esperado:** Evento actualizado con reembolsoIsapre: true.

---

## Escenario 8: Crear evento con paciente inválido

```bash
npm run cli -- evento crear --tipo "Urgencia" --paciente "NoExiste" --fecha "2024-08-01" --descripcion "Test"
```

**Resultado esperado:** Error indicando que el paciente no fue encontrado, listando miembros disponibles.

---

## Escenario 9: Crear evento con tipo inválido

```bash
npm run cli -- evento crear --tipo "Fisioterapia" --paciente "Alejandro" --fecha "2024-08-01" --descripcion "Test"
```

**Resultado esperado:** Error de validación indicando que el tipo es inválido.

---

## Escenario 10: Crear evento con fecha inválida

```bash
npm run cli -- evento crear --tipo "Examen" --paciente "Alejandro" --fecha "15-06-2024" --descripcion "Test"
```

**Resultado esperado:** Error de validación indicando formato de fecha inválido.

---

## Escenario 11: Eliminar un evento

```bash
npm run cli -- evento eliminar <EVENT_ID>
```

**Resultado esperado:** Mensaje de eliminación exitosa.

---

## Escenario 12: Vincular foto a un evento

```bash
npm run cli -- foto vincular <EVENT_ID> --google-photos-id "ABC123" --url "https://photos.google.com/photo/ABC123" --descripcion "Receta médica"
```

**Resultado esperado:** Foto vinculada con JSON mostrando id, eventoId, googlePhotosUrl, googlePhotosId, descripcion.

---

## Escenario 13: Listar fotos de un evento

```bash
npm run cli -- foto listar <EVENT_ID>
```

**Resultado esperado:** Tabla con las fotos vinculadas al evento.

---

## Escenario 14: Desvincular foto

```bash
npm run cli -- foto desvincular <PHOTO_ID>
```

**Resultado esperado:** Mensaje de desvinculación exitosa.
