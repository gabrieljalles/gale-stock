import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { CreateUserAddressDto, CreateUserDto } from './dto/create-user.dto';
import { AccountType, User, UserAddress } from '@prisma/client';
import { create } from 'domain';
import { legalAge } from 'src/utils/legal-age.utils';
import { MailService } from './mail.service';
import { JwtService } from '@nestjs/jwt';
import { userInfo } from 'os';

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto, baseURL: string) {
    const existingEmail = await this.repository.findByEmail(
      createUserDto.email,
    );
    const existingCpfCNPJ = await this.repository.findByCpfCNPJ(
      createUserDto.cpfCNPJ,
    );
    const islegalAge = legalAge(createUserDto.dateOfBirth);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    if (existingEmail || existingCpfCNPJ) {
      throw new ConflictException(
        'Não foi possível concluir o cadastro com os dados informados. ' +
          'Usuário já cadastrado.',
      );
    }

    if (!islegalAge) {
      throw new BadRequestException('Você precisa ter pelo menos 18 anos.');
    }

    const user = await this.repository.runInTransaction(async (tx) => {
      return this.repository.createUser(
        {
          ...createUserDto,
          password: hashedPassword,
        },
        tx,
      );
    });

    const payload = { sub: user.id, type: 'email_verification' };
    const token = this.jwtService.sign(payload, {
      expiresIn: process.env.EMAIL_TOKEN_EXPIRATION || '1h',
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      user.fullName,
      token,
      baseURL,
    );

    return user;
  }

  async resendVerificationEmail(email: string, baseUrl: string) {
    const user = await this.repository.findByEmail(email);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.verifiedEmail) {
      throw new BadRequestException('E-mail já é confirmado.');
    }

    const payload = { sub: user.id, type: 'email_verification' };
    const token = this.jwtService.sign(payload, {
      expiresIn: process.env.EMAIL_TOKEN_EXPIRATION || '1h',
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      user.fullName,
      token,
      baseUrl,
    );
  }

  async sendPasswordResetEmail(email: string, baseUrl: string) {
    const user = await this.repository.findByEmail(email);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const payload = { sub: user.id, type: 'email_password_changer' };
    const token = this.jwtService.sign(payload, {
      expiresIn: process.env.EMAIL_TOKEN_EXPIRATION || '1h',
    });

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      token,
      baseUrl,
    );
  }

  async createAddressForUser(userId: string, dto: CreateUserAddressDto) {
    await this.findUserById(userId);
    return this.repository.createUserAddress(userId, dto);
  }

  //Usado para logar e validar o usuário
  async validateUser(email: string, password: string) {
    const user = await this.repository.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async findUserById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com o ID: ${id} não encontrado`);
    }
    return user;
  }

  async findAddressByAddressId(addressId: string) {
    const address = await this.repository.findUserAddress(addressId);
    if (!address) {
      throw new NotFoundException('Endereço não encontrado.');
    }
    return address;
  }

  async ensureDeliveryMan(userId: string): Promise<User> {
    const user = await this.findUserById(userId);

    if (user.accountType !== AccountType.DeliveryMan) {
      throw new BadRequestException(
        `O usuário escolhido para ser motoboy não é do tipo Motoboy.`,
      );
    }
    return user;
  }

  async verifyEmailUser(userId: string) {
    const user = await this.findUserById(userId);

    if (user.verifiedEmail) {
      throw new BadRequestException('Email já verificado!');
    }

    await this.repository.updateVerifiedEmail(user.id);
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await this.findUserById(userId);

    return this.repository.updatePassword(userId, hashedPassword);
  }
}
