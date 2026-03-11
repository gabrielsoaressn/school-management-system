# 🎨 Design System - Gestão Escolar

## Paleta de Cores Profissional

### 🔵 Azul Corporativo (Primary)
```tsx
// Botões de ação primária
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Salvar
</button>

// Links e texto em destaque
<span className="text-primary">Ver detalhes</span>
```

### ⚪ Neutros (Backgrounds & Text)
```tsx
// Background da página
<div className="bg-background">...</div>

// Cards e superfícies
<div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm">
  Card content
</div>

// Texto secundário/auxiliar
<p className="text-muted-foreground">Texto auxiliar</p>
```

### 🟢 Status Colors (Semântico)
```tsx
// Success (confirmação, aprovado)
<span className="bg-success text-success-foreground">✓ Aprovado</span>

// Warning (alerta, aguardando)
<span className="bg-warning text-warning-foreground">⚠ Aguardando</span>

// Error (erro, rejeitado)
<span className="bg-destructive text-destructive-foreground">✗ Erro</span>

// Info (informação)
<span className="bg-info text-info-foreground">ℹ Informação</span>
```

---

## 🎯 Regras de UX

### Botões
```tsx
// ✅ CORRETO - Botão primário (ação principal da tela)
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-semibold">
  Salvar Aluno
</button>

// ✅ CORRETO - Botão secundário (ações secundárias)
<button className="border border-border text-foreground hover:bg-secondary px-6 py-2 rounded-lg">
  Cancelar
</button>

// ✅ CORRETO - Botão de voltar (sempre no canto superior esquerdo)
<button className="text-muted-foreground hover:text-foreground">
  ← Voltar
</button>

// ❌ ERRADO - Múltiplos botões primários na mesma tela
<button className="bg-primary">Salvar</button>
<button className="bg-primary">Excluir</button> <!-- Deve ser bg-destructive -->
```

### Cards e Tabelas
```tsx
// ✅ Card padrão com sombra sutil
<div className="bg-card border border-border rounded-lg shadow-sm p-6">
  <h3 className="text-xl font-semibold mb-4">Título do Card</h3>
  <p className="text-muted-foreground">Conteúdo...</p>
</div>

// ✅ Tabela com header destacado
<table className="w-full">
  <thead className="bg-muted">
    <tr>
      <th className="p-3 text-left font-semibold">Nome</th>
    </tr>
  </thead>
  <tbody className="bg-card">
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="p-3">João Silva</td>
    </tr>
  </tbody>
</table>
```

### Formulários
```tsx
// ✅ Input com foco azul
<input
  className="border border-input bg-card px-4 py-2 rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
  placeholder="Digite o nome..."
/>

// ✅ Label clara
<label className="text-sm font-medium text-foreground mb-1 block">
  Nome completo
</label>
```

---

## 📐 Espaçamento Consistente

```tsx
// Padding interno de cards
p-6 (24px)

// Margin entre seções
mb-6 (24px)

// Gap entre elementos
gap-4 (16px)

// Padding de botões
px-6 py-2 (24px horizontal, 8px vertical)
```

---

## 🔄 Antes e Depois

### ❌ Antes (Problemas)
```tsx
// Cores inconsistentes
<button className="bg-black">Salvar</button>
<button className="bg-gray-800">Cancelar</button>
<button className="bg-gray-600">Voltar</button>

// Sem hierarquia
<h1 className="text-gray-900">Dashboard</h1>
<p className="text-gray-600">Dados gerais</p>
```

### ✅ Depois (Novo Design System)
```tsx
// Cores semânticas claras
<button className="bg-primary text-primary-foreground">Salvar</button>
<button className="border border-border hover:bg-secondary">Cancelar</button>
<button className="text-muted-foreground hover:text-foreground">← Voltar</button>

// Hierarquia definida
<h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
<p className="text-muted-foreground">Dados gerais do sistema</p>
```

---

## 🚀 Próximos Passos

**Passo 2:** Refatorar Layout Base (Sidebar, Header, Wrapper)
**Passo 3:** Componentes Comuns (Botão, Input, Tabela)
**Passo 4:** Páginas (Dashboard, CRUDs)

---

**Última atualização:** Passo 1 completo ✅
