import { useState } from 'react';

const REGIONS = [
  { id: 'dhaka', name: 'ঢাকা', nameEn: 'Dhaka', active: true },
  { id: 'chittagong', name: 'চট্টগ্রাম', nameEn: 'Chittagong', active: false },
  { id: 'rajshahi', name: 'রাজশাহী', nameEn: 'Rajshahi', active: false },
  { id: 'sylhet', name: 'সিলেট', nameEn: 'Sylhet', active: false },
  { id: 'khulna', name: 'খুলনা', nameEn: 'Khulna', active: false },
  { id: 'barisal', name: 'বরিশাল', nameEn: 'Barisal', active: false },
  { id: 'rangpur', name: 'রংপুর', nameEn: 'Rangpur', active: false },
  { id: 'mymensingh', name: 'ময়মনসিংহ', nameEn: 'Mymensingh', active: false },
];

export default function RegionSelector({ selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <div className="grid gap-1">
          <label className="text-[0.8rem] font-bold" style={{ color: '#0369a1' }}>বিভাগ (Division)</label>
          <select
            className="region-select"
            value={selected || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">— বিভাগ নির্বাচন করুন —</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.nameEn}){!r.active ? ' 📋' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-[0.8rem] font-bold" style={{ color: '#0369a1' }}>জেলা (District)</label>
          <select className="region-select" disabled>
            <option value="">— জেলা নির্বাচন করুন —</option>
          </select>
        </div>
      </div>
    </div>
  );
}
