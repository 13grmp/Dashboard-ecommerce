import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';

// Obter o carrinho do usuário
export async function GET(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Buscar o carrinho do usuário
      let cart = await prisma.cart.findFirst({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isMain: true },
                    take: 1,
                  },
                  brand: true,
                },
              },
            },
          },
        },
      });

      // Se o usuário não tiver um carrinho, criar um novo
      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId: user.id,
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isMain: true },
                      take: 1,
                    },
                    brand: true,
                  },
                },
              },
            },
          },
        });
      }

      // Calcular o subtotal e total
      let subtotal = 0;
      for (const item of cart.items) {
        subtotal += parseFloat(item.product.price.toString()) * item.quantity;
      }

      // Formatar a resposta
      const response = {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            sku: item.product.sku,
            slug: item.product.slug,
            brand: item.product.brand ? item.product.brand.name : null,
            image: item.product.images.length > 0 ? item.product.images[0].url : null,
          },
          subtotal: parseFloat(item.product.price.toString()) * item.quantity,
        })),
        subtotal,
        total: subtotal, // Por enquanto, total = subtotal (sem frete ou descontos)
        itemCount: cart.items.length,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar carrinho. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Adicionar um produto ao carrinho
export async function POST(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { productId, quantity } = body;

      // Validar dados
      if (!productId) {
        return NextResponse.json(
          { error: 'ID do produto é obrigatório.' },
          { status: 400 }
        );
      }

      const validQuantity = quantity && quantity > 0 ? quantity : 1;

      // Verificar se o produto existe e está ativo
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Produto não encontrado ou indisponível.' },
          { status: 404 }
        );
      }

      // Verificar se o produto tem estoque suficiente
      if (product.stock < validQuantity) {
        return NextResponse.json(
          { error: 'Quantidade solicitada não disponível em estoque.' },
          { status: 400 }
        );
      }

      // Buscar ou criar o carrinho do usuário
      let cart = await prisma.cart.findFirst({
        where: { userId: user.id },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId: user.id,
          },
        });
      }

      // Verificar se o produto já está no carrinho
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      if (existingItem) {
        // Atualizar a quantidade do item existente
        const newQuantity = existingItem.quantity + validQuantity;
        
        // Verificar estoque novamente
        if (product.stock < newQuantity) {
          return NextResponse.json(
            { error: 'Quantidade total solicitada não disponível em estoque.' },
            { status: 400 }
          );
        }

        // Atualizar o item
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
          },
        });

        return NextResponse.json({
          message: 'Quantidade do produto atualizada no carrinho.',
          cartId: cart.id,
          itemId: existingItem.id,
          quantity: newQuantity,
        });
      } else {
        // Adicionar novo item ao carrinho
        const cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: validQuantity,
          },
        });

        return NextResponse.json(
          {
            message: 'Produto adicionado ao carrinho.',
            cartId: cart.id,
            itemId: cartItem.id,
            quantity: validQuantity,
          },
          { status: 201 }
        );
      }
    } catch (error) {
      console.error('Erro ao adicionar produto ao carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao adicionar produto ao carrinho. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Limpar o carrinho
export async function DELETE(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Buscar o carrinho do usuário
      const cart = await prisma.cart.findFirst({
        where: { userId: user.id },
      });

      if (!cart) {
        return NextResponse.json({
          message: 'Carrinho já está vazio.',
        });
      }

      // Remover todos os itens do carrinho
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return NextResponse.json({
        message: 'Carrinho esvaziado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao limpar carrinho. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

