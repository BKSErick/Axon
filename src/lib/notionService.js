import { supabase } from './supabase';

// ==========================================
// NOTION SERVICE — Communication with Edge Function
// ==========================================

const NOTION_DB_IDS = {
  reunioes: '136fae2f-4abd-8266-b431-01d972301fda',
  clientes: '2ecfae2f-4abd-837a-a506-818ab0301083',
  tarefas: '598fae2f-4abd-821b-9ce1-81d9b82a8823',
  conteudos: 'af8fae2f-4abd-8291-bc8c-812ff11f213a',
};

const NOTION_PAGE_IDS = {
  central: '18dfae2f-4abd-827e-a115-8101c4d21787',
  bancoIdeias: '7a6fae2f-4abd-823b-95c6-811311c6fbce',
  esteiraProducao: '769fae2f-4abd-8241-a733-81c6fca054cb',
  meusClientes: '05afae2f-4abd-82f9-8a21-018e1e7e2c02',
  reunioes: 'e1efae2f-4abd-827c-a778-0142b18df821',
  tarefas: '0c6fae2f-4abd-833d-85cb-815d5ae41ba1',
};

async function callNotionProxy(payload) {
  const { data, error } = await supabase.functions.invoke('notion-proxy', {
    body: payload,
  });
  if (error) throw error;
  if (data?.object === 'error') throw new Error(data.message || 'Notion API error');
  return data;
}

// ---- Database Queries ----

export async function queryDatabase(dbKey, filter = null, sorts = null, pageSize = 100) {
  const database_id = NOTION_DB_IDS[dbKey] || dbKey;
  return callNotionProxy({
    action: 'query_database',
    database_id,
    filter,
    sorts,
    page_size: pageSize,
  });
}

export async function getPage(pageId) {
  return callNotionProxy({ action: 'get_page', page_id: pageId });
}

export async function getBlocks(blockId, pageSize = 100) {
  return callNotionProxy({ action: 'get_blocks', block_id: blockId, page_size: pageSize });
}

export async function createPage(dbKey, properties) {
  const database_id = NOTION_DB_IDS[dbKey] || dbKey;
  return callNotionProxy({
    action: 'create_page',
    parent: { database_id },
    properties,
  });
}

export async function updatePage(pageId, properties) {
  return callNotionProxy({
    action: 'update_page',
    page_id: pageId,
    properties,
  });
}

// ---- Helper: Extract plain text from Notion rich_text ----
export function extractText(richTextArr) {
  if (!richTextArr || !Array.isArray(richTextArr)) return '';
  return richTextArr.map(rt => rt.plain_text || '').join('');
}

// ---- Helper: Extract property value ----
export function extractProp(page, propName) {
  const prop = page.properties?.[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
      return extractText(prop.title);
    case 'rich_text':
      return extractText(prop.rich_text);
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select?.map(s => s.name) || [];
    case 'date':
      return prop.date?.start || null;
    case 'checkbox':
      return prop.checkbox;
    case 'number':
      return prop.number;
    case 'url':
      return prop.url;
    case 'status':
      return prop.status?.name || null;
    case 'relation':
      return prop.relation?.map(r => r.id) || [];
    case 'files':
      return prop.files?.map(f => f.file?.url || f.external?.url || '').filter(Boolean) || [];
    default:
      return null;
  }
}

// ---- Helper: Format Notion pages into clean data ----
export function formatPages(results, propsMap) {
  return (results || []).map(page => {
    const item = { id: page.id };
    for (const [key, notionProp] of Object.entries(propsMap)) {
      item[key] = extractProp(page, notionProp);
    }
    return item;
  });
}

// ---- Pre-built queries ----

export async function fetchTarefas() {
  const data = await queryDatabase('tarefas', null, [
    { property: 'Data', direction: 'descending' },
  ]);
  return formatPages(data.results, {
    tarefa: 'Tarefa',
    cliente: 'Cliente',
    conteudo: 'Conteúdo',
    data: 'Data',
    prioridade: 'Prioridade',
    status: 'Status',
  });
}

export async function fetchClientes() {
  const data = await queryDatabase('clientes', null, [
    { property: 'Name', direction: 'ascending' },
  ]);
  return formatPages(data.results, {
    name: 'Name',
    etapa: 'Etapa',
    frequencia: 'Frequência mensal',
    logotipo: 'Logotipo',
    status: 'Status',
  });
}

export async function fetchReunioes() {
  const data = await queryDatabase('reunioes', null, [
    { property: 'Data', direction: 'descending' },
  ]);
  return formatPages(data.results, {
    cliente: 'Cliente',
    data: 'Data',
    link: 'Link da sala',
    pauta: 'Pauta',
    status: 'Status',
  });
}

export async function fetchConteudos() {
  const data = await queryDatabase('conteudos', null, [
    { property: 'Data', direction: 'descending' },
  ], 30);
  return formatPages(data.results, {
    conteudo: 'Conteúdo',
    cliente: 'Cliente',
    data: 'Data',
    formato: 'Formato',
    status: 'Status',
    producao: 'Produção',
    link: 'Link',
    objetivo: 'Objetivo',
  });
}

export { NOTION_DB_IDS, NOTION_PAGE_IDS };
