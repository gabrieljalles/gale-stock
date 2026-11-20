"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { AuthContext } from "@/_store/auth/AuthContext";
import { Button } from "@/_components/ui/button";
import AddressForm, {
  AddressFormValue,
  emptyAddress,
  isAddressComplete,
  toPayload,
  TYPE_ADDRESS_OPTIONS,
} from "@/_components/storefront/AddressForm";
import {
  createMyAddress,
  deleteMyAddress,
  getMyAddresses,
  getMyProfile,
  setMyPrimaryAddress,
  MyAddress,
  MyProfile,
} from "@/api/user";
import AvatarUploader from "@/_components/storefront/AvatarUploader";

const typeLabel = (value: string) =>
  TYPE_ADDRESS_OPTIONS.find((option) => option.value === value)?.label ?? value;

// Espelha o teto do backend (UserService.MAX_ADDRESSES_PER_USER). Aqui é
// só pra tela avisar antes; quem barra de verdade é o servidor.
const MAX_ADDRESSES = 3;

const MyAccountPage = () => {
  const { user, isLoading } = useContext(AuthContext);
  const router = useRouter();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [addresses, setAddresses] = useState<MyAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressFormValue>(emptyAddress());
  const [saving, setSaving] = useState(false);

  const atAddressLimit = addresses.length >= MAX_ADDRESSES;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/minha-conta");
  }, [user, isLoading, router]);

  const loadAddresses = () => {
    setLoading(true);
    getMyAddresses()
      .then(setAddresses)
      .catch(() => toast.error("Erro ao carregar seus endereços."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    loadAddresses();
    getMyProfile()
      .then(setProfile)
      .catch(() => toast.error("Erro ao carregar seu perfil."));
  }, [user]);

  const handleSave = async () => {
    if (!isAddressComplete(form)) {
      toast.error("Preencha endereço, número e bairro.");
      return;
    }

    setSaving(true);
    try {
      await createMyAddress(toPayload(form));
      toast.success("Endereço salvo!");
      setForm(emptyAddress());
      setShowForm(false);
      loadAddresses();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Erro ao salvar o endereço.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address: MyAddress) => {
    try {
      await deleteMyAddress(address.id);
      toast.success("Endereço removido.");
      loadAddresses();
    } catch {
      toast.error("Erro ao remover o endereço.");
    }
  };

  const handleSetPrimary = async (address: MyAddress) => {
    try {
      await setMyPrimaryAddress(address.id);
      loadAddresses();
    } catch {
      toast.error("Erro ao definir o endereço principal.");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

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

        <h1 className="mb-4 text-2xl font-bold text-gray-900">Minha conta</h1>

        <div className="mb-4 rounded-lg border bg-white p-4">
          <AvatarUploader
            avatarUrl={profile?.avatarUrl ?? null}
            fullName={profile?.fullName ?? user.name}
            onChange={(avatarUrl) =>
              setProfile((current) =>
                current ? { ...current, avatarUrl } : current,
              )
            }
          />
          <p className="mt-3 border-t pt-3 text-sm text-gray-700">
            {profile?.fullName ?? user.name}
          </p>
          <p className="text-xs text-gray-500">{profile?.email ?? user.email}</p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="h-4 w-4" />
              Meus endereços
            </h2>
            {!showForm && !atAddressLimit && (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowForm(true)}
                className="bg-primary text-white hover:bg-secondary hover:text-primary"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Novo endereço
              </Button>
            )}
            {!showForm && atAddressLimit && (
              <span className="text-xs text-gray-400">
                {MAX_ADDRESSES} de {MAX_ADDRESSES} salvos
              </span>
            )}
          </div>

          {showForm && (
            <div className="mb-4 space-y-3 rounded-md border bg-gray-50 p-3">
              <AddressForm value={form} onChange={setForm} />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyAddress());
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-primary text-white hover:bg-secondary hover:text-primary"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? "Salvando..." : "Salvar endereço"}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : addresses.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Você ainda não tem endereços salvos. Cadastre um para agilizar
              seus pedidos.
            </p>
          ) : (
            <div className="space-y-2">
              {atAddressLimit && (
                <p className="rounded-md bg-gray-100 p-2 text-xs text-gray-600">
                  Você atingiu o limite de {MAX_ADDRESSES} endereços salvos.
                  Para entregar em outro lugar, é só informar o endereço na
                  hora de finalizar o pedido — ou remover um destes.
                </p>
              )}
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-start gap-2 rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    {address.isPrimary && (
                      <span className="mb-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                        Principal
                      </span>
                    )}
                    <p className="text-sm text-gray-900">
                      {typeLabel(address.typeAddress)} {address.address},{" "}
                      {address.number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {address.district}
                      {address.complement ? ` · ${address.complement}` : ""}
                      {address.zipCode ? ` · CEP ${address.zipCode}` : ""}
                    </p>
                  </div>

                  {!address.isPrimary && (
                    <button
                      type="button"
                      title="Usar este endereço por padrão nos pedidos"
                      onClick={() => handleSetPrimary(address)}
                      className="flex flex-shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-gray-500 hover:border-secondary hover:text-secondary"
                    >
                      <Star className="h-3 w-3" />
                      Usar por padrão
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remover endereço"
                    onClick={() => handleDelete(address)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAccountPage;
