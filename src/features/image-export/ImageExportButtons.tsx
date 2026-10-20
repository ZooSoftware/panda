import { IMAGE_FORMATS, type ImageFormat } from './exportImage';

export function ImageExportButtons({ onExport }: { onExport(format: ImageFormat): void }) {
  return (
    <div className="field">
      Export image
      <div className="field-inline">
        {IMAGE_FORMATS.map((f) => (
          <button key={f} onClick={() => onExport(f)} title={`The whole diagram as drawn now, as ${f.toUpperCase()}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
