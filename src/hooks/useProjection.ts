import { useMemo } from 'react';
import type { Inputs, ProjectionResult, ProjectionMode } from '../types';
import { runProjection } from '../engine/projection';

export function useProjection(inputs: Inputs, mode: ProjectionMode = 'real'): ProjectionResult {
  return useMemo(() => runProjection(inputs, mode), [inputs, mode]);
}
