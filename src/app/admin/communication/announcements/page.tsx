'use client';

import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Megaphone, Plus, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { GRADE_LEVELS } from '@/lib/constants';

type Announcement = {
  id: string;
  title: string;
  content: string;
  targetRole: string | null;
  targetGrade: string | null;
  priority: string;
  createdAt: string;
  expiresAt: string | null;
};

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', variant: 'default' as const },
  normal: { label: 'Normal', variant: 'info' as const },
  high: { label: 'Alta', variant: 'destructive' as const },
};


export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: '',
    targetGrade: '',
    priority: 'normal',
    expiresAt: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements?limit=50');
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        setFormData({
          title: '',
          content: '',
          targetRole: '',
          targetGrade: '',
          priority: 'normal',
          expiresAt: '',
        });
        fetchAnnouncements();
      } else {
        toast.error(data.error || 'Erro ao publicar aviso');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Erro ao publicar aviso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Avisos e Comunicados"
        subtitle="Publicar avisos para alunos, pais e professores"
        icon={Megaphone}
      />

      <div className="mb-6">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Aviso
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Nenhum aviso publicado"
            description="Comece criando o primeiro aviso para a comunidade escolar."
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement) => {
              const priorityConfig = PRIORITY_CONFIG[announcement.priority as keyof typeof PRIORITY_CONFIG];

              return (
                <div key={announcement.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
                  </div>

                  <p className="text-gray-700 mb-4">{announcement.content}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {announcement.targetRole || 'Todos'}
                      {announcement.targetGrade && ` - ${announcement.targetGrade}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {announcement.expiresAt && (
                      <span className="text-orange-600">
                        Expira em {new Date(announcement.expiresAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Aviso</h3>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Título *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Reunião de Pais - Sábado 15/03"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o conteúdo do aviso..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Destinatários"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'STUDENT', label: 'Alunos' },
                    { value: 'PARENT', label: 'Responsáveis' },
                    { value: 'TEACHER', label: 'Professores' },
                  ]}
                />

                <Select
                  label="Série"
                  value={formData.targetGrade}
                  onChange={(e) => setFormData({ ...formData, targetGrade: e.target.value })}
                  options={[
                    { value: '', label: 'Todas' },
                    ...GRADE_LEVELS.map((g) => ({ value: g, label: g })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Prioridade"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  options={[
                    { value: 'low', label: 'Baixa' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'Alta' },
                  ]}
                />

                <Input
                  label="Expira em (opcional)"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  {saving ? 'Publicando...' : 'Publicar Aviso'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
