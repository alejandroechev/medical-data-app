# CLI Scenarios — Family Medical Records

These scenarios are designed to be executed by an AI agent using the CLI.

## Prerequisites
- Supabase configured with the schema applied
- Environment variables configured in `.env`

## Scenario 1: List family members

```bash
npm run cli -- miembros listar
```

**Expected result:** A table with the configured family members (at least 1 member with id, name, and relationship).

---

## Scenario 2: Create a medical event

```bash
npm run cli -- evento crear --tipo "Consulta Médica" --paciente "Alejandro" --fecha "2024-06-15" --descripcion "Control anual con médico general"
```

**Expected result:** Success message with the created event JSON, including id, fecha, tipo, descripcion, pacienteId, and reimbursement fields set to false by default.

---

## Scenario 3: Create event with reimbursement

```bash
npm run cli -- evento crear --tipo "Consulta Dental" --paciente "Alejandro" --fecha "2024-07-20" --descripcion "Limpieza dental" --reembolso-isapre
```

**Expected result:** Event created with reembolsoIsapre: true and reembolsoSeguro: false.

---

## Scenario 4: List events without filter

```bash
npm run cli -- evento listar
```

**Expected result:** Table with all created events, ordered by date descending.

---

## Scenario 5: List events filtered by patient

```bash
npm run cli -- evento listar --paciente "Alejandro"
```

**Expected result:** Only events for patient "Alejandro".

---

## Scenario 6: View event details

```bash
npm run cli -- evento ver <EVENT_ID>
```

**Expected result:** Complete event detail including patient, type, description, reimbursement status, and linked photos.

---

## Scenario 7: Edit an event (change reimbursement)

```bash
npm run cli -- evento editar <EVENT_ID> --reembolso-isapre si
```

**Expected result:** Event updated with reembolsoIsapre: true.

---

## Scenario 8: Create event with invalid patient

```bash
npm run cli -- evento crear --tipo "Urgencia" --paciente "NoExiste" --fecha "2024-08-01" --descripcion "Test"
```

**Expected result:** Error indicating the patient was not found, listing available members.

---

## Scenario 9: Create event with invalid type

```bash
npm run cli -- evento crear --tipo "Fisioterapia" --paciente "Alejandro" --fecha "2024-08-01" --descripcion "Test"
```

**Expected result:** Validation error indicating the type is invalid.

---

## Scenario 10: Create event with invalid date

```bash
npm run cli -- evento crear --tipo "Examen" --paciente "Alejandro" --fecha "15-06-2024" --descripcion "Test"
```

**Expected result:** Validation error indicating invalid date format.

---

## Scenario 11: Delete an event

```bash
npm run cli -- evento eliminar <EVENT_ID>
```

**Expected result:** Successful deletion message.

---

## Scenario 12: Link photo to an event

```bash
npm run cli -- foto vincular <EVENT_ID> --google-photos-id "ABC123" --url "https://photos.google.com/photo/ABC123" --descripcion "Receta médica"
```

**Expected result:** Photo linked with JSON showing id, eventoId, googlePhotosUrl, googlePhotosId, descripcion.

---

## Scenario 13: List photos for an event

```bash
npm run cli -- foto listar <EVENT_ID>
```

**Expected result:** Table with the photos linked to the event.

---

## Scenario 14: Unlink photo

```bash
npm run cli -- foto desvincular <PHOTO_ID>
```

**Expected result:** Successful unlink message.
