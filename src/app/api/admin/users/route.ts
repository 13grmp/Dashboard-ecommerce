import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { hashPassword } from '@/lib/auth/password';

// Listar usuários (apenas admin)
export async function GET(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair parâmetros de consulta
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const search = url.searchParams.get('search') || '';
      const role = url.searchParams.get('role') || undefined;
      const sortBy = url.searchParams.get('sortBy') || 'createdAt';
      const sortOrder = url.searchParams.get('sortOrder') || 'desc';

      // Validar parâmetros
      const validPage = page > 0 ? page : 1;
      const validLimit = limit > 0 && limit <= 50 ? limit : 10;
      const skip = (validPage - 1) * validLimit;

      // Construir filtros
      const filters: any = {};

      if (search) {
        filters.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        filters.role = role;
      }

      // Construir ordenação
      const orderBy: any = {};
      if (sortBy === 'name') {
        orderBy.name = sortOrder;
      } else if (sortBy === 'email') {
        orderBy.email = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }

      // Buscar usuários
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: filters,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                orders: true,
                addresses: true,
              },
            },
          },
          orderBy,
          skip,
          take: validLimit,
        }),
        prisma.user.count({
          where: filters,
        }),
      ]);

      // Calcular informações de paginação
      const totalPages = Math.ceil(total / validLimit);
      const hasNextPage = validPage < totalPages;
      const hasPrevPage = validPage > 1;

      return NextResponse.json({
        users,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return NextResponse.json(
        { error: 'Erro ao listar usuários. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Criar um novo usuário (apenas admin)
export async function POST(req: NextRequest) {
  return adminMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { name, email, password, phone, role } = body;

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

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'A senha deve ter pelo menos 8 caracteres.' },
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

      // Validar o papel do usuário
      const validRoles = ['CUSTOMER', 'ADMIN'];
      if (role && !validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Papel de usuário inválido.' },
          { status: 400 }
        );
      }

      // Criptografar a senha
      const hashedPassword = await hashPassword(password);

      // Criar o usuário
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: role || 'CUSTOMER',
        },
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

      return NextResponse.json(
        { message: 'Usuário criado com sucesso.', user: newUser },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao criar usuário. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

