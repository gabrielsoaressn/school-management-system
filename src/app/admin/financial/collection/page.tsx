"use client";

import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DollarSign,
  Send,
  Mail,
  MessageSquare,
  AlertTriangle,
  TrendingDown,
  CheckCircle,
  Clock,
  Handshake,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/money";

type Billing = {
  id: string;
  invoiceNumber: string;
  amount: number;
  amountDue: {
    principal: number;
    fine: number;
    interest: number;
    total: number;
    daysLate: number;
    paid: number;
    outstanding: number;
  };
  dueDate: string;
  status: string;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string;
    whatsappNumber: string | null;
  };
  reminders: any[];
};

export default function CollectionPage() {
  const [overdueBillings, setOverdueBillings] = useState<Billing[]>([]);
  const [selectedBillings, setSelectedBillings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showRenegotiationModal, setShowRenegotiationModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);

  // Stats
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [defaultRate, setDefaultRate] = useState(0);

  // Reminder form
  const [reminderType, setReminderType] = useState<"EMAIL" | "WHATSAPP">(
    "EMAIL"
  );
  const [reminderMessage, setReminderMessage] = useState("");

  // Renegotiation form
  const [renegotiationData, setRenegotiationData] = useState({
    renegotiatedAmount: 0,
    discount: 0,
    installments: 1,
    newDueDate: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/admin/billings?status=OVERDUE&limit=100"
      );
      const data = await response.json();

      if (data.success) {
        setOverdueBillings(data.data);
        setTotalOverdue(data.data.length);
        setOverdueAmount(
          data.data.reduce(
            (total: number, b: Billing) => total + b.amountDue.outstanding,
            0
          )
        );

        // Calcular taxa de inadimplência (simulado)
        const totalBillings = data.pagination.total || data.data.length;
        const rate = (data.data.length / Math.max(totalBillings, 1)) * 100;
        setDefaultRate(rate);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  const handleSelectBilling = (id: string) => {
    setSelectedBillings((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedBillings.length === overdueBillings.length) {
      setSelectedBillings([]);
    } else {
      setSelectedBillings(overdueBillings.map((b) => b.id));
    }
  };

  const openReminderModal = () => {
    if (selectedBillings.length === 0) {
      toast.error("Selecione pelo menos uma fatura");
      return;
    }

    const template = `Olá {{name}},

Verificamos que a fatura de R$ {{amount}} com vencimento em {{dueDate}} está pendente.

Por favor, regularize sua situação para evitar a suspensão dos serviços.

Atenciosamente,
Escola Davilla`;

    setReminderMessage(template);
    setShowReminderModal(true);
  };

  async function sendReminders() {
    setSending(true);
    try {
      const response = await fetch("/api/admin/payment-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingIds: selectedBillings,
          reminderType,
          subject: "Lembrete de Pagamento - Escola Davilla",
          message: reminderMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowReminderModal(false);
        setSelectedBillings([]);
        fetchData();
      } else {
        toast.error(data.error || "Erro ao enviar lembretes");
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Erro ao enviar lembretes");
    } finally {
      setSending(false);
    }
  }

  const openRenegotiationModal = (billing: Billing) => {
    setSelectedBilling(billing);
    setRenegotiationData({
      renegotiatedAmount: Number(
        (billing.amountDue.outstanding * 0.9).toFixed(2)
      ),
      discount: Number((billing.amountDue.outstanding * 0.1).toFixed(2)),
      installments: 3,
      newDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      reason: "Dificuldade financeira",
      notes: "",
    });
    setShowRenegotiationModal(true);
  };

  async function handleRenegotiation() {
    if (!selectedBilling) return;

    setSending(true);
    try {
      const response = await fetch("/api/admin/payment-renegotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingId: selectedBilling.id,
          ...renegotiationData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Renegociação criada com sucesso!");
        setShowRenegotiationModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Erro ao criar renegociação");
      }
    } catch (error) {
      console.error("Error creating renegotiation:", error);
      toast.error("Erro ao criar renegociação");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Régua de Cobrança"
        subtitle="Gerenciar inadimplência e enviar lembretes"
        icon={DollarSign}
      />

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Faturas Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor em Atraso</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(overdueAmount)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Inadimplência</p>
              <p className="text-2xl font-bold text-orange-600">
                {defaultRate.toFixed(1)}%
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={openReminderModal}
          disabled={selectedBillings.length === 0}
          className="flex-1 sm:flex-none"
        >
          <Send className="mr-2 h-4 w-4" />
          Enviar Lembretes ({selectedBillings.length})
        </Button>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : overdueBillings.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="Nenhuma fatura vencida"
            description="Parabéns! Não há faturas em atraso no momento."
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedBillings.length === overdueBillings.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Selecionar todos</span>
              </label>
              <span className="text-sm text-gray-600">
                {selectedBillings.length} selecionados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 opacity-0"
                        disabled
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Fatura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Dias Atraso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Lembretes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {overdueBillings.map((billing) => {
                    // Days late come from the server, computed in the school timezone.
                    const daysOverdue = billing.amountDue.daysLate;
                    const severity =
                      daysOverdue > 30
                        ? "high"
                        : daysOverdue > 15
                          ? "medium"
                          : "low";

                    return (
                      <tr key={billing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedBillings.includes(billing.id)}
                            onChange={() => handleSelectBilling(billing.id)}
                            className="h-4 w-4 rounded text-blue-600"
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {billing.invoiceNumber}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {billing.parent.firstName}{" "}
                              {billing.parent.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {billing.parent.email ||
                                billing.parent.phoneNumber}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">
                            <span className="font-semibold text-foreground">
                              {formatCurrency(billing.amountDue.outstanding)}
                            </span>
                            {billing.amountDue.daysLate > 0 && (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {formatCurrency(billing.amountDue.principal)} +{" "}
                                {formatCurrency(billing.amountDue.fine)} multa +{" "}
                                {formatCurrency(billing.amountDue.interest)}{" "}
                                juros
                              </span>
                            )}
                            {billing.amountDue.paid > 0 && (
                              <span className="mt-0.5 block text-xs text-success">
                                {formatCurrency(billing.amountDue.paid)} já pago
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(billing.dueDate).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge
                            variant={
                              severity === "high"
                                ? "destructive"
                                : severity === "medium"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            {daysOverdue} dias
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {billing.reminders?.length || 0} enviados
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRenegotiationModal(billing)}
                          >
                            <Handshake className="mr-1 h-4 w-4" />
                            Renegociar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Enviar Lembretes de Pagamento
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {selectedBillings.length} faturas selecionadas
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tipo de Lembrete
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReminderType("EMAIL")}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 transition-all ${
                      reminderType === "EMAIL"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Mail className="mx-auto mb-1 h-5 w-5" />
                    <span className="text-sm font-medium">E-mail</span>
                  </button>
                  <button
                    onClick={() => setReminderType("WHATSAPP")}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 transition-all ${
                      reminderType === "WHATSAPP"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <MessageSquare className="mx-auto mb-1 h-5 w-5" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mensagem
                </label>
                <textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a mensagem..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use: {"{"}
                  {"{"} name{"}"}
                  {"}"}, {"{"}
                  {"{"} amount{"}"}
                  {"}"}, {"{"}
                  {"{"}
                  dueDate{"}"}
                  {"}"} para personalizar
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowReminderModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={sending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={sendReminders}
                  disabled={sending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Enviando..." : "Enviar Lembretes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renegotiation Modal */}
      {showRenegotiationModal && selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Renegociar Pagamento
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Fatura {selectedBilling.invoiceNumber} -{" "}
                {selectedBilling.parent.firstName}{" "}
                {selectedBilling.parent.lastName}
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Valor Original</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedBilling.amountDue.outstanding)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Novo Valor *
                  </label>
                  <input
                    type="number"
                    value={renegotiationData.renegotiatedAmount}
                    onChange={(e) =>
                      setRenegotiationData({
                        ...renegotiationData,
                        renegotiatedAmount: parseFloat(e.target.value),
                        discount:
                          selectedBilling.amountDue.outstanding -
                          parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Desconto
                  </label>
                  <input
                    type="number"
                    value={renegotiationData.discount}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parcelas
                  </label>
                  <input
                    type="number"
                    value={renegotiationData.installments}
                    onChange={(e) =>
                      setRenegotiationData({
                        ...renegotiationData,
                        installments: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="12"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nova Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    value={renegotiationData.newDueDate}
                    onChange={(e) =>
                      setRenegotiationData({
                        ...renegotiationData,
                        newDueDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Motivo
                </label>
                <input
                  type="text"
                  value={renegotiationData.reason}
                  onChange={(e) =>
                    setRenegotiationData({
                      ...renegotiationData,
                      reason: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Dificuldade financeira temporária"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  value={renegotiationData.notes}
                  onChange={(e) =>
                    setRenegotiationData({
                      ...renegotiationData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Observações internas..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowRenegotiationModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={sending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRenegotiation}
                  disabled={sending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Handshake className="mr-2 h-4 w-4" />
                  {sending ? "Salvando..." : "Confirmar Renegociação"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
