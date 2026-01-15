import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { isValidEmail } from '@/lib/validation';

// Em um ambiente de produção, você enviaria um e-mail com o token
// Para este exemplo, apenas simularemos o processo

export async function POST(req: NextRequest) {
  try {
    // Extrair dados do corpo da requisição
    const body = await req.json();
    const { email } = body;

    // Validar dados
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido.' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Por segurança, não informamos se o e-mail existe ou não
    if (!user) {
      return NextResponse.json({
        message: 'Se o e-mail estiver registrado, você receberá instruções para redefinir sua senha.',
      });
    }

    // Gerar um token único para redefinição de senha
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

    // Em um ambiente real, você armazenaria este token em uma tabela específica
    // Para este exemplo, usaremos a tabela de RefreshToken com uma expiração curta
    await prisma.refreshToken.create({
      data: {
        id: resetToken,
        token: `reset_${resetToken}`,
        userId: user.id,
        expiresAt,
      },
    });

    // Em um ambiente real, você enviaria um e-mail com um link contendo o token
    // Para este exemplo, apenas retornamos o token na resposta (apenas para fins de demonstração)
    return NextResponse.json({
      message: 'Se o e-mail estiver registrado, você receberá instruções para redefinir sua senha.',
      // Apenas para demonstração, em produção não retornaria o token
      resetToken,
    });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

