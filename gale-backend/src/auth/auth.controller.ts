import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Public } from './public.decorator';
import { IsString, MinLength } from 'class-validator';

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get('verify')
  @Redirect(`${process.env.FRONT_URL_SITE}/login?verified=1`, 302)
  async verifyEmail(@Query('token') token: string) {
    const success = await this.authService.verifyEmail(token);

    if (!success) {
      throw new BadRequestException('Token inválido ou expirado.');
    }
  }

  @Post('reset-password')
  @Public()
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetDto.token, resetDto.newPassword);
    return { message: 'Senha definida com sucesso!' };
  }
}
