-- ============================================================
-- BLINDAGEM DO VÍNCULO DE INDICAÇÃO
-- ============================================================
--
-- Uma pessoa só pode ser indicada por UMA pessoa, e esse vínculo nasce
-- junto com a conta. A coluna já é única por natureza (User.referredById
-- é um campo só, não uma tabela de ligação), e hoje o único código que a
-- escreve é o cadastro. Isto aqui fecha o resto: nada no banco impedia um
-- UPDATE de trocar o padrinho depois, e é justamente esse vínculo que
-- decide quem recebe pontos da rede — remanejá-lo reescreveria a comissão
-- de compras que já aconteceram.
--
-- A regra é aplicada no banco, e não só no serviço, porque a garantia
-- precisa valer também para script de manutenção, correção manual e
-- qualquer rota futura que alguém escreva sem lembrar desta regra.

CREATE OR REPLACE FUNCTION protect_user_referral() RETURNS TRIGGER AS $$
BEGIN
  -- Ninguém é o próprio padrinho. No cadastro isso é impossível (a conta
  -- ainda não existe quando o código é resolvido), mas uma escrita direta
  -- criaria um ciclo de tamanho 1 na árvore de pontos.
  IF NEW."referredById" IS NOT NULL AND NEW."referredById" = NEW."id" THEN
    RAISE EXCEPTION
      'Usuário % não pode ser indicado por si mesmo.', NEW."id"
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Trocar de padrinho: bloqueado. É o caso que o programa de pontos
    -- não pode admitir — dois padrinhos para a mesma pessoa ao longo do
    -- tempo, cada um com direito a uma fatia diferente do mesmo consumo.
    IF OLD."referredById" IS NOT NULL
       AND NEW."referredById" IS NOT NULL
       AND NEW."referredById" <> OLD."referredById" THEN
      RAISE EXCEPTION
        'O vínculo de indicação de % já existe e não pode ser alterado.', NEW."id"
        USING ERRCODE = 'check_violation';
    END IF;

    -- Ganhar um padrinho depois do cadastro: também bloqueado. O vínculo
    -- vale desde o primeiro dia da conta; atribuí-lo mais tarde daria
    -- direito retroativo sobre compras que já foram pontuadas.
    IF OLD."referredById" IS NULL AND NEW."referredById" IS NOT NULL THEN
      RAISE EXCEPTION
        'O vínculo de indicação de % só pode ser definido no cadastro.', NEW."id"
        USING ERRCODE = 'check_violation';
    END IF;

    -- Perder o padrinho (não nulo -> nulo) segue permitido de propósito:
    -- é o que a própria chave estrangeira faz (ON DELETE SET NULL) quando
    -- um padrinho é removido. Bloquear aqui impediria a exclusão dele.
    -- Como voltar a ter padrinho é proibido pela regra acima, soltar o
    -- vínculo é definitivo — não vira uma porta para trocar de padrinho.
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_referral_guard ON "User";

CREATE TRIGGER user_referral_guard
  BEFORE INSERT OR UPDATE OF "referredById" ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION protect_user_referral();
