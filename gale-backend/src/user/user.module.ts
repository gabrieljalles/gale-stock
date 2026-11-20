import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { MailService } from './mail.service';
import { AuthModule } from 'src/auth/auth.module';
import { SettingsModule } from 'src/settings/settings.module';
import { PointsModule } from 'src/points/points.module';

@Module({
  // SettingsModule entra pelo limite padrão de notinha. Sem ciclo:
  // Settings não conhece User.
  // PointsModule entra pelo link de indicacao: o cadastro precisa
  // traduzir o ?ref= em um padrinho. Sem ciclo: Points nao conhece User.
  imports: [forwardRef(() => AuthModule), SettingsModule, PointsModule],
  controllers: [UserController],
  providers: [UserRepository, UserService, MailService],
  exports: [UserService],
})
export class UserModule {}
