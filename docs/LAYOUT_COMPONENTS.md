# 🏗️ Componentes de Layout - Guia de Uso

## Componentes Criados (Passo 2)

### 1. PageHeader

Header consistente com Logo clicável

```tsx
import PageHeader from "@/components/layout/PageHeader";

// Uso básico
<PageHeader />

// Com ações no canto direito
<PageHeader>
  <Button href="/admin/dashboard">Voltar</Button>
  <Button variant="primary">Nova Ação</Button>
</PageHeader>
```

---

### 2. PageWrapper

Container padronizado para conteúdo

```tsx
import PageWrapper from "@/components/layout/PageWrapper";

<PageWrapper maxWidth="2xl">{/* Seu conteúdo aqui */}</PageWrapper>;

// Tamanhos disponíveis: sm, md, lg, xl, 2xl, full
```

---

### 3. BackButton

Botão "Voltar" padronizado (sempre no canto superior esquerdo)

```tsx
import BackButton from "@/components/ui/BackButton";

// Volta para página anterior (router.back)
<BackButton />

// Com URL específica
<BackButton href="/admin/dashboard" />

// Com label customizado
<BackButton label="Voltar ao Dashboard" />

// Com ação customizada
<BackButton onClick={() => console.log("voltando...")} />
```

**Regra UX:** Sempre posicione no início do conteúdo da página!

```tsx
<PageWrapper>
  <BackButton href="/admin/dashboard" /> {/* ✅ Primeiro elemento */}
  <Card>{/* Conteúdo da página */}</Card>
</PageWrapper>
```

---

### 4. Card

Container moderno com sombra sutil

```tsx
import Card from "@/components/ui/Card";

// Card básico
<Card>
  Conteúdo
</Card>

// Com padding customizado
<Card padding="lg">
  Mais espaço interno
</Card>

// Com hover effect
<Card hover>
  Efeito ao passar o mouse
</Card>

// Sem padding (para tabelas)
<Card padding="none">
  <table>...</table>
</Card>
```

---

### 5. Button

Botão padronizado com variantes semânticas

```tsx
import Button from "@/components/ui/Button";

// ✅ Botão primário (ação principal da tela)
<Button variant="primary">
  Salvar
</Button>

// Botão secundário
<Button variant="secondary">
  Rascunho
</Button>

// Botão outline
<Button variant="outline">
  Cancelar
</Button>

// Botão destrutivo
<Button variant="destructive">
  Excluir
</Button>

// Botão de sucesso
<Button variant="success">
  Aprovar
</Button>

// Botão ghost (sutil)
<Button variant="ghost">
  Ver mais
</Button>

// Com loading
<Button loading>
  Salvando...
</Button>

// Full width
<Button fullWidth>
  Continuar
</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>
```

**⚠️ REGRA UX IMPORTANTE:**

- Apenas **1 botão primary** por tela!
- Use `variant="outline"` ou `variant="secondary"` para ações secundárias

---

## 📐 Estrutura de Página Padrão

```tsx
import PageHeader from "@/components/layout/PageHeader";
import PageWrapper from "@/components/layout/PageWrapper";
import BackButton from "@/components/ui/BackButton";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function MinhaPage() {
  return (
    <>
      <PageHeader />

      <PageWrapper>
        <BackButton href="/admin/dashboard" />

        <Card>
          <h1>Título da Página</h1>
          <p className="text-muted-foreground">Descrição auxiliar</p>

          {/* Conteúdo */}

          <div className="mt-6 flex gap-3">
            <Button variant="primary">Salvar</Button>
            <Button variant="outline">Cancelar</Button>
          </div>
        </Card>
      </PageWrapper>
    </>
  );
}
```

---

## ✅ Antes e Depois

### ❌ ANTES (Inconsistente)

```tsx
<div className="min-h-screen bg-gray-50">
  <div className="border-b border-gray-200 bg-white">
    <div className="container mx-auto px-4 py-4">
      <Logo size="md" showText={true} />
    </div>
  </div>
  <div className="container mx-auto px-4 py-8">
    <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
      {/* Conteúdo */}
    </div>
  </div>
</div>
```

### ✅ DEPOIS (Consistente)

```tsx
<>
  <PageHeader />
  <PageWrapper>
    <Card>{/* Conteúdo */}</Card>
  </PageWrapper>
</>
```

**Benefícios:**

- ✅ Menos código repetido
- ✅ Consistência visual automática
- ✅ Fácil manutenção
- ✅ Responsivo por padrão

---

## 🎨 Ícones com Lucide React

```tsx
import { Users, Settings, Trash, Check, X } from "lucide-react";

<Button>
  <Users className="h-4 w-4" />
  Usuários
</Button>;
```

Catálogo completo: https://lucide.dev/icons

---

**Última atualização:** Passo 2 completo ✅
