import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyAccessToken } from './jwt';
import { prisma } from '../prisma';

/**
 * Middleware para verificar se o usuário está autenticado
 */
export async function authMiddleware(
  req: NextRequest,
  handler: (req: NextRequest, user: { id: string; email: string; role: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  // Extrair token do cabeçalho
  const authHeader = req.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader || undefined);

  if (!token) {
    return NextResponse.json(
      { error: 'Não autorizado. Token não fornecido.' },
      { status: 401 }
    );
  }

  // Verificar token
  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Não autorizado. Token inválido ou expirado.' },
      { status: 401 }
    );
  }

  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Não autorizado. Usuário não encontrado.' },
      { status: 401 }
    );
  }

  // Passar o usuário para o handler
  return handler(req, {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  });
}

/**
 * Middleware para verificar se o usuário é um administrador
 */
export async function adminMiddleware(
  req: NextRequest,
  handler: (req: NextRequest, user: { id: string; email: string; role: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  return authMiddleware(req, async (req, user) => {
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}

