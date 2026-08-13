'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { CheckCircle, ChevronLeft, ChevronRight, FileText, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { HONEYPOT_FIELD } from '@/lib/rate-limit';

type FormData = {
  // Aluno
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: string;
  gradeLevel: string;
  section: string;

  // Responsável Financeiro
  financialGuardianFirstName: string;
  financialGuardianLastName: string;
  financialGuardianCPF: string;
  financialGuardianPhone: string;
  financialGuardianEmail: string;

  // Responsável Pedagógico
  isSameGuardian: boolean;
  pedagogicalGuardianFirstName: string;
  pedagogicalGuardianLastName: string;
  pedagogicalGuardianCPF: string;
  pedagogicalGuardianPhone: string;
  pedagogicalGuardianEmail: string;

  // Endereço
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

const INITIAL_FORM_DATA: FormData = {
  studentFirstName: '',
  studentLastName: '',
  dateOfBirth: '',
  gender: '',
  gradeLevel: '',
  section: '',
  financialGuardianFirstName: '',
  financialGuardianLastName: '',
  financialGuardianCPF: '',
  financialGuardianPhone: '',
  financialGuardianEmail: '',
  isSameGuardian: false,
  pedagogicalGuardianFirstName: '',
  pedagogicalGuardianLastName: '',
  pedagogicalGuardianCPF: '',
  pedagogicalGuardianPhone: '',
  pedagogicalGuardianEmail: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
};

const GRADE_LEVELS = [
  { value: '1º Ano EF', label: '1º Ano - Ensino Fundamental' },
  { value: '2º Ano EF', label: '2º Ano - Ensino Fundamental' },
  { value: '3º Ano EF', label: '3º Ano - Ensino Fundamental' },
  { value: '4º Ano EF', label: '4º Ano - Ensino Fundamental' },
  { value: '5º Ano EF', label: '5º Ano - Ensino Fundamental' },
  { value: '6º Ano EF', label: '6º Ano - Ensino Fundamental' },
  { value: '7º Ano EF', label: '7º Ano - Ensino Fundamental' },
  { value: '8º Ano EF', label: '8º Ano - Ensino Fundamental' },
  { value: '9º Ano EF', label: '9º Ano - Ensino Fundamental' },
  { value: '1º Ano EM', label: '1º Ano - Ensino Médio' },
  { value: '2º Ano EM', label: '2º Ano - Ensino Médio' },
  { value: '3º Ano EM', label: '3º Ano - Ensino Médio' },
];

const STEPS = [
  { id: 1, title: 'Dados do Aluno', icon: User },
  { id: 2, title: 'Responsável Financeiro', icon: Users },
  { id: 3, title: 'Responsável Pedagógico', icon: Users },
  { id: 4, title: 'Endereço', icon: FileText },
  { id: 5, title: 'Revisão', icon: CheckCircle },
];

export default function MatriculaPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Honeypot: hidden from users, tempting to bots. Filled in => request dropped.
  const [honeypot, setHoneypot] = useState('');
  const [requestNumber, setRequestNumber] = useState<string | null>(null);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.studentFirstName || !formData.studentLastName || !formData.dateOfBirth || !formData.gender || !formData.gradeLevel) {
          toast.error('Preencha todos os campos obrigatórios do aluno');
          return false;
        }
        return true;
      case 2:
        if (!formData.financialGuardianFirstName || !formData.financialGuardianLastName || !formData.financialGuardianCPF || !formData.financialGuardianPhone || !formData.financialGuardianEmail) {
          toast.error('Preencha todos os campos do responsável financeiro');
          return false;
        }
        if (formData.financialGuardianCPF.replace(/\D/g, '').length !== 11) {
          toast.error('CPF inválido');
          return false;
        }
        return true;
      case 3:
        if (!formData.isSameGuardian) {
          if (!formData.pedagogicalGuardianFirstName || !formData.pedagogicalGuardianLastName || !formData.pedagogicalGuardianCPF || !formData.pedagogicalGuardianPhone) {
            toast.error('Preencha todos os campos do responsável pedagógico');
            return false;
          }
          if (formData.pedagogicalGuardianCPF.replace(/\D/g, '').length !== 11) {
            toast.error('CPF do responsável pedagógico inválido');
            return false;
          }
        }
        return true;
      case 4:
        if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
          toast.error('Preencha todos os campos de endereço');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/enrollment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          [HONEYPOT_FIELD]: honeypot,
          financialGuardianCPF: formData.financialGuardianCPF.replace(/\D/g, ''),
          pedagogicalGuardianCPF: formData.isSameGuardian ? '' : formData.pedagogicalGuardianCPF.replace(/\D/g, ''),
          zipCode: formData.zipCode.replace(/\D/g, ''),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRequestNumber(data.data.requestNumber);
        toast.success('Matrícula solicitada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      toast.error('Erro ao enviar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Matrícula Solicitada com Sucesso!
            </h1>
            <p className="text-gray-600 mb-4">
              Sua solicitação foi enviada e está sendo analisada pela equipe da escola.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Número da Solicitação:</p>
              <p className="text-2xl font-bold text-blue-600">{requestNumber}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Guarde este número para acompanhar o status da sua matrícula. Você receberá um e-mail com as próximas etapas.
            </p>
            <Button onClick={() => router.push('/')} className="w-full sm:w-auto">
              Voltar para Início
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Matrícula Online</h1>
          <p className="text-gray-600">Preencha os dados abaixo para solicitar a matrícula</p>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs text-center text-gray-600 hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-colors ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8">
          {/* Step 1: Dados do Aluno */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dados do Aluno</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome *"
                  value={formData.studentFirstName}
                  onChange={(e) => updateFormData('studentFirstName', e.target.value)}
                  placeholder="Nome do aluno"
                />
                <Input
                  label="Sobrenome *"
                  value={formData.studentLastName}
                  onChange={(e) => updateFormData('studentLastName', e.target.value)}
                  placeholder="Sobrenome do aluno"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Data de Nascimento *"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                />
                <Select
                  label="Gênero *"
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  options={[
                    { value: '', label: 'Selecione' },
                    { value: 'MALE', label: 'Masculino' },
                    { value: 'FEMALE', label: 'Feminino' },
                    { value: 'OTHER', label: 'Outro' },
                  ]}
                />
                <Input
                  label="Turma/Seção"
                  value={formData.section}
                  onChange={(e) => updateFormData('section', e.target.value)}
                  placeholder="A, B, C..."
                  maxLength={2}
                />
              </div>
              <Select
                label="Série *"
                value={formData.gradeLevel}
                onChange={(e) => updateFormData('gradeLevel', e.target.value)}
                options={[
                  { value: '', label: 'Selecione a série' },
                  ...GRADE_LEVELS,
                ]}
              />
            </div>
          )}

          {/* Step 2: Responsável Financeiro */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsável Financeiro</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome *"
                  value={formData.financialGuardianFirstName}
                  onChange={(e) => updateFormData('financialGuardianFirstName', e.target.value)}
                  placeholder="Nome do responsável"
                />
                <Input
                  label="Sobrenome *"
                  value={formData.financialGuardianLastName}
                  onChange={(e) => updateFormData('financialGuardianLastName', e.target.value)}
                  placeholder="Sobrenome do responsável"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CPF *"
                  value={formData.financialGuardianCPF}
                  onChange={(e) => updateFormData('financialGuardianCPF', e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <Input
                  label="Telefone *"
                  value={formData.financialGuardianPhone}
                  onChange={(e) => updateFormData('financialGuardianPhone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <Input
                label="E-mail *"
                type="email"
                value={formData.financialGuardianEmail}
                onChange={(e) => updateFormData('financialGuardianEmail', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          )}

          {/* Step 3: Responsável Pedagógico */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsável Pedagógico</h2>

              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="sameGuardian"
                  checked={formData.isSameGuardian}
                  onChange={(e) => updateFormData('isSameGuardian', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="sameGuardian" className="text-sm text-gray-700">
                  O responsável financeiro é também o responsável pedagógico
                </label>
              </div>

              {!formData.isSameGuardian && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nome *"
                      value={formData.pedagogicalGuardianFirstName}
                      onChange={(e) => updateFormData('pedagogicalGuardianFirstName', e.target.value)}
                      placeholder="Nome do responsável"
                    />
                    <Input
                      label="Sobrenome *"
                      value={formData.pedagogicalGuardianLastName}
                      onChange={(e) => updateFormData('pedagogicalGuardianLastName', e.target.value)}
                      placeholder="Sobrenome do responsável"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="CPF *"
                      value={formData.pedagogicalGuardianCPF}
                      onChange={(e) => updateFormData('pedagogicalGuardianCPF', e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    <Input
                      label="Telefone *"
                      value={formData.pedagogicalGuardianPhone}
                      onChange={(e) => updateFormData('pedagogicalGuardianPhone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  <Input
                    label="E-mail"
                    type="email"
                    value={formData.pedagogicalGuardianEmail}
                    onChange={(e) => updateFormData('pedagogicalGuardianEmail', e.target.value)}
                    placeholder="email@exemplo.com (opcional)"
                  />
                </>
              )}
            </div>
          )}

          {/* Step 4: Endereço */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Endereço</h2>
              <Input
                label="Endereço Completo *"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Rua, número, complemento"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Cidade *"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder="Cidade"
                />
                <Input
                  label="Estado *"
                  value={formData.state}
                  onChange={(e) => updateFormData('state', e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
                <Input
                  label="CEP *"
                  value={formData.zipCode}
                  onChange={(e) => updateFormData('zipCode', e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          )}

          {/* Step 5: Revisão */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Revisão dos Dados</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Aluno</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Nome:</span> {formData.studentFirstName} {formData.studentLastName}</p>
                    <p><span className="font-medium">Data de Nascimento:</span> {new Date(formData.dateOfBirth).toLocaleDateString('pt-BR')}</p>
                    <p><span className="font-medium">Série:</span> {formData.gradeLevel} {formData.section && `- Turma ${formData.section}`}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Responsável Financeiro</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Nome:</span> {formData.financialGuardianFirstName} {formData.financialGuardianLastName}</p>
                    <p><span className="font-medium">CPF:</span> {formData.financialGuardianCPF}</p>
                    <p><span className="font-medium">Telefone:</span> {formData.financialGuardianPhone}</p>
                    <p><span className="font-medium">E-mail:</span> {formData.financialGuardianEmail}</p>
                  </div>
                </div>

                {!formData.isSameGuardian && formData.pedagogicalGuardianFirstName && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Responsável Pedagógico</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Nome:</span> {formData.pedagogicalGuardianFirstName} {formData.pedagogicalGuardianLastName}</p>
                      <p><span className="font-medium">CPF:</span> {formData.pedagogicalGuardianCPF}</p>
                      <p><span className="font-medium">Telefone:</span> {formData.pedagogicalGuardianPhone}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Endereço</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{formData.address}</p>
                    <p>{formData.city} - {formData.state}</p>
                    <p>CEP: {formData.zipCode}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Ao enviar esta solicitação, você concorda que os dados fornecidos são verdadeiros e autoriza a escola a utilizá-los para fins de matrícula.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            <div className="flex-1" />
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor={HONEYPOT_FIELD}>Não preencha este campo</label>
              <input
                id={HONEYPOT_FIELD}
                name={HONEYPOT_FIELD}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            {currentStep < 5 ? (
              <Button onClick={nextStep}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
