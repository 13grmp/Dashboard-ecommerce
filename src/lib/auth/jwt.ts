import jwt from 'jsonwebtoken';
// Define a minimal User type for token generation
export interface User {
  id: string;
  email: string;
  role: string;
}

// Tipos para os tokens
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

// Configurações de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'IaE9X2zv7WUeN2DCd/9M5+FS57zJoxYfL98QslQjjE7NMkc2BzZyrksX6JYdlY/JpCoqJ3H+GDSNlDBKBGqSwQ==';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutos
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 dias

/**
 * Gera um token de acesso JWT para o usuário
 */
export function generateAccessToken(user: User): string {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Gera um token de atualização JWT para o usuário
 */
export function generateRefreshToken(userId: string, tokenId: string): string {
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verifica e decodifica um token de acesso JWT
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    console.log(token);
    return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica e decodifica um token de atualização JWT
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extrai o token de acesso do cabeçalho de autorização
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' do início
}

