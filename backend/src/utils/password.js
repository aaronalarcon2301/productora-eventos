import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';

import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 10) {
    throw new Error('La contraseña debe tener al menos 10 caracteres');
  }

  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);

  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || typeof password !== 'string') {
    return false;
  }

  const [algoritmo, salt, hex] = storedHash.split(':');

  if (
    algoritmo !== 'scrypt' ||
    !salt ||
    !/^[a-f0-9]{128}$/.test(hex || '')
  ) {
    return false;
  }

  const expected = Buffer.from(hex, 'hex');
  const actual = await scrypt(password, salt, expected.length);

  return timingSafeEqual(actual, expected);
}