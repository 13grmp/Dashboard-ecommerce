import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';
import { isValidZipCode } from '@/lib/validation';

// Listar endereços do usuário
export async function GET(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      const addresses = await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: { isDefault: 'desc' },
      });

      return NextResponse.json(addresses);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar endereços. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Adicionar novo endereço
export async function POST(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
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

      // Se o novo endereço for definido como padrão, remover o padrão dos outros endereços
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      // Criar o novo endereço
      const address = await prisma.address.create({
        data: {
          street,
          number,
          complement,
          district,
          city,
          state,
          zipCode,
          isDefault: isDefault || false,
          userId: user.id,
        },
      });

      return NextResponse.json(
        { message: 'Endereço adicionado com sucesso.', address },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error);
      return NextResponse.json(
        { error: 'Erro ao adicionar endereço. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

