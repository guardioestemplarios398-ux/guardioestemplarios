import { FILTERS } from '../lib/dateFilters.js';

export default function PeriodFilter({ filter, setFilter, customStart, setCustomStart, customEnd, setCustomEnd }) {
  return (
    <div className="period-panel">
      <div className="period-tabs">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            className={filter === item.key ? 'active' : ''}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {filter === 'custom' && (
        <div className="custom-period">
          <label>
            Data inicial
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </label>
          <label>
            Data final
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}
