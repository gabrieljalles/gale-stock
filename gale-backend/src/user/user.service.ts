import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { CreateUserAddressDto, CreateUserDto } from './dto/create-user.dto';
import { AccountType, User, UserAddress } from '@prisma/client';
import { create } from 'domain';
import { legalAge } from 'src/utils/legal-age.utils';
import { isValidCpfCNPJ } from 'src/utils/validate-cpf-cnpj.utils';
import { MailService } from './mail.service';
import { JwtService } from '@nestjs/jwt';
import { SettingsService } from 'src/settings/settings.service';
import { PointsService } from 'src/points/points.service';
import { userInfo } from 'os';

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    // Traz o limite padrão de notinha da loja, usado por quem não tem
    // limite próprio.
    private readonly settingsService: SettingsService,
    // Traduz o código do link de indicação no padrinho do novo cadastro.
    private readonly pointsService: PointsService,
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

    // O formulário já barra CPF/CNPJ inválido, mas isso protege só quem
    // passa pela tela — quem chama a API direto contornaria a checagem.
    // O dígito verificador é a única confirmação possível sem consultar a
    // Receita: não prova que o documento é da pessoa, mas fecha a porta
    // mais barata de criação de contas em massa (indicando a si mesmas
    // com números inventados) para inflar o tier de afiliados.
    if (!isValidCpfCNPJ(createUserDto.cpfCNPJ)) {
      throw new BadRequestException('CPF/CNPJ inválido.');
    }

    // O vínculo de indicação é gravado no cadastro e nunca mais muda: é
    // ele que define quem recebe pontos da rede, e deixá-lo editável
    // depois abriria espaço pra remanejar comissão de compras passadas.
    const { referralCode, ...userData } = createUserDto;
    const referredById = await this.pointsService.resolveReferralCode(referralCode);

    const user = await this.repository.runInTransaction(async (tx) => {
      return this.repository.createUser(
        {
          ...userData,
          password: hashedPassword,
          referredById,
          referredAt: referredById ? new Date() : null,
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

  // Teto de endereços salvos por conta. Quem precisar entregar em outro
  // lugar digita o endereço na hora do pedido (ele vale só pra aquele
  // pedido e não ocupa espaço na conta).
  private static readonly MAX_ADDRESSES_PER_USER = 3;

  async createAddressForUser(userId: string, dto: CreateUserAddressDto) {
    await this.findUserById(userId);

    // Validado aqui, e não só na tela: a regra tem que valer pra qualquer
    // caminho que chegue até este método.
    const existing = await this.repository.findAddressesByUserId(userId);
    if (existing.length >= UserService.MAX_ADDRESSES_PER_USER) {
      throw new BadRequestException(
        `Você pode salvar no máximo ${UserService.MAX_ADDRESSES_PER_USER} endereços. ` +
          'Remova um antes de adicionar outro, ou informe o endereço na hora do pedido.',
      );
    }

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

  // Todos os clientes cadastrados, pra vincular a um pedido (ex: delivery)
  // sem a restrição de canPayOnTheBill — essa regra é só pra notinha.
  async findAllClients() {
    return this.repository.findManyClients(false);
  }

  // Clientes elegíveis pra receber notinha. Admin vê todo mundo (pode dar
  // notinha pra quem quiser); os demais só veem quem já é autorizado
  // (canPayOnTheBill) — a mesma regra é reforçada no lado do pedido.
  // Quem está fazendo a venda também aparece na lista (pra poder se
  // escolher), mesmo não sendo uma conta "Client" — a autorização de
  // canPayOnTheBill continua valendo normalmente pra essa própria conta.
  async findClientsForTab(requesterRole?: string, requesterId?: string) {
    const clients = await this.repository.findManyClients(
      requesterRole !== 'Admin',
    );

    if (requesterId && !clients.some((c) => c.id === requesterId)) {
      const self = await this.repository.findById(requesterId);
      if (self) {
        clients.push({
          id: self.id,
          fullName: `${self.fullName} (você)`,
          canPayOnTheBill: self.canPayOnTheBill,
        });
      }
    }

    return clients.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  // Motoboys cadastrados, pra atribuir a um pedido no Kanban de entregas.
  async findAllDeliveryMen() {
    return this.repository.findManyDeliveryMen();
  }

  // Perfil do próprio usuário logado, sem a senha. O canPayOnTheBill é o
  // que a vitrine usa pra decidir se mostra "Notinha" no checkout.
  async findMyProfile(userId: string) {
    const user = await this.findUserById(userId);
    const { password, ...profile } = user;

    // A vitrine precisa de tres numeros pra decidir sobre a notinha:
    // se pode, quanto pode e quanto ja deve. Com eles o checkout esconde
    // a opcao quando o carrinho nao cabe mais no limite.
    const credit = await this.getOnTheBillCredit(userId);

    return { ...profile, ...credit };
  }

  /**
   * Situacao de credito do cliente na notinha.
   *
   * O limite individual (User.onTheBillLimit) vence o padrao da loja
   * quando existe. Nulo cai no padrao de propósito: subir o padrao passa
   * a valer pra todo mundo que nunca foi ajustado a mao.
   */
  async getOnTheBillCredit(userId: string) {
    const user = await this.findUserById(userId);
    const settings = await this.settingsService.getSettings();

    const limit =
      user.onTheBillLimit != null
        ? Number(user.onTheBillLimit)
        : Number(settings.defaultOnTheBillLimit);

    const used = await this.repository.sumOpenOnTheBill(userId);

    return {
      canPayOnTheBill: user.canPayOnTheBill,
      onTheBillLimit: limit,
      onTheBillUsed: used,
      onTheBillAvailable: Math.max(limit - used, 0),
      /** Limite proprio ou herdado da loja - a tela do Admin mostra isso. */
      hasCustomLimit: user.onTheBillLimit != null,
    };
  }

  /**
   * Barra a notinha quando o valor nao cabe mais no limite.
   *
   * Chamada no momento do pedido: e o unico ponto que enxerga o total
   * final, ja com frete.
   */
  async assertOnTheBillWithinLimit(userId: string, orderTotal: number) {
    const { onTheBillLimit, onTheBillUsed } =
      await this.getOnTheBillCredit(userId);

    if (onTheBillUsed + orderTotal > onTheBillLimit) {
      const available = Math.max(onTheBillLimit - onTheBillUsed, 0);
      throw new ForbiddenException(
        `Limite de notinha atingido. Disponivel: R$ ${available.toFixed(2)}. ` +
          `Escolha outra forma de pagamento ou quite a conta.`,
      );
    }
  }

  /** Admin liberando (ou cortando) a notinha de um cliente. */
  async updateOnTheBillAccess(
    id: string,
    canPayOnTheBill: boolean,
    onTheBillLimit: number | null,
  ) {
    await this.findUserById(id);
    await this.repository.updateOnTheBillAccess(
      id,
      canPayOnTheBill,
      onTheBillLimit,
    );
    return this.getOnTheBillCredit(id);
  }

  async updateMyAvatar(userId: string, avatarUrl: string | null) {
    await this.findUserById(userId);
    const updated = await this.repository.updateAvatarUrl(userId, avatarUrl);
    const { password, ...profile } = updated;
    return profile;
  }

  async findMyAddresses(userId: string) {
    return this.repository.findAddressesByUserId(userId);
  }

  // Endereços de um cliente, pro balcão montar uma venda de delivery sem
  // redigitar o que a pessoa já cadastrou. Rota restrita a quem vende.
  async findAddressesOfClient(clientId: string) {
    await this.findUserById(clientId);
    return this.repository.findAddressesByUserId(clientId);
  }

  // Toda operação em endereço confere o dono antes: sem isso, qualquer
  // cliente logado apagaria o endereço de outro só chutando o id.
  private async ensureOwnAddress(userId: string, addressId: string) {
    const address = await this.repository.findUserAddress(addressId);
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Endereço não encontrado.');
    }
    return address;
  }

  async deleteMyAddress(userId: string, addressId: string) {
    await this.ensureOwnAddress(userId, addressId);
    await this.repository.deleteUserAddress(addressId);
    return { deleted: true };
  }

  async setMyPrimaryAddress(userId: string, addressId: string) {
    await this.ensureOwnAddress(userId, addressId);
    await this.repository.setPrimaryAddress(userId, addressId);
    return { updated: true };
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

    // Admin também pode assumir uma entrega (ex: quando não tem motoboy
    // disponível), além de contas do tipo Motoboy.
    if (
      user.accountType !== AccountType.DeliveryMan &&
      user.accountType !== AccountType.Admin
    ) {
      throw new BadRequestException(
        `O usuário escolhido para ser motoboy não é do tipo Motoboy nem Administrador.`,
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

  // Lista pra aba Usuários: dados pessoais, endereços, faturamento total
  // (só pedidos pagos) e o produto que mais pede (por quantidade, em
  // qualquer pedido — reflete preferência, não faturamento).
  async findAllUsersWithStats() {
    const users = await this.repository.findAllWithOrders();

    return users.map((user) => {
      const { password, clientOrders, ...rest } = user;

      let totalRevenue = 0;
      const productQuantities = new Map<string, number>();

      for (const order of clientOrders) {
        totalRevenue += (order.orderTransaction ?? []).reduce(
          (sum, tx) => sum + (tx.isPaid ? Number(tx.totalPrice) : 0),
          0,
        );

        for (const detail of order.orderDetails ?? []) {
          productQuantities.set(
            detail.productName,
            (productQuantities.get(detail.productName) ?? 0) +
              detail.quantity,
          );
        }
      }

      let favoriteProduct: string | null = null;
      let favoriteProductQuantity = 0;
      for (const [name, quantity] of productQuantities) {
        if (quantity > favoriteProductQuantity) {
          favoriteProductQuantity = quantity;
          favoriteProduct = name;
        }
      }

      return {
        ...rest,
        orderCount: clientOrders.length,
        totalRevenue,
        favoriteProduct,
        favoriteProductQuantity,
      };
    });
  }

  // Promove/rebaixa a categoria de um usuário. Exige a senha de quem está
  // fazendo a mudança (o Admin logado), não a do usuário afetado.
  async promoteUser(
    targetUserId: string,
    accountType: AccountType,
    requesterId: string,
    requesterPassword: string,
  ) {
    const requester = await this.repository.findById(requesterId);
    if (
      !requester ||
      !(await bcrypt.compare(requesterPassword, requester.password))
    ) {
      throw new UnauthorizedException('Senha incorreta.');
    }

    await this.findUserById(targetUserId);
    return this.repository.updateAccountType(targetUserId, accountType);
  }
}
