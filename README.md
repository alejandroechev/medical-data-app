# Registro Médico Familiar

Aplicación web progresiva (PWA) para registrar y consultar eventos médicos familiares.

## Características

- 📋 Registro de eventos médicos (consultas, urgencias, cirugías, exámenes, etc.)
- 👨‍👩‍👧‍👦 Asociación de eventos a miembros de la familia
- 📸 Vinculación de fotos de documentos desde Google Photos
- 💰 Seguimiento de reembolsos (ISAPRE y Seguro Complementario)
- 📱 Diseño mobile-first (PWA instalable)
- 🔍 Búsqueda y filtrado por paciente, tipo y rango de fechas

## Tech Stack

| Componente | Tecnología |
|------------|------------|
| Frontend | React + TypeScript + Vite |
| PWA | vite-plugin-pwa (Workbox) |
| Estilos | Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| Fotos | Google Photos API |
| Tests | Vitest + Playwright |
| CLI | Commander.js |

## Requisitos

- Node.js 18+
- Cuenta Supabase (gratuita)
- Proyecto Google Cloud con Google Photos API habilitada

## Configuración

1. Clonar el repositorio
2. `npm install`
3. Copiar `.env.example` a `.env` y configurar las variables
4. Ejecutar el schema SQL en Supabase (`src/infra/supabase/schema.sql`)
5. `npm run dev`

## Comandos

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run test         # Tests unitarios
npm run test:coverage # Tests con cobertura
npm run test:e2e     # Tests E2E (Playwright)
npm run cli          # CLI (feature parity)
```

## CLI

```bash
npm run cli -- miembros listar
npm run cli -- evento crear --tipo "Consulta Médica" --paciente "Juan" --fecha "2024-01-15" --descripcion "Control anual"
npm run cli -- evento listar
npm run cli -- evento ver <id>
```

## Licencia

Uso privado.
