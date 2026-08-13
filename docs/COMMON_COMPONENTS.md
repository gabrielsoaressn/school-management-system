# 🎨 Componentes Comuns - Guia de Uso

## Componentes Criados (Passo 3)

### 1. Table (Sistema de Tabelas)

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow hover>
      <TableCell>João Silva</TableCell>
      <TableCell>joao@email.com</TableCell>
      <TableCell>
        <Badge variant="success">Ativo</Badge>
      </TableCell>
    </TableRow>
    <TableRow hover selected>
      <TableCell>Maria Santos</TableCell>
      <TableCell>maria@email.com</TableCell>
      <TableCell>
        <Badge variant="warning">Pendente</Badge>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

**Características:**

- ✅ Header com fundo destacado (bg-muted)
- ✅ Bordas sutis entre linhas
- ✅ Hover effect opcional
- ✅ Suporte para linhas selecionadas
- ✅ Scroll horizontal automático
- ✅ Bordas arredondadas

---

### 2. Input (Campo de Texto)

```tsx
import Input from "@/components/ui/Input";

// Input básico
<Input
  label="Nome completo"
  placeholder="Digite seu nome..."
  required
/>

// Com erro de validação
<Input
  label="Email"
  type="email"
  error="Email inválido"
/>

// Com texto auxiliar
<Input
  label="CPF"
  helperText="Apenas números"
/>

// Full width
<Input
  label="Endereço"
  fullWidth
/>
```

**Props:**

- `label` - Label do campo
- `error` - Mensagem de erro (muda a borda para vermelho)
- `helperText` - Texto auxiliar (abaixo do input)
- `fullWidth` - Ocupa 100% da largura
- `required` - Adiciona asterisco vermelho no label

---

### 3. Select (Dropdown)

```tsx
import Select from "@/components/ui/Select";

<Select
  label="Série"
  options={[
    { value: "", label: "Selecione..." },
    { value: "1", label: "1º Ano" },
    { value: "2", label: "2º Ano" },
    { value: "3", label: "3º Ano" },
  ]}
  required
/>;
```

---

### 4. Badge (Tags de Status)

```tsx
import Badge from "@/components/ui/Badge";

// Status semânticos
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="destructive">Inativo</Badge>
<Badge variant="info">Novo</Badge>
<Badge variant="primary">Destaque</Badge>

// Tamanhos
<Badge size="sm">Pequeno</Badge>
<Badge size="md">Médio</Badge>
<Badge size="lg">Grande</Badge>

// Outline
<Badge variant="outline">Neutro</Badge>
```

**Variantes Semânticas:**

| Variante      | Uso                          | Cor              |
| ------------- | ---------------------------- | ---------------- |
| `success`     | Ativo, Aprovado, Confirmado  | Verde            |
| `warning`     | Pendente, Aguardando, Alerta | Âmbar            |
| `destructive` | Inativo, Rejeitado, Erro     | Vermelho         |
| `info`        | Informação, Novo             | Azul claro       |
| `primary`     | Destaque principal           | Azul corporativo |
| `default`     | Neutro                       | Cinza            |

---

### 5. SearchBar (Barra de Busca)

```tsx
import SearchBar from "@/components/ui/SearchBar";

<SearchBar
  placeholder="Buscar funcionários..."
  onSearch={(value) => console.log(value)}
  onClear={() => console.log("limpo!")}
  debounce={300}
/>;
```

**Características:**

- ✅ Ícone de busca à esquerda
- ✅ Botão X para limpar (aparece ao digitar)
- ✅ Debounce automático (300ms padrão)
- ✅ Foco azul elegante

---

### 6. EmptyState (Estado Vazio)

```tsx
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { Users } from "lucide-react";

// Simples
<EmptyState
  title="Nenhum aluno encontrado"
  description="Tente ajustar os filtros de busca"
/>

// Com ícone e ação
<EmptyState
  icon={<Users className="h-12 w-12" />}
  title="Nenhum funcionário cadastrado"
  description="Comece adicionando seu primeiro funcionário"
  action={
    <Button variant="primary">
      Novo Funcionário
    </Button>
  }
/>
```

---

### 7. Pagination (Paginação)

```tsx
import Pagination from "@/components/ui/Pagination";

<Pagination
  currentPage={page}
  totalPages={10}
  onPageChange={(newPage) => setPage(newPage)}
/>;
```

**Características:**

- ✅ Botões Anterior/Próxima com ícones
- ✅ Indicador "Página X de Y"
- ✅ Desabilita automaticamente quando no limite
- ✅ Oculta quando há apenas 1 página

---

## 📋 Exemplo Completo: Lista com Busca e Filtros

```tsx
"use client";

import { useState } from "react";
import SearchBar from "@/components/ui/SearchBar";
import Select from "@/components/ui/Select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function ListPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-4">
        <SearchBar
          placeholder="Buscar..."
          onSearch={setSearch}
          className="flex-1"
        />
        <Select
          options={[
            { value: "ALL", label: "Todos" },
            { value: "ACTIVE", label: "Ativos" },
            { value: "INACTIVE", label: "Inativos" },
          ]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Tabela */}
      {items.length === 0 ? (
        <EmptyState
          title="Nenhum item encontrado"
          action={<Button>Novo Item</Button>}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="success">Ativo</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={10}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

---

## 🎯 Padrões de Formulário

### Formulário Completo

```tsx
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

<Card>
  <form className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <Input label="Primeiro Nome" placeholder="João" required />
      <Input label="Sobrenome" placeholder="Silva" required />
    </div>

    <Input
      label="Email"
      type="email"
      placeholder="joao@email.com"
      required
      fullWidth
    />

    <Select
      label="Cargo"
      options={[
        { value: "", label: "Selecione..." },
        { value: "TEACHER", label: "Professor" },
        { value: "STAFF", label: "Staff" },
      ]}
      required
    />

    <div className="flex gap-3 pt-4">
      <Button variant="primary" type="submit">
        Salvar
      </Button>
      <Button variant="outline" type="button">
        Cancelar
      </Button>
    </div>
  </form>
</Card>;
```

---

## ✅ Checklist de Refatoração

Ao refatorar uma página, siga esta ordem:

- [ ] 1. Substituir estrutura de layout por `<PageHeader />` + `<PageWrapper />`
- [ ] 2. Adicionar `<BackButton />` no topo do conteúdo
- [ ] 3. Envolver conteúdo em `<Card />`
- [ ] 4. Trocar tabelas HTML por componentes `<Table />`
- [ ] 5. Substituir inputs por `<Input />` e `<Select />`
- [ ] 6. Trocar badges/tags por `<Badge />`
- [ ] 7. Usar `<Button />` com variantes corretas
- [ ] 8. Adicionar `<EmptyState />` quando não houver dados
- [ ] 9. Substituir paginação por `<Pagination />`

---

**Última atualização:** Passo 3 completo ✅
