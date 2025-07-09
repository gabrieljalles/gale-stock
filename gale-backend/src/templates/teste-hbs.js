const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// 1) Carrega o template
const source = fs.readFileSync(
  path.join(__dirname, 'verification.hbs'),
  'utf8',
);
const template = Handlebars.compile(source);

// 2) Prepara dados de exemplo
const data = {
  title: '🍺 Confirmação de E-mail - Galé 🍺',
  user: { name: 'Gabriel' },
  confirmationUrl: 'https://meusite.com/confirm?token=abc123',
  buttonText: 'Confirmar e-mail',
  siteUrl: 'https://meusite.com',
  privacyUrl: 'https://meusite.com/privacy',
  termsUrl: 'https://meusite.com/terms',
};

// 3) Gera o HTML final
const result = template(data);

// 4) Salva para preview
fs.writeFileSync(path.join(__dirname, 'preview.html'), result);
console.log('Preview gerado em preview.html');
