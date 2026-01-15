import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
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
        { error: 'Token de atualização inválido ou expirado.' },
        { status: 401 }
      );
    }

    // Buscar o token no banco de dados
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (!storedToken || storedToken.token !== refreshToken) {
      return NextResponse.json(
        { error: 'Token de atualização inválido.' },
        { status: 401 }
      );
    }

    // Verificar se o token expirou
    if (new Date() > storedToken.expiresAt) {
      // Remover o token expirado
      await prisma.refreshToken.delete({
        where: { id: payload.tokenId },
      });

      return NextResponse.json(
        { error: 'Token de atualização expirado.' },
        { status: 401 }
      );
    }

    // Remover o token antigo
    await prisma.refreshToken.delete({
      where: { id: payload.tokenId },
    });

    // Gerar novos tokens
    const user = storedToken.user;
    const accessToken = generateAccessToken(user);
    const newRefreshTokenId = uuidv4();
    const newRefreshToken = generateRefreshToken(user.id, newRefreshTokenId);

    // Salvar o novo refresh token no banco de dados
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await prisma.refreshToken.create({
      data: {
        id: newRefreshTokenId,
        token: newRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Retornar os novos tokens
    return NextResponse.json({
      message: 'Tokens atualizados com sucesso.',
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Erro ao atualizar tokens:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tokens. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

