import { Body, Controller, Get, Post, UseGuards, Request } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserService } from "./user.service";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.register(dto);
  }
}