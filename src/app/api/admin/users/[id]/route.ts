import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { hashPassword } from '@/lib/auth/password';

// Obter detalhes de um usuário específico (apenas admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const userId = params.id;

      // Buscar o usuário
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          addresses: true,
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                    },
                  },
                },
              },
              payment: true,
            },
          },
          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        },
      });

      if (!userData) {
        return NextResponse.json(
          { error: 'Usuário não encontrado.' },
          { status: 404 }
        );
      }

      // Calcular estatísticas do usuário
      const totalSpent = await prisma.order.aggregate({
        where: {
          userId,
          status: {
            in: ['PAID', 'SHIPPED', 'DELIVERED'],
          },
        },
        _sum: {
          total: true,
        },
      });

      // Formatar a resposta
      const formattedUser = {
        ...userData,
        totalSpent: totalSpent._sum.total || 0,
      };

      return NextResponse.json(formattedUser);
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar detalhes do usuário. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Atualizar um usuário (apenas admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const userId = params.id;
      const body = await req.json();
      const { name, email, phone, role, password } = body;

      // Verificar se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'Usuário não encontrado.' },
          { status: 404 }
        );
      }

      // Validar dados
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

      // Verificar se o e-mail já está em uso por outro usuário
      if (email && email !== existingUser.email) {
        const userWithEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (userWithEmail && userWithEmail.id !== userId) {
          return NextResponse.json(
            { error: 'Este e-mail já está em uso por outro usuário.' },
            { status: 409 }
          );
        }
      }

      // Validar o papel do usuário
      const validRoles = ['CUSTOMER', 'ADMIN'];
      if (role && !validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Papel de usuário inválido.' },
          { status: 400 }
        );
      }

      // Preparar dados para atualização
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (role) updateData.role = role;

      // Criptografar a senha se fornecida
      if (password) {
        if (password.length < 8) {
          return NextResponse.json(
            { error: 'A senha deve ter pelo menos 8 caracteres.' },
            { status: 400 }
          );
        }
        updateData.password = await hashPassword(password);
      }

      // Atualizar o usuário
      const updatedUser = await prisma.user.update({
        where: { id: userId },
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
        message: 'Usuário atualizado com sucesso.',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Excluir um usuário (apenas admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const userId = params.id;

      // Verificar se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: true,
          cart: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'Usuário não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o usuário tem pedidos
      if (existingUser.orders.length > 0) {
        return NextResponse.json(
          { error: 'Não é possível excluir um usuário com pedidos. Considere desativá-lo em vez disso.' },
          { status: 400 }
        );
      }

      // Excluir o carrinho e itens do carrinho
      if (existingUser.cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: existingUser.cart.id },
        });

        await prisma.cart.delete({
          where: { id: existingUser.cart.id },
        });
      }

      // Excluir endereços
      await prisma.address.deleteMany({
        where: { userId },
      });

      // Excluir tokens de atualização
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      // Excluir o usuário
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        message: 'Usuário excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir usuário. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

