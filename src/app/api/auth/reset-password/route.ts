import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { isValidPassword } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // Extrair dados do corpo da requisição
    const body = await req.json();
    const { token, password } = body;

    // Validar dados
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números.' },
        { status: 400 }
      );
    }

    // Buscar o token no banco de dados
    const resetToken = await prisma.refreshToken.findFirst({
      where: {
        id: token,
        token: `reset_${token}`,
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado.' },
        { status: 400 }
      );
    }

    // Verificar se o token expirou
    if (new Date() > resetToken.expiresAt) {
      // Remover o token expirado
      await prisma.refreshToken.delete({
        where: { id: token },
      });

      return NextResponse.json(
        { error: 'Token expirado. Solicite uma nova redefinição de senha.' },
        { status: 400 }
      );
    }

    // Criptografar a nova senha
    const hashedPassword = await hashPassword(password);

    // Atualizar a senha do usuário
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Remover o token usado
    await prisma.refreshToken.delete({
      where: { id: token },
    });

    // Remover todos os tokens de atualização do usuário (logout em todos os dispositivos)
    await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return NextResponse.json({
      message: 'Senha redefinida com sucesso. Faça login com sua nova senha.',
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { error: 'Erro ao redefinir senha. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

