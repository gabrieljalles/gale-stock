// src/users/user.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';  // adapte o caminho conforme sua estrutura
import { CreateUserAddressDto, CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto & { password: string }) {
    return this.prisma.user.create({ data });
  }

  async createUserAddress(userId: string, data: CreateUserAddressDto){
    return this.prisma.userAddress.create({data:{
      user: {connect: {id: userId}},
      typeAddress: data.typeAddress,
      address: data.address,
      number: data.number,
      district: data.district,
      complement: data.complement,
      zipCode: data.zipCode,
    }});
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(userId: string){
    return this.prisma.user.findUnique({where: {id: userId}})
  }

  async findUserAddress(addressId: string){
    return this.prisma.userAddress.findUnique({where: {id: addressId}});
  }
}