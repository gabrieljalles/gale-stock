Perguntas para o cliente (LEO)
[] - Perguntar para o Leo se o turno da noite pode ser um desconto inferior ao turno da manhã se o cliente atinge a quantidade Mínima de produtos para ter promoção.
[] - Falar para o Leo sobre consumo anterior ao pagamento, precisa estar atrelado a um cliente.
[] - Optei por adicionar o frete na conta final e não, no custo do produto atrelado ao frete ou pagamento de taxas.

Faturamento Bruto -> Valor que o cliente pagou.
Faturamento Líquido -> Dinheiro recebido do cliente. Remoção de Mquininha.
Lucro bruto -> A subtração do Faturamento Líquido pelo Custo

# DOCUMENTAÇÃO

### Regras de negócio:

##### Stock (Estoque):

- (Método de estoque) Foi adotado o COGS para cada venda aliado ao método FIFO.

  - Fácil rastreabilidade
  - Acompanhamento de validade dos produtos.
  - Margem precisa.

- (Rateio de frete e taxas) Eu tinha duas opções para realizar os rateios do frete:
  1. Rateio por quantidade:
     - Dividir os custos da operação entre o quantitativo de produtos.
  2. Rateio por valor:
     - Dividir os custos da operação entre o valor pago por produto.

### API - DOCS:

[ ] - Usar o @nestjs/swagger swagger-ui-express para imprimir a documentação da API.

# BACK-END

Objetivos:

[ ] - Preciso arrumar uma forma de colocar os dados de (Quantidade mínima para produtos com giro pequeno), caso contrário, produtos com pouco giro não conseguem se adequar a metodologia da média ponderada.
[ ] - Melhorar as tags do product seeds para facilitar a pesquisa para o usuário.
[ ] - Criar uma função que verifica uma vez por dia se o produto está em promoção ou não. Todos os dias, 07h.
[ ] - Criar carrinho em andamento. Para o cliente não precisar fazer o pedido novamente se algo aconteceu.
[ ] - Criar uma tabela de rotina de trabalho, que hora que o app funciona e que hora ele não funciona.
[X] - Criar uma função que altera o preço das bebidas em determinado momento, a partir das 23h.
[ ] - Quando o usuário cria uma conta, ele não pode criar contas diferentes de cliente. Os outros modelos são criados por meio de db.
[ ] - Existem variáveis estáticas em orderService (Variáveis de frete, variaveis de compras depois das 23 horas. Quero deixar dinamico para que seja um evento alterável).

O pedido é recebido..
O pedido foi confimado pelo Galé.
O pedido está sendo preparado.
O pedido está esperando o entregador.
O pedido está em rota de entrega.
O pedido Concluído.

Esteira do cliente abrir uma ordem request.

Cliente clica em novo pedido
Cliente navega pela plataforma e adiciona produtos ao carrinho
Cliente escolhe o endereço de entrega
Alguns itens que que podem ser uteis.
Não esqueça do docinho...
Método de pagamento.
Finalizar pedido.

# FRONT-END

### Objetivos:

[ ] Colocar o cache para puxar uma vez por dia os dados de produtos , precisa separar para que o admin consiga puxar todo momento e o usuário, só puxa 1 vez por dia.
Atualização constante para administrador.
