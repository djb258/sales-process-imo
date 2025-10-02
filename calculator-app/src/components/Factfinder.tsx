import React from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FactfinderData, ClaimRecord } from '@/types';

interface FactfinderFormInputs {
  companyName: string;
  industry: string;
  employeeCount: number;
  state: string;
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

export const Factfinder: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FactfinderFormInputs>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [prospectId, setProspectId] = React.useState<string | null>(null);

  const onSubmit = async (data: FactfinderFormInputs) => {
    setIsSubmitting(true);

    const historicalData: ClaimRecord[] = [
      { year: data.claimYear1, totalCost: data.claimCost1, claimCount: data.claimCount1 },
      { year: data.claimYear2, totalCost: data.claimCost2, claimCount: data.claimCount2 },
      { year: data.claimYear3, totalCost: data.claimCost3, claimCount: data.claimCount3 },
    ];

    const totalAnnualCost =
      (data.claimCost1 + data.claimCost2 + data.claimCost3) / 3;

    const factfinderData: Omit<FactfinderData, 'prospect_id'> = {
      prospect_id: '', // Will be set after document creation
      company: {
        name: data.companyName,
        industry: data.industry,
        employeeCount: data.employeeCount,
        state: data.state,
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
      // Add document to Firestore
      const docRef = await addDoc(collection(db, 'factfinder'), factfinderData);
      setProspectId(docRef.id);

      console.log('Factfinder saved with ID:', docRef.id);
      alert(`Factfinder saved! Prospect ID: ${docRef.id}`);
    } catch (error) {
      console.error('Error saving factfinder:', error);
      alert('Error saving factfinder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="factfinder-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Factfinder - IMO Calculator</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Complete the information below to start your insurance analysis.
      </p>

      {prospectId && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Success!</strong> Prospect ID: {prospectId}
          <br />
          <a href={`/dashboard/${prospectId}`} style={{ color: '#155724', textDecoration: 'underline' }}>
            View Dashboard →
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Company Information */}
        <section style={{ marginBottom: '30px' }}>
          <h2>Company Information</h2>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="companyName" style={{ display: 'block', marginBottom: '5px' }}>
              Company Name *
            </label>
            <input
              id="companyName"
              type="text"
              {...register('companyName', { required: 'Company name is required' })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.companyName && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.companyName.message}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="industry" style={{ display: 'block', marginBottom: '5px' }}>
              Industry *
            </label>
            <input
              id="industry"
              type="text"
              {...register('industry', { required: 'Industry is required' })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.industry && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.industry.message}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="employeeCount" style={{ display: 'block', marginBottom: '5px' }}>
              Employee Count *
            </label>
            <input
              id="employeeCount"
              type="number"
              {...register('employeeCount', {
                required: 'Employee count is required',
                min: { value: 1, message: 'Must be at least 1' }
              })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.employeeCount && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.employeeCount.message}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="state" style={{ display: 'block', marginBottom: '5px' }}>
              State *
            </label>
            <input
              id="state"
              type="text"
              placeholder="e.g., CA, NY, TX"
              {...register('state', { required: 'State is required' })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.state && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.state.message}</span>
            )}
          </div>
        </section>

        {/* Census Information */}
        <section style={{ marginBottom: '30px' }}>
          <h2>Census Information</h2>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="averageAge" style={{ display: 'block', marginBottom: '5px' }}>
              Average Employee Age *
            </label>
            <input
              id="averageAge"
              type="number"
              {...register('averageAge', {
                required: 'Average age is required',
                min: { value: 18, message: 'Must be at least 18' }
              })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.averageAge && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.averageAge.message}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="maleCount" style={{ display: 'block', marginBottom: '5px' }}>
              Male Employees *
            </label>
            <input
              id="maleCount"
              type="number"
              {...register('maleCount', { required: 'Male count is required', min: 0 })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.maleCount && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.maleCount.message}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="femaleCount" style={{ display: 'block', marginBottom: '5px' }}>
              Female Employees *
            </label>
            <input
              id="femaleCount"
              type="number"
              {...register('femaleCount', { required: 'Female count is required', min: 0 })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.femaleCount && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.femaleCount.message}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="dependents" style={{ display: 'block', marginBottom: '5px' }}>
              Total Dependents *
            </label>
            <input
              id="dependents"
              type="number"
              {...register('dependents', { required: 'Dependents count is required', min: 0 })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.dependents && (
              <span style={{ color: 'red', fontSize: '12px' }}>{errors.dependents.message}</span>
            )}
          </div>
        </section>

        {/* Claims History (3 Years) */}
        <section style={{ marginBottom: '30px' }}>
          <h2>Claims History (Last 3 Years)</h2>

          {[1, 2, 3].map((yearNum) => (
            <div key={yearNum} style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
              <h3>Year {yearNum}</h3>

              <div style={{ marginBottom: '10px' }}>
                <label htmlFor={`claimYear${yearNum}`} style={{ display: 'block', marginBottom: '5px' }}>
                  Year *
                </label>
                <input
                  id={`claimYear${yearNum}`}
                  type="number"
                  placeholder="e.g., 2023"
                  {...register(`claimYear${yearNum}` as any, { required: true })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label htmlFor={`claimCost${yearNum}`} style={{ display: 'block', marginBottom: '5px' }}>
                  Total Cost ($) *
                </label>
                <input
                  id={`claimCost${yearNum}`}
                  type="number"
                  placeholder="e.g., 150000"
                  {...register(`claimCost${yearNum}` as any, { required: true, min: 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label htmlFor={`claimCount${yearNum}`} style={{ display: 'block', marginBottom: '5px' }}>
                  Claim Count *
                </label>
                <input
                  id={`claimCount${yearNum}`}
                  type="number"
                  {...register(`claimCount${yearNum}` as any, { required: true, min: 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '15px',
            background: isSubmitting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Processing...' : 'Submit Factfinder'}
        </button>
      </form>
    </div>
  );
};
