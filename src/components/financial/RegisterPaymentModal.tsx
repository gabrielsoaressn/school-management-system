"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/money";

interface Balance {
  principal: number;
  fine: number;
  interest: number;
  totalDue: number;
  paid: number;
  outstanding: number;
  daysLate: number;
}

interface PaymentRow {
  id: string;
  amount: number;
  paidAt: string;
  method: string;
  receivedBy: string | null;
}

interface Props {
  billing: {
    id: string;
    invoiceNumber: string;
    description: string;
    parent: { firstName: string; lastName: string };
  };
  onClose: () => void;
  onRegistered: () => void;
}

const METHODS = [
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CARD", label: "Cartão" },
  { value: "CASH", label: "Dinheiro" },
  { value: "TRANSFER", label: "Transferência" },
];

/**
 * Registers a payment against a charge, in full or in part.
 *
 * The outstanding balance shown here (and the amount pre-filled) comes from the
 * server: principal plus the fine and interest of anything overdue, minus what
 * has already been received.
 */
export function RegisterPaymentModal({ billing, onClose, onRegistered }: Props) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [method, setMethod] = useState("PIX");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/billings/${billing.id}/payments`
        );
        const data = await response.json();

        if (data.success) {
          setBalance(data.data.balance);
          setPayments(data.data.payments);
          setAmount(data.data.balance.outstanding.toFixed(2));
        } else {
          toast.error(data.error || "Erro ao carregar saldo");
        }
      } catch {
        toast.error("Erro ao carregar saldo");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [billing.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/billings/${billing.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paidAt, method, notes: notes || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message ?? "Pagamento registrado");
        onRegistered();
        onClose();
      } else {
        toast.error(data.error || "Erro ao registrar pagamento");
      }
    } catch {
      toast.error("Erro ao registrar pagamento");
    } finally {
      setSaving(false);
    }
  };

  const partial =
    balance !== null && Number(amount) > 0 && Number(amount) < balance.outstanding;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-foreground">
          Registrar pagamento
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {billing.invoiceNumber} · {billing.parent.firstName}{" "}
          {billing.parent.lastName}
        </p>

        {loading || !balance ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Carregando saldo...
          </p>
        ) : (
          <>
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal</span>
                <span>{formatCurrency(balance.principal)}</span>
              </div>
              {balance.daysLate > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Multa ({balance.daysLate} dia(s) de atraso)
                    </span>
                    <span>{formatCurrency(balance.fine)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Juros</span>
                    <span>{formatCurrency(balance.interest)}</span>
                  </div>
                </>
              )}
              {balance.paid > 0 && (
                <div className="flex justify-between text-success">
                  <span>Já recebido</span>
                  <span>- {formatCurrency(balance.paid)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <span>Em aberto</span>
                <span>{formatCurrency(balance.outstanding)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Input
                label="Valor recebido"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                helperText={
                  partial
                    ? "Pagamento parcial: a cobrança seguirá em aberto pelo saldo restante."
                    : undefined
                }
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Data do pagamento"
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  required
                />
                <Select
                  label="Forma de pagamento"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  options={METHODS}
                  required
                />
              </div>

              <Input
                label="Observação"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
              />

              {payments.length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Pagamentos anteriores
                  </p>
                  <ul className="space-y-1 text-sm">
                    {payments.map((payment) => (
                      <li key={payment.id} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {new Date(payment.paidAt).toLocaleDateString("pt-BR")} ·{" "}
                          {payment.method}
                        </span>
                        <span>{formatCurrency(payment.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Registrando..." : "Registrar pagamento"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default RegisterPaymentModal;
