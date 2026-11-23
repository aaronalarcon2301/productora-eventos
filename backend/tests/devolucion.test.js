
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  contarDiasHabiles,
  buscarTramo,
  hoyChile
} from '../src/utils/devolucion.js';

const politicas = [
  {
    diasDesde: 0,
    diasHasta: 5,
    porcentaje: 100
  },
  {
    diasDesde: 6,
    diasHasta: 15,
    porcentaje: 50
  },
  {
    diasDesde: 16,
    diasHasta: null,
    porcentaje: 0
  }
];

test('el día del pago no cuenta', () => {
  assert.equal(
    contarDiasHabiles('2026-11-20', '2026-11-20'),
    0
  );
});

test('los fines de semana no cuentan', () => {
  assert.equal(
    contarDiasHabiles('2026-11-20', '2026-11-23'),
    1
  );
});

test('se excluyen los feriados proporcionados', () => {
  assert.equal(
    contarDiasHabiles(
      '2026-11-20',
      '2026-11-23',
      ['2026-11-23']
    ),
    0
  );
});

test('límites de los tramos', () => {
  assert.equal(buscarTramo(0, politicas).porcentaje, 100);
  assert.equal(buscarTramo(5, politicas).porcentaje, 100);
  assert.equal(buscarTramo(6, politicas).porcentaje, 50);
  assert.equal(buscarTramo(15, politicas).porcentaje, 50);
  assert.equal(buscarTramo(16, politicas).porcentaje, 0);
});

test('rechaza fecha anterior al pago', () => {
  assert.throws(
    () => contarDiasHabiles(
      '2026-11-20',
      '2026-11-19'
    ),
    RangeError
  );
});

test('rechaza políticas ambiguas o sin tramo', () => {
  assert.throws(
    () => buscarTramo(6, []),
    RangeError
  );

  assert.throws(
    () => buscarTramo(6, [
      {
        diasDesde: 0,
        diasHasta: 10,
        porcentaje: 50
      },
      {
        diasDesde: 5,
        diasHasta: null,
        porcentaje: 20
      }
    ]),
    RangeError
  );
});

test('fecha de hoy usa zona horaria chilena', () => {
  assert.equal(
    hoyChile(new Date('2026-11-21T02:00:00Z')),
    '2026-11-20'
  );
});
