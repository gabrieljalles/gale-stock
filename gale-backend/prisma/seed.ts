import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProduct() {
  const products = [
    {
      name: 'Água com gás 500ml',
      description:
        'Água gaseificada refrescante e ideal para acompanhar refeições ou drinks.',
      category: 'NonAlcoholic',
      pack: '12',
      tags: ['Água', 'Sem açúcar', 'gás'],
      sizeType: 'ml',
      size: '500',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfJukRATC9gSYHrpMkaq1X3Oc40dBDy8TWQJRK',
    },
    {
      name: 'água tônica 350ml',
      description:
        'Água tônica leve e refrescante, perfeita para drinks ou consumo puro.',
      category: 'NonAlcoholic',
      pack: '',
      tags: ['Água', 'Tônica', 'Antartica'],
      sizeType: 'ml',
      size: '350',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfNJN9HWllrpIT8LMF0B5vyKmh2RV7YzCEesDN',
    },
    {
      name: 'água tônica 350ml 0 açúcar',
      description:
        'Água tônica sem açúcar, refrescante e ideal para drinks mais leves.',
      category: 'NonAlcoholic',
      pack: '',
      tags: ['Água', 'Tônica', 'Antartica', 'Sem açúcar'],
      sizeType: 'ml',
      size: '350',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfyVBCsFiPY5X6TtKkmdZxQAcfrlJvOH2zsEaV',
    },
    {
      name: 'Amstel 350ml',
      description:
        'Cerveja puro malte leve e equilibrada, ideal para qualquer momento.',
      category: 'Beers',
      pack: '12',
      tags: ['Amstel', 'Álcool', 'Lata'],
      sizeType: 'ml',
      size: '350',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfCkYImadOnRv8qt3ENQ0WUfdFx6VbmirlZgeu',
    },
    {
      name: 'Amstel ultra 269ml',
      description:
        'Cerveja leve com menos calorias, perfeita para quem busca equilíbrio.',
      category: 'Beers',
      pack: '12',
      tags: ['Sem glúten', 'Álcool', 'Amstel'],
      sizeType: 'ml',
      size: '269',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf1v83ZzUhzOoRgfSwjAKCULZqV4urHd9F1EYn',
    },
    {
      name: 'Antartica boa 300ml',
      description:
        'Cerveja refrescante, perfeita para acompanhar petiscos ou churrascos.',
      category: 'Beers',
      pack: '23',
      tags: ['Álcool', 'Antartica', 'Barrigudinha'],
      sizeType: 'ml',
      size: '300',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfYRGmwjDNbPXjK6cB4rtl1d9Esv2L7hGnIiM3',
    },
    {
      name: 'Antartica lata 350ml',
      description:
        'Cerveja tradicional leve e refrescante, ideal para todos os momentos.',
      category: 'Beers',
      pack: '18',
      tags: ['Álcool', 'Antartica', 'Lata'],
      sizeType: 'ml',
      size: '350',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfgBJMgLOuFMmzCRrBYfdINw2J8e54o61DLHbX',
    },
    {
      name: 'Beats GT 269ml',
      description:
        'Drink refrescante com sabor único, ideal para festas e eventos descontraídos.',
      category: '',
      pack: '8',
      tags: ['Beats'],
      sizeType: 'ml',
      size: '269',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfjbGa0sHFoWBiM1TtXcqQUmIDN9ZeAjHgz4wR',
    },
    {
      name: 'Beats Redmix 269ml',
      description:
        'Bebida saborosa com mix de frutas vermelhas, leve e refrescante.',
      category: 'Spirits',
      pack: '8',
      tags: ['Beats'],
      sizeType: 'ml',
      size: '269',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfwFYNksh7SaLsdRCAD0k3VTHe1XIPc6UjiEB9',
    },
    {
      name: 'Beats senses 269ml',
      description: 'Bebida refrescante com sabores que despertam os sentidos.',
      category: 'Spirits',
      pack: '8',
      tags: ['Beats'],
      sizeType: 'ml',
      size: '269',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfTQfiBdocMamPA9vHby86UN7it4JBeYZx0Fhp',
    },
    {
      name: 'Beats tropical 269ml',
      description:
        'Drink tropical com sabor frutado refrescante, ideal para dias quentes.',
      category: 'Spirits',
      pack: '8',
      tags: ['Beats'],
      sizeType: 'ml',
      size: '269',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfSgBQO95OgLMIBSNZ1v7qfm62GeVu8oRKTcF0',
    },
    {
      name: 'Brahma 300ml',
      description:
        'Cerveja clássica brasileira, leve e refrescante, perfeita para encontros com amigos.',
      category: 'Beers',
      pack: '23',
      tags: ['Álcool', 'Barrigudinha', 'Brahma'],
      sizeType: 'ml',
      size: '300',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfDH3HuQWGORFvfJrNWxbBokZ5SQTCtmyHswz6',
    },
    {
      name: 'Brahma 350ml',
      description:
        'Cerveja suave e refrescante, ideal para acompanhar refeições e churrascos.',
      category: 'Beers',
      pack: '18',
      tags: ['Brahma', 'Álcool', 'Lata'],
      sizeType: 'ml',
      size: '350',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfqONfd8VcnbxQwC4hILAXmZ6iSy1Wu9evDEHF',
    },
    {
      name: 'Brahma 600ml',
      description:
        'Versão maior da tradicional cerveja Brahma, ideal para compartilhar.',
      category: 'Beers',
      pack: '24',
      tags: ['Brahma', 'Garrafa', 'Álcool'],
      sizeType: 'ml',
      size: '600',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfRvy8EfZ9iCDn9KkUElTFRMwWLAPQahBN2Z0c',
    },
    {
      name: 'Budweiser 473ml',
      description:
        'Cerveja americana premium, encorpada e refrescante, para bons momentos.',
      category: 'Beers',
      pack: '12',
      tags: ['Budweiser', 'Latão', '473ml'],
      sizeType: 'ml',
      size: '473',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf6bqASbjuY7pk0n8hcUdBwRW41Gvrq6eZQEjF',
    },
    {
      name: 'Gelo 2,5kg',
      description: 'Pacote de gelo filtrado, ideal para bebidas e eventos.',
      category: 'Others',
      pack: '1',
      tags: ['Gelo', 'Água'],
      sizeType: 'kg',
      size: '2.5',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfXYJTBqKVclKkod89RqAWH2mybQtChgJeIvED',
    },
    {
      name: 'Gelo 5kg',
      description: 'Pacote de gelo filtrado, ainda maior, para a galera toda.',
      category: 'Others',
      pack: '1',
      tags: ['Gelo', 'Água'],
      sizeType: 'kg',
      size: '5',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfXYJTBqKVclKkod89RqAWH2mybQtChgJeIvED',
    },
    {
      name: 'Halls preto',
      description:
        'Drops refrescante com sabor intenso, ideal para refrescar o hálito rapidamente e...',
      category: 'Candy',
      pack: '21',
      tags: ['Bala', 'Menta'],
      sizeType: 'un',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf7k0Jkb1MbRLaHWp3XVFPnUkisAlDJhr40mS8',
    },
    {
      name: 'Heineken 350ml',
      description:
        'Cerveja premium puro malte, reconhecida pelo sabor equilibrado e refrescante.',
      category: 'Beers',
      pack: '12',
      tags: ['Heineken', '350ml', 'Lata'],
      sizeType: 'ml',
      size: '350',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfYhWw8ZDNbPXjK6cB4rtl1d9Esv2L7hGnIiM3',
    },
    {
      name: 'Heineken 600ml',
      description:
        'Cerveja premium em garrafa maior, ideal para compartilhar bons momentos.',
      category: 'Beers',
      pack: '24',
      tags: ['Heineken', 'Garrafa', '600ml'],
      sizeType: 'ml',
      size: '600',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf5xpkLhXMB0Xr3xNtufO8bmvLqKY7ohZdsipE',
    },
    {
      name: 'Heineken shot 250ml',
      description:
        'Versão compacta da Heineken, perfeita para consumo individual rápido.',
      category: 'Beers',
      pack: '24',
      tags: ['Heineken', 'Shot'],
      sizeType: 'ml',
      size: '250',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfWUKQ36m7V9aZuRjmeKvyx78pzXUkPlwtfNo5',
    },
    {
      name: 'Ice 51 Limão 275ml',
      description:
        'Bebida refrescante com sabor limão, perfeita para festas e encontros.',
      category: 'Spirits',
      pack: '6',
      tags: ['Ice', 'Limão', '51'],
      sizeType: 'ml',
      size: '275',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf73TQlCj1MbRLaHWp3XVFPnUkisAlDJhr40mS',
    },
    {
      name: 'Isqueiro',
      description: 'Isqueiro prático e funcional, ideal para uso diário.',
      category: 'Others',
      pack: '30',
      tags: ['Fogo'],
      sizeType: 'un',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfUyaW4RH35GaYnRLZtxwlOzCmf2dryQ7EvkBu',
    },
    {
      name: 'Guaraná Mineiro 1,5l',
      description:
        'Refrigerante de guaraná, ideal para refrigerar toda a família.',
      category: 'NonAlcoholic',
      pack: '6',
      tags: ['Mineiro', 'Guaraná', '1,5l', 'Refrigerante'],
      sizeType: 'l',
      size: '1.5',
      imgUrl: 'https://utfs.io/f/',
    },
    {
      name: 'Monster tradicional 473ml',
      description:
        'Energético forte e refrescante, ótimo para renovar as energias no seu dia.',
      category: 'NonAlcoholic',
      pack: '6',
      tags: ['Monster', 'Energético'],
      sizeType: 'ml',
      size: '473',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfq8jQrbVcnbxQwC4hILAXmZ6iSy1Wu9evDEHF',
    },
    {
      name: 'Monster tradicional ZERO 473ml',
      description:
        'Energético sem açúcar com o sabor tradicional que você conhece.',
      category: 'NonAlcoholic',
      pack: '6',
      tags: ['Monster', 'Energético', 'Sem açúcar'],
      sizeType: 'ml',
      size: '473',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfjFBPkfHFoWBiM1TtXcqQUmIDN9ZeAjHgz4wR',
    },
    {
      name: 'Monster Ultra 473ml',
      description:
        'Energético com menos calorias, refrescante e leve para todos os momentos.',
      category: 'NonAlcoholic',
      pack: '6',
      tags: ['Energético', 'Monster'],
      sizeType: 'ml',
      size: '473',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfiBI9NG0fLpX6sIzmF4udQHMYENw90PR7AOGl',
    },
    {
      name: 'Original 300ml',
      description: 'Cerveja tradicional brasileira, saborosa e refrescante.',
      category: 'Beers',
      pack: '23',
      tags: ['Barrigudinha', 'Original'],
      sizeType: 'ml',
      size: '300',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfxxSPk8ZEzSiRfNUvuw5a6lxk01tDIqcPOAMm',
    },
    {
      name: 'Original lata 473ml',
      description: 'Cerveja Original em lata, perfeita para qualquer ocasião.',
      category: 'Beers',
      pack: '12',
      tags: ['Álcool', 'Latão', 'Original', '473ml'],
      sizeType: 'ml',
      size: '473',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf780Zfz1MbRLaHWp3XVFPnUkisAlDJhr40mS8',
    },
    {
      name: 'Ouro branco',
      description: 'Chocolate branco delicioso, perfeito para um doce momento.',
      category: 'Candy',
      pack: '50',
      tags: ['Bombom', 'Chocolate branco'],
      sizeType: 'un',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfclMVBQ9LNTCgGaJj5crDhp49osqzQVOUZdEb',
    },
    {
      name: 'Red Bull 250ml',
      description:
        'Energético mundialmente famoso, ideal para renovar suas energias rapidamente.',
      category: 'NonAlcoholic',
      pack: '18',
      tags: ['Energético', 'Red bull', '250ml', 'Lata'],
      sizeType: 'ml',
      size: '250',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfCs1ZnDdOnRv8qt3ENQ0WUfdFx6VbmirlZgeu',
    },
    {
      name: 'Skol 300ml',
      description:
        'Cerveja leve e refrescante, perfeita para encontros casuais.',
      category: 'Beers',
      pack: '23',
      tags: ['300ml', 'Skol', 'Barrigudinha'],
      sizeType: 'ml',
      size: '300',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfDH3HuQWGORFvfJrNWxbBokZ5SQTCtmyHswz6',
    },
    {
      name: 'Skol 350ml',
      description:
        'Cerveja Skol gelada em lata, leve e refrescante, perfeita para acompanhar seus momentos.',
      category: 'Beers',
      pack: '18',
      tags: ['Skol', '350ml', 'Lata'],
      sizeType: 'ml',
      size: '350',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfAO8qqfrP8Jb1xlV57E2GkvuwMLtc6aeRFQj4',
    },
    {
      name: 'Smirnoff ice 275ml',
      description:
        'Bebida alcoólica sabor limão, levemente gaseificada e doce, ideal para momentos descontraídos.',
      category: 'Spirits',
      pack: '6',
      tags: ['Ice', 'Limão', 'Smirnoff'],
      sizeType: 'ml',
      size: '275',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfqulHvDVcnbxQwC4hILAXmZ6iSy1Wu9evDEHF',
    },
    {
      name: 'Sonho de valsa',
      description:
        'Tradicional bombom de chocolate com recheio cremoso de castanha de caju, doce e irresistível.',
      category: 'Candy',
      pack: '50',
      tags: ['Doce', 'Chocolate', 'Bombom'],
      sizeType: 'un',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfbcTbUwSvaFZKHXL4P3xop0Y7mJ29Mn6TiUz5',
    },
    {
      name: 'Suco Del Valle Abacaxi 1L',
      description:
        'Suco Del Valle sabor abacaxi, refrescante e saboroso, ideal para acompanhar refeições e lanches.',
      category: 'NonAlcoholic',
      pack: '18',
      tags: ['Suco', 'Abacaxi', 'Del Valle'],
      sizeType: 'L',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfwd3a9Qh7SaLsdRCAD0k3VTHe1XIPc6UjiEB9',
    },
    {
      name: 'Suco Del Valle Caju 1L',
      description:
        'Delicioso suco Del Valle sabor caju, equilibrado em sabor e refrescância.',
      category: 'NonAlcoholic',
      pack: '18',
      tags: ['Suco', 'Caju', 'Del Valle'],
      sizeType: 'L',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf0qleGGSPhoGWpmcBZR5OAqSXjyUuisItewdl',
    },
    {
      name: 'Suco Del Valle Maracuja 1L',
      description:
        'Suco Del Valle sabor maracujá, refrescante e ideal para quem aprecia sabores tropicais.',
      category: 'NonAlcoholic',
      pack: '18',
      tags: ['Suco', 'Maracuja', 'Del Valle'],
      sizeType: 'L',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfBCC6DmstgcZoIk2x4FEAyf7peJYNiHVMnvlK',
    },
    {
      name: 'Suco Del Valle Pessego 1L',
      description:
        'Suco Del Valle pêssego, doce na medida certa e refrescante para o dia a dia.',
      category: 'NonAlcoholic',
      pack: '18',
      tags: ['Suco', 'Pessego', 'Del Valle'],
      sizeType: 'L',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfAclN2jP8Jb1xlV57E2GkvuwMLtc6aeRFQj4W',
    },
    {
      name: 'Trident menta',
      description:
        'Chiclete sem açúcar sabor menta refrescante, ótimo para manter o hálito fresco.',
      category: 'Candy',
      pack: '21',
      tags: ['chiclete', 'menta'],
      sizeType: 'un',
      size: '1',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfbok5nowSvaFZKHXL4P3xop0Y7mJ29Mn6TiUz',
    },
    {
      name: 'Heineken long neck ZERO 330ml',
      description:
        'Cerveja Heineken sem álcool, sabor premium tradicional, refrescante e leve.',
      category: 'Beers',
      pack: 24,
      tags: ['zero alcool', 'long neck', 'Heineken'],
      sizeType: 'ml',
      size: '330',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfAtffS3P8Jb1xlV57E2GkvuwMLtc6aeRFQj4W',
    },
    {
      name: 'Ice Cabaré Limão 275 ml',
      description:
        'Bebida alcoólica sabor limão, leve, refrescante e ideal para curtir com amigos.',
      category: 'Spirits',
      pack: '12',
      tags: ['Ice', 'Limão', 'Cabaré'],
      sizeType: 'ml',
      size: '275',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfd1eHuhbEujybQ21NSRmzkHaYXGxBfdOre5Ag',
    },
    {
      name: 'Ice Cabaré Frutas vermelhas 275 ml',
      description:
        'Bebida alcoólica sabor frutas vermelhas, leve, refrescante e ideal para curtir com amigos.',
      category: 'Spirits',
      pack: '12',
      tags: ['Ice', 'Frutas vermelhas', 'Cabaré'],
      sizeType: 'ml',
      size: '275',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIfJ5MJojC9gSYHrpMkaq1X3Oc40dBDy8TWQJRK',
    },
    {
      name: 'Ice Cabaré Frutas Amarelas 275 ml',
      description:
        'Bebida alcoólica sabor frutas amarelas, leve, refrescante e ideal para curtir com amigos.',
      category: 'Spirits',
      pack: '12',
      tags: ['Ice', 'Frutas amarelas', 'Cabaré'],
      sizeType: 'ml',
      size: '275',
      imgUrl:
        'https://utfs.io/f/oK9fzCAtRnIf7zllEV1MbRLaHWp3XVFPnUkisAlDJhr40mS8',
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('Seed concluído com sucesso!');
}

seedProduct()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
