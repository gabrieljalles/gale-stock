"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KanbanOrder, KanbanOrderStatus } from "@/api/order";

// Mesmas cores das colunas do Kanban, pra bater o pin com a etapa.
export const STATUS_COLORS: Record<KanbanOrderStatus, string> = {
  Confirmed: "#dc2626",
  Preparing: "#d97706",
  ReadyToPickup: "#7c3aed",
  OutForDelivery: "#0891b2",
  Delivered: "#16a34a",
};

export const STATUS_LABELS: Record<KanbanOrderStatus, string> = {
  Confirmed: "Recebido",
  Preparing: "Em preparação",
  ReadyToPickup: "Pronto",
  OutForDelivery: "A caminho",
  Delivered: "Entregue",
};

// Os popups são montados como HTML, então tudo que vem do banco (nome do
// cliente, endereço, produto) precisa ser escapado.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Pin desenhado em HTML (divIcon) em vez da imagem padrão do Leaflet: evita
// o problema clássico de caminho de asset quebrado no bundler e deixa a cor
// ser controlada pelo status do pedido.
const buildPinIcon = (color: string, label: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        background:${color};
        width:26px;height:26px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,.4);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);
          color:#fff;font-size:11px;font-weight:700;
          font-family:system-ui,sans-serif;line-height:1;
        ">${label}</span>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });

const buildPopupHtml = (order: KanbanOrder): string => {
  const address = order.address!;
  const products = order.products
    .map((p) => `${p.quantity}x ${p.productName}`)
    .join(", ");
  const driver = order.deliveryMan
    ? ` · ${escapeHtml(order.deliveryMan.fullName)}`
    : "";

  return `
    <div style="min-width:170px">
      <p style="font-weight:700;margin:0 0 2px">${escapeHtml(order.buyerName)}</p>
      <p style="font-size:11px;color:#555;margin:0">
        ${escapeHtml(address.address)}, ${escapeHtml(address.number)} — ${escapeHtml(address.district)}
      </p>
      <p style="font-size:11px;margin:4px 0;font-weight:600;color:${STATUS_COLORS[order.orderStatus]}">
        ${STATUS_LABELS[order.orderStatus]}${driver}
      </p>
      <p style="font-size:11px;color:#555;margin:0 0 6px">${escapeHtml(products)}</p>
      <button type="button" data-order-id="${escapeHtml(order.id)}" style="
        width:100%;background:#000;color:#fff;border:none;border-radius:4px;
        padding:5px 8px;font-size:11px;font-weight:600;cursor:pointer;
      ">Ir para o pedido</button>
    </div>`;
};

interface DeliveryMapProps {
  orders: KanbanOrder[];
  center: [number, number];
  onSelectOrder: (orderId: string) => void;
}

// O mapa é criado direto com a API do Leaflet (sem react-leaflet) porque o
// StrictMode do React 18 monta e remonta o componente no desenvolvimento, e
// o wrapper reaproveitava a mesma <div> — o Leaflet reclamava que o
// container já estava inicializado. Aqui o cleanup destrói o mapa, então
// remontar é sempre seguro.
const DeliveryMap = ({ orders, center, onSelectOrder }: DeliveryMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Mantém o callback atual sem obrigar o mapa a ser recriado.
  const onSelectRef = useRef(onSelectOrder);
  onSelectRef.current = onSelectOrder;

  const centerRef = useRef(center);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container).setView(centerRef.current, 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    // O botão "Ir para o pedido" vive dentro do HTML do popup, então o
    // clique é capturado por delegação no container do mapa.
    const handleClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest?.(
        "[data-order-id]",
      );
      const orderId = button?.getAttribute("data-order-id");
      if (orderId) onSelectRef.current(orderId);
    };
    container.addEventListener("click", handleClick);

    // O mapa nasce dentro de um modal que ainda está animando; sem isso o
    // Leaflet calcula o tamanho errado e as tiles ficam cinzas.
    const resizeTimer = setTimeout(() => map.invalidateSize(), 150);

    return () => {
      clearTimeout(resizeTimer);
      container.removeEventListener("click", handleClick);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Redesenha os pins sempre que a lista de pedidos muda.
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    const located = orders.filter(
      (order) =>
        order.address?.latitude != null && order.address?.longitude != null,
    );

    located.forEach((order, index) => {
      const position: [number, number] = [
        order.address!.latitude!,
        order.address!.longitude!,
      ];

      L.marker(position, {
        icon: buildPinIcon(
          STATUS_COLORS[order.orderStatus],
          String(index + 1),
        ),
      })
        .bindPopup(buildPopupHtml(order))
        .addTo(markers);
    });

    // Reenquadra pra caber todas as entregas. Sem nenhuma localizada, o
    // mapa fica no centro da cidade configurada.
    if (located.length === 1) {
      map.setView(
        [located[0].address!.latitude!, located[0].address!.longitude!],
        15,
      );
    } else if (located.length > 1) {
      map.fitBounds(
        L.latLngBounds(
          located.map((order) => [
            order.address!.latitude!,
            order.address!.longitude!,
          ]),
        ),
        { padding: [40, 40] },
      );
    }
  }, [orders]);

  return <div ref={containerRef} className="h-full w-full rounded-md" />;
};

export default DeliveryMap;
