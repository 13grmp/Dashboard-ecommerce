import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';

// Atualizar a quantidade de um item no carrinho
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware(req, async (req, user) => {
    try {
      const itemId = params.id;
      const body = await req.json();
      const { quantity } = body;

      // Validar dados
      if (!quantity || quantity < 1) {
        return NextResponse.json(
          { error: 'Quantidade deve ser maior que zero.' },
          { status: 400 }
        );
      }

      // Verificar se o item existe e pertence ao carrinho do usuário
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            userId: user.id,
          },
        },
        include: {
          product: true,
        },
      });

      if (!cartItem) {
        return NextResponse.json(
          { error: 'Item não encontrado no carrinho.' },
          { status: 404 }
        );
      }

      // Verificar se o produto tem estoque suficiente
      if (cartItem.product.stock < quantity) {
        return NextResponse.json(
          { error: 'Quantidade solicitada não disponível em estoque.' },
          { status: 400 }
        );
      }

      // Atualizar a quantidade do item
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json({
        message: 'Quantidade atualizada com sucesso.',
        item: {
          id: updatedItem.id,
          quantity: updatedItem.quantity,
          product: {
            id: updatedItem.product.id,
            name: updatedItem.product.name,
            price: updatedItem.product.price,
          },
          subtotal: parseFloat(updatedItem.product.price.toString()) * updatedItem.quantity,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar item do carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar item do carrinho. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Remover um item do carrinho
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware(req, async (req, user) => {
    try {
      const itemId = params.id;

      // Verificar se o item existe e pertence ao carrinho do usuário
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            userId: user.id,
          },
        },
      });

      if (!cartItem) {
        return NextResponse.json(
          { error: 'Item não encontrado no carrinho.' },
          { status: 404 }
        );
      }

      // Remover o item do carrinho
      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      return NextResponse.json({
        message: 'Item removido do carrinho com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao remover item do carrinho. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

