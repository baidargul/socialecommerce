export function WizardUploadProgress({
  progress,
  action,
}: {
  progress: number | null;
  action: string;
}) {
  if (progress === null) return null;

  const complete = progress >= 100;
  return (
    <div className="mb-3" role="status" aria-live="polite">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold">
        <span className="text-zinc-600">
          {complete ? `${action} is being processed...` : `Uploading media...`}
        </span>
        <span className="tabular-nums text-[#d62976]">{progress}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-100"
        aria-label={`${action} upload progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[#d62976] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
