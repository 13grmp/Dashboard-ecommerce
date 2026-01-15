import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, adminMiddleware } from '@/lib/auth/middleware';
import { removeFile } from '@/lib/upload';

// Obter um produto específico por ID ou slug
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idOrSlug = params.id;

    // Verificar se é um UUID (ID) ou um slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    // Buscar o produto
    const product = await prisma.product.findFirst({
      where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

// Atualizar um produto (apenas administradores)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const id = params.id;
      const body = await req.json();
      const {
        name,
        description,
        price,
        stock,
        sku,
        isActive,
        material,
        gender,
        frameColor,
        lensColor,
        frameShape,
        categoryId,
        brandId,
      } = body;

      // Verificar se o produto existe
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          images: true,
        },
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: 'Produto não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o SKU já está em uso por outro produto
      if (sku && sku !== existingProduct.sku) {
        const productWithSku = await prisma.product.findUnique({
          where: { sku },
        });

        if (productWithSku && productWithSku.id !== id) {
          return NextResponse.json(
            { error: 'Este SKU já está em uso por outro produto.' },
            { status: 409 }
          );
        }
      }

      // Gerar slug a partir do nome (se o nome foi alterado)
      let slug = existingProduct.slug;
      if (name && name !== existingProduct.name) {
        slug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');
      }

      // Atualizar o produto
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          name: name || undefined,
          description: description || undefined,
          price: price ? parseFloat(price) : undefined,
          stock: stock !== undefined ? stock : undefined,
          sku: sku || undefined,
          slug,
          isActive: isActive !== undefined ? isActive : undefined,
          material: material || undefined,
          gender: gender || undefined,
          frameColor: frameColor || undefined,
          lensColor: lensColor || undefined,
          frameShape: frameShape || undefined,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
        },
        include: {
          category: true,
          brand: true,
          images: true,
        },
      });

      return NextResponse.json({
        message: 'Produto atualizado com sucesso.',
        product: updatedProduct,
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar produto. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Excluir um produto (apenas administradores)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const id = params.id;

      // Verificar se o produto existe
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          images: true,
          cartItems: true,
          orderItems: true,
        },
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: 'Produto não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o produto está em algum carrinho ou pedido
      if (existingProduct.cartItems.length > 0 || existingProduct.orderItems.length > 0) {
        // Em vez de excluir, apenas desativar o produto
        await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });

        return NextResponse.json({
          message: 'Produto desativado com sucesso. Não foi possível excluir completamente pois está associado a carrinhos ou pedidos.',
        });
      }

      // Excluir as imagens do produto
      for (const image of existingProduct.images) {
        // Remover o arquivo físico
        removeFile(image.url);
        
        // Excluir o registro da imagem
        await prisma.productImage.delete({
          where: { id: image.id },
        });
      }

      // Excluir o produto
      await prisma.product.delete({
        where: { id },
      });

      return NextResponse.json({
        message: 'Produto excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir produto. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

