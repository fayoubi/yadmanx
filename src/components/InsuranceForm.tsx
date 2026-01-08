import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Shield, Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import { nationalitiesFr } from '../constants/nationalitiesFr';
import IDScanner from './IDScanner';
import { IDScanResult } from '../types/idScanner';
import { FieldMappingService } from '../services/FieldMappingService';
import { useQuote } from '../context/QuoteContext';
import { useAgentAuth } from '../context/AgentAuthContext';

// Minimal French → English country mapping for the cities package
const frToEnCountry: Record<string, string> = {
  'Maroc': 'Morocco',
  'France': 'France',
  'Allemagne': 'Germany',
  'Espagne': 'Spain',
  'Royaume-Uni': 'United Kingdom',
  'Italie': 'Italy',
  'Belgique': 'Belgium',
  'Pays-Bas': 'Netherlands',
  'Portugal': 'Portugal',
  'Suisse': 'Switzerland',
  'États-Unis': 'United States',
  'Canada': 'Canada',
  'Algérie': 'Algeria',
  'Tunisie': 'Tunisia',
  'Turquie': 'Turkey',
  'Chine': 'China',
  'Inde': 'India',
};

const NoIcon: React.FC<{ className?: string }> = () => null;

type Person = {
  salutation: string;
  lastName: string;
  firstName: string;
  idNumber: string;
  email: string;
  nationality: string;
  passportNumber: string;
  residencePermit: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  occupation: string;
  maritalStatus: string;
  widowed: boolean;
  numberOfChildren: string;
  usCitizen: string;
  tin: string;
};

const emptyPerson: Person = {
  salutation: '',
  lastName: '',
  firstName: '',
  idNumber: '',
  email: '',
  nationality: '',
  passportNumber: '',
  residencePermit: '',
  birthDate: '',
  birthPlace: '',
  address: '',
  city: '',
  country: '',
  phone: '',
  occupation: '',
  maritalStatus: '',
  widowed: false,
  numberOfChildren: '',
  usCitizen: '',
  tin: ''
};

// Map API customer object (snake_case) to frontend Person (camelCase)
const mapCustomerToPerson = (customer: any): Person => {
  if (!customer) return { ...emptyPerson };

  return {
    salutation: customer.salutation || '',
    lastName: customer.last_name || '',
    firstName: customer.first_name || '',
    idNumber: customer.cin || '',
    email: customer.email || '',
    nationality: customer.nationality || '',
    passportNumber: customer.passport_number || '',
    residencePermit: customer.residence_permit || '',
    birthDate: customer.date_of_birth || '',
    birthPlace: customer.birth_place || '',
    address: customer.address || '',
    city: customer.city || '',
    country: customer.country || '',
    phone: customer.phone || '',
    occupation: customer.occupation || '',
    maritalStatus: customer.marital_status || '',
    widowed: customer.widowed === true || customer.widowed === 'true',
    numberOfChildren: customer.number_of_children || '',
    usCitizen: customer.us_citizen || '',
    tin: customer.tin || ''
  };
};

interface PersonSectionProps {
  title: string;
  person: Person;
  section: 'subscriber' | 'insured';
  icon: React.ComponentType<{ className?: string }>;
  onChange: (section: 'subscriber' | 'insured', field: keyof Person, value: string | boolean) => void;
  readOnly?: boolean;
  cities: string[];
  isLoadingCities?: boolean;
  onIDScan?: (section: 'subscriber' | 'insured') => void;
  prepopulatedFields?: Set<string>;
}

const PersonSection: React.FC<PersonSectionProps> = ({ title, person, section, icon: Icon, onChange, readOnly, cities, isLoadingCities, onIDScan, prepopulatedFields }) => {
  const isFieldPrepopulated = (fieldName: string) => prepopulatedFields?.has(fieldName) ?? false;

  return (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      {onIDScan && !readOnly && (
        <button
          onClick={() => onIDScan(section)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Camera className="h-4 w-4" />
          Scanner CIN
        </button>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Civilité */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Civilité</label>
        <div className="flex gap-4">
          {['M.', 'Mme.', 'Mlle.'].map(civ => (
            <label key={civ} className="flex items-center">
              <input
                type="radio"
                name={`${section}_salutation`}
                value={civ}
                checked={person.salutation === civ}
                onChange={(e) => !readOnly && onChange(section, 'salutation', e.target.value)}
                className="mr-2 text-blue-600"
                disabled={readOnly}
              />
              {civ}
            </label>
          ))}
        </div>
      </div>

      <div className="md:col-span-2"></div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
        <input
          type="text"
          value={person.lastName}
          onChange={(e) => !readOnly && onChange(section, 'lastName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
        <input
          type="text"
          value={person.firstName}
          onChange={(e) => !readOnly && onChange(section, 'firstName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pièce d'identité (CIN)</label>
        <input
          type="text"
          value={person.idNumber}
          onChange={(e) => !readOnly && onChange(section, 'idNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité</label>
        <div className="relative">
          <select
            value={person.nationality}
            onChange={(e) => {
              if (readOnly) return;
              onChange(section, 'nationality', e.target.value);
              onChange(section, 'city', ''); // reset city when nationality changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            disabled={readOnly}
            aria-disabled={readOnly}
          >
            <option value="">Sélectionnez une nationalité</option>
            {nationalitiesFr.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Passeport</label>
        <input
          type="text"
          value={person.passportNumber}
          onChange={(e) => !readOnly && onChange(section, 'passportNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Carte/Titre de séjour</label>
        <input
          type="text"
          value={person.residencePermit}
          onChange={(e) => !readOnly && onChange(section, 'residencePermit', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date de naissance
          {isFieldPrepopulated('birthDate') && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Pré-rempli depuis votre devis</span>
          )}
        </label>
        <input
          type="date"
          value={person.birthDate}
          onChange={(e) => !readOnly && onChange(section, 'birthDate', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isFieldPrepopulated('birthDate') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
          }`}
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de naissance</label>
        <input
          type="text"
          value={person.birthPlace}
          onChange={(e) => !readOnly && onChange(section, 'birthPlace', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
        <input
          type="text"
          value={person.address}
          onChange={(e) => !readOnly && onChange(section, 'address', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville
            {isFieldPrepopulated('city') && (
              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Pré-rempli depuis votre devis</span>
            )}
          </label>
          <div className="relative">
            <select
              value={person.city}
              onChange={(e) => !readOnly && onChange(section, 'city', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                !person.nationality || readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' :
                isFieldPrepopulated('city') ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
              }`}
              disabled={!person.nationality || readOnly || (!!person.nationality && (isLoadingCities ?? false))}
              aria-disabled={!person.nationality || readOnly}
            >
              <option value="">
                {!person.nationality
                  ? 'Sélectionnez une nationalité d\'abord'
                  : isLoadingCities
                    ? 'Chargement...'
                    : 'Sélectionnez une ville'
                }
              </option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
          <input
            type="text"
            value={person.country}
            onChange={(e) => !readOnly && onChange(section, 'country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly={readOnly}
            aria-disabled={readOnly}
          />
        </div>
      </div>

      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">N° téléphone</label>
          <input
            type="tel"
            value={person.phone}
            onChange={(e) => !readOnly && onChange(section, 'phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly={readOnly}
            aria-disabled={readOnly}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={person.email}
            onChange={(e) => !readOnly && onChange(section, 'email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="exemple@email.com"
            readOnly={readOnly}
            aria-disabled={readOnly}
          />
        </div>
      </div>

      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Profession exacte</label>
        <input
          type="text"
          value={person.occupation}
          onChange={(e) => !readOnly && onChange(section, 'occupation', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Situation familiale</label>
        <div className="flex gap-6">
          {['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf (ve)'].map(status => (
            <label key={status} className="flex items-center">
              <input
                type="radio"
                name={`${section}_maritalStatus`}
                value={status}
                checked={person.maritalStatus === status}
                onChange={(e) => {
                  if (readOnly) return;
                  onChange(section, 'maritalStatus', e.target.value);
                  onChange(section, 'widowed', e.target.value === 'Veuf (ve)');
                }}
                className="mr-2 text-blue-600"
                disabled={readOnly}
              />
              {status}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'enfants</label>
        <input
          type="number"
          value={person.numberOfChildren}
          onChange={(e) => !readOnly && onChange(section, 'numberOfChildren', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          readOnly={readOnly}
          aria-disabled={readOnly}
        />
      </div>

      <div className="md:col-span-3 p-0">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Êtes-vous citoyen américain ou avez-vous votre résidence fiscale aux États-Unis ?
        </p>
        <div className="flex gap-4 mb-3">
          {['Oui', 'Non'].map(option => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name={`${section}_usCitizen`}
                value={option}
                checked={person.usCitizen === option}
                onChange={(e) => !readOnly && onChange(section, 'usCitizen', e.target.value)}
                className="mr-2 text-blue-600"
                disabled={readOnly}
              />
              {option}
            </label>
          ))}
        </div>
        {person.usCitizen === 'Oui' && (
          <div className="mt-2 ml-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro d'identification fiscale (TIN)
            </label>
            <input
              type="text"
              value={person.tin}
              onChange={(e) => !readOnly && onChange(section, 'tin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={readOnly}
              aria-disabled={readOnly}
            />
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

const InsuranceForm: React.FC = () => {
  const { prepopulationUtils } = useQuote();
  const { token } = useAgentAuth();
  const [searchParams] = useSearchParams();
  const [insuredSameAsSubscriber, setInsuredSameAsSubscriber] = useState<boolean>(true);
  const [formData, setFormData] = useState<{ subscriber: Person; insured: Person }>({
    subscriber: { ...emptyPerson },
    insured: { ...emptyPerson }
  });
  const [lastManualInsured, setLastManualInsured] = useState<Person | null>(null);
  const [citiesSubscriber, setCitiesSubscriber] = useState<string[]>([]);
  const [citiesInsured, setCitiesInsured] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState<{ subscriber: boolean; insured: boolean }>({ subscriber: false, insured: false });
  const [showIDScanner, setShowIDScanner] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<IDScanResult | null>(null);
  const [scanningFor, setScanningFor] = useState<'subscriber' | 'insured'>('subscriber');
  const [prepopulatedFields, setPrepopulatedFields] = useState<{ subscriber: Set<string>; insured: Set<string> }>({
    subscriber: new Set(),
    insured: new Set()
  });

  const handleInputChange = (section: 'subscriber' | 'insured', field: keyof Person, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value as never
      }
    }));
    if (section === 'insured' && !insuredSameAsSubscriber) {
      setLastManualInsured(prev => ({ ...(prev ?? emptyPerson), [field]: value } as Person));
    }

    // Remove field from prepopulated set when user manually changes it
    setPrepopulatedFields(prev => ({
      ...prev,
      [section]: new Set(Array.from(prev[section]).filter(f => f !== field))
    }));
  };

  // Load existing enrollment data if viewing/editing
  useEffect(() => {
    const loadEnrollmentData = async () => {
      // First check URL params, then fall back to sessionStorage
      const enrollmentId = searchParams.get('enrollmentId') || sessionStorage.getItem('current_enrollment_id');
      console.log('Loading enrollment data for ID:', enrollmentId);

      if (!enrollmentId) {
        console.log('No enrollment ID found - new enrollment mode');
        return;
      }

      // Update sessionStorage to match URL param
      if (searchParams.get('enrollmentId')) {
        sessionStorage.setItem('current_enrollment_id', enrollmentId);
      }

      try {
        console.log('Fetching enrollment from:', `http://localhost:3002/api/v1/enrollments/${enrollmentId}`);
        const response = await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}`, {
          headers: {
            'x-agent-id': '11111111-1111-1111-1111-111111111111'
          }
        });

        console.log('Enrollment fetch response status:', response.status);

        if (!response.ok) {
          console.error('Failed to fetch enrollment data, status:', response.status);
          return;
        }

        const data = await response.json();
        console.log('Enrollment data received:', data);

        const enrollment = data.enrollment;
        console.log('Parsed enrollment:', enrollment);

        if (!enrollment) {
          console.log('No enrollment found in response');
          return;
        }

        // Map subscriber data
        const subscriberPerson = mapCustomerToPerson(enrollment.subscriber);
        console.log('Mapped subscriber:', subscriberPerson);

        // Map insured data
        let insuredPerson: Person;
        let sameAsSubscriber: boolean;

        if (enrollment.insured_id === null) {
          // insured_id is null → insured same as subscriber
          insuredPerson = { ...subscriberPerson };
          sameAsSubscriber = true;
          console.log('insured_id is null - using subscriber data for insured');
        } else {
          // insured_id exists → map insured data
          insuredPerson = mapCustomerToPerson(enrollment.insured);
          sameAsSubscriber = false;
          console.log('insured_id exists - using separate insured data:', insuredPerson);
        }

        // Override with data.personalInfo.insuredSameAsSubscriber if present
        if (enrollment.data?.personalInfo?.insuredSameAsSubscriber !== undefined) {
          sameAsSubscriber = enrollment.data.personalInfo.insuredSameAsSubscriber;
          console.log('Using insuredSameAsSubscriber from data.personalInfo:', sameAsSubscriber);
        }

        // Set form state
        setFormData({
          subscriber: subscriberPerson,
          insured: insuredPerson
        });

        setInsuredSameAsSubscriber(sameAsSubscriber);
        console.log('Form data loaded successfully');
      } catch (error) {
        console.error('Error loading enrollment data:', error);
      }
    };

    loadEnrollmentData();
  }, [searchParams]);

  // Auto-save when user returns from next step
  useEffect(() => {
    const autoSave = async () => {
      const enrollmentId = sessionStorage.getItem('current_enrollment_id');
      const agentId = sessionStorage.getItem('agent_id') || '11111111-1111-1111-1111-111111111111';

      // Only auto-save if we have an enrollment ID and form has data
      if (enrollmentId && formData.subscriber.firstName) {
        try {
          await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-agent-id': agentId
            },
            body: JSON.stringify({
              personalInfo: {
                subscriber: formData.subscriber,
                insured: formData.insured,
                insuredSameAsSubscriber
              }
            })
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    };

    autoSave();
  }, [formData, insuredSameAsSubscriber]);

  // Load prepopulation data on component mount
  useEffect(() => {
    const prepopulationData = prepopulationUtils.getPrepopulationData();

    if (prepopulationData.dateOfBirth || prepopulationData.city) {
      const updatedSubscriber = { ...emptyPerson };
      const fieldsToMark = new Set<string>();

      if (prepopulationData.dateOfBirth) {
        updatedSubscriber.birthDate = prepopulationData.dateOfBirth;
        fieldsToMark.add('birthDate');
      }

      if (prepopulationData.city) {
        updatedSubscriber.city = prepopulationData.city;
        fieldsToMark.add('city');
      }

      setFormData(prev => ({
        ...prev,
        subscriber: updatedSubscriber,
        insured: insuredSameAsSubscriber ? updatedSubscriber : prev.insured
      }));

      setPrepopulatedFields(prev => ({
        ...prev,
        subscriber: fieldsToMark,
        insured: insuredSameAsSubscriber ? fieldsToMark : prev.insured
      }));

      // Clear prepopulation data after use
      prepopulationUtils.clearPrepopulationData();
    }
  }, [prepopulationUtils, insuredSameAsSubscriber]);

  // Sync insured with subscriber when the toggle is ON
  useEffect(() => {
    if (insuredSameAsSubscriber) {
      setFormData(prev => ({ ...prev, insured: { ...prev.subscriber } }));
      // Also mirror cities options to insured
      setCitiesInsured(citiesSubscriber);
      // Mirror prepopulated fields
      setPrepopulatedFields(prev => ({
        ...prev,
        insured: new Set(Array.from(prev.subscriber))
      }));
    }
  }, [insuredSameAsSubscriber, formData.subscriber, citiesSubscriber]);

  // Lazy-load cities when nationality changes
  useEffect(() => {
    const nat = formData.subscriber.nationality;
    if (!nat) { setCitiesSubscriber([]); return; }
    const en = frToEnCountry[nat] ?? nat;
    setLoadingCities(prev => ({ ...prev, subscriber: true }));
    import('country-city').then(mod => {
      const list: string[] = (mod as any).getCities ? (mod as any).getCities(en) : [];
      setCitiesSubscriber(Array.isArray(list) ? list : []);
    }).catch(() => setCitiesSubscriber([])).finally(() => setLoadingCities(prev => ({ ...prev, subscriber: false })));
  }, [formData.subscriber.nationality]);

  useEffect(() => {
    if (insuredSameAsSubscriber) { return; }
    const nat = formData.insured.nationality;
    if (!nat) { setCitiesInsured([]); return; }
    const en = frToEnCountry[nat] ?? nat;
    setLoadingCities(prev => ({ ...prev, insured: true }));
    import('country-city').then(mod => {
      const list: string[] = (mod as any).getCities ? (mod as any).getCities(en) : [];
      setCitiesInsured(Array.isArray(list) ? list : []);
    }).catch(() => setCitiesInsured([])).finally(() => setLoadingCities(prev => ({ ...prev, insured: false })));
  }, [formData.insured.nationality, insuredSameAsSubscriber]);

  const handleToggleInsuredSame = (value: 'Oui' | 'Non') => {
    if (value === 'Oui') {
      // Snapshot current manual insured before overwriting
      setLastManualInsured(formData.insured);
      setInsuredSameAsSubscriber(true);
      setFormData(prev => ({ ...prev, insured: { ...prev.subscriber } }));
    } else {
      setInsuredSameAsSubscriber(false);
      // Restore last manual insured if available
      setFormData(prev => ({ ...prev, insured: lastManualInsured ? { ...lastManualInsured } : { ...emptyPerson } }));
    }
  };

  const handleContinue = async () => {
    try {
      // Validate required fields
      if (!formData.subscriber.lastName || !formData.subscriber.firstName) {
        alert('Veuillez remplir les champs obligatoires (Nom et Prénom)');
        return;
      }

      if (!formData.subscriber.idNumber) {
        alert('Veuillez remplir le numéro CIN du souscripteur');
        return;
      }

      // Check if we're updating an existing enrollment or creating a new one
      const enrollmentId = searchParams.get('enrollmentId') || sessionStorage.getItem('current_enrollment_id');

      if (!enrollmentId) {
        // NEW ENROLLMENT - Call initialize endpoint
        const initResponse = await fetch('http://localhost:3002/api/v1/enrollments/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            personalInfo: {
              subscriber: formData.subscriber,
              insured: formData.insured,
              insuredSameAsSubscriber
            }
          })
        });

        if (!initResponse.ok) {
          const errorData = await initResponse.json();
          throw new Error(errorData.error || 'Failed to initialize enrollment');
        }

        const initData = await initResponse.json();
        const newEnrollmentId = initData.enrollment.id;

        // Store enrollment ID
        sessionStorage.setItem('current_enrollment_id', newEnrollmentId);

        // Navigate to next step with enrollment ID
        window.location.href = `/enroll/contribution?enrollmentId=${newEnrollmentId}`;

      } else {
        // EXISTING ENROLLMENT - Update as before
        const updateResponse = await fetch(`http://localhost:3002/api/v1/enrollments/${enrollmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            personalInfo: {
              subscriber: formData.subscriber,
              insured: formData.insured,
              insuredSameAsSubscriber
            }
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'Failed to update enrollment');
        }

        // Navigate to next step
        window.location.href = `/enroll/contribution?enrollmentId=${enrollmentId}`;
      }
    } catch (error: any) {
      console.error('Failed to save enrollment:', error);
      alert(`Une erreur s'est produite lors de l'enregistrement: ${error.message}`);
    }
  };

  const handleIDScan = (section: 'subscriber' | 'insured') => {
    setScanningFor(section);
    setShowIDScanner(true);
    setScanResult(null);
  };

  const handleScanComplete = (result: IDScanResult) => {
    setScanResult(result);

    if (result.success && result.extractedData) {
      const mappedData = FieldMappingService.mapExtractedDataToPerson(
        result.extractedData,
        formData[scanningFor]
      );

      setFormData(prev => ({
        ...prev,
        [scanningFor]: {
          ...prev[scanningFor],
          ...mappedData
        }
      }));

      // If scanning for insured and it's currently synced, break the sync
      if (scanningFor === 'insured' && insuredSameAsSubscriber) {
        setInsuredSameAsSubscriber(false);
      }
    }

    setShowIDScanner(false);
  };

  const handleScanCancel = () => {
    setShowIDScanner(false);
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Formulaire d'Assurance</h1>
          <p className="text-gray-600">Souscripteur Assuré - Informations personnelles</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">Étape 1 sur 3 - Informations personnelles</p>
          </div>
        </div>

        <div className="space-y-8">
          <PersonSection
            title="Souscripteur"
            person={formData.subscriber}
            section="subscriber"
            icon={User}
            onChange={handleInputChange}
            cities={citiesSubscriber}
            isLoadingCities={loadingCities.subscriber}
            onIDScan={handleIDScan}
            prepopulatedFields={prepopulatedFields.subscriber}
          />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Assuré</h2>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">L’assuré est le même que le souscripteur ?</label>
              <div className="flex gap-6">
                {['Oui', 'Non'].map(opt => (
                  <label key={opt} className="flex items-center">
                    <input
                      type="radio"
                      name="insured_same"
                      value={opt}
                      checked={insuredSameAsSubscriber ? opt === 'Oui' : opt === 'Non'}
                      onChange={(e) => handleToggleInsuredSame(e.target.value as 'Oui' | 'Non')}
                      className="mr-2 text-blue-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {insuredSameAsSubscriber && (
                <p className="text-xs text-blue-700 mt-2">Cette section est synchronisée avec le souscripteur et n’est pas modifiable.</p>
              )}
            </div>
            <div className={insuredSameAsSubscriber ? 'opacity-60 transition-opacity' : ''} aria-disabled={insuredSameAsSubscriber}>
              <PersonSection
                title=""
                person={formData.insured}
                section="insured"
                icon={NoIcon}
                onChange={handleInputChange}
                cities={insuredSameAsSubscriber ? citiesSubscriber : citiesInsured}
                isLoadingCities={insuredSameAsSubscriber ? loadingCities.subscriber : loadingCities.insured}
                readOnly={insuredSameAsSubscriber}
                onIDScan={handleIDScan}
                prepopulatedFields={prepopulatedFields.insured}
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Enregistrer le brouillon
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Suivant
            </button>
          </div>

          {/* Scan Result Display */}
          {scanResult && scanResult.success && scanResult.extractedData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Scanner terminé avec succès
                  </h3>
                  <p className="text-sm text-green-700 mb-3">
                    {scanResult.fileCount && scanResult.fileCount > 1
                      ? `Les données de ${scanResult.fileCount} fichiers ont été traitées et appliquées`
                      : 'Les données suivantes ont été extraites et appliquées'
                    } au formulaire {scanningFor === 'subscriber' ? 'du souscripteur' : 'de l\'assuré'} :
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {FieldMappingService.generateScanSummary(scanResult.extractedData).map((item, index) => (
                      <div key={index} className="text-green-600">• {item}</div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-green-600">
                      Niveau de confiance:
                      <span className={`ml-1 font-medium ${FieldMappingService.getConfidenceLevelColor(FieldMappingService.getConfidenceLevel(scanResult.extractedData))}`}>
                        {FieldMappingService.getConfidenceLevelText(FieldMappingService.getConfidenceLevel(scanResult.extractedData))}
                      </span>
                      ({Math.round(scanResult.extractedData.confidence * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {scanResult && !scanResult.success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Erreur lors du scan
                  </h3>
                  <p className="text-sm text-red-700">
                    {scanResult.error || 'Une erreur inconnue s\'est produite lors du traitement de votre document.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ID Scanner Modal */}
        {showIDScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <IDScanner
                onScanComplete={handleScanComplete}
                onCancel={handleScanCancel}
                defaultIdType="moroccan_cin"
                className="border-0 shadow-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsuranceForm;
