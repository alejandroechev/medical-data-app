# ADR-001: Arquitectura PWA con Supabase y Google Photos

## Estado

Aceptado

## Contexto

Se necesita una aplicación para registrar eventos médicos familiares, accesible desde dispositivos móviles, con soporte para vincular fotos de documentos almacenados en Google Photos.

## Decisión

### Frontend: PWA con React + Vite
- **React + TypeScript + Vite** como base del frontend
- **PWA** (Progressive Web App) para acceso móvil sin necesidad de app stores
- **Tailwind CSS** para estilos mobile-first
- **vite-plugin-pwa** para service worker y manifest

### Backend: Supabase
- **Supabase** como backend serverless (PostgreSQL + REST API)
- Sin autenticación — app de uso privado familiar
- RLS con políticas de acceso abierto

### Fotos: Google Photos API
- Integración con **Google Photos API** para seleccionar fotos
- Solo se almacenan referencias (URL + ID), no las imágenes
- OAuth para autorización de acceso a la biblioteca del usuario

### Arquitectura de capas
- **Dominio** separado de UI/CLI — TypeScript puro sin dependencias de framework
- **CLI** con paridad de funcionalidades para validación automatizada
- **Interfaces de repositorio** en dominio, implementaciones en infraestructura

## Consecuencias

### Positivas
- Instalable en móvil sin app store
- Cero costo de hosting (Supabase free tier)
- Sin duplicación de fotos (referencias a Google Photos)
- Dominio testeable sin dependencias externas
- CLI permite validación automatizada por agentes AI

### Negativas
- Dependencia de Google Photos (si se eliminan fotos, se rompen las referencias)
- Sin capacidad offline completa para escritura (requiere conexión a Supabase)
- OAuth de Google Photos agrega complejidad al setup inicial

## Alternativas Consideradas

1. **Firebase** — Descartado a favor de Supabase por preferencia de PostgreSQL
2. **IndexedDB local** — Descartado por falta de sincronización entre dispositivos
3. **App nativa (React Native)** — Descartado por overhead de desarrollo; PWA es suficiente
4. **Almacenar fotos directamente** — Descartado para evitar duplicación y costos de storage
