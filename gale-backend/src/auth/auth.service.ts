import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const user = await this.userService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (!user.verifiedEmail) {
        throw new ForbiddenException('E-mail não verificado');
      }

      const payload = {
        sub: user.id,
        name: user.fullName,
        email: user.email,
        role: user.accountType,
      };
      console.log('User successfully logged.');
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (err) {
      console.error('Error logging or generating token:', err);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = this.jwtService.verify<{ sub: string; type: string }>(
      token,
    );
    if (payload.type !== 'email_password_changer') {
      throw new BadRequestException('Token inválido para reset de senha');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userService.updatePassword(payload.sub, hashed);
  }
  //Quando o usuário verifica o EMAIL
  async verifyEmail(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify<{ sub: string; type: string }>(
        token,
        { secret: process.env.JWT_SECRET },
      );

      if (payload.type !== 'email_verification') return false;

      const userId = payload.sub;
      await this.userService.verifyEmailUser(userId);

      return true;
    } catch {
      return false;
    }
  }
}
