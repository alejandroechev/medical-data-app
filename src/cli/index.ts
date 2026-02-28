#!/usr/bin/env node
import { Command } from 'commander';
import { getFamilyMembers, getFamilyMemberByName } from '../infra/supabase/family-member-store.js';
import {
  createEvent,
  getEventById,
  listEvents,
  updateEvent,
  deleteEvent,
  linkPhoto,
  listPhotosByEvent,
  unlinkPhoto,
} from '../infra/store-provider.js';
import { validateCreateEvent, validateUpdateEvent } from '../domain/validators/medical-event-validator.js';
import { validateLinkPhoto } from '../domain/validators/event-photo-validator.js';
import type { EventType } from '../domain/models/medical-event.js';

const program = new Command();

program
  .name('medical-app')
  .description('Registro Médico Familiar — CLI')
  .version('0.1.0');

// --- Miembros ---
const miembros = program.command('miembros').description('Gestión de miembros de familia');

miembros
  .command('listar')
  .description('Listar todos los miembros de la familia')
  .action(() => {
    const members = getFamilyMembers();
    console.table(members);
  });

// --- Eventos ---
const evento = program.command('evento').description('Gestión de eventos médicos');

evento
  .command('crear')
  .description('Crear un nuevo evento médico')
  .requiredOption('--tipo <tipo>', 'Tipo de evento')
  .requiredOption('--paciente <nombre>', 'Nombre del paciente')
  .requiredOption('--fecha <fecha>', 'Fecha (YYYY-MM-DD)')
  .requiredOption('--descripcion <texto>', 'Descripción del evento')
  .option('--reembolso-isapre', 'Reembolsado por ISAPRE', false)
  .option('--reembolso-seguro', 'Reembolsado por Seguro Complementario', false)
  .action(async (opts) => {
    const member = getFamilyMemberByName(opts.paciente);
    if (!member) {
      console.error(`Error: Paciente "${opts.paciente}" no encontrado.`);
      console.error('Miembros disponibles:', getFamilyMembers().map((m) => m.name).join(', '));
      process.exit(1);
    }

    const input = {
      date: opts.fecha,
      type: opts.tipo as EventType,
      description: opts.descripcion,
      patientId: member.id,
      isapreReimbursed: opts.reembolsoIsapre,
      insuranceReimbursed: opts.reembolsoSeguro,
    };

    const validation = validateCreateEvent(input);
    if (!validation.valid) {
      console.error('Errores de validación:');
      validation.errors.forEach((e) => console.error(`  - ${e.field}: ${e.message}`));
      process.exit(1);
    }

    try {
      const event = await createEvent(input);
      console.log('Evento creado exitosamente:');
      console.log(JSON.stringify(event, null, 2));
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

evento
  .command('listar')
  .description('Listar eventos médicos')
  .option('--paciente <nombre>', 'Filtrar por paciente')
  .option('--tipo <tipo>', 'Filtrar por tipo')
  .option('--desde <fecha>', 'Desde fecha (YYYY-MM-DD)')
  .option('--hasta <fecha>', 'Hasta fecha (YYYY-MM-DD)')
  .action(async (opts) => {
    try {
      let pacienteId: string | undefined;
      if (opts.paciente) {
        const member = getFamilyMemberByName(opts.paciente);
        if (!member) {
          console.error(`Error: Paciente "${opts.paciente}" no encontrado.`);
          process.exit(1);
        }
        pacienteId = member.id;
      }

      const events = await listEvents({
        patientId: pacienteId,
        type: opts.tipo,
        from: opts.desde,
        to: opts.hasta,
      });

      if (events.length === 0) {
        console.log('No se encontraron eventos.');
        return;
      }

      const members = getFamilyMembers();
      const table = events.map((e) => ({
        ID: e.id.substring(0, 8),
        Fecha: e.date,
        Tipo: e.type,
        Paciente: members.find((m) => m.id === e.patientId)?.name ?? e.patientId,
        Descripción: e.description.substring(0, 40),
        ISAPRE: e.isapreReimbursed ? 'Sí' : 'No',
        Seguro: e.insuranceReimbursed ? 'Sí' : 'No',
      }));
      console.table(table);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

evento
  .command('ver <id>')
  .description('Ver detalle de un evento médico')
  .action(async (id: string) => {
    try {
      const event = await getEventById(id);
      if (!event) {
        console.error(`Evento con ID "${id}" no encontrado.`);
        process.exit(1);
      }

      const members = getFamilyMembers();
      const paciente = members.find((m) => m.id === event.patientId);

      console.log('Evento Médico:');
      console.log(`  ID:          ${event.id}`);
      console.log(`  Fecha:       ${event.date}`);
      console.log(`  Tipo:        ${event.type}`);
      console.log(`  Paciente:    ${paciente?.name ?? event.patientId}`);
      console.log(`  Descripción: ${event.description}`);
      console.log(`  ISAPRE:      ${event.isapreReimbursed ? 'Sí' : 'No'}`);
      console.log(`  Seguro:      ${event.insuranceReimbursed ? 'Sí' : 'No'}`);

      const fotos = await listPhotosByEvent(id);
      if (fotos.length > 0) {
        console.log(`  Fotos (${fotos.length}):`);
        fotos.forEach((f) => {
          console.log(`    - ${f.description ?? 'Sin descripción'}: ${f.googlePhotosUrl}`);
        });
      }
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

evento
  .command('editar <id>')
  .description('Editar un evento médico')
  .option('--fecha <fecha>', 'Nueva fecha')
  .option('--tipo <tipo>', 'Nuevo tipo')
  .option('--descripcion <texto>', 'Nueva descripción')
  .option('--paciente <nombre>', 'Nuevo paciente')
  .option('--reembolso-isapre <si|no>', 'Reembolsado por ISAPRE')
  .option('--reembolso-seguro <si|no>', 'Reembolsado por Seguro')
  .action(async (id: string, opts) => {
    try {
      const input: Record<string, unknown> = {};
      if (opts.fecha) input.date = opts.fecha;
      if (opts.tipo) input.type = opts.tipo;
      if (opts.descripcion) input.description = opts.descripcion;
      if (opts.paciente) {
        const member = getFamilyMemberByName(opts.paciente);
        if (!member) {
          console.error(`Error: Paciente "${opts.paciente}" no encontrado.`);
          process.exit(1);
        }
        input.patientId = member.id;
      }
      if (opts.reembolsoIsapre !== undefined) {
        input.isapreReimbursed = opts.reembolsoIsapre === 'si';
      }
      if (opts.reembolsoSeguro !== undefined) {
        input.insuranceReimbursed = opts.reembolsoSeguro === 'si';
      }

      const validation = validateUpdateEvent(input);
      if (!validation.valid) {
        console.error('Errores de validación:');
        validation.errors.forEach((e) => console.error(`  - ${e.field}: ${e.message}`));
        process.exit(1);
      }

      const updated = await updateEvent(id, input);
      console.log('Evento actualizado:');
      console.log(JSON.stringify(updated, null, 2));
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

evento
  .command('eliminar <id>')
  .description('Eliminar un evento médico')
  .action(async (id: string) => {
    try {
      await deleteEvent(id);
      console.log(`Evento ${id} eliminado exitosamente.`);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

// --- Fotos ---
const foto = program.command('foto').description('Gestión de fotos vinculadas');

foto
  .command('vincular <evento-id>')
  .description('Vincular una foto de Google Photos a un evento')
  .requiredOption('--google-photos-id <id>', 'ID del media item de Google Photos')
  .requiredOption('--url <url>', 'URL de Google Photos')
  .option('--descripcion <texto>', 'Descripción de la foto')
  .action(async (eventoId: string, opts) => {
    const input = {
      eventId: eventoId,
      googlePhotosUrl: opts.url,
      googlePhotosId: opts.googlePhotosId,
      description: opts.descripcion,
    };

    const validation = validateLinkPhoto(input);
    if (!validation.valid) {
      console.error('Errores de validación:');
      validation.errors.forEach((e) => console.error(`  - ${e.field}: ${e.message}`));
      process.exit(1);
    }

    try {
      const photo = await linkPhoto(input);
      console.log('Foto vinculada exitosamente:');
      console.log(JSON.stringify(photo, null, 2));
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

foto
  .command('listar <evento-id>')
  .description('Listar fotos vinculadas a un evento')
  .action(async (eventoId: string) => {
    try {
      const photos = await listPhotosByEvent(eventoId);
      if (photos.length === 0) {
        console.log('No hay fotos vinculadas a este evento.');
        return;
      }
      console.table(
        photos.map((p) => ({
          ID: p.id.substring(0, 8),
          GoogleID: p.googlePhotosId,
          Descripción: p.description ?? '-',
          URL: p.googlePhotosUrl,
        }))
      );
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

foto
  .command('desvincular <foto-id>')
  .description('Desvincular una foto de un evento')
  .action(async (fotoId: string) => {
    try {
      await unlinkPhoto(fotoId);
      console.log(`Foto ${fotoId} desvinculada exitosamente.`);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

program.parse();
