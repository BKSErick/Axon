-- ================================================
-- Central de Gerenciamento — Tabelas Autônomas
-- ================================================

-- 1. TAREFAS
CREATE TABLE IF NOT EXISTS sm_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  tarefa TEXT NOT NULL,
  status TEXT DEFAULT 'A fazer' CHECK (status IN ('A fazer','Em andamento','Feito')),
  prioridade TEXT DEFAULT 'Média' CHECK (prioridade IN ('Alta','Média','Baixa')),
  cliente_nome TEXT,
  data_entrega DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sm_tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_tarefas_user" ON sm_tarefas FOR ALL USING (auth.uid() = user_id);

-- 2. REUNIÕES
CREATE TABLE IF NOT EXISTS sm_reunioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  pauta TEXT NOT NULL,
  status TEXT DEFAULT 'Agendado' CHECK (status IN ('Agendado','Finalizado','Cancelado','Aguardando confirmação')),
  cliente_nome TEXT,
  data TIMESTAMPTZ,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sm_reunioes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_reunioes_user" ON sm_reunioes FOR ALL USING (auth.uid() = user_id);

-- 3. CHECKLIST "Não posso esquecer"
CREATE TABLE IF NOT EXISTS sm_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  texto TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sm_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_checklist_user" ON sm_checklist FOR ALL USING (auth.uid() = user_id);
