import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Param,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  CreateUserAddressDto,
  CreateUserDto,
  ResendEmailDto,
} from './dto/create-user.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';
import { MailService } from './mail.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  @Post('register') //ok
  @Public()
  async createUser(@Body() dto: CreateUserDto, @Req() req: ExpressRequest) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const user = await this.userService.register(dto, baseUrl);

    return {
      message:
        'Usuário criado com sucesso. Verifique seu e-mail para confirmar.',
      user,
    };
  }

  @Post('resend-verification')
  @Public()
  async resendVerificationEmail(
    @Body() dto: ResendEmailDto,
    @Req() req: ExpressRequest,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    await this.userService.resendVerificationEmail(dto.email, baseUrl);
    return {
      message:
        'E-mail de verificação reenviado. Verifique sua caixa de entrada (inclusive spam/lixo).',
    };
  }

  @Post('send-password-reset-email')
  @Public()
  async sendpasswordResetEmail(
    @Body() dto: ResendEmailDto,
    @Req() req: ExpressRequest,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    await this.userService.sendPasswordResetEmail(dto.email, baseUrl);
    return {
      message:
        'E-mail de mudança de senha enviado. Verifique sua caixa de entrada (inclusive spam/lixo).',
    };
  }

  @Post('me/address') //ok
  @UseGuards(JwtAuthGuard)
  async createMyAddress(@Req() req, @Body() dto: CreateUserAddressDto) {
    console.log('USER:', req.user);
    const userId = req.user.id;
    return this.userService.createAddressForUser(userId, dto);
  }

  @Post('shopper/:userId/address') //ok
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async createAddressForOther(
    @Req() req,
    @Param('userId') userId: string,
    @Body() dto: CreateUserAddressDto,
  ) {
    return this.userService.createAddressForUser(userId, dto);
  }

  @Get('clients-for-tab')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getClientsForTab(@Req() req) {
    return this.userService.findClientsForTab(req.user?.role, req.user?.id);
  }

  @Get('clients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getAllClients() {
    return this.userService.findAllClients();
  }
}
