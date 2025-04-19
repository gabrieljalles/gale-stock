import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto);
  }

  @Get('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  testRoute(@Req() req) {
    return {
      message: 'Você é um ADMIN e acessou a rota!',
      user: req.user, // mostra o conteúdo do token
    };
  }
}
