import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FactfinderData, ClaimRecord } from '@/types';

interface FactfinderFormInputs {
  companyName: string;
  industry: string;
  employeeCount: number;
  state: string;
  ein: string;
  renewalDate: string;
  averageAge: number;
  maleCount: number;
  femaleCount: number;
  dependents: number;
  claimYear1: number;
  claimCost1: number;
  claimCount1: number;
  claimYear2: number;
  claimCost2: number;
  claimCount2: number;
  claimYear3: number;
  claimCost3: number;
  claimCount3: number;
}

export const FactfinderEnhanced: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FactfinderFormInputs>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);
  const navigate = useNavigate();

  const totalSteps = 3;

  const onSubmit = async (data: FactfinderFormInputs) => {
    setIsSubmitting(true);

    const historicalData: ClaimRecord[] = [
      { year: data.claimYear1, totalCost: data.claimCost1, claimCount: data.claimCount1 },
      { year: data.claimYear2, totalCost: data.claimCost2, claimCount: data.claimCount2 },
      { year: data.claimYear3, totalCost: data.claimCost3, claimCount: data.claimCount3 },
    ];

    const totalAnnualCost = (data.claimCost1 + data.claimCost2 + data.claimCost3) / 3;

    const factfinderData: Omit<FactfinderData, 'prospect_id'> = {
      prospect_id: '',
      company: {
        name: data.companyName,
        industry: data.industry,
        employeeCount: data.employeeCount,
        state: data.state,
        ein: data.ein,
        renewalDate: data.renewalDate,
      },
      census: {
        averageAge: data.averageAge,
        maleCount: data.maleCount,
        femaleCount: data.femaleCount,
        dependents: data.dependents,
      },
      claims: {
        historicalData,
        totalAnnualCost,
      },
      validated: true,
      timestamp: Date.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'factfinder'), factfinderData);
      console.log('Factfinder saved with ID:', docRef.id);
      navigate(`/dashboard/${docRef.id}`);
    } catch (error) {
      console.error('Error saving factfinder:', error);
      alert('Error saving factfinder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Factfinder</h1>
        <p className="text-lg text-gray-600">
          Complete the information below to start your insurance analysis. All fields marked with * are required.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Company Info</span>
          <span>Census Data</span>
          <span>Claims History</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    {...register('companyName', { required: 'Company name is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <input
                    id="industry"
                    type="text"
                    {...register('industry', { required: 'Industry is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Technology, Healthcare"
                  />
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Count *
                  </label>
                  <input
                    id="employeeCount"
                    type="number"
                    {...register('employeeCount', {
                      required: 'Employee count is required',
                      min: { value: 1, message: 'Must be at least 1' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="50"
                  />
                  {errors.employeeCount && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeCount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    id="state"
                    type="text"
                    maxLength={2}
                    {...register('state', {
                      required: 'State is required',
                      pattern: { value: /^[A-Z]{2}$/, message: 'Enter 2-letter state code (e.g., CA)' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                    placeholder="CA"
                  />
                  {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
                </div>

                <div>
                  <label htmlFor="ein" className="block text-sm font-medium text-gray-700 mb-2">
                    EIN (Employer Identification Number)
                  </label>
                  <input
                    id="ein"
                    type="text"
                    {...register('ein')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div>
                  <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Renewal Date
                  </label>
                  <input
                    id="renewalDate"
                    type="date"
                    {...register('renewalDate')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Census Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Census Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="averageAge" className="block text-sm font-medium text-gray-700 mb-2">
                    Average Employee Age *
                  </label>
                  <input
                    id="averageAge"
                    type="number"
                    {...register('averageAge', {
                      required: 'Average age is required',
                      min: { value: 18, message: 'Must be at least 18' },
                      max: { value: 100, message: 'Must be 100 or less' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="35"
                  />
                  {errors.averageAge && (
                    <p className="mt-1 text-sm text-red-600">{errors.averageAge.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dependents" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Dependents *
                  </label>
                  <input
                    id="dependents"
                    type="number"
                    {...register('dependents', {
                      required: 'Dependents is required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="75"
                  />
                  {errors.dependents && (
                    <p className="mt-1 text-sm text-red-600">{errors.dependents.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="maleCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Male Employees *
                  </label>
                  <input
                    id="maleCount"
                    type="number"
                    {...register('maleCount', {
                      required: 'Male count is required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="30"
                  />
                  {errors.maleCount && (
                    <p className="mt-1 text-sm text-red-600">{errors.maleCount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="femaleCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Female Employees *
                  </label>
                  <input
                    id="femaleCount"
                    type="number"
                    {...register('femaleCount', {
                      required: 'Female count is required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="20"
                  />
                  {errors.femaleCount && (
                    <p className="mt-1 text-sm text-red-600">{errors.femaleCount.message}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Census data helps us calculate more accurate risk assessments
                  and compliance requirements.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Claims History */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Claims History (Last 3 Years)
              </h2>

              {[1, 2, 3].map((year) => (
                <div key={year} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Year {year}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor={`claimYear${year}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Year *
                      </label>
                      <input
                        id={`claimYear${year}`}
                        type="number"
                        {...register(`claimYear${year}` as any, {
                          required: `Year ${year} is required`,
                          min: { value: 2000, message: 'Year must be 2000 or later' },
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={`${new Date().getFullYear() - (4 - year)}`}
                      />
                      {errors[`claimYear${year}` as keyof typeof errors] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`claimYear${year}` as keyof typeof errors]?.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`claimCost${year}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Total Cost ($) *
                      </label>
                      <input
                        id={`claimCost${year}`}
                        type="number"
                        step="0.01"
                        {...register(`claimCost${year}` as any, {
                          required: `Cost for year ${year} is required`,
                          min: { value: 0, message: 'Cannot be negative' },
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="500000"
                      />
                      {errors[`claimCost${year}` as keyof typeof errors] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`claimCost${year}` as keyof typeof errors]?.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`claimCount${year}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Claim Count *
                      </label>
                      <input
                        id={`claimCount${year}`}
                        type="number"
                        {...register(`claimCount${year}` as any, {
                          required: `Claim count for year ${year} is required`,
                          min: { value: 0, message: 'Cannot be negative' },
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="120"
                      />
                      {errors[`claimCount${year}` as keyof typeof errors] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`claimCount${year}` as keyof typeof errors]?.message as string}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Submit & Analyze →'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
