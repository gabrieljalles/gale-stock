/**
 * Configuração de fábrica do programa de pontos.
 *
 * Serve a três coisas ao mesmo tempo: semear a linha única de
 * PointsSettings, responder quando o banco ainda não tem nada gravado, e
 * alimentar o botão "Restaurar padrão" do painel. Por isso é uma constante
 * só — três cópias desses números divergiriam no primeiro ajuste.
 */
export const DEFAULT_POINTS_SETTINGS = {
  enabled: true,

  // Pontos por R$1 de PRODUTO, por forma de pagamento. Dinheiro paga
  // cheio; quanto mais cara a forma de recebimento pra loja, menos pontos.
  moneyRate: 1,
  pixRate: 0.99,
  creditRate: 0.95,
  debitRate: 0.95,

  // Notinha só pontua se for quitada dentro deste prazo.
  onTheBillGraceDays: 5,

  mlmEnabled: true,
  selfMultiplier: 1,
  level2Multiplier: 0.5,
  level3Multiplier: 0.25,
  level4Multiplier: 0.1,

  tiersEnabled: true,
  activeAffiliateWindowDays: 90,

  pointsPerReal: 100,
  minRedeemPoints: 100,
  maxRedeemPercent: 50,

  expirationDays: 365,
  inactivityDays: 90,

  maxCashbackPercent: 4,
} as const;

export const DEFAULT_POINTS_TIERS = [
  { level: 0, name: 'Recruta dos Cervejeiros', multiplier: 0.99, minActiveAffiliates: 0 },
  { level: 1, name: 'Aprendiz da Taberna', multiplier: 1, minActiveAffiliates: 1 },
  { level: 2, name: 'Sommelier de Lúpulo', multiplier: 1.2, minActiveAffiliates: 3 },
  { level: 3, name: 'Mestre Cervejeiro', multiplier: 1.4, minActiveAffiliates: 10 },
  { level: 4, name: 'Guardião do Barril', multiplier: 1.5, minActiveAffiliates: 20 },
  { level: 5, name: 'Barão do Malte', multiplier: 1.6, minActiveAffiliates: 30 },
  {
    level: 6,
    name: 'Comandante de uma Legião de Cervejeiros',
    multiplier: 2,
    minActiveAffiliates: 50,
  },
];

/**
 * Profundidade máxima da árvore de indicação que pontua.
 *
 * Quatro: o próprio comprador e três gerações acima. Abaixo disso não
 * pontua ninguém — é o que segura o custo do programa, porque cada nível
 * a mais multiplica a distribuição sobre a MESMA venda.
 */
export const MAX_POINTS_LEVELS = 4;
