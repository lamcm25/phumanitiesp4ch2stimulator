import React, { useState, useEffect } from 'react';

// Game Constants & Data
const MAX_TURNS = 8;
const INITIAL_BUDGET = 1000; // Represents 10,000,000 HKD
const TAX_REVENUE = 150; // Income per turn

// Web Audio API sound effect synthesizer
const playSFX = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'build') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15); // E3
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    // Audio context not supported or disabled
  }
};

const FAMILY_MEMBERS = [
  { id: 'dad', name: '爸爸 (上班族)', needs: '交通', icon: '👔' },
  { id: 'mom', name: '媽媽 (主婦)', needs: '購物', icon: '👜' },
  { id: 'grandpa', name: '爺爺 (長者)', needs: '醫療/休閒', icon: '👴' },
  { id: 'boy', name: '哥哥小皇', needs: '教育/玩樂', icon: '👦' },
  { id: 'girl', name: '妹妹小英', needs: '環境/自然', icon: '👧' }
];

const BUILDINGS = {
  housing: { id: 'housing', name: '公共屋邨', cost: 150, upkeep: 10, icon: '🏢', img: 'building logo.png', desc: '基礎居住設施。全家人心情+10', color: 'bg-blue-100 border-blue-400 text-blue-700' },
  transport: { id: 'transport', name: '交通樞紐', cost: 250, upkeep: 20, icon: '🚆', img: 'train logo.jpg', desc: '解決跨區通勤問題。爸爸+40, 媽媽+20, 經濟+15', color: 'bg-slate-100 border-slate-400 text-slate-700' },
  commercial: { id: 'commercial', name: '大型街市', cost: 200, upkeep: 15, icon: '🛒', img: 'market logo.jpg', desc: '滿足日常購買食材的需要。媽媽+40, 經濟+30, 環境-10', color: 'bg-yellow-100 border-yellow-400 text-yellow-700' },
  hospital: { id: 'hospital', name: '綜合醫院', cost: 300, upkeep: 30, icon: '🏥', img: 'hospital logo.png', desc: '應付醫療需求。爺爺+50, 全家人+5', color: 'bg-red-50 border-red-400 text-red-700' },
  school: { id: 'school', name: '中小學校網', cost: 200, upkeep: 15, icon: '🏫', img: null, desc: '原區就學。哥哥+40, 妹妹+40', color: 'bg-orange-100 border-orange-400 text-orange-700' },
  park: { id: 'park', name: '濕地保育公園', cost: 150, upkeep: 10, icon: '🌳', img: 'wetland logo.jpg', desc: '保護生態。妹妹+30, 爺爺+20, 環境+40', color: 'bg-emerald-100 border-emerald-400 text-emerald-700' },
  pond: { id: 'pond', name: '市鎮公園', cost: 100, upkeep: 5, icon: '🦆', img: 'pond logo.jpg', desc: '休憩空間。全家人心情+5', color: 'bg-green-100 border-green-400 text-green-700' }
};

// Yearly Reflection Quiz Pool (Randomized per playthrough)
const QUIZ_POOL = [
  {
    question: "【歷史與地理】天水圍在發展成新市鎮之前，主要是什麼地形？",
    options: [
      { text: "主要是高山與森林", correct: false, feedback: "不對。天水圍早期並沒有高山。" },
      { text: "主要是低窪魚塘與濕地", correct: true, feedback: "答對了！天水圍原為低窪濕地魚塘，發展時需兼顧生態平衡。" },
      { text: "主要是商業高樓集中地", correct: false, feedback: "不對。發展前這裡主要是鄉郊地區。" }
    ]
  },
  {
    question: "【居民觀察】如果居民每天要花兩小時跨區到港島上班，會帶來什麼影響？",
    options: [
      { text: "增加居民車費開支與時間成本，生活質素下降", correct: true, feedback: "答對了！交通不便會嚴重影響居民的作息和心情。" },
      { text: "完全沒有影響，居民都很享受乘坐長途車", correct: false, feedback: "長途通勤會令人身心疲倦呢！" }
    ]
  },
  {
    question: "【發展與保育】興建大型購物商場雖然能方便購物，但可能會帶來什麼負面影響？",
    options: [
      { text: "增加綠化面積，改善空氣質素", correct: false, feedback: "商業發展通常會佔用土地，並減少綠化空間。" },
      { text: "產生較多廢物與噪音，影響原有的自然環境", correct: true, feedback: "答對了！發展經濟與保護環境往往需要取得平衡。" }
    ]
  },
  {
    question: "【社區規劃】「新市鎮」的主要發展目的是什麼？",
    options: [
      { text: "舒緩市區人口過剩的壓力，提供自給自足的社區", correct: true, feedback: "答對了！新市鎮希望能讓居民在區內滿足生活所需。" },
      { text: "將所有工業設施集中在一起，遠離市中心", correct: false, feedback: "新市鎮主要功能是提供居住和生活社區，不僅僅是工業區。" }
    ]
  },
  {
    question: "【生態保育】設立「濕地保育公園」對天水圍有什麼重要性？",
    options: [
      { text: "為候鳥提供棲息地，保護本土自然生態", correct: true, feedback: "答對了！濕地對保護生物多樣性非常重要。" },
      { text: "提供大量土地用作興建更多公共屋邨", correct: false, feedback: "保育公園的目的正是限制過度開發，保護自然。" }
    ]
  },
  {
    question: "【民生設施】區內欠缺完善的醫院網絡，會對居民造成什麼嚴重後果？",
    options: [
      { text: "只會令醫生失去工作機會，對市民影響不大", correct: false, feedback: "缺乏醫院對市民的影響非常大。" },
      { text: "長者及急症病人延誤治療，威脅生命健康", correct: true, feedback: "答對了！完善的醫療設施是宜居城市的重要基石。" }
    ]
  }
];

// Helper to randomly pick 3 quizzes for years 2, 4, 6
const generateRunQuizzes = () => {
  const shuffled = [...QUIZ_POOL].sort(() => 0.5 - Math.random());
  return {
    2: shuffled[0],
    4: shuffled[1],
    6: shuffled[2]
  };
};

export default function App() {
  // Game State
  const [showCover, setShowCover] = useState(true);
  const [turn, setTurn] = useState(1);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [plots, setPlots] = useState(Array(6).fill(null));
  const [builtThisTurn, setBuiltThisTurn] = useState(false);
  const [turnQuizzes, setTurnQuizzes] = useState(generateRunQuizzes());
  
  const [financialEffect, setFinancialEffect] = useState(null);
  const [budgetPulse, setBudgetPulse] = useState(false);
  
  const [moods, setMoods] = useState({ dad: 50, mom: 50, grandpa: 50, boy: 50, girl: 50 });
  const [env, setEnv] = useState(50);
  const [econ, setEcon] = useState(30);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [log, setLog] = useState(["歡迎來到天水圍！請開始您的規劃。"]);
  const [cooldown, setCooldown] = useState(0);
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', text: '', options: [] });
  const [quizModal, setQuizModal] = useState({ isOpen: false, data: null, selectedOpt: null });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const triggerSFX = (type) => {
    if (soundEnabled) playSFX(type);
  };

  const addLog = (msg) => {
    setLog(prev => [msg, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const canAdvance = cooldown === 0;
  
  const updateMoods = (changes) => {
    setMoods(prev => {
      let newMoods = { ...prev };
      for (const [key, val] of Object.entries(changes)) {
        if (newMoods[key] !== undefined) {
          newMoods[key] = Math.max(0, Math.min(100, newMoods[key] + val));
        }
      }
      return newMoods;
    });
  };

  const updateStats = (envChange, econChange) => {
    setEnv(prev => Math.max(0, Math.min(100, prev + envChange)));
    setEcon(prev => Math.max(0, Math.min(100, prev + econChange)));
  };

  const handleBuild = (buildingKey) => {
    const building = BUILDINGS[buildingKey];
    if (budget < building.cost) {
      triggerAlert("預算不足", `您需要 ${building.cost} 資金來興建 ${building.name}。`);
      return;
    }

    setBudget(prev => prev - building.cost);
    let newPlots = [...plots];
    newPlots[selectedPlot] = buildingKey;
    setPlots(newPlots);
    setSelectedPlot(null);
    setBuiltThisTurn(true);
    triggerSFX('build');

    // Apply immediate effects
    let moodChanges = {};
    if (buildingKey === 'housing') moodChanges = { dad: 10, mom: 10, grandpa: 10, boy: 10, girl: 10 };
    if (buildingKey === 'transport') { moodChanges = { dad: 40, mom: 20 }; updateStats(0, 15); }
    if (buildingKey === 'commercial') { moodChanges = { mom: 40 }; updateStats(-10, 30); }
    if (buildingKey === 'hospital') { moodChanges = { grandpa: 50, dad: 5, mom: 5, boy: 5, girl: 5 }; }
    if (buildingKey === 'school') { moodChanges = { boy: 40, girl: 40 }; }
    if (buildingKey === 'park') { moodChanges = { girl: 30, grandpa: 20 }; updateStats(40, 0); }

    updateMoods(moodChanges);
    addLog(`[建設] 在地塊 ${selectedPlot + 1} 興建了 ${building.name}！`);
  };

  // Pre-check before ending turn
  const handleEndTurnClick = () => {
    // 1. If player hasn't built anything and still has plots & budget, give a warning!
    if (!builtThisTurn && plots.includes(null) && budget >= 150) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: "⚠️ 警告：本年度未有任何規劃！",
        text: "您今年完全沒有興建任何設施！直接跳過年份會導致居民失望且心情下降。您確定要直接結束本年嗎？",
        options: [
          {
            label: "返回規劃（建議）",
            action: closeModal,
            color: "bg-blue-600 hover:bg-blue-700"
          },
          {
            label: "堅持跳過今年",
            action: () => {
              closeModal();
              checkQuizOrAdvance();
            },
            color: "bg-gray-500 hover:bg-gray-600"
          }
        ]
      });
      return;
    }

    checkQuizOrAdvance();
  };

  const checkQuizOrAdvance = () => {
    // Check if there is a random quiz for the current year
    if (turnQuizzes[turn]) {
      setQuizModal({
        isOpen: true,
        data: turnQuizzes[turn],
        selectedOpt: null
      });
    } else {
      processAdvanceTurn();
    }
  };

  const processAdvanceTurn = () => {
    // Penalize if no action was taken
    if (!builtThisTurn) {
      updateMoods({ dad: -10, mom: -10, grandpa: -10, boy: -10, girl: -10 });
      addLog("⚠️ 由於今年缺乏規劃，陳氏一家感到極度失望 (心情-10)。");
    }

    // Reset build flag & cooldown timer
    setBuiltThisTurn(false);
    setCooldown(5);

    // Calculate Upkeep
    let totalUpkeep = 0;
    plots.forEach(p => {
      if (p) totalUpkeep += BUILDINGS[p].upkeep;
    });

    const netIncome = TAX_REVENUE - totalUpkeep;
    const newBudget = budget + netIncome;
    setBudget(newBudget);

    setFinancialEffect({
      income: TAX_REVENUE,
      upkeep: totalUpkeep,
      key: Date.now()
    });
    setBudgetPulse(true);
    setTimeout(() => setBudgetPulse(false), 1200);

    // Natural mood decay
    updateMoods({ dad: -5, mom: -5, grandpa: -5, boy: -5, girl: -5 });
    
    // Check bankrupt
    if (newBudget < 0) {
      triggerEndGame('bankrupt');
      return;
    }

    const nextYear = turn + 1;
    setTurn(nextYear);
    addLog(`[第${nextYear}年] 收取稅收 +${TAX_REVENUE}，設施維護費 -${totalUpkeep}。`);

    if (nextYear > MAX_TURNS) {
      triggerEndGame('normal');
      return;
    }

    // Trigger Key Events
    if (nextYear === 3) checkSchoolEvent();
    else if (nextYear === 5) checkMedicalEvent();
    else if (nextYear === 6) triggerConservationDilemma();
  };

  // Turn Events
  const checkSchoolEvent = () => {
    if (!plots.includes('school')) {
      updateMoods({ boy: -30, girl: -30 });
      triggerAlert("⚠️ 跨區上學之苦", "小皇和小英每天要花兩小時跨區上學，身心俱疲！(哥哥、妹妹心情大跌)");
      addLog("事件：跨區上學之苦發生！");
    } else {
      addLog("事件：因為已有學校，孩子們開心上學去了。");
    }
  };

  const checkMedicalEvent = () => {
    if (!plots.includes('hospital')) {
      updateMoods({ grandpa: -40 });
      triggerAlert("⚠️ 醫療資源告急", "爺爺半夜不適，但區內只有小診所無法處理，需要跨區求醫！(爺爺心情大跌)");
      addLog("事件：醫療資源告急發生！");
    }
  };

  const triggerConservationDilemma = () => {
    setModal({
      isOpen: true,
      type: 'dilemma',
      title: "⚖️ 發展與保育的抉擇",
      text: "有地產商提議收購北部濕地發展豪宅，這會帶來巨額收入，但會嚴重破壞生態。您會如何選擇？",
      options: [
        {
          label: "發展豪宅 (資金+300, 環境-40, 妹妹-20)",
          action: () => {
            setBudget(prev => prev + 300);
            updateStats(-40, 20);
            updateMoods({ girl: -20 });
            addLog("決定：選擇發展豪宅，獲得資金，犧牲生態。");
            closeModal();
          },
          color: "bg-amber-600 hover:bg-amber-700"
        },
        {
          label: "保育濕地 (資金-100, 環境+40, 妹妹+20)",
          action: () => {
            setBudget(prev => prev - 100);
            updateStats(40, -10);
            updateMoods({ girl: 20 });
            addLog("決定：選擇保育濕地，政府補貼，環境大幅改善。");
            closeModal();
          },
          color: "bg-emerald-600 hover:bg-emerald-700"
        }
      ]
    });
  };

  const triggerEndGame = (reason) => {
    let title = "";
    let desc = "";
    
    if (reason === 'bankrupt') {
      title = "❌ 破產免職！";
      desc = "您耗盡了所有城市建設基金，無力支付設施維護費。天水圍新市鎮計劃宣告失敗，您已被撤職。";
    } else {
      const avgMood = Object.values(moods).reduce((a, b) => a + b, 0) / 5;
      if (avgMood >= 70 && env >= 60) {
        title = "🏆 五星級宜居典範城！";
        desc = "太棒了！您成功平衡了各方需求，天水圍成為了兼具綠色生態與完善設施的夢幻新市鎮！陳氏一家非常幸福！";
      } else if (avgMood >= 50 && env < 40) {
        title = "🏢 水泥森林浩劫";
        desc = "雖然您解決了部分民生需求，但過度發展導致環境被破壞。這是一座失去靈魂的水泥森林，居民感到壓抑。";
      } else if (avgMood < 50) {
        title = "😢 悲情城市...";
        desc = "設施嚴重不足，居民生活充滿怨言。跨區通勤與醫療短缺讓這個家庭苦不堪言，規劃有待改善。";
      } else {
        title = "✅ 發展中新市鎮";
        desc = "您完成了8年的任期，天水圍有了一定的發展，但仍有進步空間。感謝您的努力！";
      }
    }

    setModal({
      isOpen: true,
      type: 'end',
      title: title,
      text: desc,
      options: [
        { label: "重新開始遊戲", action: resetGame, color: "bg-blue-600 hover:bg-blue-700" }
      ]
    });
  };

  const resetGame = () => {
    setTurn(1);
    setBudget(INITIAL_BUDGET);
    setPlots(Array(6).fill(null));
    setMoods({ dad: 50, mom: 50, grandpa: 50, boy: 50, girl: 50 });
    setEnv(50);
    setEcon(30);
    setBuiltThisTurn(false);
    setCooldown(5);
    setTurnQuizzes(generateRunQuizzes()); // Generate new quizzes for replay
    setLog(["遊戲已重置。請開始您的新任期！"]);
    closeModal();
  };

  const triggerAlert = (title, text) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title: title,
      text: text,
      options: [{ label: "確認", action: closeModal, color: "bg-blue-600 hover:bg-blue-700" }]
    });
  };

  const closeModal = () => setModal({ isOpen: false, type: '', title: '', text: '', options: [] });

  const MoodBar = ({ val }) => {
    let color = 'bg-red-500';
    if (val > 40) color = 'bg-yellow-400';
    if (val > 70) color = 'bg-green-500';
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 border border-gray-300 shadow-inner">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${val}%` }}></div>
      </div>
    );
  };

  if (showCover) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
        {/* Background Decorative Gradient */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Cover Header */}
        <header className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-lg z-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-900 text-2xl p-2.5 rounded-xl font-black shadow-md">
              🏫
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400 tracking-wide">英皇書院同學會小學</h2>
              <p className="text-xs text-slate-400">小學人文科 | 環境與我</p>
            </div>
          </div>
        </header>

        {/* Cover Main Content */}
        <main className="max-w-3xl mx-auto w-full my-auto py-8 flex flex-col items-center text-center z-10">
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold px-4 py-1.5 rounded-full text-sm mb-4">
            第2課：發展與保育
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-md">
            🏗️ 建設理想天水圍
          </h1>

          <p className="text-slate-300 text-lg md:text-xl mb-8 leading-relaxed max-w-xl font-medium">
            成為優秀的城市規劃師！<br/>
            為陳氏一家建設完善的社區，<br/>
            同時緊記保護大自然生態！
          </p>

          <button
            onClick={() => setShowCover(false)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xl font-extrabold px-12 py-5 rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer mt-4"
          >
            🚀 開始規劃
          </button>
        </main>

        {/* Cover Footer Notice */}
        <footer className="max-w-4xl mx-auto w-full text-center z-10 pt-4 border-t border-slate-800">
          <p className="text-slate-500 text-xs">
            由英皇書院同學會小學提供
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Inject custom CSS keyframes for floating financial effects */}
      <style>{`
        @keyframes floatFadeUp {
          0% { opacity: 0; transform: translate(-50%, 8px) scale(0.9); }
          20% { opacity: 1; transform: translate(-50%, 0px) scale(1.05); }
          80% { opacity: 1; transform: translate(-50%, -8px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
        }
        .animate-financial-float {
          animation: floatFadeUp 2.4s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <header className="bg-emerald-700 text-white p-4 shadow-md flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCover(true)}
            title="返回封面與課程簡介"
            className="bg-emerald-800 hover:bg-emerald-900 text-emerald-100 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-600 transition"
          >
            📖 封面簡介
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-emerald-800 hover:bg-emerald-900 text-emerald-100 p-2 rounded-lg text-xs font-semibold border border-emerald-600 transition"
          >
            {soundEnabled ? '🔊 音效開' : '🔇 音效關'}
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wider flex items-center gap-2">
              🏛️ 天水圍新市鎮規劃模擬器
            </h1>
            <p className="text-emerald-200 text-xs md:text-sm">英皇書院同學會小學人文科 | 第2課 發展與保育</p>
          </div>
        </div>
        <div className="flex gap-6 items-center bg-emerald-800/50 p-2 rounded-lg border border-emerald-600/50 shadow-inner">
          <div className="text-center">
            <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">當前年份</div>
            <div className="text-2xl font-black">{turn} <span className="text-base font-normal">/ {MAX_TURNS}</span></div>
          </div>
          <div className="w-px h-10 bg-emerald-600/50"></div>
          
          <div className="text-center relative">
            <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">建設基金</div>
            <div className={`text-2xl font-black transition-transform duration-300 ${budgetPulse ? 'scale-125 text-yellow-100' : ''} ${budget < 200 ? 'text-red-300' : 'text-yellow-300'}`}>
              💰 {budget} <span className="text-xs font-normal">萬</span>
            </div>

            {/* Financial Change Floating Animation Badge */}
            {financialEffect && (
              <div 
                key={financialEffect.key} 
                className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 animate-financial-float whitespace-nowrap"
              >
                <span className="text-xs font-black text-emerald-300 bg-slate-900/95 px-2.5 py-1 rounded-full shadow-xl border border-emerald-500/60 flex items-center gap-1">
                  📈 +{financialEffect.income}萬 (年度稅收)
                </span>
                {financialEffect.upkeep > 0 && (
                  <span className="text-xs font-black text-red-300 bg-slate-900/95 px-2.5 py-1 rounded-full shadow-xl border border-red-500/60 flex items-center gap-1 mt-1">
                    💸 -{financialEffect.upkeep}萬 (設施維護費)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full shadow-2xl bg-white">
        
        {/* Left Panel: Family, Stats & City Guide */}
        <aside className="w-full md:w-80 bg-slate-100 p-5 border-r border-slate-200 overflow-y-auto flex flex-col gap-6">
          
          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
               <span className="text-blue-500">🏠</span> 陳氏一家心情
            </h2>
            <div className="space-y-4">
              {FAMILY_MEMBERS.map(member => (
                <div key={member.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-3xl bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                    {member.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{member.name}</span>
                      <span className="text-slate-500 text-xs">重視:{member.needs}</span>
                    </div>
                    <MoodBar val={moods[member.id]} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
               <span className="text-emerald-500">📊</span> 城市指標
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-emerald-700">🌲 生態環境</span>
                  <span>{env}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${env}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-yellow-600">📈 經濟繁榮</span>
                  <span>{econ}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${econ}%` }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* City Management Guide Panel */}
          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-slate-800">
              <span>📘</span> 城市管理指南
            </h2>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-100">
                <div className="font-bold text-amber-900 mb-0.5 flex items-center gap-1">
                  <span>💰</span> 建設基金
                </div>
                <p className="text-slate-600">政府庫房的總資金，用於建設新設施。每年會根據城市發展獲得稅收。</p>
              </div>

              <div className="bg-red-50/70 p-2.5 rounded-lg border border-red-100">
                <div className="font-bold text-red-900 mb-0.5 flex items-center gap-1">
                  <span>💸</span> 維護費
                </div>
                <p className="text-slate-600">維持設施日常運作的必要開支。每年會自動從建設基金中扣除。</p>
              </div>

              <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
                  <span>📊</span> 各項指標定義
                </div>
                <ul className="space-y-1 text-slate-600 pl-1">
                  <li><strong className="text-emerald-700">🌲 環境：</strong>城市的綠化與生態保育程度。</li>
                  <li><strong className="text-yellow-700">📈 經濟：</strong>商業與就業發展程度。</li>
                  <li><strong className="text-blue-700">😊 市民心情：</strong>居民對現時社區設施的滿意度。</li>
                </ul>
              </div>
            </div>
          </section>

        </aside>

        {/* Center Panel: Map Grid */}
        <section className="flex-1 bg-slate-200 p-6 flex flex-col relative">
          <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-lg shadow-sm border border-slate-300">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-700">
               🗺️ 規劃區圖 (點擊空地建設)
            </h2>
            <button 
              onClick={handleEndTurnClick}
              disabled={!canAdvance}
              className={`px-6 py-2 rounded-lg font-bold shadow-md transform transition active:scale-95 flex items-center gap-2 ${
                canAdvance 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-400'
              }`}
            >
              {canAdvance ? "⏳ 結束本年 (進入下一年)" : `🔍 觀察規劃中 (${cooldown}s)`}
            </button>
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-center justify-center p-4">
            {plots.map((plot, idx) => (
              <div 
                key={idx} 
                onClick={() => !plot && setSelectedPlot(idx)}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative shadow-md overflow-hidden
                  ${plot 
                    ? BUILDINGS[plot].color + ' shadow-lg transform hover:-translate-y-1 border-4' 
                    : selectedPlot === idx 
                      ? 'bg-blue-100 border-4 border-blue-500 shadow-inner' 
                      : 'bg-emerald-50/50 border-4 border-dashed border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-400'
                  }
                `}
              >
                {plot ? (
                  <>
                    <div className="flex flex-col items-center justify-center p-2 z-10">
                      {BUILDINGS[plot].img ? (
                        <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-1">
                          <img 
                            src={BUILDINGS[plot].img} 
                            alt={BUILDINGS[plot].name} 
                            onError={(e) => {
                              // Fallback seamlessly to SVG/Emoji icon if image file is missing
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                            }}
                            className="max-w-full max-h-full object-contain rounded-xl opacity-90 drop-shadow-md"
                          />
                          <span className="text-5xl md:text-6xl hidden filter drop-shadow-md">{BUILDINGS[plot].icon}</span>
                        </div>
                      ) : (
                        <span className="text-5xl md:text-6xl mb-1 filter drop-shadow-md">{BUILDINGS[plot].icon}</span>
                      )}
                    </div>
                    <span className="font-bold text-center text-xs md:text-sm bg-white/90 px-2 py-0.5 rounded-full z-10 mt-auto mb-5 shadow-sm">{BUILDINGS[plot].name}</span>
                    <span className="absolute bottom-1 text-[10px] font-semibold bg-red-100/90 text-red-700 px-2 py-0.5 rounded-full border border-red-200 z-10">
                      維護 -{BUILDINGS[plot].upkeep}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-4xl ${selectedPlot === idx ? 'text-blue-500' : 'text-emerald-400/50'}`}>+</span>
                    <span className={`text-sm mt-2 font-semibold ${selectedPlot === idx ? 'text-blue-600' : 'text-emerald-600/70'}`}>
                      {selectedPlot === idx ? '選擇了此地塊' : '點擊建設'}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Event Log */}
          <div className="mt-4 bg-gray-900 text-green-400 p-3 rounded-lg shadow-inner border border-gray-700 h-32 overflow-y-auto font-mono text-xs">
            {log.map((msg, i) => (
              <div key={i} className={`mb-1 ${i === 0 ? 'text-white font-bold' : 'opacity-70'}`}>
                {msg}
              </div>
            ))}
          </div>
        </section>

        {/* Right Panel: Build Menu */}
        {selectedPlot !== null && (
          <aside className="w-full md:w-80 bg-white p-5 border-l border-slate-200 flex flex-col shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">🏗️ 建設清單</h2>
              <button 
                onClick={() => setSelectedPlot(null)}
                className="text-slate-400 hover:text-red-500 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">請為地塊 {selectedPlot + 1} 選擇要興建的設施：</p>
            
            <div className="space-y-3 overflow-y-auto pr-1 pb-4">
              {Object.values(BUILDINGS).map(b => (
                <div key={b.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-lg border bg-white overflow-hidden shadow-inner ${b.color.split(' ')[1]}`}>
                       {b.img ? (
                          <img src={b.img} alt={b.name} className="w-full h-full object-cover" />
                       ) : (
                          <span className="text-3xl">{b.icon}</span>
                       )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-800 text-base">{b.name}</h3>
                      <div className="flex gap-2 text-xs font-semibold mt-1">
                        <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">💰 {b.cost}萬</span>
                        <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">維護: -{b.upkeep}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border border-slate-100 leading-relaxed">
                    {b.desc}
                  </p>
                  <button 
                    onClick={() => handleBuild(b.id)}
                    disabled={budget < b.cost}
                    className={`mt-2 w-full py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm ${
                      budget >= b.cost 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {budget >= b.cost ? '確認興建' : '資金不足'}
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}
      </main>

      {/* Quiz Modal (Humanities Reflection Checkpoint) */}
      {quizModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-lg mb-2">
              🧠 年度人文科思考檢討
            </div>
            <p className="text-slate-800 text-base font-semibold mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
              {quizModal.data.question}
            </p>

            <div className="space-y-3 mb-6">
              {quizModal.data.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuizModal(prev => ({ ...prev, selectedOpt: opt }));
                    triggerSFX(opt.correct ? 'correct' : 'wrong');
                  }}
                  className={`w-full p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                    quizModal.selectedOpt === opt 
                      ? (opt.correct ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900')
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            {quizModal.selectedOpt && (
              <div className={`p-3 rounded-xl text-xs font-bold mb-4 ${quizModal.selectedOpt.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {quizModal.selectedOpt.feedback}
              </div>
            )}

            <div className="flex justify-end">
              <button
                disabled={!quizModal.selectedOpt}
                onClick={() => {
                  setQuizModal({ isOpen: false, data: null, selectedOpt: null });
                  processAdvanceTurn();
                }}
                className={`px-6 py-2 rounded-xl text-white font-bold text-sm ${
                  quizModal.selectedOpt 
                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                完成思考，進入下一年 ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Modal Overlay (Alerts, Warnings, Dilemmas, End Game) */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all border border-slate-100">
            <h3 className={`text-2xl font-bold mb-4 border-b pb-2 ${modal.type === 'warning' ? 'text-amber-600 border-amber-100' : 'text-slate-800 border-slate-100'}`}>
              {modal.title}
            </h3>
            <p className="text-slate-600 text-base mb-6 leading-relaxed">
              {modal.text}
            </p>
            <div className="flex flex-col gap-3">
              {modal.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={opt.action}
                  className={`w-full py-3 px-4 rounded-xl text-white font-bold text-base shadow-md transition-transform transform active:scale-95 ${opt.color}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}