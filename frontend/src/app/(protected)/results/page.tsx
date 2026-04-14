'use client';

import { FlaskConical } from 'lucide-react';
import { ResultList } from '@/modules/results/ResultList';

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FlaskConical className="text-primary-600" size={24} />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Resultados</h1>
          <p className="text-sm text-gray-500">Resultados de exámenes de laboratorio</p>
        </div>
      </div>
      <ResultList />
    </div>
  );
}
