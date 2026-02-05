
import React, { useState, useCallback, useEffect } from 'react';
import { Camera, MapPin, Smile, Zap, RefreshCcw, Instagram, ExternalLink, Info, Loader2, ArrowLeft, Grid3X3, Layers, Plus, Trash2, ShieldCheck, HeartCrack, Eye } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Location, Mood, Gear, ShotIdea } from './types';
import { SCENARIOS } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GEAR_ROASTS: Record<string, string> = {
  'Айфон (и так сойдет)': 'Снимаешь на телефон и ждешь магии? Твой "портретный режим" — это просто цифровой суп с артефактами вместо боке.',
  'Sony A7IV + 35mm f/1.4 (база)': 'У тебя самый быстрый автофокус в мире, жаль он не может сфокусироваться на смысле кадра. Но резкость — огонь, можно рассмотреть каждую твою ошибку.',
  'Canon R5 + 85mm f/1.2 (тяжелый люкс)': 'Цвета-то "секс", а вот сюжет — полное воздержание. За такие деньги мог бы купить себе хотя бы одну оригинальную идею.',
  'Fujifilm X100V (хипстерский дефицит)': 'Крутишь кольцо диафрагмы и ждешь, пока лайки посыпятся сами? Спойлер: симуляция пленки не скроет отсутствие таланта.',
  'Leica M11 (продал почку)': 'Красная точка на камере не делает тебя Анри Картье-Брессоном. Она просто делает тебя беднее на миллион и пафоснее на десять.',
  'Зенит + Гелиос-44 (советское боке)': 'Это не "винтажная атмосфера", это просто грибок на линзе, пыль в затворе и твоя неспособность попасть в фокус без электроники.',
  'Пленочная мыльница из 90-х': 'Ностальгия по временам, когда ты еще не знал, как всё испортить? Поздравляю, теперь ты портишь кадры в аналоговом цвете.',
  'Средний формат (для мазохистов)': 'Столько мегапикселей, чтобы в деталях рассмотреть, как плохо ты выставил свет? Гениальное вложение средств.',
  'Nikon Z9 + 400mm f/2.8 (фотоохота)': 'Ты похож на спецназовца в засаде, но единственное, что ты подстрелил сегодня — это остатки здравого смысла у зрителя.',
  'Полароид (один кадр — одна боль)': 'Ты платишь 200 рублей за кусок химии, который проявит твою неуверенность в себе. Зато можно потрясти в воздухе.',
  'Haselblad (наследство дедушки)': 'Камера, которая летала на Луну, в твоих руках снимает только твой завтрак. Нил Армстронг плачет в космосе.',
  'Старый цифровой Nikon D40': 'Твой динамический диапазон меньше, чем твое терпение. Зато "шум" выглядит как настоящий песок в глазах.'
};

const DEFAULT_PHOTOS = [
  { location: 'В студии', id: '601', url: 'https://images.unsplash.com/photo-1590483734724-38fa1f0dd3bd?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 85mm | f/1.8', title: 'Studio Precision' },
  { location: 'Дома на диване', id: '101', url: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 800 | 35mm | f/1.8', title: 'Lazy Afternoon' },
  { location: 'Дома на диване', id: '102', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 400 | 50mm | f/1.4', title: 'Minimalist Rest' },
  { location: 'На заброшке', id: '301', url: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 24mm | f/8.0', title: 'Concrete Silence' },
  { location: 'На заброшке', id: '302', url: 'https://images.unsplash.com/photo-1533664488202-6af66d26c44a?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 200 | 35mm | f/1.4', title: 'Shattered Windows' },
  { location: 'В пафосном месте', id: '401', url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 50mm | f/1.2', title: 'Golden Spirits' },
  { location: 'В пафосном месте', id: '402', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 800 | 35mm | f/2.0', title: 'Crystal Glimmer' },
  { location: 'На улице (холодно)', id: '701', url: 'https://images.unsplash.com/photo-1547113110-3882a17730e7?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 400 | 35mm | f/2.8', title: 'Frozen Streets' },
  { location: 'В метро (час пик)', id: '201', url: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 3200 | 18mm | f/4.0', title: 'Deep Underground' },
  { location: 'На крыше (высоко)', id: '501', url: 'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?q=80&w=1000&auto=format&fit=crop', meta: 'ISO 100 | 14mm | f/5.6', title: 'Rooftop Edge' }
];

const STORAGE_KEY = 'shutter_therapy_user_photos_final';

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
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved photos", e);
        return [];
      }
    }
    return [];
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
        meta: `ISO ${Math.floor(Math.random() * 800) + 100} | 35mm | f/2.8`,
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
    const foundScenario = SCENARIOS[key];
    const scenario = foundScenario || Object.values(SCENARIOS)[Math.floor(Math.random() * Object.values(SCENARIOS).length)];
    
    setResult({
      ...scenario,
      gearComment: GEAR_ROASTS[gear] || 'Твое оборудование вызывает только вопросы.'
    });
    
    setIsGenerating(false);
    setShowResult(true);
    setIsGeneratingImage(true);

    try {
      const prompt = `A highly aesthetic, professional photograph for a moodboard. Subject: ${scenario.imageKeyword}. Setting: ${location}. Vibe: ${mood}. Style: cinematic lighting, editorial, high-end photography. Avoid text. Use color palette: ${scenario.colors.join(', ')}.`;
      
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
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [location, mood, gear]);

  const renderContent = () => {
    switch (view) {
      case 'archive':
        return <ArchiveView onBack={() => setView('generator')} userPhotos={userPhotos} onUpload={handleFileUpload} onDelete={deletePhoto} />;
      case 'about':
        return <AboutView onBack={() => setView('generator')} />;
      default:
        return (
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
                  <img 
                    src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop" 
                    alt="Creative photography" 
                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-black via-transparent to-transparent opacity-60"></div>
                </div>
                <div className="absolute -top-4 -right-4 bg-acid-lime text-graphite p-8 rounded-3xl rotate-6 shadow-2xl hover:rotate-0 transition-transform cursor-pointer">
                  <p className="serif-heading text-2xl font-bold leading-none text-graphite">99%</p>
                  <p className="text-xs font-bold uppercase tracking-widest mt-1 text-graphite/70">Шанс шедевра</p>
                </div>
              </div>
            </div>

            <section className="bg-warm-charcoal rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative mb-12">
              <div className="serrated-edge absolute top-0 left-0 w-full z-10"></div>
              <div className="p-8 md:p-12 mt-4">
                  <div className="flex flex-wrap items-center gap-4 mb-10">
                    <div className="bg-acid-lime text-graphite px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider -rotate-2">
                      Настройки съемки
                    </div>
                    <div className="h-px bg-white/10 flex-grow"></div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-stone-white/40 text-xs font-bold uppercase tracking-widest">
                          <MapPin size={14} className="text-acid-lime" /> Где ты?
                        </label>
                        <select 
                          value={location}
                          onChange={(e) => setLocation(e.target.value as Location)}
                          className="w-full bg-stone-white border-4 border-transparent rounded-2xl px-4 py-4 focus:border-acid-lime outline-none transition-all appearance-none cursor-pointer text-lg font-black text-graphite shadow-xl"
                        >
                          {['Дома на диване', 'В пафосном месте', 'На улице (холодно)', 'В студии', 'Где-то в глуши', 'На крыше (высоко)', 'В старом лифте', 'На заброшке', 'В метро (час пик)', 'На парковке ТЦ'].map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-stone-white/40 text-xs font-bold uppercase tracking-widest">
                          <Smile size={14} className="text-acid-lime" /> Настроение
                        </label>
                        <select 
                          value={mood}
                          onChange={(e) => setMood(e.target.value as Mood)}
                          className="w-full bg-stone-white border-4 border-transparent rounded-2xl px-4 py-4 focus:border-acid-lime outline-none transition-all appearance-none cursor-pointer text-lg font-black text-graphite shadow-xl"
                        >
                          {['Драма Квин', 'Эстетика панелек', 'Люкс/Богатство', 'Уютный интроверт', 'Киберпанк', 'Ностальгия по 2007', 'Сонный паралич', 'Диско-шар', 'Аниме-протагонист', 'Минимализм (пустота)'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-stone-white/40 text-xs font-bold uppercase tracking-widest">
                          <Zap size={14} className="text-acid-lime" /> Оборудование
                        </label>
                        <select 
                          value={gear}
                          onChange={(e) => setGear(e.target.value as Gear)}
                          className="w-full bg-stone-white border-4 border-transparent rounded-2xl px-4 py-4 focus:border-acid-lime outline-none transition-all appearance-none cursor-pointer text-lg font-black text-graphite shadow-xl"
                        >
                          {['Айфон (и так сойдет)', 'Sony A7IV + 35mm f/1.4 (база)', 'Canon R5 + 85mm f/1.2 (тяжелый люкс)', 'Fujifilm X100V (хипстерский дефицит)', 'Leica M11 (продал почку)', 'Зенит + Гелиос-44 (советское боке)', 'Пленочная мыльница из 90-х', 'Средний формат (для мазохистов)', 'Nikon Z9 + 400mm f/2.8 (фотоохота)', 'Полароид (один кадр — одна боль)', 'Haselblad (наследство дедушки)', 'Старый цифровой Nikon D40'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                    </div>
                  </div>

                  <div className="mt-16 flex justify-center">
                    <button 
                      onClick={generateMasterpiece}
                      disabled={isGenerating || isGeneratingImage}
                      className={`
                        group relative flex items-center gap-4 bg-acid-lime text-graphite px-12 py-6 rounded-full font-bold text-xl uppercase tracking-tighter
                        transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${isGenerating ? 'shake' : 'hover:scale-105 hover:shadow-[0_0_50px_rgba(198,255,0,0.4)]'}
                      `}
                    >
                      {isGenerating || isGeneratingImage ? (
                        <>
                          <RefreshCcw className="animate-spin" />
                          {isGeneratingImage ? 'Создаем визуал...' : 'Анализируем...'}
                        </>
                      ) : (
                        <>
                          СГЕНЕРИРОВАТЬ ШЕДЕВР
                          <div className="w-8 h-8 rounded-full bg-stone-black text-acid-lime flex items-center justify-center transition-transform group-hover:rotate-45">
                            <Zap size={16} fill="currentColor" />
                          </div>
                        </>
                      )}
                    </button>
                  </div>
              </div>
            </section>

            {showResult && result && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-acid-lime text-graphite rounded-[40px] p-8 md:p-12 rotate-[-1deg] hover:rotate-0 transition-transform shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Instagram size={300} strokeWidth={1} />
                  </div>
                  <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 relative z-10">
                    {(isGeneratingImage || generatedImage) && (
                      <div className="space-y-6">
                        <div className="relative aspect-square md:aspect-video lg:aspect-[3/4] overflow-hidden rounded-3xl bg-black/20 border border-black/5 shadow-inner flex items-center justify-center">
                          {isGeneratingImage ? (
                            <div className="flex flex-col items-center gap-4 text-graphite opacity-60">
                              <Loader2 className="animate-spin" size={48} />
                              <p className="font-bold text-xs uppercase tracking-widest">Генерируем шедевр...</p>
                            </div>
                          ) : (
                            <img src={generatedImage!} alt="AI Reference" className="w-full h-full object-cover img-fade-in" />
                          )}
                          <div className="absolute top-4 left-4 glass-nav px-4 py-2 rounded-xl text-[10px] font-mono flex items-center gap-2 text-white shadow-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-acid-lime animate-pulse"></div>
                            FIG. AI / REFERENCE
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {result.colors.map((color, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-black/10 shadow-sm">
                              <div className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: color }}></div>
                              <span className="text-xs font-mono font-black text-graphite uppercase tracking-tighter">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={`flex flex-col justify-between py-4 ${!generatedImage && !isGeneratingImage ? 'lg:col-span-2' : ''}`}>
                      <div>
                          <h2 className="serif-heading text-5xl md:text-7xl font-bold leading-none mb-10 text-graphite tracking-tight">
                            {result.title}
                          </h2>
                          <div className="space-y-10">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-graphite border-b border-black/20 pb-1 w-fit">Задача (The Shot)</p>
                              <p className="text-3xl font-medium leading-tight text-graphite">{result.shot}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 text-graphite border-b border-black/20 pb-1 w-fit">Свет (Lighting)</p>
                              <p className="text-xl font-medium text-graphite">{result.lighting}</p>
                            </div>
                            <div className="bg-white/40 p-8 rounded-3xl border-2 border-black/5 border-dashed backdrop-blur-sm relative">
                              <div className="absolute -top-3 -left-3 bg-stone-black text-acid-lime p-2 rounded-lg rotate-[-12deg] shadow-lg">
                                <Info size={18} />
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4 text-graphite">Вердикт Директора (The Roast)</p>
                              <div className="space-y-4">
                                <p className="text-xl font-bold italic leading-relaxed text-graphite">"{result.roast}"</p>
                                <p className="text-sm font-bold opacity-80 border-t border-black/10 pt-4 text-graphite leading-relaxed">💡 {result.gearComment}</p>
                              </div>
                            </div>
                          </div>
                      </div>
                      <div className="mt-16 flex flex-wrap items-center justify-between border-t border-black/20 pt-10 gap-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-stone-black flex items-center justify-center text-acid-lime shadow-xl">
                                <Camera size={24} />
                            </div>
                            <div className="text-graphite">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Creative Dept.</p>
                                <p className="font-black text-lg">@shutter_therapy</p>
                            </div>
                          </div>
                          <button className="flex items-center gap-2 bg-stone-black text-acid-lime px-8 py-4 rounded-full font-black hover:scale-105 transition-all shadow-xl active:scale-95">
                            SHARE <ExternalLink size={18} />
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
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
            <button onClick={() => setView('archive')} className={`transition-colors flex items-center gap-1.5 ${view === 'archive' ? 'text-acid-lime' : 'hover:text-acid-lime'}`}>Архив</button>
            <button onClick={() => setView('about')} className={`transition-colors flex items-center gap-1.5 ${view === 'about' ? 'text-acid-lime' : 'hover:text-acid-lime'}`}>О нас</button>
          </div>
          <button className="hidden md:block bg-acid-lime text-graphite px-4 py-1.5 rounded-full text-sm font-bold hover:scale-105 transition-transform active:scale-95">Войти</button>
        </div>
      </nav>

      {renderContent()}

      <footer className="w-full py-16 border-t border-white/5 mt-20 relative overflow-hidden text-stone-white/30">
         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3 font-black tracking-tighter">
              <Camera size={20} className="text-acid-lime" />
              <span className="text-xl uppercase text-stone-white">Shutter Therapy © 2024</span>
            </div>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em]">
               <a href="#" className="hover:text-acid-lime transition-colors">Arrogance Policy</a>
               <a href="#" className="hover:text-acid-lime transition-colors">Bad Cookies</a>
               <a href="#" className="hover:text-acid-lime transition-colors">Fire Me</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

const AboutView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <main className="max-w-6xl mx-auto px-6 pt-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid lg:grid-cols-[1fr_1fr] gap-20 mb-32 items-start">
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-acid-lime text-xs font-black uppercase tracking-widest mb-6 hover:-translate-x-2 transition-transform">
          <ArrowLeft size={14} /> Назад
        </button>
        <h1 className="serif-heading text-7xl md:text-9xl font-light leading-none mb-10 text-stone-white">Манифест <br /><i className="italic font-extralight text-acid-lime">Правды</i></h1>
        <div className="space-y-8 text-xl text-stone-white/60 leading-relaxed font-medium">
           <p>«Shutter Therapy» — это цифровой пощечина твоему творческому застою.</p>
           <p className="text-stone-white border-l-4 border-acid-lime pl-6 italic">Наш AI-директор обучен на миллионах провальных кадров, чтобы давать тебе советы, от которых хочется либо разбить камеру, либо снять шедевр.</p>
        </div>
      </div>
      <div className="relative">
         <div className="aspect-[3/4] rounded-full overflow-hidden border border-white/10 grayscale">
            <img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
         </div>
         <div className="absolute -bottom-10 -left-10 bg-acid-lime text-graphite p-10 rounded-[40px] rotate-[-5deg] shadow-2xl max-w-xs">
            <h3 className="serif-heading text-3xl font-bold mb-4 leading-none">Наша миссия</h3>
            <p className="text-sm font-bold leading-tight opacity-80">Искоренить визуальную посредственность.</p>
         </div>
      </div>
    </div>
    <div className="bg-acid-lime text-graphite p-16 rounded-[48px] text-center mb-32 relative overflow-hidden">
       <div className="noise-overlay opacity-20"></div>
       <h2 className="serif-heading text-5xl md:text-8xl mb-8 leading-none">Стань частью <br />культа</h2>
       <button onClick={onBack} className="bg-stone-black text-acid-lime px-12 py-6 rounded-full font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-2xl">НАЧАТЬ ТЕРАПИЮ</button>
    </div>
  </main>
);

const ArchiveView: React.FC<{ onBack: () => void; userPhotos: any[]; onUpload: (loc: string, file: File) => void; onDelete: (id: string) => void; }> = ({ onBack, userPhotos, onUpload, onDelete }) => {
  const LOCATIONS_LIST = ['В студии', 'Дома на диване', 'На заброшке', 'В пафосном месте', 'На улице (холодно)', 'В метро (час пик)', 'На крыше (высоко)', 'Где-то в глуши', 'На парковке ТЦ', 'В старом лифте'];

  return (
    <main className="max-w-6xl mx-auto px-6 pt-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-8">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-acid-lime text-xs font-black uppercase tracking-widest mb-6 hover:-translate-x-2 transition-transform"><ArrowLeft size={14} /> Назад</button>
          <h1 className="serif-heading text-7xl md:text-9xl font-light leading-none text-stone-white">Архив <br /><i className="italic font-extralight text-acid-lime">Шедевров</i></h1>
        </div>
      </div>
      <div className="space-y-32">
        {LOCATIONS_LIST.map((locName, albumIdx) => {
          const locDefaults = DEFAULT_PHOTOS.filter(p => p.location === locName);
          const locUsers = userPhotos.filter(p => p.location === locName);
          const allPhotos = [...locUsers, ...locDefaults];
          return (
            <section key={locName}>
              <div className="flex items-center gap-6 mb-12">
                 <div className="bg-acid-lime text-graphite px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter rotate-[-2deg]">Album 0{albumIdx + 1}</div>
                 <h2 className="serif-heading text-4xl italic font-light text-stone-white">{locName}</h2>
                 <div className="h-px bg-white/10 flex-grow"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allPhotos.map((photo, i) => (
                  <div key={photo.id} className={`group relative aspect-[3/4] overflow-hidden rounded-[24px] bg-warm-charcoal border border-white/5 ${i === 1 ? 'lg:-translate-y-8' : ''}`}>
                    <img src={photo.url} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 glass-nav px-4 py-2 rounded-xl text-[10px] font-mono text-white">FIG. {photo.id}</div>
                    {photo.isUser && <button onClick={() => onDelete(photo.id)} className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full text-white"><Trash2 size={14} /></button>}
                    <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all">
                      <p className="text-[10px] font-black uppercase text-acid-lime">{photo.meta}</p>
                      <h3 className="serif-heading text-2xl text-white italic">{photo.title}</h3>
                    </div>
                  </div>
                ))}
                <label className="group relative aspect-[3/4] rounded-[24px] bg-black border-2 border-white/5 border-dashed cursor-pointer hover:border-acid-lime/50 transition-colors flex flex-col items-center justify-center gap-4 text-stone-white/20 hover:text-acid-lime">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onUpload(locName, e.target.files[0])} />
                  <Plus size={32} />
                  <span className="font-black text-xs uppercase tracking-widest">Добавить</span>
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
