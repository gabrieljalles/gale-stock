Perguntas para o cliente (LEO)

[] - Falar para o Leo sobre consumo anterior ao pagamento, precisa estar atrelado a um cliente.
[] - Explicar o Pack (na hora de criar um novo produto)

Receita líquida (RL) = (RB) - Imposto (0,04\*FB (Valor alterável))

Lucro bruto -> A subtração do Faturamento Líquido pelo Custo de produção

### DRE

- = Receita bruta (RB) -> Valor que o cliente pagou.
- (-) Deduções de vendas (taxas de apps, maquininha, devoluções, descontos)
- (=) Receita líquida de vendas -> O real dinheiro que entra no caixa.

##### Custos variáveis

- (-) Custo de mercadoria vendida (CMV)
- (-) Perdas com estoque (quebras, furtos, vencimentos)
- (=) Lucro bruto

##### Despesas operacionais

- (-) Despesas com entregadores (fixo - variáveis)
- (-) Marketing digital (anúncios, promoções)
- (-) Aluguel
- (-) Energia, água e internet
- (-) Despesas administrativas (sistema, contador, taxas bancárias)
- (=) Resultado Operacional

##### Despesas financeiros

- (-) Juros de Empréstimos (apenas juros)
- (=) Resultado antes do IR/CSLL

##### Tributação sobre o lucro

- (-) IRPJ + CSLL
- = Lucro Líquido do exercício

# ⚙️ PARAMETROS DO SISTEMA

- 🚚 Frete de entrega (6 reais)
- 🌜 Preço noturno (0.9) -> Não programado.
- 🛍️ Preço Ifood = (0.7) \* Preço de liquidação.

# BACK-END

#Deixei o enableCors aberto para todos os domínios do front. precisa fechar depois somente com o domínio do gale na pagin main.ts do backend.
app.enableCors({
origin: 'http://localhost:3001',
methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
credentials: true,
});

Objetivos:

- [] Criar um produto
- [] Criar um fornecedor
- [] Criar um estoque
- [] Criar uma perda
- [] Criar um cliente
- [] Criar uma venda

[ ] - Criei uma coluna de isPrimary para userAddress para que ele diga qual o seu endereço principal. (Ainda não programado no backend, nem mesmo o repository).
[ ] - Preciso arrumar uma forma de colocar os dados de (Quantidade mínima para produtos com giro pequeno), caso contrário, produtos com pouco giro não conseguem se adequar a metodologia da média ponderada.
[ ] - Melhorar as tags do product seeds para facilitar a pesquisa para o usuário.
[ ] - Criar uma função que verifica uma vez por dia se o produto está em promoção ou não. Todos os dias, 07h.
[ ] - Criar carrinho em andamento. Para o cliente não precisar fazer o pedido novamente se algo aconteceu.
[ ] - Criar uma tabela de rotina de trabalho, que hora que o app funciona e que hora ele não funciona.
[X] - Criar uma função que altera o preço das bebidas em determinado momento, a partir das 23h.
[ ] - Quando o usuário cria uma conta, ele não pode criar contas diferentes de cliente. Os outros modelos são criados por meio de db.
[ ] - Existem variáveis estáticas em orderService (Variáveis de frete, variaveis de compras depois das 23 horas. Quero deixar dinamico para que seja um evento alterável).
[ ] - Criar um script que apaga usuários que não validaram seus e-mails em 7 dias.

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

[ ] Colocar o cache para puxar uma vez por dia os dados de produtos , precisa separar para que o admin consiga puxar todo momento e o usuário, só puxa 1 vez por dia. Atualização constante para administrador.
[ ] Cria página de privacy-policies e terms-of-use.(Alterar o sendVerificationEmail - no backend)

# E-MAIL VERIFICATION:

[ ] Alterar os links do corpo do e-mail -> instagram | Políticas de privacidade | Termos de uso |
