// Path: src/components/AddCap.tsx

import { useState } from 'react';
import { Cap } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo from './TeamLogos';

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

export default function AddCap({ onBack, onSaved }: Props) {
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [year, setYear] = useState<number | undefined>();
  const [condition, setCondition] = useState<'good' | 'renovated'>('good');
  const [price, setPrice] = useState<number | undefined>();
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (jpg, png, svg).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !team || !year || !price || !description) {
      alert('Please fill all required fields.');
      return;
    }

    const newCap: Cap = {
      id: crypto.randomUUID(),
      name,
      team,
      year,
      condition,
      price,
      description,
      image: image || null,
      featured,
    };

    await api.addCap(newCap);
    onSaved();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl">
      <h1 className="text-2xl font-black mb-6">Add New Cap</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block font-bold mb-1">Cap Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Bulls Dynasty Snapback"
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-bold mb-1">Team *</label>
          <input
            type="text"
            value={team}
            onChange={e => setTeam(e.target.value)}
            placeholder="e.g. Chicago Bulls"
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-1">Year Released</label>
            <input
              type="number"
              value={year || ''}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Condition</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value as 'good' | 'renovated')}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="good">Good</option>
              <option value="renovated">Renovated</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold mb-1">Price (₱)</label>
          <input
            type="number"
            value={price || ''}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-bold mb-1">Cap Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full"
          />
          {image && (
            <img
              src={image}
              alt="Cap preview"
              className="mt-2 w-32 h-32 object-cover rounded-xl border"
            />
          )}
        </div>

        <div>
          <label className="block font-bold mb-1">Description *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the cap..."
            className="w-full border px-3 py-2 rounded"
            rows={3}
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
            />
            Featured
          </label>

          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded font-bold"
          >
            Add Cap
          </button>

          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 text-black px-4 py-2 rounded font-bold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
