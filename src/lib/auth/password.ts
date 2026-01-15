import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Criptografa uma senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se uma senha corresponde ao hash armazenado
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

