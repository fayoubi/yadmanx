import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  User,
  CreditCard,
  Users,
  FileText,
  ArrowLeft,
  Send
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface EnrollmentSummary {
  enrollment: any;
  customer: any;
  billing: any;
  beneficiaries: any[];
  steps: any[];
}

const EnrollmentConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollmentId');

  const [summary, setSummary] = useState<EnrollmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [enrollmentId]);

  const loadSummary = async () => {
    if (!enrollmentId) {
      setError('Enrollment ID is missing');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch enrollment data from API (using existing endpoint)
      const response = await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}`, {
        headers: {
          'x-agent-id': '11111111-1111-1111-1111-111111111111'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load enrollment data');
      }

      const data = await response.json();

      if (!data.success || !data.enrollment) {
        throw new Error('Invalid enrollment data');
      }

      const enrollment = data.enrollment;
      const contribution = enrollment.data?.contribution || {};
      const beneficiaries = enrollment.data?.beneficiaries || [];
      const subscriber = enrollment.subscriber || enrollment.customer; // Fallback to customer for backward compat

      // Transform API response to match component interface
      const summary: EnrollmentSummary = {
        enrollment: {
          id: enrollment.id,
          status: null, // V2 doesn't use status
          plan_id: null, // V2 doesn't use plan_id
          effective_date: contribution.effectiveDate || null,
        },
        customer: {
          first_name: subscriber?.first_name || '',
          last_name: subscriber?.last_name || '',
          email: subscriber?.email || '',
          phone: subscriber?.phone || '',
        },
        billing: contribution.amount ? {
          contribution_amount: contribution.amount,
          contribution_frequency: contribution.frequency || 'monthly',
          payment_method_type: contribution.paymentMode?.mode || 'check',
          payment_method_last_four: contribution.paymentMode?.accountNumber?.slice(-4) || contribution.paymentMode?.checkNumber?.slice(-4) || null,
        } : null,
        beneficiaries: beneficiaries.map((b: any) => ({
          id: b.id,
          first_name: b.firstName || b.first_name || '',
          last_name: b.lastName || b.last_name || '',
          cin: b.cin || '',
          date_of_birth: b.birthDate || b.date_of_birth || '',
          place_of_birth: b.placeOfBirth || b.place_of_birth || '',
          address: b.address || '',
          percentage: b.percentage || 0,
          relationship: b.relationship || '',
        })),
        steps: [], // V2 doesn't track steps
      };

      setSummary(summary);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load summary:', err);
      setError('Échec du chargement du résumé de l\'inscription');
      setIsLoading(false);
    }
  };

  const handleEdit = (section: string) => {
    switch (section) {
      case 'customer':
        navigate(`/enroll/start?enrollmentId=${enrollmentId}`);
        break;
      case 'billing':
        navigate(`/enroll/contribution?enrollmentId=${enrollmentId}`);
        break;
      case 'beneficiaries':
        navigate(`/enroll/beneficiaries?enrollmentId=${enrollmentId}`);
        break;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Call the enrollment service API to submit the enrollment
      const response = await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-id': '11111111-1111-1111-1111-111111111111'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        const errorCode = response.status === 400 ? 'VALIDATION_ERROR' :
                         response.status === 404 ? 'NOT_FOUND' :
                         response.status === 409 ? 'DUPLICATE_ENROLLMENT' :
                         'SERVER_ERROR';

        const errorMessage = data.error || 'Erreur lors de la soumission';

        navigate(`/enroll/error?enrollmentId=${enrollmentId}&errorCode=${errorCode}&errorMessage=${encodeURIComponent(errorMessage)}`);
        return;
      }

      if (!data.success) {
        // Handle business logic errors
        navigate(`/enroll/error?enrollmentId=${enrollmentId}&errorCode=SUBMISSION_FAILED&errorMessage=${encodeURIComponent(data.message || 'La soumission a échoué')}`);
        return;
      }

      // Success - navigate to success page
      navigate(`/enroll/success?enrollmentId=${enrollmentId}`);

    } catch (err: any) {
      console.error('Failed to submit enrollment:', err);

      // Determine error type
      const errorCode = err.name === 'TypeError' && err.message.includes('fetch')
        ? 'NETWORK_ERROR'
        : 'UNKNOWN_ERROR';

      const errorMessage = err.message || 'Une erreur inattendue s\'est produite';

      navigate(`/enroll/error?enrollmentId=${enrollmentId}&errorCode=${errorCode}&errorMessage=${encodeURIComponent(errorMessage)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">Chargement du résumé...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
                <p className="text-red-700">{error || 'Une erreur s\'est produite'}</p>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/enroll/beneficiaries')}
                  className="mt-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Confirmation de l'Inscription
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-700">
                  Veuillez vérifier toutes les informations ci-dessous avant de soumettre votre inscription.
                  Vous pouvez modifier n'importe quelle section en cliquant sur le bouton "Modifier".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Informations Client</h2>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleEdit('customer')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Nom</p>
              <p className="font-medium text-gray-900">{summary.customer.last_name}</p>
            </div>
            <div>
              <p className="text-gray-600">Prénom</p>
              <p className="font-medium text-gray-900">{summary.customer.first_name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{summary.customer.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Téléphone</p>
              <p className="font-medium text-gray-900">{summary.customer.phone}</p>
            </div>
          </div>
        </Card>

        {/* Billing Information */}
        {summary.billing && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Informations de Paiement</h2>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEdit('billing')}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Montant de la cotisation</p>
                <p className="font-medium text-gray-900">{summary.billing.contribution_amount} MAD</p>
              </div>
              <div>
                <p className="text-gray-600">Fréquence</p>
                <p className="font-medium text-gray-900 capitalize">{summary.billing.contribution_frequency}</p>
              </div>
              <div>
                <p className="text-gray-600">Méthode de paiement</p>
                <p className="font-medium text-gray-900 capitalize">{summary.billing.payment_method_type}</p>
              </div>
              {summary.billing.payment_method_last_four && (
                <div>
                  <p className="text-gray-600">Carte se terminant par</p>
                  <p className="font-medium text-gray-900">**** {summary.billing.payment_method_last_four}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Beneficiaries */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Bénéficiaires</h2>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleEdit('beneficiaries')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          </div>
          <div className="space-y-4">
            {summary.beneficiaries.map((beneficiary, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {beneficiary.first_name} {beneficiary.last_name}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{beneficiary.relationship}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{beneficiary.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total alloué:</span>
              <span className="text-lg font-bold text-green-600">
                {summary.beneficiaries.reduce((sum, b) => sum + b.percentage, 0)}%
              </span>
            </div>
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col md:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={() => navigate(`/enroll/beneficiaries?enrollmentId=${enrollmentId}`)}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Soumission en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Soumettre l'inscription
              </>
            )}
          </Button>
        </div>

        {/* Success Guarantee */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800 mb-1">Inscription sécurisée</h3>
              <p className="text-sm text-green-700">
                Vos informations sont protégées et cryptées. Après soumission, vous recevrez une confirmation par email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentConfirmation;