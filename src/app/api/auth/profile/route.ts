import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { isValidEmail, isValidPhone } from '@/lib/validation';

// Obter perfil do usuário
export async function GET(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Buscar o usuário com endereços
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          addresses: {
            select: {
              id: true,
              street: true,
              number: true,
              complement: true,
              district: true,
              city: true,
              state: true,
              zipCode: true,
              isDefault: true,
            },
          },
        },
      });

      if (!userProfile) {
        return NextResponse.json(
          { error: 'Usuário não encontrado.' },
          { status: 404 }
        );
      }

      return NextResponse.json(userProfile);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Atualizar perfil do usuário
export async function PUT(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { name, email, phone, currentPassword, newPassword } = body;

      // Validar dados
      if (!name) {
        return NextResponse.json(
          { error: 'Nome é obrigatório.' },
          { status: 400 }
        );
      }

      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { error: 'E-mail inválido.' },
          { status: 400 }
        );
      }

      if (phone && !isValidPhone(phone)) {
        return NextResponse.json(
          { error: 'Número de telefone inválido.' },
          { status: 400 }
        );
      }

      // Buscar o usuário atual
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'Usuário não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o e-mail já está em uso por outro usuário
      if (email && email !== currentUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.id !== user.id) {
          return NextResponse.json(
            { error: 'Este e-mail já está em uso por outro usuário.' },
            { status: 409 }
          );
        }
      }

      // Preparar dados para atualização
      const updateData: any = {
        name,
        phone,
      };

      // Atualizar e-mail apenas se for diferente
      if (email && email !== currentUser.email) {
        updateData.email = email;
      }

      // Atualizar senha se fornecida
      if (currentPassword && newPassword) {
        // Verificar senha atual
        const isPasswordValid = await verifyPassword(currentPassword, currentUser.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Senha atual incorreta.' },
            { status: 401 }
          );
        }

        // Validar nova senha
        if (newPassword.length < 8) {
          return NextResponse.json(
            { error: 'A nova senha deve ter pelo menos 8 caracteres.' },
            { status: 400 }
          );
        }

        // Criptografar nova senha
        updateData.password = await hashPassword(newPassword);
      }

      // Atualizar o usuário
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        message: 'Perfil atualizado com sucesso.',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil do usuário. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

