import { Body, Controller, Get, Post, UseGuards, Request, Param, Req } from "@nestjs/common";
import { CreateUserAddressDto, CreateUserDto } from "./dto/create-user.dto";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { Roles } from "src/auth/roles.decorator";
import { Public } from 'src/auth/public.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')//ok
  @Public()
  async createUser(@Body() dto: CreateUserDto) {
    
    return await this.userService.register(dto);
  }

  @Post('me/address') //ok
  @UseGuards(JwtAuthGuard)
  async createMyAddress(
    @Req() req,
    @Body() dto: CreateUserAddressDto,
  ){
    console.log('USER:', req.user);
    const userId = req.user.id;
    return this.userService.createAddressForUser(userId,dto);
  }

  @Post('shopper/:userId/address') //ok
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Shopper')
  async createAddressForOther(
    @Req() req,
    @Param('userId') userId: string,
    @Body() dto: CreateUserAddressDto,
  ){
    return this.userService.createAddressForUser(userId,dto);
  }

  
}