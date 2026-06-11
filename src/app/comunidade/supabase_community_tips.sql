-- Tabela community_tips (igual a daily_tips mas para a comunidade)
CREATE TABLE IF NOT EXISTS community_tips (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  short_description TEXT,
  content      TEXT,
  image_url    TEXT,
  category     TEXT,
  is_published BOOLEAN DEFAULT false,
  publish_date DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: qualquer utilizador autenticado pode ler as dicas publicadas
ALTER TABLE community_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_tips_read" ON community_tips
  FOR SELECT USING (is_published = true);

CREATE POLICY "community_tips_admin" ON community_tips
  FOR ALL USING (auth.role() = 'service_role');

-- Index
CREATE INDEX IF NOT EXISTS idx_community_tips_published ON community_tips (is_published, publish_date DESC);

-- Exemplo de dica inicial
INSERT INTO community_tips (title, short_description, content, category, is_published, publish_date)
VALUES (
  'Como identificar uma fuga de água em casa?',
  'Manchas húmidas, contador a subir sem razão ou som de água a correr são sinais de alerta.',
  'As fugas de água podem causar danos graves se não forem detetadas a tempo. Fique atento a: manchas húmidas nas paredes ou tecto, contador de água a registar consumo mesmo sem torneiras abertas, som de água a correr quando tudo está fechado, e aumento inexplicável da fatura da água. Em caso de suspeita, contrate sempre um canalizador verificado.',
  'canalização',
  true,
  CURRENT_DATE
);
