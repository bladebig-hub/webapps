import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scan, 
  Map as MapIcon, 
  Gift, 
  ChevronRight, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  X,
  Ticket
} from 'lucide-react';
import { AppView, Merchant, Reward, UserState } from './types.ts';
import { generateCheckInMessage, generateLuckyFortune } from './services/geminiService.ts';
import { Button } from './components/Button.tsx';
import { TaskMap } from './components/TaskMap.tsx';

// Mock Data - Gongti / Sanlitun Area
const MOCK_MERCHANTS: Merchant[] = [
  { id: '1', name: 'Shake Shack (三里屯店)', category: '餐饮', distance: '100m', imageUrl: 'https://picsum.photos/seed/shake/100/100', offer: '奶昔买一送一', description: "美式经典汉堡与奶昔。" },
  { id: '2', name: '乐高品牌旗舰店', category: '零售', distance: '250m', imageUrl: 'https://picsum.photos/seed/lego/100/100', offer: '限定贴纸免费领', description: "激发无限创造力。" },
  { id: '3', name: '工体·冰雪嘉年华', category: '娱乐', distance: '500m', imageUrl: 'https://picsum.photos/seed/snow/100/100', offer: '门票8折优惠', description: "冬日必玩冰上乐园。" },
  { id: '4', name: 'COMMUNE (工体店)', category: '酒吧', distance: '650m', imageUrl: 'https://picsum.photos/seed/bar/100/100', offer: '指定特饮半价', description: "美酒美食自选超市。" },
  { id: '5', name: '陶陶居 (太古里店)', category: '餐饮', distance: '800m', imageUrl: 'https://picsum.photos/seed/dimsum/100/100', offer: '95折代金券', description: "正宗广式早茶。" },
];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isScanning, setIsScanning] = useState(false);
  const [geminiMessage, setGeminiMessage] = useState<string>('');
  const [geminiFortune, setGeminiFortune] = useState<string>('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const [userState, setUserState] = useState<UserState>({
    checkInCount: 1,
    totalTarget: 5,
    points: 120,
    lastCheckInMerchant: null,
    history: [MOCK_MERCHANTS[0]] // Pretend user already checked in once
  });

  // Calculate upcoming merchants for the map
  const upcomingMerchants = useMemo(() => {
    return MOCK_MERCHANTS.filter(m => !userState.history.find(h => h.id === m.id));
  }, [userState.history]);

  // -- Handlers --

  const handleStartScan = () => {
    setCurrentView(AppView.NFC_SCANNING);
    // Reset states
    setGeminiMessage('');
    setIsScanning(true);
  };

  const handleSimulateNFC = async () => {
    // Pick a random next merchant to simulate checking in
    if (upcomingMerchants.length === 0) {
      alert("恭喜！所有任务已完成！");
      setCurrentView(AppView.HOME);
      return;
    }
    
    const nextMerchant = upcomingMerchants[0];

    // Simulate Network Delay
    setTimeout(async () => {
      setIsScanning(false);
      
      // Update User State
      const newCount = userState.checkInCount + 1;
      setUserState(prev => ({
        ...prev,
        checkInCount: newCount,
        lastCheckInMerchant: nextMerchant,
        history: [...prev.history, nextMerchant],
        points: prev.points + 50
      }));

      // Call Gemini for dynamic content
      const msg = await generateCheckInMessage(nextMerchant.name, newCount);
      setGeminiMessage(msg);

      setCurrentView(AppView.CHECK_IN_SUCCESS);
    }, 1500);
  };

  const handleGoToRewardSelection = () => {
    setCurrentView(AppView.REWARD_SELECTION);
  };

  const handleSelectReward = async (type: 'RED_PACKET' | 'COUPON') => {
    const fortune = await generateLuckyFortune();
    setGeminiFortune(fortune);

    if (type === 'RED_PACKET') {
      setSelectedReward({
        type: 'COUPON',
        value: '5折',
        title: '超值团购神券',
        description: '全场通用，限时五折'
      });
    } else {
       setSelectedReward({
        type: 'COUPON',
        value: '¥50',
        title: `${userState.lastCheckInMerchant?.name} 满减券`,
        description: '满200元可用'
      });
    }
    setCurrentView(AppView.REWARD_CLAIMED);
  };

  const handleViewMap = () => {
    setCurrentView(AppView.MAP_VIEW);
  };

  const handleBackHome = () => {
    setCurrentView(AppView.HOME);
  };

  // -- Render Views --

  const renderHome = () => (
    <div className="pb-24">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl overflow-hidden">
        {/* Ice/Snow Background Decoration */}
        <div className="absolute top-0 right-0 opacity-20 transform translate-x-1/4 -translate-y-1/4">
          <Ticket size={200} />
        </div>
        
        <div className="relative z-10 mt-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-blue-200" size={18} /> 工体·燃冬冰雪嘉年华
              </h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border border-white/30">
              {userState.points} 积分
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-6 shadow-inner">
            <div className="flex justify-between text-sm mb-2 opacity-90">
              <span>今日打卡进度</span>
              <span className="font-bold">{userState.checkInCount}/{userState.totalTarget}</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-300 to-orange-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(253,186,116,0.6)]" 
                style={{ width: `${(userState.checkInCount / userState.totalTarget) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs mt-2 opacity-80 flex items-center">
              <Gift size={12} className="mr-1" /> 再完成 3 站即可解锁嘉年华大礼包！
            </p>
          </div>

          <Button 
            onClick={handleStartScan}
            fullWidth 
            className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg border-0 py-4 text-lg font-extrabold tracking-wide"
          >
            <Scan className="mr-2" /> 碰一下 NFC 打卡
          </Button>
        </div>
      </div>

      {/* Merchant List */}
      <div className="px-5 mt-8">
        <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">🔥 热门商户优惠</span>
          <span className="text-xs font-normal text-gray-500 cursor-pointer flex items-center hover:text-blue-600 transition-colors" onClick={handleViewMap}>
            查看打卡地图 <ChevronRight size={14} />
          </span>
        </h2>
        
        <div className="space-y-4">
          {MOCK_MERCHANTS.map((merchant) => (
            <div key={merchant.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 transition-transform active:scale-[0.98]">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={merchant.imageUrl} alt={merchant.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-gray-800 line-clamp-1">{merchant.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{merchant.category} • {merchant.distance}</p>
                <div className="inline-flex items-center text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded-md self-start border border-rose-100">
                  <Ticket size={12} className="mr-1" /> {merchant.offer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderScanning = () => (
    <div className="h-screen flex flex-col bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/snow.png')] opacity-10"></div>
      
      <button onClick={() => setCurrentView(AppView.HOME)} className="absolute top-6 left-6 z-20 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
        <X size={24} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 text-center">
        <div className="relative mb-12">
          {/* Pulse Effect */}
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          <div className="relative bg-gradient-to-b from-slate-800 to-slate-950 p-8 rounded-full border border-slate-700 shadow-2xl shadow-blue-500/20">
            <Scan size={64} className="text-blue-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 tracking-wider">准备打卡</h2>
        <p className="text-slate-400 mb-12 max-w-xs mx-auto leading-relaxed">
          请将手机背部靠近商家柜台上的<br/>
          <span className="text-blue-300 font-semibold">燃冬嘉年华 NFC 标签</span>
        </p>

        {/* Simulation Button for Web Demo */}
        <Button 
          variant="primary" 
          onClick={handleSimulateNFC}
          disabled={!isScanning}
          className="animate-bounce bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/50 border-0"
        >
          {isScanning ? "模拟 NFC 碰一碰" : "正在识别..."}
        </Button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white pointer-events-none"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_infinite]">
          <CheckCircle2 size={48} className="text-green-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">打卡成功！</h2>
        <p className="text-gray-500 mb-8 flex items-center gap-1">
          <MapIcon size={16} /> {userState.lastCheckInMerchant?.name}
        </p>

        {/* Gemini Generated Message */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 max-w-sm w-full mb-8 transform transition-all duration-500 hover:scale-105">
          <Sparkles className="text-amber-400 w-6 h-6 mb-2 mx-auto" />
          <p className="text-lg font-medium text-gray-800 italic font-serif">
            "{geminiMessage || '正在生成好运寄语...'}"
          </p>
        </div>

        <div className="w-full max-w-sm bg-gray-100 rounded-2xl p-4 mb-8">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-600">今日任务</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-500">{userState.checkInCount}/{userState.totalTarget}</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{width: `${(userState.checkInCount / userState.totalTarget) * 100}%`}}></div>
            </div>
        </div>

        <Button onClick={handleGoToRewardSelection} size="lg" fullWidth className="shadow-xl shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <Gift className="mr-2" size={20} /> 抽取商家福利
        </Button>
      </div>
    </div>
  );

  const renderRewardSelection = () => (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-900 to-slate-900 text-white px-6 py-12">
      <h2 className="text-2xl font-bold text-center mb-2">选择你的奖励</h2>
      <p className="text-center text-indigo-200 mb-10">完成任务，二选一福利！</p>

      <div className="flex-1 grid grid-cols-1 gap-6 place-content-center">
        {/* Card 1 */}
        <div 
            onClick={() => handleSelectReward('RED_PACKET')}
            className="group relative h-48 bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-6 shadow-2xl cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-orange-500/50 flex flex-col items-center justify-center border-4 border-white/10"
        >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
                <Ticket size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold">超值团购券</h3>
            <p className="text-sm text-rose-100 opacity-80 mt-1">热门套餐 限时特价</p>
        </div>

        {/* Card 2 */}
        <div 
            onClick={() => handleSelectReward('COUPON')}
            className="group relative h-48 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-6 shadow-2xl cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-cyan-500/50 flex flex-col items-center justify-center border-4 border-white/10"
        >
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
                <ShoppingBag size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold">商家满减券</h3>
            <p className="text-sm text-blue-100 opacity-80 mt-1">消费立减 专属优惠</p>
        </div>
      </div>
    </div>
  );

  const renderRewardClaimed = () => (
    <div className="h-screen flex flex-col bg-white px-6 py-12 text-center">
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative mb-8 animate-bounce">
               <div className="absolute -inset-10 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full opacity-30 blur-xl"></div>
               {selectedReward?.type === 'RED_PACKET' ? (
                   <div className="w-40 h-28 bg-rose-500 rounded-xl border-4 border-yellow-300 flex flex-col items-center justify-center shadow-2xl relative z-10 text-white">
                       <span className="text-3xl font-bold">{selectedReward.value}</span>
                       <span className="text-xs opacity-90 mt-1">团购特惠</span>
                   </div>
               ) : (
                    <div className="w-40 h-28 bg-blue-600 rounded-xl border-dashed border-2 border-white flex flex-col items-center justify-center shadow-2xl relative z-10 text-white">
                       <span className="text-3xl font-bold">{selectedReward?.value}</span>
                       <span className="text-xs opacity-90 mt-1">商家满减</span>
                   </div>
               )}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedReward?.title}</h2>
            <p className="text-gray-500 mb-6">{selectedReward?.description}</p>
            
            <div className="bg-orange-50 text-orange-700 px-4 py-3 rounded-xl text-sm italic mb-10 max-w-xs mx-auto border border-orange-100">
               "{geminiFortune}"
            </div>

            <div className="w-full space-y-3">
                <Button onClick={handleViewMap} variant="outline" fullWidth>
                    <MapIcon className="mr-2" size={18} /> 查看打卡地图
                </Button>
                <Button onClick={handleBackHome} variant="ghost" fullWidth>
                    返回活动主页
                </Button>
            </div>
        </div>
    </div>
  );

  const renderMap = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white p-4 shadow-sm z-10 sticky top-0 flex items-center">
            <button onClick={handleBackHome} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="font-bold text-lg flex-1 text-center pr-8">打卡路线图</h1>
        </div>

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">燃冬之旅</h2>
                <p className="text-gray-500 text-sm">沿着地图打卡，点亮工体·三里屯！</p>
            </div>

            {/* D3 Map Component */}
            <TaskMap 
                completedMerchants={userState.history} 
                upcomingMerchants={upcomingMerchants} 
            />

            <div className="mt-8 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <Ticket size={18} className="mr-2 text-rose-500" /> 我的卡包
                </h3>
                {selectedReward ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedReward.type === 'COUPON' && selectedReward.title.includes('团购') ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Ticket size={18} />
                             </div>
                             <div>
                                 <p className="font-bold text-sm text-gray-800">{selectedReward.title}</p>
                                 <p className="text-xs text-gray-500">{selectedReward.description}</p>
                             </div>
                        </div>
                        <Button size="sm" variant="secondary" className="text-xs px-3">去使用</Button>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        暂无奖励，快去打卡吧！
                    </p>
                )}
            </div>
            
            <div className="h-20"></div> 
        </div>

        <div className="fixed bottom-6 left-6 right-6">
             <Button onClick={handleStartScan} fullWidth className="shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600">
                 继续探索
             </Button>
        </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden font-sans">
      {currentView === AppView.HOME && renderHome()}
      {currentView === AppView.NFC_SCANNING && renderScanning()}
      {currentView === AppView.CHECK_IN_SUCCESS && renderSuccess()}
      {currentView === AppView.REWARD_SELECTION && renderRewardSelection()}
      {currentView === AppView.REWARD_CLAIMED && renderRewardClaimed()}
      {currentView === AppView.MAP_VIEW && renderMap()}
    </div>
  );
}