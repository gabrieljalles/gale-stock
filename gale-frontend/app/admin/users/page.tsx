"use client";

import { useContext, useEffect, useState } from "react";
import OnTheBillPanel from "./_components/OnTheBillPanel";
import SideBar from "@/admin/_components/SideBar";
import { AuthContext } from "@/_store/auth/AuthContext";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/_components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Loader2, Info, ShieldCheck, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  getAllUsersWithStats,
  promoteUser,
  UserWithStats,
} from "@/api/user";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  Admin: "Administrador",
  Shopper: "Vendedor",
  DeliveryMan: "Entregador",
  Client: "Cliente",
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Admin: "bg-yellow-100 text-yellow-800",
  Shopper: "bg-blue-100 text-blue-800",
  DeliveryMan: "bg-purple-100 text-purple-800",
  Client: "bg-green-100 text-green-800",
};

const TYPE_ADDRESS_LABELS: Record<string, string> = {
  Street: "Rua",
  Avanue: "Avenida",
  Alley: "Beco",
  Lane: "Travessa",
  Highway: "Rodovia",
  Road: "Estrada",
  Square: "Praça",
  Village: "Vila",
  Condominium: "Condomínio",
};

const GENDER_LABELS: Record<string, string> = {
  Masculine: "Masculino",
  Feminine: "Feminino",
  Other: "Outro",
  DoNotInform: "Não informado",
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const UsersPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [infoUser, setInfoUser] = useState<UserWithStats | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<UserWithStats | null>(
    null,
  );
  const [newAccountType, setNewAccountType] = useState("Client");
  const [password, setPassword] = useState("");
  const [promoting, setPromoting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    getAllUsersWithStats()
      .then(setUsers)
      .catch(() => toast.error("Erro ao carregar usuários."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user && user.role !== "Admin") return;
    loadUsers();
  }, [user]);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.cellPhone.toLowerCase().includes(term)
    );
  });

  const handleStartPromote = (target: UserWithStats) => {
    setPromoteTarget(target);
    setNewAccountType(target.accountType ?? "Client");
    setPassword("");
  };

  const handleConfirmPromote = async () => {
    if (!promoteTarget) return;
    if (!password) {
      toast.error("Digite sua senha pra confirmar.");
      return;
    }

    setPromoting(true);
    try {
      await promoteUser(promoteTarget.id, newAccountType, password);
      toast.success(
        `${promoteTarget.fullName} agora é ${ACCOUNT_TYPE_LABELS[newAccountType] ?? newAccountType}.`,
      );
      setPromoteTarget(null);
      setPassword("");
      loadUsers();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao mudar a categoria. Tente novamente.");
    } finally {
      setPromoting(false);
    }
  };

  if (user && user.role !== "Admin") {
    return (
      <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
        <SideBar />
        <div className="flex flex-1 items-center justify-center rounded-md border border-black bg-white">
          <p className="text-gray-500">
            Você não tem permissão para acessar essa página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-black bg-white">
        <header className="flex-shrink-0 border-b px-6 py-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Users className="h-6 w-6" />
            Usuários
          </h1>
          <p className="text-gray-600">
            {users.length} usuário(s) cadastrado(s)
          </p>
        </header>

        <div className="flex-shrink-0 border-b p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Produto preferido</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium text-gray-900">
                          {u.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            ACCOUNT_TYPE_COLORS[u.accountType ?? ""] ??
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ACCOUNT_TYPE_LABELS[u.accountType ?? ""] ??
                            u.accountType ??
                            "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(u.totalRevenue)}
                      </TableCell>
                      <TableCell>
                        {u.favoriteProduct ? (
                          <span className="text-sm text-gray-700">
                            {u.favoriteProduct}{" "}
                            <span className="text-xs text-gray-400">
                              ({u.favoriteProductQuantity}x)
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Nenhum pedido ainda
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setInfoUser(u)}
                          >
                            <Info className="mr-1 h-3.5 w-3.5" />
                            Info
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-black text-white hover:bg-green-600"
                            onClick={() => handleStartPromote(u)}
                          >
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                            Promover
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-400">
                  Nenhum usuário encontrado.
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Info do usuário */}
      <Dialog open={!!infoUser} onOpenChange={(v) => !v && setInfoUser(null)}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{infoUser?.fullName}</DialogTitle>
          </DialogHeader>
          {infoUser && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="font-medium">{infoUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="font-medium">{infoUser.cellPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CPF/CNPJ</p>
                  <p className="font-medium">{infoUser.cpfCNPJ}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data de nascimento</p>
                  <p className="font-medium">
                    {formatDate(infoUser.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gênero</p>
                  <p className="font-medium">
                    {GENDER_LABELS[infoUser.gender] ?? infoUser.gender}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cadastrado em</p>
                  <p className="font-medium">
                    {formatDate(infoUser.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">E-mail verificado</p>
                  <p className="font-medium">
                    {infoUser.verifiedEmail ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              {/* Crédito de notinha: autorização e teto, editáveis aqui
                  mesmo. Só Admin chega nesta tela. */}
              <OnTheBillPanel
                userId={infoUser.id}
                userName={infoUser.fullName}
              />

              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Endereços ({infoUser.address.length})
                </p>
                {infoUser.address.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    Nenhum endereço cadastrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {infoUser.address.map((addr) => (
                      <div
                        key={addr.id}
                        className="rounded-md border bg-gray-50 p-2 text-xs"
                      >
                        {addr.isPrimary && (
                          <span className="mb-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                            Principal
                          </span>
                        )}
                        <p>
                          {TYPE_ADDRESS_LABELS[addr.typeAddress] ??
                            addr.typeAddress}{" "}
                          {addr.address}, {addr.number} — {addr.district}
                        </p>
                        {addr.complement && <p>{addr.complement}</p>}
                        {addr.zipCode && <p>CEP: {addr.zipCode}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Promover usuário */}
      <Dialog
        open={!!promoteTarget}
        onOpenChange={(v) => !v && setPromoteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mudar categoria de {promoteTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Nova categoria
              </label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              >
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Confirme sua senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha de admin"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPromoteTarget(null)}
                disabled={promoting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 bg-black text-white hover:bg-green-600"
                onClick={handleConfirmPromote}
                disabled={promoting}
              >
                {promoting ? "Confirmando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
