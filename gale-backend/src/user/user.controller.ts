import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
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
import { PromoteUserDto } from './dto/promote-user.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateOnTheBillDto } from './dto/on-the-bill.dto';
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Req() req) {
    return this.userService.findMyProfile(req.user.id);
  }

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  async updateMyAvatar(@Req() req, @Body() dto: UpdateAvatarDto) {
    return this.userService.updateMyAvatar(req.user.id, dto.avatarUrl ?? null);
  }

  @Get('me/addresses')
  @UseGuards(JwtAuthGuard)
  async getMyAddresses(@Req() req) {
    return this.userService.findMyAddresses(req.user.id);
  }

  @Delete('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  async deleteMyAddress(@Req() req, @Param('id') id: string) {
    return this.userService.deleteMyAddress(req.user.id, id);
  }

  @Patch('me/addresses/:id/primary')
  @UseGuards(JwtAuthGuard)
  async setMyPrimaryAddress(@Req() req, @Param('id') id: string) {
    return this.userService.setMyPrimaryAddress(req.user.id, id);
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

  @Get('delivery-men')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getAllDeliveryMen() {
    return this.userService.findAllDeliveryMen();
  }

  @Get('admin-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getAllUsersWithStats() {
    return this.userService.findAllUsersWithStats();
  }

  // Endereços salvos de um cliente, pra "Nova Venda" oferecer no delivery.
  @Get(':id/addresses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async getClientAddresses(@Param('id') id: string) {
    return this.userService.findAddressesOfClient(id);
  }

  // Situação de crédito de um cliente: se pode, quanto pode e quanto já
  // deve. O Admin precisa do "quanto já deve" pra decidir o limite.
  @Get(':id/on-the-bill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getOnTheBill(@Param('id') id: string) {
    return this.userService.getOnTheBillCredit(id);
  }

  // Autorização de notinha e limite individual. Só Admin: é decisão de
  // crédito, não de operação.
  @Patch(':id/on-the-bill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateOnTheBill(
    @Param('id') id: string,
    @Body() dto: UpdateOnTheBillDto,
  ) {
    return this.userService.updateOnTheBillAccess(
      id,
      dto.canPayOnTheBill,
      dto.onTheBillLimit ?? null,
    );
  }

  @Patch(':id/account-type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async promoteUser(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: PromoteUserDto,
  ) {
    return this.userService.promoteUser(
      id,
      dto.accountType,
      req.user.id,
      dto.password,
    );
  }
}
