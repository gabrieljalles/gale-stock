"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Banknote,
  CalendarClock,
  CreditCard,
  Gift,
  Loader2,
  QrCode,
  Share2,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { getPointsRules, PointsPublicRules } from "@/api/points";
import { formatCurrency } from "@/_utils/formatCurrency";

/** Número que o cliente precisa enxergar de longe. Cor é o que separa regra de detalhe. */
const Highlight = ({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "danger" | "success";
}) => (
  <strong
    className={
      tone === "danger"
        ? "text-red-600"
        : tone === "success"
          ? "text-emerald-600"
          : "text-amber-600"
    }
  >
    {children}
  </strong>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-xl border bg-white p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({
  step,
  icon,
  title,
  subtitle,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div className="mb-4 flex items-start gap-3">
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
      {icon}
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
        {step}
      </p>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  </div>
);

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  Money: <Banknote className="h-5 w-5" />,
  Pix: <QrCode className="h-5 w-5" />,
  DebitCard: <CreditCard className="h-5 w-5" />,
  CreditCard: <CreditCard className="h-5 w-5" />,
};

const PAYMENT_LABELS: Record<string, string> = {
  Money: "Dinheiro",
  Pix: "Pix",
  DebitCard: "Cartão de débito",
  CreditCard: "Cartão de crédito",
};

/**
 * A corrente de indicações do exemplo, de quem começou até a ponta.
 *
 * Tem cinco pessoas de propósito: com quatro, o limite da rede nunca
 * apareceria — é justamente a quinta que fica de fora.
 */
const CHAIN = ["Você", "Bruno", "Carla", "Diego", "Eduarda"];

/**
 * Pontos do exemplo, COM casa decimal.
 *
 * Aqui não vale o arredondamento do saldo: metade de 99 é 49,5, e
 * mostrar "49" faria a conta da página parecer errada justo onde ela
 * está sendo ensinada.
 */
const pts = (value: number) => value.toLocaleString("pt-BR");

// Os mesmos meios, escritos pra caber no meio de uma frase. Baixar a
// caixa do rótulo automaticamente estragaria "Pix", que é nome próprio.
const PAYMENT_IN_SENTENCE: Record<string, string> = {
  Money: "dinheiro",
  Pix: "Pix",
  DebitCard: "cartão de débito",
  CreditCard: "cartão de crédito",
};

/**
 * Página pública das regras de pontos.
 *
 * Aberta sem login de propósito: quem ainda não tem conta precisa entender
 * o programa antes de criar uma. Todos os números vêm da configuração
 * vigente no servidor — a página nunca repete um valor escrito à mão, para
 * que o que está aqui seja exatamente o que o sistema aplica.
 */
const PointsRulesPage = () => {
  const [rules, setRules] = useState<PointsPublicRules | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPointsRules()
      .then(setRules)
      .catch(() => setRules(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!rules) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-gray-600">
          Não foi possível carregar as regras do programa agora.
        </p>
        <Link href="/" className="text-sm font-medium text-amber-600 underline">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const realPerHundred = 100 / rules.pointsPerReal;

  // A taxa varia por forma de pagamento. O cartão do topo mostra a MELHOR
  // delas e diz qual é — "até 1" sozinho não significava nada pra quem lê,
  // e a grade logo abaixo detalha as outras.
  const bestRate = Math.max(...Object.values(rules.rates));
  const bestMethod =
    (Object.keys(rules.rates) as (keyof typeof rules.rates)[]).find(
      (method) => rules.rates[method] === bestRate,
    ) ?? "Money";
  const orderedTiers = [...rules.tiers].sort(
    (a, b) => a.minActiveAffiliates - b.minActiveAffiliates,
  );

  // Base do exemplo da rede: R$ 100 no Pix. Sai da configuração vigente, e
  // não de números escritos à mão, pra explicação nunca divergir do que o
  // sistema realmente paga.
  const pixBase = 100 * rules.rates.Pix;
  /** Multiplicador de quem está a `distance` indicações de quem comprou. */
  const networkRate = (distance: number) =>
    rules.levels[distance]?.multiplier ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-16">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center gap-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-amber-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Image
              src="/light-logo-noname.png"
              alt="Galé"
              width={30}
              height={30}
            />
            <span className="font-bold text-primary">Galé</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
        {!rules.enabled && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            <strong>O programa de pontos está temporariamente pausado.</strong>{" "}
            As regras abaixo continuam valendo para os saldos já existentes,
            mas novas compras não estão gerando pontos no momento.
          </div>
        )}

        {/* ---------- Abertura ---------- */}
        <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            Programa de pontos Galé
          </span>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Compre, acumule e pague menos na próxima
          </h1>
          <p className="mt-3 text-gray-600">
            Cada real que você <Highlight>paga de verdade</Highlight> em
            produtos vira ponto. Junte pontos e use como desconto na sua
            próxima compra.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-amber-50 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">
                {bestRate.toLocaleString("pt-BR")}{" "}
                {bestRate === 1 ? "ponto" : "pontos"}
              </p>
              <p className="text-xs text-gray-600">
                a cada {formatCurrency(1)} gasto em produtos
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                pagando em {PAYMENT_IN_SENTENCE[bestMethod]}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {rules.pointsPerReal} pontos
              </p>
              <p className="text-xs text-gray-600">
                viram {formatCurrency(1)} de desconto
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {rules.maxRedeemPercent}%
              </p>
              <p className="text-xs text-gray-600">
                é o máximo que os pontos abatem por compra
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Como ganhar ---------- */}
        <Card>
          <SectionTitle
            step="Passo 1"
            icon={<TrendingUp className="h-5 w-5" />}
            title="Como você ganha pontos"
            subtitle="Depende da forma de pagamento — e só conta o que você realmente pagou."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["Money", "Pix", "DebitCard", "CreditCard"] as const).map(
              (method) => (
                <div
                  key={method}
                  className="rounded-xl border bg-gray-50 p-4 text-center"
                >
                  <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
                    {PAYMENT_ICONS[method]}
                  </span>
                  <p className="text-sm font-medium text-gray-700">
                    {PAYMENT_LABELS[method]}
                  </p>
                  <p className="mt-1 text-xl font-bold text-amber-600">
                    {rules.rates[method].toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    ponto por R$ 1,00
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-start gap-2 text-sm text-red-800">
              <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                <strong>Não geram pontos:</strong> o valor do{" "}
                <Highlight tone="danger">frete</Highlight>. Os pontos são
                calculados{" "}
                <strong>apenas sobre o valor dos produtos</strong>.
              </span>
            </p>
          </div>

          {/* A notinha NÃO é explicada aqui de propósito: comprar fiado é
              liberado individualmente, e esta página é pública. Quem tem o
              benefício vê a regra no checkout, onde a opção aparece. */}

          <p className="mt-3 text-xs text-gray-500">
            Só clientes cadastrados acumulam pontos. Uma compra sem conta não
            gera saldo para ninguém.
          </p>
        </Card>

        {/* ---------- Rede de indicações ---------- */}
        {rules.mlmEnabled && (
          <Card>
            <SectionTitle
              step="Passo 2"
              icon={<Share2 className="h-5 w-5" />}
              title="Convide e ganhe com a sua rede"
              subtitle="Compartilhe seu link de convite. Quando quem você indicou compra, você também pontua."
            />

            {/* O diagrama é o coração da explicação: sem ele, "0,5x do
                nível 2" não significa nada pra quem está lendo. */}
            <div className="space-y-2">
              {rules.levels.map((level, index) => {
                const width = 100 - index * 14;
                return (
                  <div key={level.level} className="flex items-center gap-3">
                    <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-600">
                      Nível {level.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Fundo e cor do texto andam juntos na MESMA
                          condicional. Deixar `text-white` na base e tentar
                          sobrescrever num ramo não funciona: as duas são
                          utilitárias `text-*` de igual especificidade, e
                          quem vence é a ordem do CSS gerado, não a do
                          atributo — o nível mais claro saía branco. */}
                      <div
                        className={`flex h-11 items-center justify-between rounded-lg px-3 transition-all ${
                          index === 0
                            ? "bg-amber-500 text-white"
                            : index === 1
                              ? "bg-amber-400 text-white"
                              : index === 2
                                ? "bg-amber-300 text-white"
                                : "bg-amber-200 text-gray-900"
                        }`}
                        style={{ width: `${width}%` }}
                      >
                        <span className="truncate text-xs font-medium">
                          {level.label}
                        </span>
                        <span className="ml-2 flex-shrink-0 text-sm font-bold">
                          {level.multiplier.toLocaleString("pt-BR")}x
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------- Exemplo 1: o caso simples ---------- */}
            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-800">Na prática</p>
              <p className="mt-1 text-sm text-gray-600">
                Você indica o <strong>Bruno</strong>. Ele compra{" "}
                <strong>{formatCurrency(100)}</strong> em produtos no Pix. Essa
                compra gera <Highlight>{pts(pixBase)} pontos</Highlight>{" "}
                para o Bruno e{" "}
                <Highlight>
                  {pts(pixBase * networkRate(1))} pontos
                </Highlight>{" "}
                para você — sem tirar nada dele.
              </p>
            </div>

            {/* ---------- Exemplo 2: onde a rede acaba ----------
                O limite de 4 níveis é o que mais gera dúvida, porque só
                fica visível quando existe alguém no nível 5. Por isso aqui
                a corrente tem cinco pessoas com nome e a última linha
                aparece zerada — em vez de afirmar o limite numa frase que
                ninguém consegue conferir. */}
            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-800">
                E onde a rede acaba?
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Agora a corrente cresceu: você indicou o Bruno, o Bruno indicou
                a Carla, a Carla indicou o Diego, e o Diego indicou a Eduarda.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                {CHAIN.map((person, index) => (
                  <span key={person} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-gray-300">&rarr;</span>}
                    <span
                      className={`rounded-full px-2 py-1 font-medium ${
                        index === 0
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {person}
                    </span>
                  </span>
                ))}
              </div>

              <p className="mt-3 text-sm text-gray-600">
                A <strong>Eduarda</strong> compra{" "}
                <strong>{formatCurrency(100)}</strong> em produtos no Pix:
              </p>

              {/* Da compra pra cima: quem comprou primeiro, você por último
                  — que é onde está a surpresa. */}
              <ul className="mt-2 divide-y rounded-lg border">
                {CHAIN.slice()
                  .reverse()
                  .map((person, distance) => {
                    const points = pixBase * networkRate(distance);
                    const earns = networkRate(distance) > 0;
                    const isYou = distance === CHAIN.length - 1;

                    return (
                      <li
                        key={person}
                        className={`flex items-center gap-3 px-3 py-2 text-sm ${
                          isYou ? "bg-red-50" : ""
                        }`}
                      >
                        <span className="w-16 flex-shrink-0 text-xs text-gray-500">
                          Nível {distance + 1}
                        </span>
                        <span
                          className={`min-w-0 flex-1 truncate ${
                            isYou
                              ? "font-semibold text-red-800"
                              : "text-gray-800"
                          }`}
                        >
                          {person}
                          {distance === 0 && (
                            <span className="ml-1 text-xs text-gray-400">
                              (quem comprou)
                            </span>
                          )}
                        </span>
                        <span
                          className={`flex-shrink-0 text-sm font-bold tabular-nums ${
                            earns ? "text-amber-600" : "text-red-600"
                          }`}
                        >
                          {earns ? `${pts(points)} pontos` : "0 ponto"}
                        </span>
                      </li>
                    );
                  })}
              </ul>

              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <strong>Repare no seu caso:</strong> a Eduarda está a{" "}
                {CHAIN.length - 1} indicações de distância de você, o que te
                coloca no{" "}
                <Highlight tone="danger">nível {CHAIN.length}</Highlight> dessa
                compra. A rede paga só até o{" "}
                <strong>nível {rules.levels.length}</strong>, então{" "}
                <strong>você não ganha nada com a compra dela</strong> — mesmo
                tendo começado a corrente.
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Se quem comprasse fosse o Diego, você estaria no nível{" "}
                {rules.levels.length} e ganharia{" "}
                {pts(pixBase * networkRate(rules.levels.length - 1))}{" "}
                pontos. É a <strong>distância até quem compra</strong> que
                decide, não o tamanho da sua rede.
              </p>
            </div>
          </Card>
        )}

        {/* ---------- Tiers ---------- */}
        {rules.tiersEnabled && orderedTiers.length > 0 && (
          <Card>
            <SectionTitle
              step="Passo 3"
              icon={<Users className="h-5 w-5" />}
              title="Suba de título e ganhe mais rápido"
              subtitle="Quanto mais amigos ativos você trouxer, maior o multiplicador aplicado a TODOS os seus ganhos."
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2 font-medium">Título</th>
                    <th className="px-3 py-2 font-medium">
                      Amigos ativos indicados
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Multiplicador
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderedTiers.map((tier, index) => (
                    <tr
                      key={tier.level}
                      className={`border-b last:border-0 ${
                        index === orderedTiers.length - 1 ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 font-medium text-gray-900">
                        {tier.name}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {tier.minActiveAffiliates === 0
                          ? "—"
                          : `a partir de ${tier.minActiveAffiliates}`}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-amber-600">
                        {tier.multiplier.toLocaleString("pt-BR")}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              <p>
                <strong>Amigo ativo</strong> é quem você indicou diretamente e
                que comprou{" "}
                <Highlight>
                  nos últimos {rules.activeAffiliateWindowDays} dias
                </Highlight>
                . Só indicações diretas contam.
              </p>
              <p>
                Se um amigo parar de comprar, você pode{" "}
                <strong>voltar para o nível anterior</strong> — mas{" "}
                <Highlight tone="success">
                  os pontos que você já ganhou continuam seus
                </Highlight>
                . Rebaixar de nível nunca apaga saldo.
              </p>
            </div>
          </Card>
        )}

        {/* ---------- Como usar ---------- */}
        <Card>
          <SectionTitle
            step="Passo 4"
            icon={<Ticket className="h-5 w-5" />}
            title="Como usar seus pontos"
            subtitle="Na hora de fechar o pedido, escolha quantos pontos quer usar."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-2xl font-bold text-emerald-600">
                {rules.pointsPerReal} pontos = {formatCurrency(1)}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                A cada {rules.pointsPerReal} pontos usados você tem{" "}
                {formatCurrency(1)} de desconto. Exemplo: 112 pontos viram{" "}
                <Highlight tone="success">
                  {formatCurrency(112 * (realPerHundred / 100))}
                </Highlight>{" "}
                de desconto.
              </p>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <p className="text-2xl font-bold text-blue-600">
                mínimo {rules.minRedeemPoints} pontos
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Abaixo de {rules.minRedeemPoints} pontos o resgate fica
                bloqueado. Daí em diante você usa a quantidade que quiser.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Ban className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <span>
                Os pontos <strong>não abatem o frete</strong> — só o valor dos
                produtos.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>
                Os pontos abatem no máximo{" "}
                <Highlight>
                  {rules.maxRedeemPercent}% do valor dos produtos
                </Highlight>{" "}
                de cada compra. Sempre sobra uma parte a pagar.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Gift className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              <span>
                O que você paga com pontos não gera pontos de novo — o ganho é
                calculado sobre o valor que sai do seu bolso.
              </span>
            </li>
          </ul>
        </Card>

        {/* ---------- Como perder ---------- */}
        <Card className="border-red-200">
          <SectionTitle
            step="Atenção"
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Como você pode perder pontos"
            subtitle="Duas situações fazem o saldo sumir sem você usar. Vale a pena ler."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 font-semibold text-red-800">
                <CalendarClock className="h-4 w-4" />
                Validade
              </p>
              <p className="mt-1 text-sm text-red-700">
                Cada ponto vale por{" "}
                <Highlight tone="danger">{rules.expirationDays} dias</Highlight>{" "}
                a partir do dia em que foi ganho. Passou disso, ele vence.
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 font-semibold text-red-800">
                <Ban className="h-4 w-4" />
                Inatividade
              </p>
              <p className="mt-1 text-sm text-red-700">
                Ficando{" "}
                <Highlight tone="danger">
                  {rules.inactivityDays} dias sem comprar
                </Highlight>
                , você perde todo o saldo. Uma compra de{" "}
                <strong>qualquer valor</strong> reinicia a contagem.
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Pedido cancelado devolve os pontos que você usou nele e desfaz os
            pontos que ele tinha gerado.
          </p>
        </Card>

        {/* ---------- Fechamento ---------- */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Pronto para começar?
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Crie sua conta, compre normalmente e acompanhe seus pontos no menu
            da sua conta.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Criar minha conta
            </Link>
            <Link
              href="/"
              className="rounded-md border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              Ver produtos
            </Link>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400">
          Os valores nesta página são os que estão valendo agora e podem ser
          alterados pela loja a qualquer momento. Alterações valem para
          compras futuras: <strong>pontos já creditados não são removidos</strong>{" "}
          por mudança de regra — apenas pela validade, pela inatividade ou pelo
          cancelamento do pedido que os gerou.
        </p>
      </main>
    </div>
  );
};

export default PointsRulesPage;
