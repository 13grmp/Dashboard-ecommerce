import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { isValidEmail, isValidPassword, isValidPhone } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    // Extrair dados do corpo da requisição
    const body = await req.json();
    const { name, email, password, phone } = body;

    // Validar dados
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido.' },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números.' },
        { status: 400 }
      );
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Número de telefone inválido.' },
        { status: 400 }
      );
    }

    // Verificar se o e-mail já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está em uso.' },
        { status: 409 }
      );
    }

    // Criptografar a senha
    const hashedPassword = await hashPassword(password);

    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'CUSTOMER', // Por padrão, todos os usuários são clientes
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: 'Usuário registrado com sucesso.', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar usuário. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

