const TermsOfUse = () => {
  const cellphone = process.env.NEXT_PUBLIC_CELLPHONE_SUPPORT;
  const emailSupport = process.env.NEXT_PUBLIC_EMAIL_SUPPORT;
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <p className="p-styled">
          Solicitamos que você leia com atenção os Termos de uso abaixo,
          necessários para a utilização dos serviços e produtos oferecido pela
          empresa Galé. Caso você não concorde com quaisquer dispositivos dos
          Termos de Uso, não acesse ou utilize os nossos sites, aplicativos e/
          ou serviços.
        </p>
        <p className="p-styled">
          Seu acesso e utilização representa sua aceitação integral e
          incondicional aos Termos de Uso. A Política de Privacidade do Grupo
          Galé integra os presentes Termos de Uso. Lembre-se, ainda, que as
          disposições contidas nestes Termos podem ser atualizadas a qualquer
          tempo e a exclusivo critério da empresa Galé, sendo de
          responsabilidade do Usuário verificá-los com frequência.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Objeto e vinculação</h3>
        <p className="p-styled">
          Os Termos e Condições de Uso têm por objeto regular a utilização dos
          sites, aplicativos e serviços do Galé, estabelecendo os direitos e as
          obrigações dos Usuários.
        </p>
        <p className="p-styled">
          Este documento contém informações legais importantes e indispensáveis
          à utilização dos canais, sendo, portanto, obrigatória a sua leitura e
          compreensão por parte do Usuário.
        </p>
        <p className="p-styled">
          A aceitação formal destes Termos se dará no ato do seu registro. Deste
          modo, ao utilizar quaisquer das funcionalidades disponibilizadas nos
          sites, aplicativos, serviços, ou efetuar seu cadastramento para
          utilizar serviços de acesso restrito, o Usuário declara sua plena,
          integral e irrestrita concordância com as condições previstas nestes
          Termos. A aceitação a estes Termos implicará, ainda, a aceitação à
          Política de Privacidade do Grupo Galé.
        </p>
        <p className="p-styled">
          Em caso de qualquer dúvida com relação ao conteúdo desses Termos,
          entre em contato com a Central de Atendimento pelo telefone
          <span className="text-red-500"> {cellphone}</span> ou envie nos um
          e-mail <span className="text-red-500">{emailSupport}</span>
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">
          Regras para utilização de sites, Aplicativos e serviços do Galé
        </h3>
        <p className="p-styled">
          O cadastro no site ou aplicativo é realizado por meio da Internet,
          feito por livre e espontânea vontade do Usuário, condicionado ao
          fornecimento de dados cadastrais, informados durante o preenchimento
          de campos específicos tais como: nome, data de nascimento, endereço,
          CPF, e-mail e telefones para contato, a fim de se cadastrar para
          participar de promoções, mala direta e recebimento de ofertas via SMS,
          PUSH, e-mail marketing, em que o Usuário manifesta o consentimento
          livre, expresso e informado para a coleta, uso, armazenamento,
          tratamento e compartilhamento dos dados, nos termos da Política de
          Privacidade.
        </p>
        <p className="p-styled">
          Para utilizar os sites, aplicativos ou serviços de Wi-Fi da Galé, o
          Usuário deverá ser maior de 18 anos e civilmente capaz, nos moldes da
          legislação civil vigente no Brasil. Não é permitida a utilização por
          menores de 18 anos. No caso de qualquer eventual cadastro de Usuários
          menores de 18 anos, com ou sem permissão de seus pais, tutores ou
          representantes legais, estes serão responsáveis por todos os atos
          praticados pelos menores, na forma da lei. A Galé reserva-se o direito
          de cancelar os cadastros de Usuários que, no ato do registro, tenham
          prestado informações inválidas ou fraudulentas, especialmente no que
          diz respeito à idade e à capacidade civil.
        </p>
        <p className="p-styled">
          Cada Usuário deve ter apenas um cadastro junto aos canais digitais do
          Galé. Caso verifiquemos que o Usuário possui cadastro duplicado,
          iremos cancelar todos os cadastros do Usuário e este poderá ser
          impedido de se cadastrar novamente em nossos sistemas.
        </p>
        <p className="p-styled">
          Só será confirmado o cadastro do Usuário que preencher todos os campos
          obrigatórios. O Usuário se compromete a fornecer apenas dados e
          informações verdadeiras. Assim, o Usuário garante a autenticidade de
          toda informação e dados fornecidos, se responsabilizando civil e
          criminalmente por qualquer inexatidão que venha a causar prejuízos ao
          Galé ou a terceiros em razão de seu cadastro fraudulento nos sites,
          aplicativos, se obrigando, ainda, a manter seus dados e informações
          constantemente atualizadas, sempre que houver alterações.
        </p>
        <p className="p-styled">
          O Galé reserva-se o direito de utilizar todos os meios válidos e
          possíveis para identificar o Usuário, bem como de solicitar dados
          adicionais e documentos que estime serem pertinentes a fim de conferir
          os dados pessoais informados. Para mais informações acerca de como os
          dados coletados serão tratados verifique a Política de Privacidade.
        </p>
        <p className="p-styled">
          O Usuário é o único responsável pelas atividades que ocorrem em seu
          cadastro e login, portanto, deverá guardar sua senha de acesso em
          local seguro. O Usuário deve notificar o Galé imediatamente sobre
          qualquer violação de segurança, perda de senha ou uso não autorizado
          de seu cadastro. O Usuário será o único responsável pelas operações
          efetuadas em sua conta, ainda que o Usuário tenha confiado a sua senha
          a terceiros.
        </p>
      </div>
    </div>
  );
};

export default TermsOfUse;
