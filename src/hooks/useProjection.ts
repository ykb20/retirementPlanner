import { useMemo } from 'react';
import type { Inputs, ProjectionResult } from '../types';
import { runProjection } from '../engine/projection';

export function useProjection(inputs: Inputs): ProjectionResult {
  return useMemo(() => runProjection(inputs), [inputs]);
}
