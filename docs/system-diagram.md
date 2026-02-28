# Diagrama del Sistema — Registro Médico Familiar

```mermaid
graph TB
    subgraph Cliente["📱 PWA (React + Vite)"]
        UI["UI Components<br/>(React + Tailwind)"]
        Hooks["Custom Hooks"]
        SW["Service Worker<br/>(Workbox)"]
    end

    subgraph Dominio["🧠 Dominio (TypeScript puro)"]
        Models["Modelos<br/>FamilyMember | MedicalEvent | EventPhoto"]
        Validators["Validadores"]
        Services["Interfaces de Repositorio"]
    end

    subgraph CLI["⌨️ CLI (Commander.js)"]
        Commands["Comandos<br/>miembros | evento | foto"]
    end

    subgraph Infra["🔌 Infraestructura"]
        SupaClient["Supabase Client"]
        GoogleAPI["Google Photos API"]
    end

    subgraph Externos["☁️ Servicios Externos"]
        Supabase["Supabase<br/>(PostgreSQL + REST API)"]
        GooglePhotos["Google Photos"]
    end

    UI --> Hooks
    Hooks --> Services
    Commands --> Services
    Services --> Validators
    Services --> Models
    Services --> SupaClient
    Services --> GoogleAPI
    SupaClient --> Supabase
    GoogleAPI --> GooglePhotos
    SW -.-> UI
```

## Notas

- **Dominio puro**: Sin dependencias de framework. Los modelos, validadores e interfaces de repositorio son TypeScript puro.
- **CLI con paridad**: Todos los comandos del CLI acceden a la misma lógica de dominio que la UI.
- **Fotos por referencia**: Solo se almacenan URLs/IDs de Google Photos, nunca las imágenes.
- **Sin autenticación**: App de uso familiar privado, sin control de acceso.
