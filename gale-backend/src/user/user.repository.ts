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
    data: CreateUserDto & { password: string },
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

  async findUserAddress(addressId: string) {
    return this.prisma.userAddress.findUnique({ where: { id: addressId } });
  }

  async updateVerifiedEmail(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { verifiedEmail: true },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
