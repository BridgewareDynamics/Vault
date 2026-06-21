import {
  FileImage,
  FileText,
  Film,
  Gauge,
  Image,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import {
  FileConverterOutputFormat,
  FileConverterSource,
  FileConverterTarget,
  Theme,
} from '../../types';
import { useFileConverterTheme } from './fileConverterTheme';
import { FileConverterStyledSelect, type FileConverterSelectOption } from './FileConverterStyledSelect';

interface FileConverterFormatPickerProps {
  source: FileConverterSource | null;
  target: FileConverterTarget;
  availableFormats: FileConverterOutputFormat[];
  onChange: (target: FileConverterTarget) => void;
  theme: Theme;
}

const FORMAT_META: Record<
  FileConverterOutputFormat,
  { label: string; description: string; icon: LucideIcon }
> = {
  png: { label: 'PNG', description: 'Lossless raster evidence export', icon: Image },
  jpeg: { label: 'JPEG', description: 'Compressed photo output', icon: FileImage },
  webp: { label: 'WebP', description: 'Modern efficient web raster', icon: Layers },
  tiff: { label: 'TIFF', description: 'Archival high-fidelity raster', icon: FileImage },
  gif: { label: 'GIF', description: 'Animated or indexed color', icon: Image },
  pdf: { label: 'PDF', description: 'Document bundle output', icon: FileText },
  mp4: { label: 'MP4', description: 'H.264 video container', icon: Film },
  webm: { label: 'WebM', description: 'Web-optimized video', icon: Film },
};

const DPI_OPTIONS: FileConverterSelectOption<string>[] = [
  { value: '72', label: '72 DPI', description: 'Draft preview quality', icon: Gauge },
  { value: '150', label: '150 DPI', description: 'Standard evidence raster', icon: Gauge },
  { value: '300', label: '300 DPI', description: 'High fidelity archive', icon: Gauge },
];

function buildFormatOptions(formats: FileConverterOutputFormat[]): FileConverterSelectOption<FileConverterOutputFormat>[] {
  return formats.map((format) => {
    const meta = FORMAT_META[format];
    return {
      value: format,
      label: meta?.label ?? format.toUpperCase(),
      description: meta?.description,
      icon: meta?.icon,
    };
  });
}

export function FileConverterFormatPicker({
  source,
  target,
  availableFormats,
  onChange,
  theme,
}: FileConverterFormatPickerProps) {
  const t = useFileConverterTheme(theme);
  const formatOptions = buildFormatOptions(availableFormats);

  if (!source) {
    return (
      <div className={`rounded-[22px] border px-5 py-8 text-center ${t.promptIdle}`}>
        <p className={`text-sm leading-6 ${t.mutedText}`}>
          Select a source file to unlock format-specific output controls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className={`rounded-[22px] border p-4 ${t.dialogInset}`}>
        <FileConverterStyledSelect
          theme={theme}
          label="Output format"
          ariaLabel="Choose output format"
          value={target.format}
          options={formatOptions}
          onChange={(format) => onChange({ ...target, format })}
        />
      </div>

      {(target.format === 'jpeg' || target.format === 'webp') && (
        <div className={`rounded-[22px] border p-4 ${t.dialogInset}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className={`text-xs font-semibold uppercase tracking-[0.22em] ${t.sectionLabel}`}>
              Quality
            </label>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${t.featurePill}`}>
              {target.quality ?? 85}%
            </span>
          </div>
          <div className={`rounded-[18px] border px-4 py-3 ${t.softInsetSurface}`}>
            <input
              type="range"
              min={1}
              max={100}
              value={target.quality ?? 85}
              onChange={(e) => onChange({ ...target, quality: parseInt(e.target.value, 10) })}
              className={`w-full ${t.isPastel ? 'accent-purple-500' : 'accent-cyan-400'}`}
            />
            <div className={`mt-2 flex justify-between text-[10px] uppercase tracking-[0.18em] ${t.muted}`}>
              <span>Smaller file</span>
              <span>Higher fidelity</span>
            </div>
          </div>
        </div>
      )}

      {source.category === 'pdf' && target.format !== 'pdf' && (
        <div className={`rounded-[22px] border p-4 ${t.dialogInset}`}>
          <FileConverterStyledSelect
            theme={theme}
            label="Raster DPI"
            ariaLabel="Choose raster DPI"
            value={String(target.dpi ?? 150)}
            options={DPI_OPTIONS}
            onChange={(dpi) => onChange({ ...target, dpi: parseInt(dpi, 10) })}
          />
        </div>
      )}

      <div className={`rounded-[22px] border p-4 ${t.callout}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${t.calloutLabel}`}>
          Source profile
        </p>
        <p className={`mt-2 text-sm leading-6 ${t.body}`}>
          {source.fileName} · {source.category.toUpperCase()} ·{' '}
          {availableFormats.length} compatible output route
          {availableFormats.length === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}
