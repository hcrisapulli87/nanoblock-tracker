interface Props {
  owned: number
  total: number
}

export function ProgressBar({ owned, total }: Props) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((owned / total) * 100))
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-label">
        {owned} / {total} sets collected
      </div>
      <div className="progress-bar-track">
        <div
          data-testid="progress-fill"
          className="progress-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
