#!/usr/bin/env node
import { Command } from 'commander';
import { getFamilyMembers, getFamilyMemberByName } from '../infra/supabase/family-member-store.js';
import {
  crearEvento,
  obtenerEventoPorId,
  listarEventos,
  actualizarEvento,
  eliminarEvento,
  vincularFoto,
  listarFotosPorEvento,
  desvincularFoto,
} from '../infra/store-provider.js';
import { validarCrearEvento, validarActualizarEvento } from '../domain/validators/medical-event-validator.js';
import { validarVincularFoto } from '../domain/validators/event-photo-validator.js';
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
      console.error('Miembros disponibles:', getFamilyMembers().map((m) => m.nombre).join(', '));
      process.exit(1);
    }

    const input = {
      fecha: opts.fecha,
      tipo: opts.tipo as EventType,
      descripcion: opts.descripcion,
      pacienteId: member.id,
      reembolsoIsapre: opts.reembolsoIsapre,
      reembolsoSeguro: opts.reembolsoSeguro,
    };

    const validation = validarCrearEvento(input);
    if (!validation.valido) {
      console.error('Errores de validación:');
      validation.errores.forEach((e) => console.error(`  - ${e.campo}: ${e.mensaje}`));
      process.exit(1);
    }

    try {
      const event = await crearEvento(input);
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

      const events = await listarEventos({
        pacienteId,
        tipo: opts.tipo,
        desde: opts.desde,
        hasta: opts.hasta,
      });

      if (events.length === 0) {
        console.log('No se encontraron eventos.');
        return;
      }

      const members = getFamilyMembers();
      const table = events.map((e) => ({
        ID: e.id.substring(0, 8),
        Fecha: e.fecha,
        Tipo: e.tipo,
        Paciente: members.find((m) => m.id === e.pacienteId)?.nombre ?? e.pacienteId,
        Descripción: e.descripcion.substring(0, 40),
        ISAPRE: e.reembolsoIsapre ? 'Sí' : 'No',
        Seguro: e.reembolsoSeguro ? 'Sí' : 'No',
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
      const event = await obtenerEventoPorId(id);
      if (!event) {
        console.error(`Evento con ID "${id}" no encontrado.`);
        process.exit(1);
      }

      const members = getFamilyMembers();
      const paciente = members.find((m) => m.id === event.pacienteId);

      console.log('Evento Médico:');
      console.log(`  ID:          ${event.id}`);
      console.log(`  Fecha:       ${event.fecha}`);
      console.log(`  Tipo:        ${event.tipo}`);
      console.log(`  Paciente:    ${paciente?.nombre ?? event.pacienteId}`);
      console.log(`  Descripción: ${event.descripcion}`);
      console.log(`  ISAPRE:      ${event.reembolsoIsapre ? 'Sí' : 'No'}`);
      console.log(`  Seguro:      ${event.reembolsoSeguro ? 'Sí' : 'No'}`);

      const fotos = await listarFotosPorEvento(id);
      if (fotos.length > 0) {
        console.log(`  Fotos (${fotos.length}):`);
        fotos.forEach((f) => {
          console.log(`    - ${f.descripcion ?? 'Sin descripción'}: ${f.googlePhotosUrl}`);
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
      if (opts.fecha) input.fecha = opts.fecha;
      if (opts.tipo) input.tipo = opts.tipo;
      if (opts.descripcion) input.descripcion = opts.descripcion;
      if (opts.paciente) {
        const member = getFamilyMemberByName(opts.paciente);
        if (!member) {
          console.error(`Error: Paciente "${opts.paciente}" no encontrado.`);
          process.exit(1);
        }
        input.pacienteId = member.id;
      }
      if (opts.reembolsoIsapre !== undefined) {
        input.reembolsoIsapre = opts.reembolsoIsapre === 'si';
      }
      if (opts.reembolsoSeguro !== undefined) {
        input.reembolsoSeguro = opts.reembolsoSeguro === 'si';
      }

      const validation = validarActualizarEvento(input);
      if (!validation.valido) {
        console.error('Errores de validación:');
        validation.errores.forEach((e) => console.error(`  - ${e.campo}: ${e.mensaje}`));
        process.exit(1);
      }

      const updated = await actualizarEvento(id, input);
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
      await eliminarEvento(id);
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
      eventoId,
      googlePhotosUrl: opts.url,
      googlePhotosId: opts.googlePhotosId,
      descripcion: opts.descripcion,
    };

    const validation = validarVincularFoto(input);
    if (!validation.valido) {
      console.error('Errores de validación:');
      validation.errores.forEach((e) => console.error(`  - ${e.campo}: ${e.mensaje}`));
      process.exit(1);
    }

    try {
      const photo = await vincularFoto(input);
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
      const photos = await listarFotosPorEvento(eventoId);
      if (photos.length === 0) {
        console.log('No hay fotos vinculadas a este evento.');
        return;
      }
      console.table(
        photos.map((p) => ({
          ID: p.id.substring(0, 8),
          GoogleID: p.googlePhotosId,
          Descripción: p.descripcion ?? '-',
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
      await desvincularFoto(fotoId);
      console.log(`Foto ${fotoId} desvinculada exitosamente.`);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

program.parse();
