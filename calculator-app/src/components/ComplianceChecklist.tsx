import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import type { ComplianceRequirement } from '@/types';

interface ComplianceChecklistProps {
  requirements: ComplianceRequirement[];
  title: string;
  description?: string;
}

export const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({
  requirements,
  title,
  description,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const requiredCount = requirements.filter((r) => r.required).length;
  const optionalCount = requirements.length - requiredCount;

  if (requirements.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-500">No compliance requirements found.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <span className="text-sm">
              <strong>{requiredCount}</strong> Required
            </span>
          </div>
          {optionalCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm">
                <strong>{optionalCount}</strong> Optional
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {requirements.map((requirement, index) => (
          <div
            key={index}
            className={`border rounded-lg overflow-hidden transition-all duration-200 ${
              requirement.required
                ? 'border-success-200 bg-success-50'
                : 'border-gray-200 bg-gray-50'
            } ${expandedIndex === index ? 'shadow-md' : 'shadow-sm'}`}
          >
            {/* Header */}
            <div
              className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-0.5">
                  {requirement.required ? (
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-gray-900">{requirement.name}</h4>
                    {requirement.required && (
                      <span className="px-2 py-1 bg-success-600 text-white text-xs font-medium rounded whitespace-nowrap">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Show description preview when collapsed */}
                  {expandedIndex !== index && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {requirement.description}
                    </p>
                  )}
                </div>

                {/* Expand/Collapse indicator */}
                <div className="mt-1">
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedIndex === index && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="pt-4 space-y-3">
                  {/* Description */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                    <p className="text-sm text-gray-600">{requirement.description}</p>
                  </div>

                  {/* Deadline */}
                  {requirement.deadline && (
                    <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-200">
                      <Calendar className="w-4 h-4 text-primary-600 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Deadline</h5>
                        <p className="text-sm text-gray-600">{requirement.deadline}</p>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-200 rounded">
                      {requirement.required ? 'Mandatory' : 'Conditional'}
                    </span>
                    <span className="px-2 py-1 bg-gray-200 rounded">
                      Click to toggle
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Requirements:</span>
          <span className="font-semibold text-gray-900">{requirements.length}</span>
        </div>
      </div>
    </div>
  );
};
