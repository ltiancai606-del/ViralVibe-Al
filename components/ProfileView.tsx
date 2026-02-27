import React, { useState } from 'react';
import { CatProfile } from '../types';
import { Button } from './Button';

interface ProfileViewProps {
  cats: CatProfile[];
  onUpdateCats: (cats: CatProfile[]) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ cats, onUpdateCats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CatProfile>>({
    name: '',
    breed: '',
    age: '',
    gender: 'boy',
    isNeutered: false,
    personality: '',
    hobbies: '',
    relationship: '',
    avatar: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      age: '',
      gender: 'boy',
      isNeutered: false,
      personality: '',
      hobbies: '',
      relationship: '',
      avatar: ''
    });
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (cat: CatProfile) => {
    setFormData(cat);
    setEditingId(cat.id);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个猫咪档案吗？')) {
      onUpdateCats(cats.filter(c => c.id !== id));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // The result is a data URL (base64)
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, avatar: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      const updatedCats = cats.map(c => 
        c.id === editingId ? { ...c, ...formData } as CatProfile : c
      );
      onUpdateCats(updatedCats);
    } else {
      const newCat: CatProfile = {
        ...formData,
        id: Date.now().toString(),
      } as CatProfile;
      onUpdateCats([...cats, newCat]);
    }
    resetForm();
  };

  return (
    <div className="p-4 animate-fade-in pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-white mb-1">铲屎官中心</h2>
           <p className="text-slate-400 text-sm">管理你的爱宠档案，生成更懂你的文案</p>
        </div>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          {cats.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center border-dashed border-2 border-slate-700">
              <div className="text-5xl mb-4 grayscale opacity-50">🐱</div>
              <p className="text-slate-300 font-medium mb-2">还没有添加猫咪档案</p>
              <p className="text-xs text-slate-500 mb-6">添加后AI能更精准地识别主子</p>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                + 添加第一只猫咪
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
               {cats.map(cat => (
                <div key={cat.id} className="glass-card rounded-3xl p-5 flex items-start justify-between group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-bl-full -mr-4 -mt-4"></div>
                  
                  <div className="flex gap-4 z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg overflow-hidden ${!cat.avatar ? (cat.gender === 'boy' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400') : ''}`}>
                      {cat.avatar ? (
                        <img src={cat.avatar} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        cat.gender === 'boy' ? '😼' : '😺'
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {cat.name}
                        {cat.isNeutered && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">已绝育</span>}
                      </h3>
                      <div className="text-sm text-slate-400 mb-2">{cat.breed} · {cat.age}</div>
                      <div className="flex flex-wrap gap-1">
                        {cat.personality.split(/[,，、]/).slice(0,3).map((tag, i) => (
                           tag && <span key={i} className="text-[10px] bg-slate-800 px-2 py-1 rounded-md text-slate-300 border border-slate-700">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 z-10">
                    <button onClick={() => handleEdit(cat)} className="p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700 text-slate-300">✏️</button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 bg-slate-800/50 rounded-xl hover:bg-red-900/50 text-slate-300 hover:text-red-400">🗑️</button>
                  </div>
                </div>
               ))}
               <Button onClick={() => setIsEditing(true)} variant="secondary" fullWidth className="mt-4 !bg-slate-800/50 border-dashed border-slate-600 text-slate-400">
                 + 添加更多猫咪
               </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 animate-slide-up">
          <h3 className="text-lg font-bold mb-6 text-white border-l-4 border-rose-500 pl-3">
            {editingId ? '编辑档案' : '新猫咪档案'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-600 ${!formData.avatar ? 'bg-slate-800' : ''}`}>
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-slate-500">📷</span>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="absolute bottom-0 right-0 bg-rose-500 rounded-full p-1.5 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 ml-1">名字</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 outline-none transition-colors"
                  placeholder="咪咪"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 ml-1">品种</label>
                <input
                  value={formData.breed}
                  onChange={e => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 outline-none transition-colors"
                  placeholder="英短"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 ml-1">年龄</label>
                <input
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 outline-none transition-colors"
                  placeholder="2岁"
                />
              </div>
              <div className="space-y-1 col-span-2">
                 <label className="text-xs text-slate-400 ml-1">性别 & 状态</label>
                 <div className="flex gap-2">
                   <select 
                     value={formData.gender}
                     onChange={e => setFormData({...formData, gender: e.target.value as 'boy' | 'girl'})}
                     className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white flex-1 outline-none"
                   >
                     <option value="boy">弟弟 ♂</option>
                     <option value="girl">妹妹 ♀</option>
                   </select>
                   <label className="flex items-center justify-center px-3 bg-slate-900/50 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isNeutered}
                        onChange={e => setFormData({ ...formData, isNeutered: e.target.checked })}
                        className="w-4 h-4 accent-rose-500 rounded mr-2"
                      />
                      <span className="text-sm text-slate-300">已绝育</span>
                   </label>
                 </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 ml-1">性格 (用逗号分隔)</label>
              <input
                value={formData.personality}
                onChange={e => setFormData({ ...formData, personality: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 outline-none transition-colors"
                placeholder="粘人, 高冷, 话唠..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 ml-1">爱好/特长</label>
              <input
                value={formData.hobbies}
                onChange={e => setFormData({ ...formData, hobbies: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 outline-none transition-colors"
                placeholder="踩奶, 跑酷..."
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" onClick={resetForm} className="flex-1">取消</Button>
              <Button type="submit" className="flex-1 shadow-rose-500/20">保存</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};