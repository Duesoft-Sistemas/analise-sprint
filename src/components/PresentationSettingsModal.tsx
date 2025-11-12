import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, X, Clock, RotateCw } from 'lucide-react';
import { useSprintStore } from '../store/useSprintStore';
import { PresentationStep } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_STEPS: PresentationStep[] = [
  { view: 'sprint', section: 'summary' },
  { view: 'sprint', section: 'byFeature' },
  { view: 'sprint', section: 'byClient' },
  { view: 'sprint', section: 'developers' },
  { view: 'multiSprint' },
];

export const PresentationSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const presentation = useSprintStore((s) => s.presentation);
  const setPresentationConfig = useSprintStore((s) => s.setPresentationConfig);
  const setPresentationSteps = useSprintStore((s) => s.setPresentationSteps);
  const startPresentation = useSprintStore((s) => s.startPresentation);
  const stopPresentation = useSprintStore((s) => s.stopPresentation);
  const nextStep = useSprintStore((s) => s.nextPresentationStep);

  const [seconds, setSeconds] = useState<number>(Math.round(presentation.intervalMs / 1000));
  const [localSteps, setLocalSteps] = useState<PresentationStep[]>(presentation.steps.length ? presentation.steps : DEFAULT_STEPS);

  useEffect(() => {
    setSeconds(Math.round(presentation.intervalMs / 1000));
  }, [presentation.intervalMs]);

  useEffect(() => {
    if (presentation.steps.length === 0) {
      setLocalSteps(DEFAULT_STEPS);
    } else {
      setLocalSteps(presentation.steps);
    }
  }, [presentation.steps]);

  const onSave = () => {
    setPresentationConfig({ intervalMs: seconds * 1000, isActive: true });
    setPresentationSteps(localSteps);
  };

  const togglePlay = () => {
    if (presentation.isPlaying) {
      stopPresentation();
    } else {
      startPresentation();
      onClose();
    }
  };

  const stepChecked = (predicate: (s: PresentationStep) => boolean) =>
    localSteps.some(predicate);

  const sameStep = (a: PresentationStep, b: PresentationStep) =>
    a.view === b.view && a.section === b.section && a.multiSection === b.multiSection;

  const toggleStep = (step: PresentationStep) => {
    const exists = localSteps.find((s) => sameStep(s, step));
    if (exists) {
      setLocalSteps(localSteps.filter((s) => !sameStep(s, step)));
    } else {
      setLocalSteps([...localSteps, step]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Modo Apresentação</h3>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sessões do Sprint</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'sprint' && s.section === 'summary')}
                  onChange={() => toggleStep({ view: 'sprint', section: 'summary' })}
                />
                Resumo
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'sprint' && s.section === 'byFeature')}
                  onChange={() => toggleStep({ view: 'sprint', section: 'byFeature' })}
                />
                Por Feature
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'sprint' && s.section === 'byClient')}
                  onChange={() => toggleStep({ view: 'sprint', section: 'byClient' })}
                />
                Por Cliente
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'sprint' && s.section === 'developers')}
                  onChange={() => toggleStep({ view: 'sprint', section: 'developers' })}
                />
                Desenvolvedores
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Outras Abas</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 text-xs uppercase text-gray-500 dark:text-gray-400 mt-1">Multi‑Sprint</div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'multiSprint' && s.multiSection === 'sprintDistribution')}
                  onChange={() => toggleStep({ view: 'multiSprint', multiSection: 'sprintDistribution' })}
                />
                Distribuição por Sprint
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'multiSprint' && s.multiSection === 'developerAllocation')}
                  onChange={() => toggleStep({ view: 'multiSprint', multiSection: 'developerAllocation' })}
                />
                Alocação por Dev
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'multiSprint' && s.multiSection === 'clientAllocation')}
                  onChange={() => toggleStep({ view: 'multiSprint', multiSection: 'clientAllocation' })}
                />
                Alocação por Cliente
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'multiSprint' && s.multiSection === 'featureAnalysis')}
                  onChange={() => toggleStep({ view: 'multiSprint', multiSection: 'featureAnalysis' })}
                />
                Análise de Features
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'multiSprint' && s.multiSection === 'managementKPIs')}
                  onChange={() => toggleStep({ view: 'multiSprint', multiSection: 'managementKPIs' })}
                />
                KPIs de Gestão
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'performance')}
                  onChange={() => toggleStep({ view: 'performance' })}
                />
                Performance
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'evolution')}
                  onChange={() => toggleStep({ view: 'evolution' })}
                />
                Evolução Temporal
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'quality')}
                  onChange={() => toggleStep({ view: 'quality' })}
                />
                Qualidade dos Chamados
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'inconsistencies')}
                  onChange={() => toggleStep({ view: 'inconsistencies' })}
                />
                Inconsistências
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={stepChecked((s) => s.view === 'backlog')}
                  onChange={() => toggleStep({ view: 'backlog' })}
                />
                Backlog
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              <input
                type="number"
                min={5}
                step={5}
                value={seconds}
                onChange={(e) => setSeconds(parseInt(e.target.value || '0', 10))}
                className="w-20 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">segundos por etapa</span>
            </div>
            <button
              onClick={() => { setLocalSteps(DEFAULT_STEPS); setSeconds(60); }}
              className="px-3 py-2 text-sm rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              title="Restaurar padrão"
            >
              <RotateCw className="w-4 h-4" /> Padrão
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {presentation.steps.length} etapas • {Math.round(presentation.intervalMs / 1000)}s padrão
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSave}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Salvar
            </button>
            <button
              onClick={togglePlay}
              className={`px-4 py-2 rounded-xl text-white shadow-md flex items-center gap-2 ${presentation.isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {presentation.isPlaying ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Reproduzir</>}
            </button>
            <button
              onClick={() => nextStep()}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black/90"
              title="Próxima etapa"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


