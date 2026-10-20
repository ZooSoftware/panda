import { toJpeg, toPng, toSvg } from 'html-to-image';
import { getNodesBounds, type Node } from '@xyflow/react';

export type ImageFormat = 'png' | 'jpg' | 'svg';
export const IMAGE_FORMATS: ImageFormat[] = ['png', 'jpg', 'svg'];

const PADDING = 40;
// Browsers refuse canvases much larger than this on a side.
const MAX_SIDE = 16000;

/**
 * Renders the whole diagram as it is drawn now (pins, collapsed branches,
 * line style, theme) to a data URL. Nothing is laid out again: the React Flow
 * viewport is captured with a transform that frames every node at scale 1.
 */
export async function renderDiagramImage(format: ImageFormat, nodes: Node[], background: string): Promise<string> {
  const viewport = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewport || nodes.length === 0) throw new Error('Nothing to export');

  const bounds = getNodesBounds(nodes);
  const width = Math.ceil(bounds.width + PADDING * 2);
  const height = Math.ceil(bounds.height + PADDING * 2);
  const options = {
    backgroundColor: background,
    width,
    height,
    // Sharp on high-density screens, but never past the canvas size limit.
    pixelRatio: Math.min(2, MAX_SIDE / Math.max(width, height)),
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${PADDING - bounds.x}px, ${PADDING - bounds.y}px) scale(1)`,
    },
    filter: (el: HTMLElement) => !el.classList?.contains('react-flow__node-toolbar'),
  };

  // `.exporting` hides selection outlines while the copy is taken.
  const root = viewport.closest('.react-flow');
  root?.classList.add('exporting');
  try {
    if (format === 'svg') return await toSvg(viewport, options);
    if (format === 'jpg') return await toJpeg(viewport, { ...options, quality: 0.95 });
    return await toPng(viewport, options);
  } finally {
    root?.classList.remove('exporting');
  }
}
