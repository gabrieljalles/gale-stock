import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { CreateUserAddressDto, CreateUserDto } from './dto/create-user.dto';
import { AccountType, User, UserAddress } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async register(createUserDto: CreateUserDto) {
    
    const existingUser = await this.repository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }
    
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.repository.createUser({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async createAddressForUser(
    userId: string,
    dto: CreateUserAddressDto
  ){
   await this.findUserById(userId);
   return this.repository.createUserAddress(userId, dto);
  }

  async validateUser(email: string, password: string) {
    const user = await this.repository.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async findUserById(id: string){
    const user = await this.repository.findById(id);
    if (!user){
      throw new NotFoundException(`Usuário com o ID: ${id} não encontrado`);
    }
    return user;
  }

  async findAddressByAddressId(addressId:string){
    const address = await this.repository.findUserAddress(addressId);
    if(!address){
      throw new NotFoundException('Endereço não encontrado.');
    }
    return address;
  }

  async ensureDeliveryMan(userId: string): Promise<User> {
    const user = await this.findUserById(userId);

    if (user.accountType !== AccountType.DeliveryMan){
      throw new BadRequestException(
        `O usuário escolhido para ser motoboy, não é do tipo Motoboy.`
      )
    }
    return user;
  }

}