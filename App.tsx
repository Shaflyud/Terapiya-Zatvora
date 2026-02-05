
import React, { useState, useCallback, useEffect } from 'react';
import { Camera, MapPin, Smile, Zap, RefreshCcw, Instagram, ExternalLink, Info, Loader2, ArrowLeft, Trash2, Layers, Plus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Location, Mood, Gear, ShotIdea } from './types';
import { SCENARIOS } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GEAR_ROASTS: Record<string, string> = {
  'Айфон (и так сойдет)': 'Снимаешь на телефон и ждешь магии? Твой "портретный режим" — это просто цифровой суп.',
  'Sony A7IV + 35mm f/1.4 (база)': 'Самый быстрый автофокус не поможет, если у кадра нет души. Но резкость — огонь.',
  'Canon R5 + 85mm f/1.2 (тяжелый люкс)': 'Цвета — секс, сюжет — воздержание. За эти деньги можно было купить талант.',
  'Fujifilm X100V (хипстерский дефицит)': 'Симуляция пленки не скроет отсутствие идеи. Крутить кольца весело, снимать — сложнее.',
  'Leica M11 (продал почку)': 'Красная точка не делает тебя мастером. Она делает тебя пафосным и бедным.',
  'Зенит + Гелиос-44 (советское боке)': 'Это не винтаж, это грибок на линзе. Но боке красивое, признаю.',
  'Пленочная мыльница из 90-х': 'Ностальгия по временам, когда ты еще не умел всё портить цифрой.',
  'Средний формат (для мазохистов)': 'Столько мегапикселей, чтобы в деталях рассмотреть твой провал. Гениально.',
  'Nikon Z9 + 400mm f/2.8 (фотоохота)': 'Ты похож на спецназовца, но твоя цель — просто голуби.',
  'Полароид (один кадр — одна боль)': '200 рублей за кусок химии, который проявит твою неуверенность.',
  'Haselblad (наследство дедушки)': 'Камера была на Луне, а в твоих руках она видит только яичницу.',
  'Старый цифровой Nikon D40': 'Твой динамический диапазон меньше, чем твое терпение.'
};

const DEFAULT_PHOTOS = [
  { location: 'В студии', id: '601', url: 'https://images.unsplash.com/photo-1590483734724-38fa1f0dd3bd?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 85mm', title: 'Studio Precision' },
  { location: 'Дома на диване', id: '101', url: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 800 | 35mm', title: 'Lazy Afternoon' },
  { location: 'На заброшке', id: '301', url: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 24mm', title: 'Concrete Silence' },
  { location: 'В пафосном месте', id: '401', url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 50mm', title: 'Golden Spirits' },
  { location: 'На крыше (высоко)', id: '501', url: 'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 14mm', title: 'Rooftop Edge' }
];

const STORAGE_KEY = 'shutter_therapy_v2_final';

const App: React.FC = () => {
  const [view, setView] = useState<'generator' | 'archive' | 'about'>('generator');
  const [location, setLocation] = useState<Location>('Дома на диване');
  const [mood, setMood] = useState<Mood>('Уютный интроверт');
  const [gear, setGear] = useState<Gear>('Айфон (и так сойдет)');
  const [result, setResult] = useState<(ShotIdea & { gearComment: string }) | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [userPhotos, setUserPhotos] = useState<any[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPhotos));
  }, [userPhotos]);

  const handleFileUpload = (loc: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newPhoto = {
        location: loc,
        id: `user-${Date.now()}`,
        url: reader.result as string,
        meta: `USER SHOT | ${loc}`,
        title: 'Твой Шедевр',
        isUser: true
      };
      setUserPhotos(prev => [newPhoto, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = (id: string) => {
    setUserPhotos(prev => prev.filter(p => p.id !== id));
  };

  const generateMasterpiece = useCallback(async () => {
    setIsGenerating(true);
    setShowResult(false);
    setGeneratedImage(null);
    
    const key = `${location}_${mood}`;
    const scenario = SCENARIOS[key] || Object.values(SCENARIOS)[0];
    
    setResult({
      ...scenario,
      gearComment: GEAR_ROASTS[gear] || 'Оборудование сомнительное.'
    });
    
    setIsGenerating(false);
    setShowResult(true);
    setIsGeneratingImage(true);

    try {
      const prompt = `A highly aesthetic, professional editorial photograph. Subject: ${scenario.imageKeyword}. Setting: ${location}. Vibe: ${mood}. Cinematic lighting, high-end photography style. No text. Color palette: ${scenario.colors.join(', ')}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [location, mood, gear]);

  return (
    <div className="min-h-screen relative pb-20">
      {/* NAV */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="glass-nav px-6 py-3 rounded-full flex items-center gap-4 md:gap-8 text-stone-white/80">
          <button 
            onClick={() => setView('generator')}
            className={`flex items-center gap-2 font-bold tracking-tighter transition-colors ${view === 'generator' ? 'text-acid-lime' : 'text-stone-white'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${view === 'generator' ? 'bg-acid-lime text-graphite' : 'bg-white/10 text-white'}`}>
              <Camera size={18} />
            </div>
            <span className="hidden sm:inline uppercase">Shutter Therapy</span>
          </button>
          <div className="flex gap-4 md:gap-6 text-xs md:text-sm font-medium">
            <button onClick={() => setView('archive')} className={`transition-colors ${view === 'archive' ? 'text-acid-lime' : 'hover:text-acid-lime'}`}>Архив</button>
            <button onClick={() => setView('about')} className={`transition-colors ${view === 'about' ? 'text-acid-lime' : 'hover:text-acid-lime'}`}>О нас</button>
          </div>
          <button className="hidden md:block bg-acid-lime text-graphite px-4 py-1.5 rounded-full text-sm font-bold hover:scale-105 transition-all">Войти</button>
        </div>
      </nav>

      {view === 'generator' && (
        <main className="max-w-6xl mx-auto px-6 pt-32 animate-in fade-in duration-500">
          <div className="grid md:grid-cols-[5fr_7fr] gap-12 mb-20 items-center">
            <div>
              <h1 className="serif-heading text-6xl md:text-8xl leading-[0.9] mb-6 font-light text-stone-white">
                Терапия <br />
                <i className="font-extralight italic text-acid-lime">Затвором</i>
              </h1>
              <p className="text-xl text-stone-white/60 font-medium max-w-md leading-relaxed">
                Хватит снимать скучную ерунду. Получи совет от самого токсичного креативного директора в индустрии.
              </p>
            </div>
            <div className="relative group">
              <div className="aspect-[4/5] rounded-t-[10rem] rounded-b-3xl overflow-hidden bg-warm-charcoal relative border border-white/5 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-black via-transparent to-transparent opacity-60"></div>
              </div>
              <div className="absolute -top-4 -right-4 bg-acid-lime text-graphite p-8 rounded-3xl rotate-6 shadow-2xl">
                <p className="serif-heading text-2xl font-bold leading-none">99%</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Шанс шедевра</p>
              </div>
            </div>
          </div>

          <section className="bg-warm-charcoal rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative mb-12 p-8 md:p-12">
            <div className="serrated-edge absolute top-0 left-0 w-full z-10"></div>
            <div className="flex flex-wrap items-center gap-4 mb-10 mt-6">
              <div className="bg-acid-lime text-graphite px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider -rotate-2">Настройки съемки</div>
              <div className="h-px bg-white/10 flex-grow"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[ 
                { label: 'Где ты?', val: location, set: setLocation, options: ['Дома на диване', 'В пафосном месте', 'На улице (холодно)', 'В студии', 'Где-то в глуши', 'На крыше (высоко)', 'В старом лифте', 'На заброшке', 'В метро (час пик)', 'На парковке ТЦ'] },
                { label: 'Настроение', val: mood, set: setMood, options: ['Драма Квин', 'Эстетика панелек', 'Люкс/Богатство', 'Уютный интроверт', 'Киберпанк', 'Ностальгия по 2007', 'Сонный паралич', 'Диско-шар', 'Аниме-протагонист', 'Минимализм (пустота)'] },
                { label: 'Оборудование', val: gear, set: setGear, options: ['Айфон (и так сойдет)', 'Sony A7IV + 35mm f/1.4 (база)', 'Canon R5 + 85mm f/1.2 (тяжелый люкс)', 'Fujifilm X100V (хипстерский дефицит)', 'Leica M11 (продал почку)', 'Зенит + Гелиос-44 (советское боке)', 'Пленочная мыльница из 90-х', 'Средний формат (для мазохистов)', 'Nikon Z9 + 400mm f/2.8 (фотоохота)', 'Полароид (один кадр — одна боль)', 'Haselblad (наследство дедушки)', 'Старый цифровой Nikon D40'] }
              ].map((group, i) => (
                <div key={i} className="space-y-4">
                  <label className="text-stone-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-acid-lime" /> {group.label}
                  </label>
                  <select 
                    value={group.val} 
                    onChange={(e) => group.set(e.target.value as any)}
                    className="w-full bg-stone-white border-4 border-transparent rounded-2xl px-4 py-4 outline-none transition-all appearance-none cursor-pointer text-lg font-black text-graphite focus:border-acid-lime"
                  >
                    {group.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-16 flex justify-center">
              <button 
                onClick={generateMasterpiece}
                disabled={isGenerating || isGeneratingImage}
                className="group relative flex items-center gap-4 bg-acid-lime text-graphite px-12 py-6 rounded-full font-bold text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isGenerating || isGeneratingImage ? <RefreshCcw className="animate-spin" /> : 'СГЕНЕРИРОВАТЬ ШЕДЕВР'}
              </button>
            </div>
          </section>

          {showResult && result && (
            <div className="bg-acid-lime text-graphite rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8">
              <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 relative z-10">
                <div className="space-y-6">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-black/10 border border-black/5 flex items-center justify-center">
                    {isGeneratingImage ? <Loader2 className="animate-spin text-graphite" size={48} /> : <img src={generatedImage!} className="w-full h-full object-cover img-fade-in" />}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {result.colors.map(c => (
                      <div key={c} className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-full border border-black/10">
                        <div className="w-4 h-4 rounded-full border border-black/10" style={{backgroundColor: c}}></div>
                        <span className="text-[10px] font-mono font-black uppercase">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h2 className="serif-heading text-5xl md:text-7xl font-bold mb-10 tracking-tight leading-none">{result.title}</h2>
                    <div className="space-y-8">
                      <div><p className="text-[10px] font-black uppercase opacity-40 mb-2 border-b border-black/10 pb-1 w-fit">Задача</p><p className="text-2xl font-medium">{result.shot}</p></div>
                      <div><p className="text-[10px] font-black uppercase opacity-40 mb-2 border-b border-black/10 pb-1 w-fit">Свет</p><p className="text-xl font-medium">{result.lighting}</p></div>
                      <div className="bg-white/40 p-8 rounded-3xl border-2 border-black/5 border-dashed">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-4 tracking-widest">Вердикт</p>
                        <p className="text-xl font-bold italic mb-4">"{result.roast}"</p>
                        <p className="text-sm font-bold opacity-80 border-t border-black/10 pt-4 leading-relaxed">💡 {result.gearComment}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-12 flex items-center justify-between border-t border-black/10 pt-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-black rounded-full flex items-center justify-center text-acid-lime"><Camera size={20} /></div>
                      <p className="font-black">@shutter_therapy</p>
                    </div>
                    <button className="bg-stone-black text-acid-lime px-6 py-3 rounded-full font-black text-sm">SHARE</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {view === 'archive' && (
        <ArchiveView onBack={() => setView('generator')} userPhotos={userPhotos} onUpload={handleFileUpload} onDelete={deletePhoto} />
      )}
      
      {view === 'about' && (
        <AboutView onBack={() => setView('generator')} />
      )}
    </div>
  );
};

const AboutView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <main className="max-w-6xl mx-auto px-6 pt-32 animate-in fade-in duration-500">
    <button onClick={onBack} className="flex items-center gap-2 text-acid-lime text-xs font-black uppercase mb-8"><ArrowLeft size={14} /> Назад</button>
    <h1 className="serif-heading text-7xl md:text-9xl text-stone-white mb-12 leading-none">Манифест <br /><i className="italic text-acid-lime font-extralight">Правды</i></h1>
    <div className="grid md:grid-cols-2 gap-16 items-center">
      <div className="space-y-8 text-xl text-stone-white/60 leading-relaxed font-medium">
        <p>«Shutter Therapy» — это пощечина твоему творческому застою. Миру не нужен еще один кадр твоего латте.</p>
        <p className="text-stone-white border-l-4 border-acid-lime pl-6 italic">Наш AI-директор обучен на миллионах провалов, чтобы сделать тебя великим или заставить продать камеру.</p>
      </div>
      <div className="bg-acid-lime text-graphite p-12 rounded-[48px] rotate-[-2deg] shadow-2xl">
        <h3 className="serif-heading text-4xl font-bold mb-6">Стань частью культа</h3>
        <p className="font-bold opacity-80 mb-8">Мы не обещаем, что ты станешь легендой. Мы обещаем, что ты перестанешь быть скучным.</p>
        <button onClick={onBack} className="bg-stone-black text-acid-lime px-8 py-4 rounded-full font-black uppercase text-sm">Начать терапию</button>
      </div>
    </div>
  </main>
);

const ArchiveView: React.FC<{ onBack: () => void; userPhotos: any[]; onUpload: (loc: string, file: File) => void; onDelete: (id: string) => void; }> = ({ onBack, userPhotos, onUpload, onDelete }) => {
  const LOCS = ['В студии', 'Дома на диване', 'На заброшке', 'В пафосном месте', 'На улице (холодно)', 'В метро (час пик)', 'На крыше (высоко)'];
  return (
    <main className="max-w-6xl mx-auto px-6 pt-32 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-acid-lime text-xs font-black uppercase mb-8"><ArrowLeft size={14} /> Назад</button>
      <h1 className="serif-heading text-7xl md:text-9xl text-stone-white mb-20 leading-none">Архив <br /><i className="italic text-acid-lime font-extralight">Шедевров</i></h1>
      <div className="space-y-24">
        {LOCS.map((loc, i) => {
          const photos = [...userPhotos.filter(p => p.location === loc), ...DEFAULT_PHOTOS.filter(p => p.location === loc)];
          return (
            <section key={loc}>
              <div className="flex items-center gap-6 mb-12">
                <div className="bg-acid-lime text-graphite px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Album 0{i+1}</div>
                <h2 className="serif-heading text-4xl text-stone-white italic">{loc}</h2>
                <div className="h-px bg-white/10 flex-grow"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {photos.map((p, idx) => (
                  <div key={p.id} className={`group relative aspect-[3/4] overflow-hidden rounded-[24px] bg-warm-charcoal border border-white/5 ${idx === 1 ? 'lg:-translate-y-8' : ''}`}>
                    <img src={p.url} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0" />
                    <div className="absolute top-4 left-4 bg-stone-white/10 backdrop-blur-xl px-4 py-2 rounded-xl text-[10px] font-mono text-white">FIG. {p.id}</div>
                    {p.isUser && <button onClick={() => onDelete(p.id)} className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full text-white"><Trash2 size={14} /></button>}
                    <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      <p className="text-[10px] font-black text-acid-lime mb-2 uppercase">{p.meta}</p>
                      <h3 className="serif-heading text-2xl text-white italic leading-none">{p.title}</h3>
                    </div>
                  </div>
                ))}
                <label className="group relative aspect-[3/4] rounded-[24px] bg-black border-2 border-white/5 border-dashed cursor-pointer flex flex-col items-center justify-center gap-4 text-stone-white/20 hover:text-acid-lime transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onUpload(loc, e.target.files[0])} />
                  <Plus size={32} />
                  <span className="font-black text-xs uppercase">Добавить</span>
                </label>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
};

export default App;
