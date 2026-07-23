const attendancePoints = "8,74 54,66 100,70 146,48 192,42 238,24 284,30 330,14";

export function HomeDashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[600px] lg:ml-auto" aria-label="Sample Flock leadership reports dashboard">
      <div className="absolute -inset-5 -z-10 rounded-[2.75rem] bg-gradient-to-tr from-[#4f7df3]/25 via-[#dce7ff] to-[#eef3ff] blur-2xl" />
      <div className="overflow-hidden rounded-[1.75rem] border border-white/90 bg-white shadow-[0_30px_80px_rgba(31,52,105,0.16)]">
        <div className="flex items-center justify-between border-b border-[#e7ecf6] bg-[#f9fbff] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff8d86]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f3c96c]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#68c995]" />
          </div>
          <div className="rounded-full border border-[#e0e6f2] bg-white px-4 py-1.5 text-[10px] font-semibold text-[#7c879b]">Flock workspace · Reports</div>
          <span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4f7df3]">Sample</span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4f7df3]">Leadership reports</p>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#172344] sm:text-xl">Attendance overview</h2>
              <p className="mt-1 text-[10px] text-[#8a94a7]">One trusted view across services and departments</p>
            </div>
            <div className="flex gap-1.5 text-[9px] font-semibold">
              <span className="rounded-lg border border-[#dde5f3] bg-white px-2.5 py-2 text-[#68748b]">Last 90 days</span>
              <span className="rounded-lg bg-[#4f7df3] px-2.5 py-2 text-white">Download PDF</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["91%", "Worker attendance", "+4.8%", "text-[#347457]"],
              ["426", "Congregation", "+38", "text-[#347457]"],
              ["14", "First timers", "8 progressing", "text-[#4f7df3]"],
              ["3", "Open care alerts", "Needs review", "text-[#bd5d52]"],
            ].map(([value, label, detail, tone]) => (
              <div key={label} className="rounded-xl border border-[#e7ebf4] bg-[#fbfcff] p-3">
                <p className="text-lg font-bold text-[#172344] sm:text-xl">{value}</p>
                <p className="mt-0.5 text-[9px] font-semibold text-[#68748b]">{label}</p>
                <p className={`mt-1.5 text-[8px] font-bold ${tone}`}>{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1.45fr_0.85fr]">
            <div className="rounded-xl border border-[#e7ebf4] p-3.5">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-bold text-[#34415f]">Attendance trend</p><p className="mt-0.5 text-[8px] text-[#929bad]">Last 8 recorded services</p></div>
                <span className="rounded-full bg-[#edf7f1] px-2 py-1 text-[8px] font-bold text-[#347457]">Healthy</span>
              </div>
              <svg viewBox="0 0 338 92" role="img" aria-labelledby="dashboard-chart-title dashboard-chart-description" className="mt-3 h-24 w-full overflow-visible">
                <title id="dashboard-chart-title">Sample worker attendance trend</title>
                <desc id="dashboard-chart-description">Attendance rises across eight recent services.</desc>
                {[18, 42, 66, 90].map((y) => <line key={y} x1="6" x2="332" y1={y} y2={y} stroke="#e8edf7" strokeWidth="1" />)}
                <path d={`M ${attendancePoints} L 330 90 L 8 90 Z`} fill="url(#home-chart-fill)" opacity="0.55" />
                <polyline points={attendancePoints} fill="none" stroke="#4f7df3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <defs><linearGradient id="home-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#9bb5fa" /><stop offset="1" stopColor="#edf2ff" /></linearGradient></defs>
              </svg>
            </div>

            <div className="rounded-xl border border-[#e7ebf4] p-3.5">
              <p className="text-[10px] font-bold text-[#34415f]">Department comparison</p>
              <div className="mt-3 space-y-3">
                {[
                  ["Media", "96%"],
                  ["Ushering", "93%"],
                  ["Music", "89%"],
                  ["Technical", "86%"],
                ].map(([name, rate], index) => (
                  <div key={name}>
                    <div className="flex justify-between text-[8px] font-semibold"><span className="text-[#59657c]">{name}</span><span className="text-[#34415f]">{rate}</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#edf1f8]"><div className="h-full rounded-full bg-[#4f7df3]" style={{ width: `${96 - index * 4}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#dfe6f4] bg-white/95 p-3.5 shadow-[0_18px_45px_rgba(31,52,105,0.15)] backdrop-blur sm:absolute sm:-bottom-7 sm:-left-7 sm:mt-0 sm:max-w-[260px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4f7df3]">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M7 3h7l4 4v14H7V3Z" /><path d="M14 3v5h5M10 13h6m-6 4h4" /></svg>
        </div>
        <div><p className="text-xs font-bold text-[#253252]">Leadership PDF ready</p><p className="mt-0.5 text-[10px] leading-4 text-[#7e889d]">Church-branded and filtered for the meeting</p></div>
      </div>
    </div>
  );
}

export function HomeReportPreview() {
  return (
    <div className="relative rounded-[1.75rem] bg-[#101c3d] p-4 shadow-[0_24px_70px_rgba(16,28,61,0.22)] sm:p-6" aria-label="Sample church-branded attendance report">
      <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#b9caf8]">Sample report</div>
      <div className="overflow-hidden rounded-xl bg-white text-[#172344] shadow-2xl">
        <div className="bg-[#172344] px-5 py-4 text-white sm:px-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#a9c0ff]">TREM Victory Centre</p>
          <div className="mt-1 flex items-end justify-between gap-3"><h3 className="text-base font-bold sm:text-lg">Worker attendance report</h3><span className="text-[8px] text-[#d8e2fb]">1 Apr - 30 Jun 2026</span></div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-4 gap-1.5">
            {[["12", "Services"], ["48", "Submissions"], ["384", "Present"], ["91%", "Rate"]].map(([value, label]) => (
              <div key={label} className="rounded-lg bg-[#f5f7fc] p-2"><p className="text-sm font-bold sm:text-base">{value}</p><p className="mt-0.5 text-[7px] font-semibold uppercase tracking-wide text-[#8993a7]">{label}</p></div>
            ))}
          </div>
          <div className="mt-4">
            <div className="grid grid-cols-[1fr_70px_60px] border-b border-[#dfe5f0] bg-[#f7f9fd] px-2 py-2 text-[7px] font-bold uppercase tracking-wide text-[#7a8599]"><span>Department</span><span className="text-right">Present</span><span className="text-right">Rate</span></div>
            {[["Media", "46 / 48", "96%"], ["Ushering", "45 / 48", "94%"], ["Music", "43 / 48", "90%"], ["Technical", "41 / 48", "85%"]].map((row) => (
              <div key={row[0]} className="grid grid-cols-[1fr_70px_60px] border-b border-[#edf0f6] px-2 py-2 text-[8px] last:border-0"><span className="font-semibold">{row[0]}</span><span className="text-right text-[#68748b]">{row[1]}</span><span className="text-right font-bold text-[#4f7df3]">{row[2]}</span></div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#e8ecf4] pt-3 text-[7px] text-[#8c95a7]"><span>TREM Victory Centre · Confidential</span><span>Page 1 of 3</span></div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-white">
        <div><p className="text-xs font-bold">Ready for leadership review</p><p className="mt-1 text-[10px] text-[#aebbd6]">PDF and CSV use the church name from Settings.</p></div>
        <div className="flex gap-2"><span className="rounded-lg bg-white px-3 py-2 text-[9px] font-bold text-[#345fc9]">PDF report</span><span className="rounded-lg border border-white/20 px-3 py-2 text-[9px] font-bold text-white">CSV data</span></div>
      </div>
    </div>
  );
}

const journeyStages = [
  ["First visit", "32", "100%"],
  ["Returned", "21", "66%"],
  ["Connected", "15", "47%"],
  ["Training", "11", "34%"],
  ["Member", "8", "25%"],
];

export function HomeFirstTimerPreview() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_24px_70px_rgba(31,52,105,0.14)]" aria-label="Sample First Timers movement report">
      <div className="flex items-center justify-between border-b border-[#e8edf7] bg-[#101c3d] px-5 py-4 text-white">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9db7ff]">First-timer movement</p>
          <h3 className="mt-1 text-base font-bold sm:text-lg">Newcomer care overview</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#cbd8fb]">Sample</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-2">
          {[["32", "First visits"], ["66%", "Return rate"], ["3", "Need attention"]].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-[#f5f7fc] p-3">
              <p className="text-lg font-bold text-[#172344]">{value}</p>
              <p className="mt-1 text-[8px] font-semibold text-[#7d889d]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <div><p className="text-xs font-bold text-[#34415f]">Journey funnel</p><p className="mt-0.5 text-[9px] text-[#8b95a8]">First-visit cohort progress</p></div>
            <span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-[8px] font-bold text-[#4f7df3]">Last 90 days</span>
          </div>
          <div className="space-y-2.5">
            {journeyStages.map(([stage, count, rate], index) => (
              <div key={stage} className="grid grid-cols-[68px_1fr_32px] items-center gap-2 text-[9px]">
                <span className="font-semibold text-[#53607a]">{stage}</span>
                <div className="h-6 overflow-hidden rounded-md bg-[#edf1f8]">
                  <div className="flex h-full items-center rounded-md bg-gradient-to-r from-[#4f7df3] to-[#86a5f7] px-2 text-[8px] font-bold text-white" style={{ width: `${100 - index * 15}%` }}>{count}</div>
                </div>
                <span className="text-right font-bold text-[#34415f]">{rate}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e0e7f5] bg-[#fbfcff] px-3.5 py-3">
          <div><p className="text-[10px] font-bold text-[#34415f]">Membership training</p><p className="mt-0.5 text-[8px] text-[#8791a5]">Required before Member status</p></div>
          <span className="rounded-full bg-[#edf7f1] px-2.5 py-1 text-[8px] font-bold text-[#347457]">Gate active</span>
        </div>
      </div>
    </div>
  );
}
