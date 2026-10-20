import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

/** Fits the whole tree in view, after the next paint (so new nodes are measured). */
export function useFit() {
  const { fitView } = useReactFlow();
  return useCallback(() => {
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [fitView]);
}
