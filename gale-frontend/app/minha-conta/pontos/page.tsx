"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Copy,
  HelpCircle,
  Loader2,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "@/_store/auth/AuthContext";
import { Button } from "@/_components/ui/button";
import {
  createMyReferralCode,
  describeEntry,
  formatPoints,
  getMyPoints,
  getMyPointsStatement,
  MyPointsSummary,
  PointsEntry,
} from "@/api/points";
import { formatCurrency } from "@/_utils/formatCurrency";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** Verde para o que entra, vermelho para o que sai: a leitura tem que ser instantânea. */
const toneOf = (entry: PointsEntry) =>
  entry.amount >= 0 ? "text-emerald-600" : "text-red-600";

const MyPointsPage = () => {
  const { user, isLoading } = useContext(AuthContext);
  const router = useRouter();

  const [summary, setSummary] = useState<MyPointsSummary | null>(null);
  const [entries, setEntries] = useState<PointsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/minha-conta/pontos");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getMyPoints(), getMyPointsStatement(50)])
      .then(([mySummary, myEntries]) => {
        setSummary(mySummary);
        setEntries(myEntries);
      })
      .catch(() => toast.error("Erro ao carregar seus pontos."))
      .finally(() => setLoading(false));
  }, [user]);

  // Montado no navegador porque depende do domínio em que a loja está
  // aberta — o mesmo código funciona em produção e na rede local.
  const referralLink = summary?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${summary.referralCode}`
    : null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const code = await createMyReferralCode();
      setSummary((current) => (current ? { ...current, referralCode: code } : current));
    } catch {
      toast.error("Não foi possível gerar seu link agora.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  if (isLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à loja
        </Link>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Meus pontos</h1>
          <Link
            href="/pontos"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 underline hover:text-amber-600"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Como funciona
          </Link>
        </div>

        {/* ---------- Saldo ---------- */}
        <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-50">
            <Sparkles className="h-3.5 w-3.5" />
            Saldo disponível
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {formatPoints(summary.balance)}
            <span className="ml-2 text-base font-normal text-amber-100">
              pontos
            </span>
          </p>
          <p className="mt-1 text-sm text-amber-50">
            Valem {formatCurrency(summary.balanceInReais)} de desconto
          </p>

          {summary.balance < summary.minRedeemPoints && (
            <p className="mt-3 rounded-md bg-white/15 p-2 text-xs">
              Faltam <strong>{formatPoints(summary.minRedeemPoints - summary.balance)}</strong>{" "}
              pontos para você poder usar no checkout (mínimo{" "}
              {summary.minRedeemPoints}).
            </p>
          )}
        </div>

        {/* ---------- Tier ---------- */}
        {summary.tier && (
          <div className="mb-4 rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Seu nível
                </p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">
                  {summary.tier.name}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-lg font-bold text-amber-700">
                {summary.tier.multiplier.toLocaleString("pt-BR")}x
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Users className="h-4 w-4" />
                <strong className="text-gray-900">
                  {summary.affiliates.active}
                </strong>{" "}
                amigos ativos
              </span>
              <span className="text-xs text-gray-400">
                de {summary.affiliates.total} indicados
              </span>
            </div>

            {summary.nextTier && (
              <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                Faltam <strong>{summary.nextTier.missing}</strong> amigos
                ativos para virar{" "}
                <strong>{summary.nextTier.name}</strong> e pontuar{" "}
                <strong>
                  {summary.nextTier.multiplier.toLocaleString("pt-BR")}x
                </strong>
                .
              </p>
            )}

            <p className="mt-2 text-[11px] text-gray-400">
              Amigo ativo é quem você indicou e comprou nos últimos{" "}
              {summary.activeAffiliateWindowDays} dias.
            </p>
          </div>
        )}

        {/* ---------- Link de convite ---------- */}
        <div className="mb-4 rounded-xl border bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Share2 className="h-4 w-4" />
            Seu link de convite
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Quem se cadastrar por esse link entra na sua rede. Quando essa
            pessoa comprar, você também ganha pontos.
          </p>

          {referralLink ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={referralLink}
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-md border bg-gray-50 px-3 py-2 text-xs text-gray-700"
              />
              <Button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 gap-1.5"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="mt-3 gap-2"
            >
              {generating && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerar meu link
            </Button>
          )}
        </div>

        {/* ---------- Extrato ---------- */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <TrendingUp className="h-4 w-4" />
            Últimas movimentações
          </h2>

          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Você ainda não tem movimentações. Faça uma compra para começar a
              acumular.
            </p>
          ) : (
            <ul className="mt-3 divide-y">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    {/* O extrato nunca diz QUEM comprou — só o nível da
                        rede. É o que permite mostrar a origem do ponto sem
                        expor os outros clientes. */}
                    <p className="text-sm text-gray-800">
                      {describeEntry(entry)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDate(entry.createdAt)}
                      {entry.expiresAt && entry.remaining > 0 && (
                        <> · vence em {formatDate(entry.expiresAt)}</>
                      )}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-sm font-bold tabular-nums ${toneOf(entry)}`}
                  >
                    {entry.amount >= 0 ? "+" : "−"}
                    {formatPoints(Math.abs(entry.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Seus pontos valem por {summary.expirationDays} dias e são zerados
          após {summary.inactivityDays} dias sem nenhuma compra.{" "}
          <Link href="/pontos" className="underline">
            Ver todas as regras
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default MyPointsPage;
