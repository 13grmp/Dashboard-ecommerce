import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';
import { isValidZipCode } from '@/lib/validation';

// Obter um endereço específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware(req, async (req, user) => {
    try {
      const addressId = params.id;

      const address = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        return NextResponse.json(
          { error: 'Endereço não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o endereço pertence ao usuário
      if (address.userId !== user.id) {
        return NextResponse.json(
          { error: 'Acesso negado. Este endereço não pertence ao usuário.' },
          { status: 403 }
        );
      }

      return NextResponse.json(address);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar endereço. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Atualizar um endereço
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware(req, async (req, user) => {
    try {
      const addressId = params.id;
      const body = await req.json();
      const { street, number, complement, district, city, state, zipCode, isDefault } = body;

      // Validar dados
      if (!street || !number || !district || !city || !state || !zipCode) {
        return NextResponse.json(
          { error: 'Todos os campos são obrigatórios, exceto complemento.' },
          { status: 400 }
        );
      }

      if (!isValidZipCode(zipCode)) {
        return NextResponse.json(
          { error: 'CEP inválido.' },
          { status: 400 }
        );
      }

      // Verificar se o endereço existe e pertence ao usuário
      const existingAddress = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!existingAddress) {
        return NextResponse.json(
          { error: 'Endereço não encontrado.' },
          { status: 404 }
        );
      }

      if (existingAddress.userId !== user.id) {
        return NextResponse.json(
          { error: 'Acesso negado. Este endereço não pertence ao usuário.' },
          { status: 403 }
        );
      }

      // Se o endereço for definido como padrão, remover o padrão dos outros endereços
      if (isDefault && !existingAddress.isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      // Atualizar o endereço
      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: {
          street,
          number,
          complement,
          district,
          city,
          state,
          zipCode,
          isDefault: isDefault || false,
        },
      });

      return NextResponse.json({
        message: 'Endereço atualizado com sucesso.',
        address: updatedAddress,
      });
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar endereço. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Excluir um endereço
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware(req, async (req, user) => {
    try {
      const addressId = params.id;

      // Verificar se o endereço existe e pertence ao usuário
      const existingAddress = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!existingAddress) {
        return NextResponse.json(
          { error: 'Endereço não encontrado.' },
          { status: 404 }
        );
      }

      if (existingAddress.userId !== user.id) {
        return NextResponse.json(
          { error: 'Acesso negado. Este endereço não pertence ao usuário.' },
          { status: 403 }
        );
      }

      // Verificar se é o único endereço do usuário
      const addressCount = await prisma.address.count({
        where: { userId: user.id },
      });

      if (addressCount === 1) {
        return NextResponse.json(
          { error: 'Não é possível excluir o único endereço cadastrado.' },
          { status: 400 }
        );
      }

      // Se o endereço excluído for o padrão, definir outro endereço como padrão
      if (existingAddress.isDefault) {
        const anotherAddress = await prisma.address.findFirst({
          where: {
            userId: user.id,
            id: { not: addressId },
          },
        });

        if (anotherAddress) {
          await prisma.address.update({
            where: { id: anotherAddress.id },
            data: { isDefault: true },
          });
        }
      }

      // Excluir o endereço
      await prisma.address.delete({
        where: { id: addressId },
      });

      return NextResponse.json({
        message: 'Endereço excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir endereço. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

