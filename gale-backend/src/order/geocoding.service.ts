import { Injectable, Logger } from '@nestjs/common';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Nominatim (OpenStreetMap) é gratuito e não exige chave, mas a política de
// uso pede: no máximo 1 requisição por segundo e um User-Agent que
// identifique a aplicação. Por isso as consultas são feitas em fila, uma de
// cada vez — e o resultado é gravado no banco pra nunca repetir a mesma.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'gale-stock/1.0 (sistema de gestão de loja)';
const REQUEST_INTERVAL_MS = 1100;

// Tipos de resultado precisos o suficiente pra virar um ponto de entrega.
// Sem esse filtro o Nominatim "acha" qualquer coisa: um CEP que ele não
// conhece cai num bairro ou na cidade inteira, e o pin aparece a
// quilômetros do destino — errado com cara de certo. Melhor não ter pin.
const PRECISE_ADDRESS_TYPES = ['house', 'building', 'road', 'postcode'];

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  // Cache em memória do centro das cidades já consultadas. A cidade da loja
  // quase nunca muda, então não vale uma coluna no banco: se o servidor
  // reiniciar, é só uma consulta a mais.
  private readonly cityCache = new Map<string, Coordinates | null>();

  async geocodeCity(city: string, state: string): Promise<Coordinates | null> {
    const key = `${city}/${state}`.toLowerCase();
    const cached = this.cityCache.get(key);
    if (cached !== undefined) return cached;

    // requirePrecise desligado: aqui o resultado esperado é o município.
    const coordinates = await this.geocode(`${city}, ${state}, Brasil`, false);
    this.cityCache.set(key, coordinates);
    return coordinates;
  }

  private async wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Resolve um endereço em coordenadas. Devolve null quando o endereço não
  // é encontrado (rua inexistente, erro de digitação, etc) ou quando o que
  // veio é impreciso demais — o chamador grava a tentativa mesmo assim,
  // pra não ficar reconsultando.
  // Com requirePrecise (padrão), só aceita resultado no nível de rua/casa/
  // CEP. Desligado, aceita qualquer coisa — usado pra centrar o mapa numa
  // cidade, onde o resultado é justamente o município.
  async geocode(
    query: string,
    requirePrecise = true,
  ): Promise<Coordinates | null> {
    // limit=5 porque o primeiro resultado pode ser impreciso mesmo havendo
    // um mais exato logo abaixo.
    const url = `${NOMINATIM_URL}?format=json&limit=5&countrycodes=br&q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
      });

      if (!response.ok) {
        this.logger.warn(
          `Nominatim respondeu ${response.status} para "${query}"`,
        );
        return null;
      }

      const results = (await response.json()) as {
        lat: string;
        lon: string;
        addresstype?: string;
      }[];

      if (!Array.isArray(results) || results.length === 0) return null;

      const match = requirePrecise
        ? results.find((item) =>
            PRECISE_ADDRESS_TYPES.includes(item.addresstype ?? ''),
          )
        : results[0];

      if (!match) {
        this.logger.debug(
          `Descartado por imprecisão (${results[0].addresstype}): "${query}"`,
        );
        return null;
      }

      return {
        latitude: Number(match.lat),
        longitude: Number(match.lon),
      };
    } catch (error) {
      this.logger.error(`Erro ao geocodificar "${query}"`, error as Error);
      return null;
    }
  }

  // Tenta as variações em ordem e devolve a primeira que resolver. Serve
  // pra ir afrouxando a busca: endereço completo primeiro, depois só a rua
  // com a cidade — o OSM costuma ter a via mapeada mesmo sem o número.
  async geocodeFirstMatch(queries: string[]): Promise<Coordinates | null> {
    for (const [index, query] of queries.entries()) {
      if (index > 0) await this.wait(REQUEST_INTERVAL_MS);
      const coordinates = await this.geocode(query);
      if (coordinates) return coordinates;
    }
    return null;
  }

  // Geocodifica vários endereços respeitando o intervalo entre requisições.
  // O callback é chamado a cada resultado pra quem chamou já ir salvando.
  async geocodeMany<T>(
    items: { id: T; queries: string[] }[],
    onResult: (id: T, coordinates: Coordinates | null) => Promise<void>,
  ): Promise<void> {
    for (const [index, item] of items.entries()) {
      if (index > 0) await this.wait(REQUEST_INTERVAL_MS);
      const coordinates = await this.geocodeFirstMatch(item.queries);
      await onResult(item.id, coordinates);
    }
  }
}
