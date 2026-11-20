import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

// ---------- Configuração (Admin) ----------

export interface PointsSettings {
  enabled: boolean;
  moneyRate: number;
  pixRate: number;
  creditRate: number;
  debitRate: number;
  onTheBillGraceDays: number;
  mlmEnabled: boolean;
  selfMultiplier: number;
  level2Multiplier: number;
  level3Multiplier: number;
  level4Multiplier: number;
  tiersEnabled: boolean;
  activeAffiliateWindowDays: number;
  pointsPerReal: number;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  expirationDays: number;
  inactivityDays: number;
  maxCashbackPercent: number;
}

export interface PointsTier {
  level: number;
  name: string;
  multiplier: number;
  minActiveAffiliates: number;
}

/** O que a configuração atual PODE distribuir, contra o teto configurado. */
export interface PointsProjection {
  worstCasePercent: number;
  baseCasePercent: number;
  soloPercent: number;
  limitPercent: number;
  exceedsLimit: boolean;
}

export interface PointsConfig {
  settings: PointsSettings;
  tiers: PointsTier[];
  projection: PointsProjection;
}

export const getPointsConfig = async (): Promise<PointsConfig> => {
  const response = await requestWithAuth(() => api.get("/points/config"));
  return response.data;
};

export const updatePointsSettings = async (
  data: Partial<PointsSettings> & { acknowledgeCashbackRisk?: boolean },
): Promise<PointsConfig> => {
  const response = await requestWithAuth(() => api.patch("/points/config", data));
  return response.data;
};

export const updatePointsTiers = async (
  tiers: PointsTier[],
  acknowledgeCashbackRisk?: boolean,
): Promise<PointsConfig> => {
  const response = await requestWithAuth(() =>
    api.put("/points/tiers", { tiers, acknowledgeCashbackRisk }),
  );
  return response.data;
};

export const resetPointsConfig = async (): Promise<PointsConfig> => {
  const response = await requestWithAuth(() => api.post("/points/config/reset"));
  return response.data;
};

// ---------- Resumo de saúde (Admin) ----------

export interface PointsSummary {
  periodDays: number;
  from: string;
  to: string;
  limitPercent: number;
  pointsPerReal: number;

  productRevenue: number;
  grossProductRevenue: number;

  pointsIssued: number;
  pointsIssuedValue: number;
  distributionPercent: number;
  pointsRedeemed: number;
  pointsRedeemedValue: number;
  redeemedPercent: number;

  pointsExpired: number;
  pointsLostToInactivity: number;
  pointsReversed: number;

  outstandingPoints: number;
  outstandingValue: number;
  expiringIn30DaysPoints: number;

  holders: number;
  referredUsers: number;
  sponsorsWithActiveNetwork: number;
  tierHistogram: (PointsTier & { sponsors: number })[];
  byLevel: { level: number; points: number; entries: number }[];

  projection: PointsProjection;
  overLimit: boolean;
}

export const getPointsSummary = async (days: number): Promise<PointsSummary> => {
  const response = await requestWithAuth(() =>
    api.get("/points/summary", { params: { days } }),
  );
  return response.data;
};

// ---------- Regras públicas ----------

export interface PointsPublicRules {
  enabled: boolean;
  rates: { Money: number; Pix: number; CreditCard: number; DebitCard: number };
  mlmEnabled: boolean;
  levels: { level: number; label: string; multiplier: number }[];
  tiersEnabled: boolean;
  tiers: PointsTier[];
  activeAffiliateWindowDays: number;
  pointsPerReal: number;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  expirationDays: number;
  inactivityDays: number;
}

/** Sem token de propósito: a página de regras abre pra quem não tem conta. */
export const getPointsRules = async (): Promise<PointsPublicRules> => {
  const response = await api.get("/points/rules");
  return response.data;
};

export const describeReferralCode = async (
  code: string,
): Promise<{ firstName: string } | null> => {
  const response = await api.get(`/points/referral/${encodeURIComponent(code)}`);
  return response.data || null;
};

// ---------- Cliente ----------

export interface MyPointsSummary {
  enabled: boolean;
  balance: number;
  balanceExact: number;
  balanceInReais: number;
  pointsPerReal: number;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  expirationDays: number;
  inactivityDays: number;
  activeAffiliateWindowDays: number;
  lastPurchaseAt: string | null;
  tier: (PointsTier & { activeAffiliates: number }) | null;
  nextTier: (PointsTier & { missing: number }) | null;
  affiliates: { active: number; total: number };
  referralCode: string | null;
}

export type PointsEntryType =
  | "Earn"
  | "Redeem"
  | "Expire"
  | "InactivityReset"
  | "Reversal";

export interface PointsEntry {
  id: string;
  type: PointsEntryType;
  amount: number;
  remaining: number;
  expiresAt: string | null;
  /** 1 = a própria compra; 2, 3, 4 = níveis da rede. Nunca identifica quem comprou. */
  sourceLevel: number | null;
  basisAmount: number | null;
  tierLevel: number | null;
  tierMultiplier: number | null;
  levelMultiplier: number | null;
  description: string | null;
  createdAt: string;
}

export const getMyPoints = async (): Promise<MyPointsSummary> => {
  const response = await requestWithAuth(() => api.get("/points/me"));
  return response.data;
};

export const getMyPointsStatement = async (
  limit = 50,
): Promise<PointsEntry[]> => {
  const response = await requestWithAuth(() =>
    api.get("/points/me/statement", { params: { limit } }),
  );
  return response.data;
};

export const createMyReferralCode = async (): Promise<string> => {
  const response = await requestWithAuth(() =>
    api.post("/points/me/referral-code"),
  );
  return response.data.referralCode;
};

// ---------- Simulação do checkout ----------

export interface PointsQuote {
  enabled: boolean;
  pointsPerReal: number;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  balance: number;
  maxRedeemablePoints: number;
  redeemPoints: number;
  redeemDiscount: number;
  basis: number;
  rate: number;
  pointsToEarn: number;
  tier: (PointsTier & { activeAffiliates: number }) | null;
  network: { level: number; multiplier: number }[];
  expirationDays: number;
}

export const quotePoints = async (params: {
  productTotal: number;
  transactionType?: string;
  pointsToRedeem?: number;
}): Promise<PointsQuote> => {
  const response = await requestWithAuth(() => api.post("/points/me/quote", params));
  return response.data;
};

// ---------- Formatação ----------

/** Pontos sempre inteiros pra quem lê: casa decimal em ponto não ajuda a decidir nada. */
export const formatPoints = (value: number): string =>
  Math.floor(value).toLocaleString("pt-BR");

export const POINTS_ENTRY_LABELS: Record<PointsEntryType, string> = {
  Earn: "Pontos ganhos",
  Redeem: "Pontos usados",
  Expire: "Pontos vencidos",
  InactivityReset: "Pontos perdidos por inatividade",
  Reversal: "Pontos estornados",
};

/**
 * Texto do extrato do cliente.
 *
 * Nunca nomeia quem comprou — só o nível da rede. É o recorte que permite
 * mostrar a origem do ponto sem expor a carteira de clientes de ninguém.
 */
export const describeEntry = (entry: PointsEntry): string => {
  if (entry.type !== "Earn") {
    return entry.description ?? POINTS_ENTRY_LABELS[entry.type];
  }
  if (entry.sourceLevel === null) return entry.description ?? "Pontos ganhos";
  if (entry.sourceLevel === 1) return "Sua compra gerou pontos";
  return `Um usuário de nível ${entry.sourceLevel} da sua rede comprou produtos e te gerou pontos`;
};
