import { useState } from 'react';
import type { Inputs, ProjectionMode } from './types';
import { defaultInputs } from './engine/defaults';
import { useLocalStorage, useResetToDefaults } from './hooks/useLocalStorage';
import { useProjection } from './hooks/useProjection';
import InputPanel from './components/InputPanel';
import ExpensePhaseEditor from './components/ExpensePhaseEditor';
import Summary from './components/Summary';
import BalanceChart from './components/BalanceChart';
import ProjectionTable from './components/ProjectionTable';
import styles from './App.module.css';

function App() {
  const [inputs, setInputs] = useLocalStorage<Inputs>(
    'retirement-planner-inputs',
    defaultInputs
  );
  const resetToDefaults = useResetToDefaults(defaultInputs, setInputs);
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('real');
  const result = useProjection(inputs, projectionMode);

  return (
    <div className={styles.app}>
      <h1 className={styles.title}>Retirement Planner</h1>
      <div className={styles.layout}>
        <InputPanel
          inputs={inputs}
          onChange={setInputs}
          onReset={resetToDefaults}
          projectionMode={projectionMode}
          onModeChange={setProjectionMode}
        />
        <ExpensePhaseEditor
          phases={inputs.expensePhases}
          onChange={(phases) => setInputs({ ...inputs, expensePhases: phases })}
        />
        <div className={styles.outputs}>
          <Summary result={result} inputs={inputs} projectionMode={projectionMode} />
          <BalanceChart rows={result.rows} inputs={inputs} projectionMode={projectionMode} />
          <ProjectionTable rows={result.rows} inputs={inputs} projectionMode={projectionMode} />
        </div>
      </div>
    </div>
  );
}

export default App;
