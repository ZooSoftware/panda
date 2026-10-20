import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { saveUrl, slug } from '../../shared/download';
import { renderDiagramImage, type ImageFormat } from './exportImage';

/** Saves the whole diagram as drawn now, named after the tree's title. */
export function useImageExport(title: string, onError: (message: string) => void) {
  const { getNodes } = useReactFlow();
  return useCallback(
    async (format: ImageFormat) => {
      try {
        const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        saveUrl(`${slug(title)}.${format}`, await renderDiagramImage(format, getNodes(), background));
      } catch (e) {
        onError(`Image export failed: ${(e as Error).message}`);
      }
    },
    [getNodes, title, onError],
  );
}
