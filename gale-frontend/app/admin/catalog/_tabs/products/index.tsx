"use client";

import { useCatalog } from "@/_store/catalog/CatalogContext";
import { Loader2, Package, Search, Pen, X, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/_components/ui/input";
import { Card, CardContent } from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/_components/ui/drawer";
import { Label } from "@/_components/ui/label";
import { toast } from "sonner";
import { CatalogItem } from "@/api/catalog";
import { getSettings, SiteSettings } from "@/api/settings";
import { translateCategory } from "@/_constants/product";

const CatalogProductsTab = () => {
  const { catalogItems, loading, error, updateItemPrice } = useCatalog();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [prices, setPrices] = useState({
    consumerPrice: 0,
    consumerNightPrice: 0,
    consumerIfoodPrice: 0,
    isLiquidation: false,
    liquidationPrice: 0,
    packageDiscountAmount: 0,
    discountPackPrice: 0,
    wholesaleEnabled: true,
  });

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {
        // Sem configurações carregadas, o preço "agora" cai no preço normal.
      });
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Mesma prioridade usada no backend na hora da venda presencial
  // (fora do escopo de iFood/atacado, que dependem do pedido em si).
  const isCurrentlyNight = (): boolean => {
    if (!settings || !settings.nightPriceEnabled) return false;

    const hour = new Date().getHours();
    const { nightPriceStartHour: start, nightPriceEndHour: end } = settings;

    if (start === end) return false;
    // Janela que cruza a meia-noite (ex: 23 -> 7)
    if (start > end) return hour >= start || hour < end;
    // Janela dentro do mesmo dia (ex: 1 -> 5)
    return hour >= start && hour < end;
  };

  const getCurrentPrice = (
    item: CatalogItem,
  ): { price: number; label: string | null } | null => {
    const isNight = isCurrentlyNight();

    if (item.isLiquidation && item.liquidationPrice) {
      return { price: item.liquidationPrice, label: "Liquidação" };
    }
    if (isNight && item.consumerNightPrice) {
      return { price: item.consumerNightPrice, label: "Noturno" };
    }
    if (item.consumerPrice) {
      return { price: item.consumerPrice, label: "Normal" };
    }
    return null;
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleToggleAvailability = async (item: CatalogItem) => {
    try {
      await updateItemPrice(item.id, { available: !item.available });
      toast.success(
        item.available
          ? "Produto retirado de circulação."
          : "Produto disponível novamente.",
      );
    } catch (error) {
      console.error("Erro ao atualizar disponibilidade:", error);
      toast.error("Erro ao atualizar disponibilidade. Tente novamente.");
    }
  };

  const handleEditPrice = (item: CatalogItem) => {
    setEditingItem(item);
    setPrices({
      consumerPrice: item.consumerPrice || 0,
      consumerNightPrice: item.consumerNightPrice || 0,
      consumerIfoodPrice: item.consumerIfoodPrice || 0,
      isLiquidation: item.isLiquidation || false,
      liquidationPrice: item.liquidationPrice || 0,
      packageDiscountAmount: item.packageDiscountAmount || 0,
      discountPackPrice: item.discountPackPrice || 0,
      wholesaleEnabled: item.wholesaleEnabled ?? true,
    });
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
    setPrices({
      consumerPrice: 0,
      consumerNightPrice: 0,
      consumerIfoodPrice: 0,
      isLiquidation: false,
      liquidationPrice: 0,
      packageDiscountAmount: 0,
      discountPackPrice: 0,
      wholesaleEnabled: true,
    });
  };

  const handleSubmitPrices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setPriceLoading(true);

      const updateData: any = {};

      if (prices.consumerPrice !== editingItem.consumerPrice) {
        updateData.consumerPrice = prices.consumerPrice;
      }
      if (prices.consumerNightPrice !== editingItem.consumerNightPrice) {
        updateData.consumerNightPrice = prices.consumerNightPrice;
      }
      if (prices.consumerIfoodPrice !== editingItem.consumerIfoodPrice) {
        updateData.consumerIfoodPrice = prices.consumerIfoodPrice;
      }
      if (prices.isLiquidation !== editingItem.isLiquidation) {
        updateData.isLiquidation = prices.isLiquidation;
      }
      if (prices.liquidationPrice !== (editingItem.liquidationPrice || 0)) {
        updateData.liquidationPrice = prices.liquidationPrice;
      }
      if (
        prices.packageDiscountAmount !==
        (editingItem.packageDiscountAmount || 0)
      ) {
        updateData.packageDiscountAmount = prices.packageDiscountAmount;
      }
      if (prices.discountPackPrice !== (editingItem.discountPackPrice || 0)) {
        updateData.discountPackPrice = prices.discountPackPrice;
      }
      if (prices.wholesaleEnabled !== (editingItem.wholesaleEnabled ?? true)) {
        updateData.wholesaleEnabled = prices.wholesaleEnabled;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("Nenhuma alteração foi feita nos preços");
        handleCloseEdit();
        return;
      }

      await updateItemPrice(editingItem.id, updateData);
      toast.success("Preços atualizados com sucesso!");
      handleCloseEdit();
    } catch (error) {
      console.error("Erro ao atualizar preços:", error);
      toast.error("Erro ao atualizar preços. Tente novamente.");
    } finally {
      setPriceLoading(false);
    }
  };

  const handlePriceChange = (field: keyof typeof prices, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setPrices((prev) => ({ ...prev, [field]: numericValue }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        <span className="ml-2 text-gray-600">Carregando catálogo...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const availableCount = catalogItems.filter((item) => item.available).length;

  const visibleItems = showAll
    ? catalogItems
    : catalogItems.filter(
        (item) => item.available || (item.totalStock ?? 0) > 0,
      );

  const categories = Array.from(
    new Set(visibleItems.map((item) => item.product.category)),
  );

  const filteredItems = visibleItems.filter((item) => {
    const matchesSearch = item.product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || item.product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Catálogo de Produtos
        </h2>
        <div className="text-sm text-gray-600">
          {availableCount} produtos disponíveis
        </div>
      </div>

      {/* Barra de busca */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar produtos no catálogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-input bg-white px-3 py-2 text-sm sm:w-56"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {translateCategory(category)}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant={showAll ? "default" : "outline"}
          onClick={() => setShowAll((prev) => !prev)}
          className={`flex-shrink-0 whitespace-nowrap ${
            showAll ? "bg-black text-white hover:bg-gray-800" : ""
          }`}
        >
          {showAll ? "Mostrando tudo" : "Mostrar tudo"}
        </Button>
      </div>

      {/* Grid de produtos */}
      {filteredItems.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">
              {searchTerm
                ? "Nenhum produto encontrado"
                : "Nenhum produto disponível no catálogo"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`flex flex-col overflow-hidden py-0 transition-shadow hover:shadow-lg ${
                !item.available ? "grayscale opacity-70" : ""
              }`}
            >
              <CardContent className="flex flex-1 flex-col gap-3 p-0">
                {/* Header com imagem e status */}
                <div className="relative">
                  {item.product.imgUrl ? (
                    <img
                      src={item.product.imgUrl}
                      alt={item.product.name}
                      className="h-20 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center bg-gray-100">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                  )}

                  {/* Botão de tirar/colocar em circulação */}
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item)}
                    title={
                      item.available
                        ? "Tirar de circulação"
                        : "Colocar em circulação"
                    }
                    className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
                  >
                    {item.available ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Badge de disponibilidade */}
                  <div className="absolute right-2 top-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.available
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.available ? "Disponível" : "Indisponível"}
                    </span>
                  </div>

                  {/* Badge de liquidação */}
                  {item.isLiquidation && (
                    <div className="absolute left-2 top-9">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                        Liquidação
                      </span>
                    </div>
                  )}
                </div>

                {/* Conteúdo principal */}
                <div className="flex flex-1 flex-col gap-2 px-3 pb-2 pt-3">
                  {/* Nome e categoria */}
                  <div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {item.product.category} • {item.product.size}
                      {item.product.sizeType}
                    </p>
                  </div>

                  {/* Estoque */}
                  <div className="flex items-center gap-2 text-xs">
                    <Package className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-600">
                      Estoque:{" "}
                      <span className="font-semibold">
                        {item.totalStock || 0} un
                      </span>
                    </span>
                  </div>

                  {/* Preço praticado agora */}
                  {(() => {
                    const current = getCurrentPrice(item);
                    if (!current) return null;
                    return (
                      <div className="flex items-center justify-between rounded-md bg-blue-50 px-2 py-1.5">
                        <span className="text-xs font-medium text-blue-900">
                          Preço agora
                          {current.label && (
                            <span className="font-normal text-blue-700">
                              {" "}
                              ({current.label})
                            </span>
                          )}
                          :
                        </span>
                        <span className="text-lg font-bold text-black">
                          {formatCurrency(current.price)}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Preços */}
                  <div className="space-y-1">
                    {item.isLiquidation && item.liquidationPrice != null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          Preço liquidação:
                        </span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(item.liquidationPrice)}
                        </span>
                      </div>
                    )}

                    {item.wholesaleEnabled &&
                      item.discountPackPrice != null &&
                      item.packageDiscountAmount != null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            Preço atacado ({item.packageDiscountAmount}+):
                          </span>
                          <span className="font-semibold text-purple-600">
                            {formatCurrency(item.discountPackPrice)}
                          </span>
                        </div>
                      )}

                    {item.consumerPrice && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Preço normal:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.consumerPrice)}
                        </span>
                      </div>
                    )}

                    {item.consumerNightPrice && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Preço noturno:</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(item.consumerNightPrice)}
                        </span>
                      </div>
                    )}

                    {item.consumerIfoodPrice && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Preço iFood:</span>
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(item.consumerIfoodPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Data da última modificação */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>
                      Atualizado em: {formatLastUpdate(item.updatedAt)}
                    </span>
                  </div>

                  {/* Botão de editar preço */}
                  <Button
                    className="mt-auto w-full bg-black text-white hover:bg-green-600"
                    size="sm"
                    onClick={() => handleEditPrice(item)}
                  >
                    <Pen className="mr-2 h-4 w-4" />
                    Editar Preços
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição de Preços */}
      <Drawer
        open={!!editingItem}
        onOpenChange={() => handleCloseEdit()}
        direction="right"
      >
        <DrawerContent className="fixed right-0 top-0 flex h-screen w-full max-w-[360px] flex-col overflow-y-auto rounded-md border-l bg-white shadow-lg">
          <DrawerHeader className="py-2">
            <DrawerTitle className="text-base">
              Editar Preços - {editingItem?.product.name}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" className="absolute right-2 top-2">
                X
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <form onSubmit={handleSubmitPrices} className="space-y-4 p-3">
            {/* iFood / Noturno / Normal */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="consumerIfoodPrice" className="text-xs">
                  iFood
                </Label>
                <Input
                  id="consumerIfoodPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices.consumerIfoodPrice}
                  onChange={(e) =>
                    handlePriceChange("consumerIfoodPrice", e.target.value)
                  }
                  placeholder="0.00"
                />
                <p className="text-[10px] text-gray-400">
                  Atual:{" "}
                  {editingItem?.consumerIfoodPrice
                    ? formatCurrency(editingItem.consumerIfoodPrice)
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="consumerNightPrice" className="text-xs">
                  Noturno
                </Label>
                <Input
                  id="consumerNightPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices.consumerNightPrice}
                  onChange={(e) =>
                    handlePriceChange("consumerNightPrice", e.target.value)
                  }
                  placeholder="0.00"
                />
                <p className="text-[10px] text-gray-400">
                  Atual:{" "}
                  {editingItem?.consumerNightPrice
                    ? formatCurrency(editingItem.consumerNightPrice)
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="consumerPrice" className="text-xs">
                  Normal
                </Label>
                <Input
                  id="consumerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices.consumerPrice}
                  onChange={(e) =>
                    handlePriceChange("consumerPrice", e.target.value)
                  }
                  placeholder="0.00"
                />
                <p className="text-[10px] text-gray-400">
                  Atual:{" "}
                  {editingItem?.consumerPrice
                    ? formatCurrency(editingItem.consumerPrice)
                    : "—"}
                </p>
              </div>
            </div>

            <hr />

            {/* Preço Atacado */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Preço de atacado{" "}
                  <span className="font-normal text-gray-400">
                    (venda em quantidade)
                  </span>
                </Label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={prices.wholesaleEnabled}
                    onChange={(e) =>
                      setPrices((prev) => ({
                        ...prev,
                        wholesaleEnabled: e.target.checked,
                      }))
                    }
                    className="h-3.5 w-3.5"
                  />
                  Ativo
                </label>
              </div>
              <fieldset
                disabled={!prices.wholesaleEnabled}
                className="space-y-1.5 disabled:opacity-50"
              >
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <div className="space-y-1">
                    <Label
                      htmlFor="packageDiscountAmount"
                      className="text-[10px] font-normal text-gray-500"
                    >
                      A partir de
                    </Label>
                    <Input
                      id="packageDiscountAmount"
                      type="number"
                      step="1"
                      min="0"
                      value={prices.packageDiscountAmount}
                      onChange={(e) =>
                        handlePriceChange(
                          "packageDiscountAmount",
                          e.target.value,
                        )
                      }
                      placeholder="un."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="discountPackPrice"
                      className="text-[10px] font-normal text-gray-500"
                    >
                      Preço por unidade
                    </Label>
                    <Input
                      id="discountPackPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={prices.discountPackPrice}
                      onChange={(e) =>
                        handlePriceChange("discountPackPrice", e.target.value)
                      }
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Atual:{" "}
                  {editingItem?.discountPackPrice &&
                  editingItem?.packageDiscountAmount
                    ? `${formatCurrency(editingItem.discountPackPrice)} (${editingItem.packageDiscountAmount}+)`
                    : "—"}
                </p>
              </fieldset>
            </div>

            <hr />

            {/* Preço Liquidação */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="liquidationPrice" className="text-xs">
                  Liquidação
                </Label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={prices.isLiquidation}
                    onChange={(e) =>
                      setPrices((prev) => ({
                        ...prev,
                        isLiquidation: e.target.checked,
                      }))
                    }
                    className="h-3.5 w-3.5"
                  />
                  Ativa
                </label>
              </div>
              <Input
                id="liquidationPrice"
                type="number"
                step="0.01"
                min="0"
                value={prices.liquidationPrice}
                onChange={(e) =>
                  handlePriceChange("liquidationPrice", e.target.value)
                }
                placeholder="0.00"
              />
              <p className="text-[10px] text-gray-400">
                Atual:{" "}
                {editingItem?.liquidationPrice
                  ? formatCurrency(editingItem.liquidationPrice)
                  : "—"}
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEdit}
                className="flex-1"
                disabled={priceLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={priceLoading}
              >
                {priceLoading ? "Atualizando..." : "Atualizar Preços"}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CatalogProductsTab;
