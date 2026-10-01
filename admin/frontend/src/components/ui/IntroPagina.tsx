'use client';

export function PageIntro({ icon, tint, title, description }: {
  icon: React.ReactNode; tint: string; title: string; description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>{icon}</div>
      <div>
        <h1 className="text-[22px] font-bold leading-tight text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}
