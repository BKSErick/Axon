import React, { useState, useEffect, useCallback, useRef } from 'react';
import { C } from '../../data/db';
import { supabase } from '../../lib/supabase';
import {
  RefreshCw, Plus, ChevronDown, Loader2, Trash2, Edit3, Check, X,
  Calendar as CalIcon, Clock, Square, CheckSquare, MoreHorizontal,
  ListTodo, Users, Video, Lightbulb, GripVertical
} from 'lucide-react';

// ==========================================
// CENTRAL DE GERENCIAMENTO — Autônoma (Supabase)
// ==========================================

// ---- Notion-inspired color helpers ----
const tagColors = {
  'A fazer':    { bg: 'rgba(217,115,13,.18)', color: '#D9730D' },
  'Em andamento': { bg: 'rgba(82,156,202,.18)', color: '#529CCA' },
  'Feito':      { bg: 'rgba(77,171,154,.18)', color: '#4DAB9A' },
  'Alta':       { bg: 'rgba(224,62,62,.18)',  color: '#E03E3E' },
  'Média':      { bg: 'rgba(223,171,1,.18)',  color: '#DFAB01' },
  'Media':      { bg: 'rgba(223,171,1,.18)',  color: '#DFAB01' },
  'Baixa':      { bg: 'rgba(82,156,202,.18)', color: '#529CCA' },
  'Agendado':   { bg: 'rgba(82,156,202,.18)', color: '#529CCA' },
  'Finalizado': { bg: 'rgba(77,171,154,.18)', color: '#4DAB9A' },
  'Cancelado':  { bg: 'rgba(120,119,116,.18)',color: '#787774' },
  'Aguardando confirmação': { bg: 'rgba(144,101,176,.18)', color: '#9065B0' },
};

const Tag = ({ label }) => {
  if (!label) return null;
  const c = tagColors[label] || { bg: 'rgba(120,119,116,.15)', color: '#9B9A97' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 3, fontSize: 12, fontWeight: 500, lineHeight: '20px',
      background: c.bg, color: c.color, whiteSpace: 'nowrap',
      cursor: 'pointer', userSelect: 'none',
    }}>{label}</span>
  );
};

const StatusSelect = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <Tag label={value} />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 999,
          background: '#2D2D2D', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 6, padding: 4, minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
        }}>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
                fontSize: 13, color: '#E8E8E8', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background .1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Tag label={opt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const InlineInput = ({ value, onSave, placeholder, style: customStyle }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => { setVal(value || ''); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = () => {
    setEditing(false);
    if (val.trim() !== (value || '')) onSave(val.trim());
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        style={{
          fontSize: 14, color: value ? '#E8E8E8' : '#6B6B6B',
          cursor: 'text', padding: '2px 4px', borderRadius: 3,
          transition: 'background .1s', ...customStyle,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        {value || placeholder || 'Clique para editar'}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value || ''); setEditing(false); } }}
      placeholder={placeholder}
      style={{
        background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 4, padding: '3px 8px', fontSize: 14, color: '#E8E8E8',
        outline: 'none', width: '100%', ...customStyle,
      }}
    />
  );
};

const SectionTitle = ({ icon: Icon, iconColor, title, count, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 0 8px', marginBottom: 2,
  }}>
    {Icon && <Icon size={18} color={iconColor || '#9B9A97'} />}
    <span style={{ fontSize: 15, fontWeight: 700, color: '#E8E8E8', letterSpacing: '-.3px' }}>
      {title}
    </span>
    {count != null && (
      <span style={{
        fontSize: 11, fontWeight: 600, color: '#9B9A97',
        background: 'rgba(255,255,255,.06)', padding: '1px 8px', borderRadius: 10,
      }}>
        {count}
      </span>
    )}
    <div style={{ flex: 1 }} />
    {children}
  </div>
);

// ==========================================
// TAREFAS
// ==========================================
const TarefasSection = ({ tarefas, loading, onAdd, onUpdate, onDelete }) => {
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);

  const filtered = filter === 'all' ? tarefas :
    tarefas.filter(t => t.status === filter);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    await onAdd(newTask.trim());
    setNewTask('');
    setAdding(false);
  };

  const statusOpts = ['A fazer', 'Em andamento', 'Feito'];
  const prioOpts = ['Alta', 'Média', 'Baixa'];

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionTitle icon={ListTodo} iconColor="#529CCA" title="Tarefas" count={tarefas.length}>
        <div style={{ display: 'flex', gap: 2 }}>
          {[{ id: 'all', label: 'Todas' }, ...statusOpts.map(s => ({ id: s, label: s }))].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                background: filter === f.id ? 'rgba(255,255,255,.1)' : 'transparent',
                color: filter === f.id ? '#E8E8E8' : '#9B9A97',
                border: 'none', cursor: 'pointer',
              }}
            >{f.label}</button>
          ))}
        </div>
      </SectionTitle>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '120px 1fr 100px 140px 40px',
        borderBottom: '1px solid rgba(255,255,255,.06)', padding: '6px 4px',
      }}>
        {['Status', 'Tarefa', 'Prioridade', 'Cliente', ''].map((h, i) => (
          <div key={i} style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>{h}</div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <Loader2 size={18} style={{ color: '#6B6B6B', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {filtered.map(t => (
            <div
              key={t.id}
              style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 100px 140px 40px',
                borderBottom: '1px solid rgba(255,255,255,.04)', padding: '5px 4px',
                alignItems: 'center', transition: 'background .1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div>
                <StatusSelect
                  value={t.status}
                  options={statusOpts}
                  onChange={s => onUpdate(t.id, { status: s })}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div
                  onClick={() => onUpdate(t.id, { status: t.status === 'Feito' ? 'A fazer' : 'Feito' })}
                  style={{ cursor: 'pointer', flexShrink: 0, display: 'flex' }}
                >
                  {t.status === 'Feito'
                    ? <CheckSquare size={15} style={{ color: '#4DAB9A' }} />
                    : <Square size={15} style={{ color: '#6B6B6B' }} />
                  }
                </div>
                <InlineInput
                  value={t.tarefa}
                  onSave={v => onUpdate(t.id, { tarefa: v })}
                  style={{
                    textDecoration: t.status === 'Feito' ? 'line-through' : 'none',
                    color: t.status === 'Feito' ? '#6B6B6B' : '#E8E8E8',
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                />
              </div>
              <div>
                <StatusSelect
                  value={t.prioridade || 'Média'}
                  options={prioOpts}
                  onChange={p => onUpdate(t.id, { prioridade: p })}
                />
              </div>
              <div>
                <InlineInput
                  value={t.cliente_nome}
                  onSave={v => onUpdate(t.id, { cliente_nome: v })}
                  placeholder="Cliente"
                  style={{ fontSize: 13, color: '#9B9A97' }}
                />
              </div>
              <div>
                <button
                  onClick={() => onDelete(t.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6B6B6B', padding: 4, borderRadius: 4, display: 'flex',
                    opacity: 0.4, transition: 'opacity .15s',
                  }}
                  title="Excluir"
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#E03E3E'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0.4; e.currentTarget.style.color = '#6B6B6B'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add new row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 4px', borderBottom: '1px solid rgba(255,255,255,.04)',
          }}>
            <Plus size={14} style={{ color: '#6B6B6B', flexShrink: 0 }} />
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Nova tarefa..."
              disabled={adding}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, color: '#9B9A97', padding: '2px 0',
              }}
            />
            {adding && <Loader2 size={14} style={{ color: '#6B6B6B', animation: 'spin 1s linear infinite' }} />}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// CLIENTES (da tabela clients existente)
// ==========================================
const ClientesSection = ({ clientes, loading }) => {
  const colors = ['#E03E3E', '#D9730D', '#4DAB9A', '#529CCA', '#9065B0', '#AD1A72', '#DFAB01'];
  const getColor = (name) => {
    if (!name) return colors[0];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionTitle icon={Users} iconColor="#9065B0" title="Clientes" count={clientes.length} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <Loader2 size={18} style={{ color: '#6B6B6B', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
        }}>
          {clientes.map(cl => {
            const color = getColor(cl.name);
            return (
              <div
                key={cl.id}
                style={{
                  borderRadius: 8, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,.06)',
                  background: '#1E1E1E',
                  cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1E1E1E'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'; }}
              >
                <div style={{
                  height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${color}12`,
                }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color, opacity: .6 }}>
                    {(cl.name || '?').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#E8E8E8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 2,
                  }}>
                    {cl.name || '(sem nome)'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==========================================
// CHECKLIST "Não posso esquecer"
// ==========================================
const ChecklistSection = ({ items, loading, onAdd, onToggle, onUpdate, onDelete }) => {
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    await onAdd(newItem.trim());
    setNewItem('');
    setAdding(false);
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionTitle icon={Lightbulb} iconColor="#DFAB01" title="Não posso esquecer" count={items.filter(i => !i.checked).length} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Loader2 size={16} style={{ color: '#6B6B6B', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '4px 4px', borderRadius: 4,
                transition: 'background .1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.querySelector('.del-btn').style.opacity = 1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.querySelector('.del-btn').style.opacity = 0; }}
            >
              <div
                onClick={() => onToggle(item.id, !item.checked)}
                style={{ cursor: 'pointer', paddingTop: 2, flexShrink: 0, display: 'flex' }}
              >
                {item.checked
                  ? <CheckSquare size={16} style={{ color: '#529CCA' }} />
                  : <Square size={16} style={{ color: '#6B6B6B' }} />
                }
              </div>
              <InlineInput
                value={item.texto}
                onSave={v => onUpdate(item.id, { texto: v })}
                style={{
                  flex: 1,
                  textDecoration: item.checked ? 'line-through' : 'none',
                  color: item.checked ? '#6B6B6B' : '#E8E8E8',
                  fontSize: 14, lineHeight: '20px',
                }}
              />
              <button
                className="del-btn"
                onClick={() => onDelete(item.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6B6B6B', padding: 2, opacity: 0, transition: 'opacity .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E03E3E'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B'; }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add new */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px' }}>
            <Plus size={14} style={{ color: '#6B6B6B', flexShrink: 0 }} />
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Novo item..."
              disabled={adding}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, color: '#9B9A97', padding: '2px 0',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// REUNIÕES
// ==========================================
const ReunioesSection = ({ reunioes, loading, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pauta: '', cliente_nome: '', data: '', link: '' });

  const handleAdd = async () => {
    if (!form.pauta.trim()) return;
    await onAdd({
      ...form,
      data: form.data || null,
      link: form.link || null,
    });
    setForm({ pauta: '', cliente_nome: '', data: '', link: '' });
    setShowForm(false);
  };

  const statusOpts = ['Agendado', 'Finalizado', 'Cancelado', 'Aguardando confirmação'];

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionTitle icon={Video} iconColor="#4DAB9A" title="Reuniões" count={reunioes.length}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
            background: '#2E8B6E', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Nova
        </button>
      </SectionTitle>

      {/* Add form */}
      {showForm && (
        <div style={{
          padding: 14, borderRadius: 8, marginBottom: 10,
          background: '#1E1E1E', border: '1px solid rgba(255,255,255,.08)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              value={form.pauta}
              onChange={e => setForm({ ...form, pauta: e.target.value })}
              placeholder="Pauta da reunião"
              style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#E8E8E8', outline: 'none',
              }}
            />
            <input
              value={form.cliente_nome}
              onChange={e => setForm({ ...form, cliente_nome: e.target.value })}
              placeholder="Cliente (opcional)"
              style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#E8E8E8', outline: 'none',
              }}
            />
            <input
              type="datetime-local"
              value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value })}
              style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#E8E8E8', outline: 'none',
                colorScheme: 'dark',
              }}
            />
            <input
              value={form.link}
              onChange={e => setForm({ ...form, link: e.target.value })}
              placeholder="Link da reunião (opcional)"
              style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#E8E8E8', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '5px 14px', borderRadius: 4, fontSize: 12,
                background: 'transparent', border: '1px solid rgba(255,255,255,.1)',
                color: '#9B9A97', cursor: 'pointer',
              }}
            >Cancelar</button>
            <button
              onClick={handleAdd}
              style={{
                padding: '5px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                background: '#2E8B6E', border: 'none', color: '#fff', cursor: 'pointer',
              }}
            >Criar reunião</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Loader2 size={16} style={{ color: '#6B6B6B', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : reunioes.length === 0 ? (
        <div style={{ padding: '12px 4px', color: '#6B6B6B', fontSize: 13 }}>
          Nenhuma reunião agendada
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reunioes.map(r => (
            <div
              key={r.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 6px', borderRadius: 4,
                transition: 'background .1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.querySelector('.r-del').style.opacity = 1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.querySelector('.r-del').style.opacity = 0; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 500, color: '#E8E8E8',
                  marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  📄 {r.pauta || 'Nova Reunião'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <StatusSelect
                    value={r.status}
                    options={statusOpts}
                    onChange={s => onUpdate(r.id, { status: s })}
                  />
                  {r.cliente_nome && (
                    <span style={{ fontSize: 12, color: '#9B9A97' }}>👤 {r.cliente_nome}</span>
                  )}
                  {r.data && (
                    <span style={{ fontSize: 12, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} />
                      {new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {r.link && (
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12, color: '#529CCA', textDecoration: 'underline',
                        textUnderlineOffset: 2,
                      }}
                    >
                      Entrar
                    </a>
                  )}
                </div>
              </div>
              <button
                className="r-del"
                onClick={() => onDelete(r.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6B6B6B', padding: 4, opacity: 0, transition: 'opacity .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E03E3E'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B'; }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN DASHBOARD
// ==========================================
const NotionDashboard = () => {
  const [tarefas, setTarefas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState({ tarefas: true, clientes: true, reunioes: true, checklist: true });

  // ---- Data loading ----
  const loadTarefas = useCallback(async () => {
    setLoading(p => ({ ...p, tarefas: true }));
    const { data } = await supabase.from('sm_tarefas').select('*').order('created_at', { ascending: false });
    setTarefas(data || []);
    setLoading(p => ({ ...p, tarefas: false }));
  }, []);

  const loadClientes = useCallback(async () => {
    setLoading(p => ({ ...p, clientes: true }));
    const { data } = await supabase.from('clients').select('id, name').order('name');
    setClientes(data || []);
    setLoading(p => ({ ...p, clientes: false }));
  }, []);

  const loadReunioes = useCallback(async () => {
    setLoading(p => ({ ...p, reunioes: true }));
    const { data } = await supabase.from('sm_reunioes').select('*').order('data', { ascending: true });
    setReunioes(data || []);
    setLoading(p => ({ ...p, reunioes: false }));
  }, []);

  const loadChecklist = useCallback(async () => {
    setLoading(p => ({ ...p, checklist: true }));
    const { data } = await supabase.from('sm_checklist').select('*').order('ordem').order('created_at');
    setChecklist(data || []);
    setLoading(p => ({ ...p, checklist: false }));
  }, []);

  const loadAll = useCallback(() => {
    loadTarefas(); loadClientes(); loadReunioes(); loadChecklist();
  }, [loadTarefas, loadClientes, loadReunioes, loadChecklist]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ---- CRUD: Tarefas ----
  const addTarefa = async (tarefa) => {
    await supabase.from('sm_tarefas').insert({ tarefa });
    loadTarefas();
  };
  const updateTarefa = async (id, updates) => {
    await supabase.from('sm_tarefas').update(updates).eq('id', id);
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteTarefa = async (id) => {
    await supabase.from('sm_tarefas').delete().eq('id', id);
    setTarefas(prev => prev.filter(t => t.id !== id));
  };

  // ---- CRUD: Reuniões ----
  const addReuniao = async (data) => {
    await supabase.from('sm_reunioes').insert(data);
    loadReunioes();
  };
  const updateReuniao = async (id, updates) => {
    await supabase.from('sm_reunioes').update(updates).eq('id', id);
    setReunioes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  const deleteReuniao = async (id) => {
    await supabase.from('sm_reunioes').delete().eq('id', id);
    setReunioes(prev => prev.filter(r => r.id !== id));
  };

  // ---- CRUD: Checklist ----
  const addChecklistItem = async (texto) => {
    const maxOrdem = checklist.length > 0 ? Math.max(...checklist.map(c => c.ordem || 0)) + 1 : 0;
    await supabase.from('sm_checklist').insert({ texto, ordem: maxOrdem });
    loadChecklist();
  };
  const toggleChecklistItem = async (id, checked) => {
    await supabase.from('sm_checklist').update({ checked }).eq('id', id);
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked } : c));
  };
  const updateChecklistItem = async (id, updates) => {
    await supabase.from('sm_checklist').update(updates).eq('id', id);
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteChecklistItem = async (id) => {
    await supabase.from('sm_checklist').delete().eq('id', id);
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div style={{
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      color: '#E8E8E8',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, padding: '0 4px',
      }}>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
            margin: 0, lineHeight: 1.2,
          }}>
            💻 Central de Gerenciamento
          </h1>
          <p style={{ color: '#6B6B6B', fontSize: 13, margin: '4px 0 0' }}>
            Gerencie tarefas, reuniões e lembretes da sua equipe
          </p>
        </div>
        <button
          onClick={loadAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 6,
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
            color: '#9B9A97', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {/* 2-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 40,
        alignItems: 'start',
      }}>
        {/* LEFT COLUMN */}
        <div>
          <TarefasSection
            tarefas={tarefas}
            loading={loading.tarefas}
            onAdd={addTarefa}
            onUpdate={updateTarefa}
            onDelete={deleteTarefa}
          />
          <ClientesSection clientes={clientes} loading={loading.clientes} />
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <ChecklistSection
            items={checklist}
            loading={loading.checklist}
            onAdd={addChecklistItem}
            onToggle={toggleChecklistItem}
            onUpdate={updateChecklistItem}
            onDelete={deleteChecklistItem}
          />
          <ReunioesSection
            reunioes={reunioes}
            loading={loading.reunioes}
            onAdd={addReuniao}
            onUpdate={updateReuniao}
            onDelete={deleteReuniao}
          />
        </div>
      </div>

      {/* CSS for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NotionDashboard;
