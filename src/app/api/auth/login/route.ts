import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Extrair dados do corpo da requisição
    const body = await req.json();
    const { email, password } = body;

    // Validar dados
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Buscar o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Verificar a senha
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Gerar tokens
    const accessToken = generateAccessToken(user);
    const refreshTokenId = uuidv4();
    const refreshToken = generateRefreshToken(user.id, refreshTokenId);

    // Salvar o refresh token no banco de dados
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Retornar os tokens e informações do usuário
    return NextResponse.json({
      message: 'Login realizado com sucesso.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

