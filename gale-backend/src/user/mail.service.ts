import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
    baseURL: string,
  ) {
    const confirmationUrl = `${baseURL}/auth/verify?token=${token}`;
    const firstName = name.trim().split(' ')[0] || '';

    await this.mailer.sendMail({
      to: email,
      subject: '🍺 VERIFIQUE SEU E-MAIL 🍺',
      template: 'verification',
      context: {
        title: 'Confirmação de E-mail',
        name: firstName,
        siteUrl: process.env.FRONT_URL_SITE,
        privacyUrl: `${process.env.FRONT_URL_SITE}/privacy-policies`,
        termsUrl: `${process.env.FRONT_URL_SITE}/terms-of-use`,
        confirmationUrl,
      },
      attachments: [
        {
          filename: 'logo.png',
          path: 'https://bfu8xmr6kg.ufs.sh/f/oK9fzCAtRnIfdQ5CN4bEujybQ21NSRmzkHaYXGxBfdOre5Ag',
          cid: 'logo@galedelivery', // este mesmo valor irá no src do <img>
        },
      ],
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
    baseURL: string,
  ) {
    const resetUrl = `${process.env.FRONT_URL_SITE}/login/reset-password?token=${token}`;
    const firstName = name.trim().split(' ')[0] || '';

    await this.mailer.sendMail({
      to: email,
      subject: '🔐 ALTERAÇÃO DE SENHA 🔐',
      template: 'passwordchanger',
      context: {
        title: 'Alteração de senha',
        name: firstName,
        siteUrl: process.env.FRONT_URL_SITE,
        privacyUrl: `${process.env.FRONT_URL_SITE}/privacy-policies`,
        termsUrl: `${process.env.FRONT_URL_SITE}/terms-of-use`,
        resetUrl,
      },
      attachments: [
        {
          filename: 'logo.png',
          path: 'https://bfu8xmr6kg.ufs.sh/f/oK9fzCAtRnIfdQ5CN4bEujybQ21NSRmzkHaYXGxBfdOre5Ag',
          cid: 'logo@galedelivery', // este mesmo valor irá no src do <img>
        },
      ],
    });
  }
}
