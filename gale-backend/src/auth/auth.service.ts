import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {

    try{

      const user = await this.usersService.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const payload = { sub: user.id, email: user.email, role: user.accountType };
      console.log('User successfully logged.')
      return {
        access_token: this.jwtService.sign(payload),
      
    };

    }catch(err){
      console.error('Error logging or generating token:', err) 
    }
    
    
  }
}

