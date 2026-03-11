'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  UserCheck,
  AlertCircle,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

type EnrollmentRequest = {
  id: string;
  requestNumber: string;
  status: string;
  studentFirstName: string;
  studentLastName: string;
  gradeLevel: string;
  financialGuardianFirstName: string;
  financialGuardianLastName: string;
  createdAt: string;
  approvedStudent?: {
    id: string;
    studentId: string;
  };
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendente',
    color: 'yellow' as const,
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Em Análise',
    color: 'blue' as const,
    icon: Eye,
  },
  APPROVED: {
    label: 'Aprovada',
    color: 'green' as const,
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejeitada',
    color: 'red' as const,
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'gray' as const,
    icon: AlertCircle,
  },
};

export default function EnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/enrollment-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/enrollment-requests/${id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedRequest(data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Erro ao carregar detalhes');
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    if (action === 'reject' && !rejectionReason) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/enrollment-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(action === 'approve' ? 'Matrícula aprovada com sucesso!' : 'Solicitação rejeitada');
        setShowDetailsModal(false);
        fetchRequests();
      } else {
        toast.error(data.message || 'Erro ao processar solicitação');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Matrículas Online"
        subtitle="Gerenciar solicitações de matrícula"
        icon={FileText}
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            onSearch={() => fetchRequests()}
            placeholder="Buscar por nome, CPF ou número..."
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="UNDER_REVIEW">Em Análise</option>
            <option value="APPROVED">Aprovada</option>
            <option value="REJECTED">Rejeitada</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprovadas</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'APPROVED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejeitadas</p>
              <p className="text-2xl font-bold text-red-600">
                {requests.filter(r => r.status === 'REJECTED').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma solicitação encontrada"
            description="Não há solicitações de matrícula no momento."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aluno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Série
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => {
                    const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {request.requestNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.studentFirstName} {request.studentLastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {request.financialGuardianFirstName} {request.financialGuardianLastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{request.gradeLevel}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(request.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhes da Solicitação - {selectedRequest.requestNumber}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge color={STATUS_CONFIG[selectedRequest.status as keyof typeof STATUS_CONFIG].color}>
                  {STATUS_CONFIG[selectedRequest.status as keyof typeof STATUS_CONFIG].label}
                </Badge>
                {selectedRequest.approvedStudent && (
                  <span className="text-sm text-gray-500">
                    ID do Aluno: <span className="font-medium">{selectedRequest.approvedStudent.studentId}</span>
                  </span>
                )}
              </div>

              {/* Dados do Aluno */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Dados do Aluno</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <p className="font-medium">{selectedRequest.studentFirstName} {selectedRequest.studentLastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Data de Nascimento:</span>
                    <p className="font-medium">{new Date(selectedRequest.dateOfBirth).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Gênero:</span>
                    <p className="font-medium">
                      {selectedRequest.gender === 'MALE' ? 'Masculino' : selectedRequest.gender === 'FEMALE' ? 'Feminino' : 'Outro'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Série:</span>
                    <p className="font-medium">{selectedRequest.gradeLevel}</p>
                  </div>
                </div>
              </div>

              {/* Responsável Financeiro */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Responsável Financeiro</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <p className="font-medium">{selectedRequest.financialGuardianFirstName} {selectedRequest.financialGuardianLastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">CPF:</span>
                    <p className="font-medium">{selectedRequest.financialGuardianCPF}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Telefone:</span>
                    <p className="font-medium">{selectedRequest.financialGuardianPhone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">E-mail:</span>
                    <p className="font-medium">{selectedRequest.financialGuardianEmail}</p>
                  </div>
                </div>
              </div>

              {/* Responsável Pedagógico */}
              {!selectedRequest.isSameGuardian && selectedRequest.pedagogicalGuardianFirstName && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Responsável Pedagógico</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Nome:</span>
                      <p className="font-medium">{selectedRequest.pedagogicalGuardianFirstName} {selectedRequest.pedagogicalGuardianLastName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">CPF:</span>
                      <p className="font-medium">{selectedRequest.pedagogicalGuardianCPF}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Telefone:</span>
                      <p className="font-medium">{selectedRequest.pedagogicalGuardianPhone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">E-mail:</span>
                      <p className="font-medium">{selectedRequest.pedagogicalGuardianEmail || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Endereço */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Endereço</h4>
                <div className="text-sm space-y-1">
                  <p>{selectedRequest.address}</p>
                  <p>{selectedRequest.city} - {selectedRequest.state}</p>
                  <p>CEP: {selectedRequest.zipCode}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'UNDER_REVIEW') && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleAction(selectedRequest.id, 'approve')}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Processando...' : 'Aprovar Matrícula'}
                  </Button>
                  <Button
                    onClick={() => {
                      const reason = prompt('Motivo da rejeição:');
                      if (reason) {
                        handleAction(selectedRequest.id, 'reject', reason);
                      }
                    }}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              )}

              {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">Motivo da Rejeição</h4>
                  <p className="text-sm text-red-700">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
