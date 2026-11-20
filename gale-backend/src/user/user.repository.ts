// src/users/user.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // adapte o caminho conforme sua estrutura
import { CreateUserAddressDto, CreateUserDto } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';
import { generatePrefixedId } from 'src/utils/generate-prefix-id';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async createUser(
    data: Omit<CreateUserDto, 'referralCode'> & {
      password: string;
      // Padrinho já resolvido pelo service. O código do link não chega
      // aqui: quem entra na tabela é o vínculo, não o texto do convite.
      referredById?: string | null;
      referredAt?: Date | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.user.create({
      data: {
        id: generatePrefixedId('U', 5),
        ...data,
      },
    });
  }

  async createUserAddress(userId: string, data: CreateUserAddressDto) {
    return this.prisma.userAddress.create({
      data: {
        user: { connect: { id: userId } },
        typeAddress: data.typeAddress,
        address: data.address,
        number: data.number,
        district: data.district,
        complement: data.complement,
        zipCode: data.zipCode,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByCpfCNPJ(cpfCNPJ: string) {
    return this.prisma.user.findUnique({ where: { cpfCNPJ } });
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async findManyClients(onlyAuthorizedForBill: boolean) {
    return this.prisma.user.findMany({
      where: {
        accountType: 'Client',
        ...(onlyAuthorizedForBill && { canPayOnTheBill: true }),
      },
      select: { id: true, fullName: true, canPayOnTheBill: true },
      orderBy: { fullName: 'asc' },
    });
  }

  // Motoboys de verdade primeiro (por nome); Admins entram como opção de
  // reserva (quando não tem motoboy disponível) e ficam sempre por último.
  async findManyDeliveryMen() {
    const [deliveryMen, admins] = await Promise.all([
      this.prisma.user.findMany({
        where: { accountType: 'DeliveryMan' },
        select: { id: true, fullName: true, accountType: true },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.user.findMany({
        where: { accountType: 'Admin' },
        select: { id: true, fullName: true, accountType: true },
        orderBy: { fullName: 'asc' },
      }),
    ]);

    return [...deliveryMen, ...admins];
  }

  async findUserAddress(addressId: string) {
    return this.prisma.userAddress.findUnique({ where: { id: addressId } });
  }

  async findAddressesByUserId(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      // Principal primeiro, depois os mais recentes.
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async deleteUserAddress(addressId: string) {
    return this.prisma.userAddress.delete({ where: { id: addressId } });
  }

  // Marca um endereço como principal e tira a marca dos outros do mesmo
  // dono — só pode existir um principal por usuário.
  async setPrimaryAddress(userId: string, addressId: string) {
    return this.prisma.$transaction([
      this.prisma.userAddress.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { isPrimary: true },
      }),
    ]);
  }

  async updateVerifiedEmail(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { verifiedEmail: true },
    });
  }

  async updateAvatarUrl(userId: string, avatarUrl: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // Todos os usuários com endereços e pedidos (só o necessário pra
  // calcular faturamento e produto preferido no service).
  async findAllWithOrders() {
    return this.prisma.user.findMany({
      include: {
        address: true,
        clientOrders: {
          include: {
            orderDetails: { select: { productName: true, quantity: true } },
            orderTransaction: {
              select: { isPaid: true, totalPrice: true },
            },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async updateAccountType(userId: string, accountType: Prisma.UserUpdateInput['accountType']) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { accountType },
    });
  }

  // Quanto o cliente deve em notinha agora: soma das transacoes OnTheBill
  // que ainda nao foram quitadas.
  async sumOpenOnTheBill(userId: string) {
    const result = await this.prisma.orderTransaction.aggregate({
      where: {
        transactionType: 'OnTheBill',
        isPaid: false,
        order: { clientId: userId },
      },
      _sum: { totalPrice: true },
    });
    return Number(result._sum.totalPrice ?? 0);
  }

  async updateOnTheBillAccess(
    id: string,
    canPayOnTheBill: boolean,
    onTheBillLimit: number | null,
  ) {
    return this.prisma.user.update({
      where: { id },
      data: { canPayOnTheBill, onTheBillLimit },
    });
  }
}
