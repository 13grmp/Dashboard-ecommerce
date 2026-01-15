import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';
import { verifyRefreshToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { refreshToken } = body;

      if (!refreshToken) {
        return NextResponse.json(
          { error: 'Token de atualização não fornecido.' },
          { status: 400 }
        );
      }

      // Verificar o token de atualização
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        return NextResponse.json(
          { message: 'Logout realizado com sucesso.' },
          { status: 200 }
        );
      }

      // Verificar se o token pertence ao usuário autenticado
      if (payload.userId !== user.id) {
        return NextResponse.json(
          { error: 'Token de atualização inválido.' },
          { status: 401 }
        );
      }

      // Remover o token do banco de dados
      await prisma.refreshToken.delete({
        where: { id: payload.tokenId },
      });

      return NextResponse.json({
        message: 'Logout realizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return NextResponse.json(
        { error: 'Erro ao fazer logout. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Endpoint para logout de todos os dispositivos
export async function DELETE(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Remover todos os tokens de atualização do usuário
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        message: 'Logout realizado em todos os dispositivos.',
      });
    } catch (error) {
      console.error('Erro ao fazer logout em todos os dispositivos:', error);
      return NextResponse.json(
        { error: 'Erro ao fazer logout. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

