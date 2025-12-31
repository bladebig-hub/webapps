import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scan, 
  Map as MapIcon, 
  Gift, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  X,
  Ticket,
  Navigation,
  Search,
  Wallet,
  Phone,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Flame,
  Puzzle,
  Store,
  QrCode,
  Copy,
  Clock,
  Share2,
  Crown,
  CreditCard
} from 'lucide-react';
import { AppView, Merchant, Reward, UserState, GrandPrize, WalletItem } from './types.ts';
import { generateCheckInMessage, generateLuckyFortune, generateNextStopRecommendation } from './services/geminiService.ts';
import { Button } from './components/Button.tsx';
import { TaskMap } from './components/TaskMap.tsx';

// --- Mock Data ---

const GRAND_PRIZES: GrandPrize[] = [
  { 
    id: 'p1', 
    name: '工体嘉年华·超级通票', 
    imageUrl: 'https://picsum.photos/seed/ski_resort_v2/600/400', 
    totalFragments: 3,
    description: '畅玩冰雪乐园，含滑雪体验与装备租赁。' 
  },
  { 
    id: 'p2', 
    name: '500元 商圈购物卡', 
    imageUrl: 'https://picsum.photos/seed/shopping_luxury_mall/600/400', 
    totalFragments: 5,
    description: '三里屯太古里/工体商圈通用购物金。' 
  },
  { 
    id: 'p3', 
    name: '泡泡玛特·限定手办', 
    imageUrl: 'https://picsum.photos/seed/popmart_toy_cute/600/400', 
    totalFragments: 4,
    description: '燃冬系列隐藏款，收藏价值极高。' 
  }
];

const MOCK_MERCHANTS: Merchant[] = [
  { id: '1', name: 'Shake Shack (三里屯店)', category: '餐饮', distance: '100m', imageUrl: 'https://picsum.photos/seed/burger_shake/200/200', offerType: 'GROUP_DEAL', offerTitle: '双人经典汉堡套餐', price: '¥128', originalPrice: '¥160', description: "美式经典汉堡与奶昔，情侣约会首选。" },
  { id: '2', name: '乐高品牌旗舰店', category: '零售', distance: '250m', imageUrl: 'https://picsum.photos/seed/lego_store/200/200', offerType: 'COUPON', offerTitle: '满500减50优惠券', description: "激发无限创造力，新品首发。" },
  { id: '3', name: '工体·冰雪嘉年华', category: '娱乐', distance: '500m', imageUrl: 'https://picsum.photos/seed/snow_park/200/200', offerType: 'VOUCHER', offerTitle: '单人入场早鸟票', price: '¥88', originalPrice: '¥120', description: "冬日必玩冰上乐园，限时特惠。" },
  { id: '4', name: 'COMMUNE (工体店)', category: '酒吧', distance: '650m', imageUrl: 'https://picsum.photos/seed/pub_drinks/200/200', offerType: 'GROUP_DEAL', offerTitle: '夜宵欢聚4人餐', price: '¥398', originalPrice: '¥680', description: "美酒美食自选超市，聚会神地。" },
  { id: '5', name: '陶陶居 (太古里店)', category: '餐饮', distance: '800m', imageUrl: 'https://picsum.photos/seed/dimsum_tea/200/200', offerType: 'VOUCHER', offerTitle: '100元代金券', price: '¥92', originalPrice: '¥100', description: "正宗广式早茶，全场通用。" },
  { id: '6', name: 'Blue Frog 蓝蛙', category: '餐饮', distance: '900m', imageUrl: 'https://picsum.photos/seed/bluefrog/200/200', offerType: 'GROUP_DEAL', offerTitle: '周一汉堡买一送一', price: '¥98', originalPrice: '¥196', description: "美式炙烤，肉食者的天堂。" },
  { id: '7', name: 'Megacine 影城', category: '娱乐', distance: '1.2km', imageUrl: 'https://picsum.photos/seed/cinema/200/200', offerType: 'VOUCHER', offerTitle: '2D/3D通兑电影票', price: '¥39.9', originalPrice: '¥80', description: "震撼视听，贺岁档大片热映中。" },
  { id: '8', name: '魅KTV (工体店)', category: '娱乐', distance: '300m', imageUrl: 'https://picsum.photos/seed/ktv_neon/200/200', offerType: 'GROUP_DEAL', offerTitle: '小包欢唱3小时', price: '¥168', originalPrice: '¥388', description: "顶级音响，释放你的激情。" },
  { id: '9', name: '喜茶 (三里屯黑金店)', category: '餐饮', distance: '400m', imageUrl: 'https://picsum.photos/seed/heytea/200/200', offerType: 'COUPON', offerTitle: '第二杯半价券', description: "酷黑莓桑新品上市。" },
  { id: '10', name: 'Adidas 旗舰店', category: '零售', distance: '150m', imageUrl: 'https://picsum.photos/seed/adidas_shoe/200/200', offerType: 'VOUCHER', offerTitle: '800元代1000元券', price: '¥800', originalPrice: '¥1000', description: "冬季新品羽绒服热卖中。" },
];

const CATEGORIES = ['全部', '餐饮', '娱乐', '零售', '酒吧'];

const BANNER_IMAGES = [
  'https://picsum.photos/seed/winter_sport_skiing/800/400',
  'https://picsum.photos/seed/ice_skating_rink/800/400', 
  'https://picsum.photos/seed/snow_festival_lights/800/400',
  'https://picsum.photos/seed/snowboard_jump_action/800/400'
];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isScanning, setIsScanning] = useState(false);
  
  // Banner State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Search & Filter State
  const [selectedCategory, setSelectedCategory] = useState('全部');

  // Gemini Content State
  const [geminiMessage, setGeminiMessage] = useState<string>('');
  const [geminiFortune, setGeminiFortune] = useState<string>('');
  const [nextStopGuide, setNextStopGuide] = useState<string>('');
  const [selectedReward, setSelectedReward] = useState<WalletItem | null>(null);

  // User State
  const [userState, setUserState] = useState<UserState>({
    currentPrizeId: 'p1', // Default prize
    collectedFragments: 1, // Start with 1 fragment for demo
    history: [],
    wallet: [
      { id: 'w1', type: 'FRAGMENT', title: '初始碎片', date: '2023-12-01', description: '新手大礼包赠送' }
    ],
    wishingCards: 2 // Initial wishing cards
  });

  // --- Effects ---
  
  // Banner Autoplay
  useEffect(() => {
    if (currentView === AppView.HOME) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % BANNER_IMAGES.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Derived State
  const currentPrize = useMemo(() => 
    GRAND_PRIZES.find(p => p.id === userState.currentPrizeId) || GRAND_PRIZES[0]
  , [userState.currentPrizeId]);

  const upcomingMerchants = useMemo(() => {
    return MOCK_MERCHANTS.filter(m => !userState.history.find(h => h.id === m.id));
  }, [userState.history]);

  const filteredMerchants = useMemo(() => {
    return MOCK_MERCHANTS.filter(m => {
      // Removed search query logic as search bar is removed
      const matchesCategory = selectedCategory === '全部' || m.category === selectedCategory;
      return matchesCategory;
    });
  }, [selectedCategory]);

  // -- Handlers --

  const handleStartScan = () => {
    setCurrentView(AppView.NFC_SCANNING);
    setGeminiMessage('');
    setIsScanning(true);
  };

  const handleShare = () => {
    // Simulate share
    alert("已调起微信分享，快去邀请好友吧！");
  };

  const handleSimulateNFC = async () => {
    if (upcomingMerchants.length === 0) {
      alert("今日任务已全部完成！");
      setCurrentView(AppView.HOME);
      return;
    }
    
    const nextMerchant = upcomingMerchants[0];
    const newFragmentCount = userState.collectedFragments + 1;

    // Parallel execution for speed (Targeting ~2 seconds total perception)
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 2000));
    
    const geminiPromise = (async () => {
       try {
         const [msg, guide] = await Promise.all([
            generateCheckInMessage(nextMerchant.name, newFragmentCount),
            upcomingMerchants.length > 1 
              ? generateNextStopRecommendation(newFragmentCount, upcomingMerchants[1].name)
              : Promise.resolve("最后冲刺！集齐碎片召唤大奖！")
         ]);
         return { msg, guide };
       } catch (e) {
         return { msg: "打卡成功！", guide: "" };
       }
    })();

    // Wait for both
    const [_, geminiResult] = await Promise.all([minDelayPromise, geminiPromise]);
    
    setIsScanning(false);
    setGeminiMessage(geminiResult.msg);
    setNextStopGuide(geminiResult.guide);

    // Update User State
    setUserState(prev => ({
      ...prev,
      history: [...prev.history, nextMerchant],
      collectedFragments: newFragmentCount,
      wishingCards: prev.wishingCards + 2 // Grant 2 Wishing Cards
    }));

    setCurrentView(AppView.CHECK_IN_SUCCESS);
  };

  const handleSelectReward = async (type: 'RED_PACKET' | 'COUPON') => {
    // Parallel execution for speed (Targeting ~2 seconds)
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 2000));
    
    const prepareRewardPromise = (async () => {
        const fortune = await generateLuckyFortune();
        const randomMerchant = MOCK_MERCHANTS[Math.floor(Math.random() * MOCK_MERCHANTS.length)];
        
        let newReward: WalletItem;

        if (type === 'RED_PACKET') {
          newReward = { 
              id: Date.now().toString(), 
              type: 'COUPON', 
              title: randomMerchant.offerTitle, 
              value: randomMerchant.price || '5折', 
              date: new Date().toLocaleDateString(),
              description: `适用商户：${randomMerchant.name}`,
              imageUrl: randomMerchant.imageUrl
          };
        } else {
           newReward = { 
               id: Date.now().toString(), 
               type: 'COUPON', 
               title: '50元代金券', 
               value: '¥50', 
               date: new Date().toLocaleDateString(),
               description: `适用商户：${randomMerchant.name} (满200可用)`,
               imageUrl: randomMerchant.imageUrl
            };
        }
        return { fortune, newReward };
    })();

    const [_, result] = await Promise.all([minDelayPromise, prepareRewardPromise]);
    const { fortune, newReward } = result;

    setGeminiFortune(fortune);
    
    // Add Fragment logic
    const currentMerchant = userState.history[userState.history.length-1];
    const fragmentItem: WalletItem = {
        id: `frag-${Date.now()}`,
        type: 'FRAGMENT',
        title: '任务碎片',
        description: `来自: ${currentMerchant?.name || '打卡'}`,
        date: new Date().toLocaleDateString()
    };

    setUserState(prev => ({
        ...prev,
        wallet: [fragmentItem, newReward, ...prev.wallet]
    }));

    setSelectedReward(newReward);
    setCurrentView(AppView.REWARD_CLAIMED);
  };

  const handleClaimSuccess = () => {
    // Check if mission complete
    if (userState.collectedFragments >= currentPrize.totalFragments) {
      setCurrentView(AppView.MISSION_COMPLETE);
    } else {
      setCurrentView(AppView.HOME);
    }
  };

  const handleSwitchPrize = (prizeId: string) => {
    if (prizeId !== userState.currentPrizeId) {
      if (confirm("切换奖品目标将重置当前碎片进度，确认切换吗？")) {
        setUserState(prev => ({
          ...prev,
          currentPrizeId: prizeId,
          collectedFragments: 0
        }));
        setCurrentView(AppView.HOME);
      }
    } else {
      setCurrentView(AppView.HOME);
    }
  };

  // -- Render Components --

  const renderOfferBadge = (merchant: Merchant) => {
    switch (merchant.offerType) {
      case 'GROUP_DEAL':
        return <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">超值团购</span>;
      case 'VOUCHER':
        return <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">代金券</span>;
      case 'COUPON':
        return <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">优惠券</span>;
      default:
        return null;
    }
  };

  const renderOfferDetails = (merchant: Merchant) => {
    if (merchant.offerType === 'COUPON') {
      return (
        <div className="flex items-center gap-1 mt-1">
          <Ticket size={14} className="text-rose-500" />
          <span className="text-sm font-bold text-rose-600">{merchant.offerTitle}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-lg font-bold text-rose-600">{merchant.price}</span>
        {merchant.originalPrice && (
           <span className="text-xs text-gray-400 line-through">原价 {merchant.originalPrice}</span>
        )}
      </div>
    );
  };

  // -- Render Views --

  const renderHome = () => (
    <div className="pb-24 bg-gray-50 min-h-screen relative">
      {/* 1. Top Banner - Carousel - Reduced Height */}
      <div className="w-full h-40 relative overflow-hidden">
         {BANNER_IMAGES.map((img, idx) => (
           <img 
              key={idx}
              src={img} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentBannerIndex ? 'opacity-100' : 'opacity-0'}`}
              alt={`Event Banner ${idx}`} 
           />
         ))}
         
         <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-black/20"></div>
         
         {/* Carousel Dots */}
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {BANNER_IMAGES.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-white w-3' : 'bg-white/50'}`}
              ></div>
            ))}
         </div>

         {/* Share Button (Top Right) */}
         <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full shadow-lg border border-white/30 backdrop-blur-md active:scale-95 transition-transform"
            >
              <Share2 size={16} fill="white" />
              <span className="text-xs font-bold tracking-wide">分享</span>
            </button>
         </div>
      </div>

      {/* 2. Target Prize Card */}
      <div className="px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-blue-50">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
               <Sparkles size={14} className="text-yellow-500" /> 当前心愿目标
             </h2>
             <button 
                onClick={() => setCurrentView(AppView.PRIZE_SELECTOR)}
                className="text-xs font-semibold text-blue-600 flex items-center bg-blue-50 px-2 py-1.5 rounded-lg active:bg-blue-100"
             >
                <RefreshCw size={12} className="mr-1" /> 切换奖品
             </button>
          </div>
          
          <div className="flex gap-4 items-start">
            {/* Prize Image */}
            <div 
              className="w-24 h-24 rounded-xl overflow-hidden shadow-md flex-shrink-0 relative group cursor-pointer bg-gray-100"
              onClick={() => setCurrentView(AppView.PRIZE_SELECTOR)}
            >
               <img src={currentPrize.imageUrl} className="w-full h-full object-cover" alt="Prize" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{currentPrize.name}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{currentPrize.description}</p>
              
              {/* Fragment Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-500">收集进度</span>
                  <span className="text-gray-600">{userState.collectedFragments} / {currentPrize.totalFragments}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                   <div 
                      className="bg-gradient-to-r from-rose-400 to-red-500 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                      style={{ width: `${Math.min(100, (userState.collectedFragments / currentPrize.totalFragments) * 100)}%` }}
                   ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons Area */}
          <div className="mt-5 grid grid-cols-5 gap-3">
             {/* Map Button (Small) */}
             <button 
                onClick={() => setCurrentView(AppView.MAP_VIEW)}
                className="col-span-1 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
                title="查看打卡地图"
             >
                <MapIcon size={24} />
             </button>

             {/* Main Action Button (Large) */}
             <div className="col-span-4">
               {userState.collectedFragments >= currentPrize.totalFragments ? (
                  <Button 
                      onClick={() => setCurrentView(AppView.MISSION_COMPLETE)}
                      fullWidth className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-orange-200 text-sm py-0"
                  >
                      <Gift className="mr-2" size={18} /> 任务完成！去领奖
                  </Button>
               ) : (
                  <Button 
                      onClick={handleStartScan}
                      fullWidth className="h-full shadow-blue-200 text-sm py-0"
                  >
                      <Scan className="mr-2" size={18} /> 碰一下打卡（赢礼物）
                  </Button>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* 2.5 New: 0 Yuan Wish Banner */}
      <div className="px-5 mt-4">
         <div className="w-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 rounded-xl p-3 shadow-lg flex items-center justify-between cursor-pointer transform transition-transform hover:scale-[1.01] active:scale-95 relative overflow-hidden group">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            <div className="absolute -right-4 -top-8 w-24 h-24 bg-white/20 blur-2xl rounded-full"></div>
            
            <div className="flex items-center gap-3 relative z-10 text-white">
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <Crown size={20} className="text-yellow-300 drop-shadow-sm" fill="currentColor" />
               </div>
               <div>
                  <h3 className="font-bold text-base leading-tight">0元许愿赢免单</h3>
                  <p className="text-[10px] text-purple-100 opacity-90">锦鲤附体 · 每日抽取幸运大奖</p>
               </div>
            </div>
            
            <div className="bg-white text-purple-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center relative z-10">
               去许愿 <ChevronRight size={12} className="ml-0.5" />
            </div>
         </div>
      </div>

      {/* 3. Merchant List & Search - Removed Search Input */}
      <div className="px-5 mt-6">
         <div className="sticky top-0 bg-gray-50 z-20 pb-2 transition-all pt-2">
            <h2 className="font-extrabold text-xl text-gray-900 mb-4 flex items-center">
               <Flame className="text-rose-500 mr-2" fill="currentColor" size={20} />
               活动周边优惠大放送
            </h2>
            
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-rose-600 text-white shadow-md' 
                      : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
         </div>
        
        <div className="space-y-4 mt-2 pb-10">
          {filteredMerchants.map((merchant) => (
            <div key={merchant.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 relative overflow-hidden group">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                <img src={merchant.imageUrl} alt={merchant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-br-lg backdrop-blur-sm">
                  {merchant.category}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{merchant.name}</h3>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] text-gray-400">{merchant.distance}</span>
                     {renderOfferBadge(merchant)}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{merchant.offerTitle}</p>
                </div>
                
                {/* Enhanced Price / Action Area */}
                <div className="flex items-end justify-between mt-1">
                   <div className="flex flex-col">
                      {renderOfferDetails(merchant)}
                   </div>
                   
                   <button className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm active:scale-95 transition-transform ${
                      merchant.offerType === 'COUPON' 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500' 
                      : 'bg-gradient-to-r from-orange-500 to-amber-500'
                   }`}>
                      {merchant.offerType === 'COUPON' ? '立即领券' : '立即抢购'}
                   </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredMerchants.length > 0 && (
             <div className="text-center py-4 text-gray-300 text-xs flex items-center justify-center">
                <span>— 更多优惠加载中 —</span>
             </div>
          )}

          {filteredMerchants.length === 0 && (
             <div className="text-center py-10 text-gray-400 text-sm">暂无相关商户</div>
          )}
        </div>
      </div>

      {/* Floating Wallet Button (Bottom Right) */}
      <div className="fixed bottom-8 right-4 z-40">
         <button 
           onClick={() => setCurrentView(AppView.WALLET)}
           className="bg-white text-gray-800 rounded-full shadow-2xl border-2 border-gray-100 p-1 pr-4 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
         >
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
               <Wallet size={20} />
            </div>
            <div className="flex flex-col items-start">
               <span className="text-xs font-bold">我的卡包</span>
               <span className="text-[10px] text-rose-500 font-bold">{userState.wallet.length + userState.wishingCards} 件物品</span>
            </div>
         </button>
      </div>
    </div>
  );

  const renderSuccess = () => {
    // Get the most recently visited merchant
    const lastVisited = userState.history[userState.history.length - 1] || MOCK_MERCHANTS[0];

    return (
      <div className="h-screen flex flex-col bg-slate-900 relative overflow-hidden">
        {/* Festive Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti-doodles.png')] opacity-10"></div>
        
        {/* Decorative Circles */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-rose-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-md mx-auto">
          
          {/* Brand Exposure Card */}
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-6 text-center shadow-2xl animate-fade-in-up">
            
            {/* Merchant Image */}
            <div className="w-full h-32 rounded-xl overflow-hidden mb-4 shadow-inner relative">
                <img src={lastVisited.imageUrl} alt={lastVisited.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Logo Overlay */}
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-4 border-white shadow-lg -mt-14 mb-3 relative z-10 bg-white">
              <img src={`https://picsum.photos/seed/logo_${lastVisited.id}/100/100`} alt="Logo" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-white text-xl font-bold mb-1">打卡成功</h2>
            <div className="flex items-center justify-center gap-1 text-blue-200 text-sm mb-4">
              <MapPin size={14} />
              <span>{lastVisited.name}</span>
            </div>

            {/* AI Message */}
            <div className="bg-white/90 text-slate-800 p-4 rounded-xl text-sm font-medium italic relative shadow-inner">
               <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
               "{geminiMessage || '欢迎光临！祝你在嘉年华玩得开心！'}"
            </div>
          </div>

          {/* Rewards Section */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6">
             {/* Fragment Item */}
             <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 flex flex-col items-center justify-center relative backdrop-blur-sm animate-pulse">
                <div className="absolute top-1 right-1">
                   <CheckCircle2 size={12} className="text-green-400" />
                </div>
                <Puzzle size={32} className="text-yellow-300 drop-shadow-md mb-1" />
                <span className="text-white text-xs font-bold">任务碎片 x1</span>
             </div>

             {/* Red Packet Item (New) */}
             <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 flex flex-col items-center justify-center relative backdrop-blur-sm animate-pulse delay-100">
                <div className="absolute top-1 right-1">
                   <Sparkles size={12} className="text-yellow-400 animate-spin-slow" />
                </div>
                <div className="relative">
                   <div className="w-8 h-10 bg-red-600 rounded mb-1 flex items-center justify-center border border-red-400 shadow-md">
                      <span className="text-yellow-300 font-bold text-xs">¥</span>
                   </div>
                </div>
                <span className="text-white text-xs font-bold">店铺红包 x1</span>
             </div>
          </div>

          {/* Wishing Cards Bonus */}
          <div className="mb-8 w-full">
             <div className="bg-gradient-to-r from-purple-600/60 to-indigo-600/60 border border-purple-400/30 rounded-xl p-3 flex items-center justify-center gap-3 shadow-lg">
                <Crown size={20} className="text-yellow-300" />
                <span className="text-white font-bold text-sm">额外获赠：许愿卡 x2</span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">已存入</span>
             </div>
          </div>

          <Button 
            onClick={() => setCurrentView(AppView.REWARD_SELECTION)} 
            size="lg" 
            fullWidth 
            className="shadow-[0_0_20px_rgba(37,99,235,0.5)] bg-gradient-to-r from-blue-500 to-indigo-600 border-t border-blue-400"
          >
            <Gift className="mr-2 animate-bounce" size={20} /> 
            开启商户盲盒礼包
          </Button>
        </div>
      </div>
    );
  };

  const renderRewardSelection = () => (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-900 to-slate-900 text-white px-6 py-12">
      <h2 className="text-2xl font-bold text-center mb-2">选择你的礼物</h2>
      <p className="text-center text-indigo-200 mb-10">点击任意礼盒，解锁即时福利！</p>

      <div className="flex-1 grid grid-cols-1 gap-6 place-content-center">
        {/* Gift Box 1 */}
        <div 
            onClick={() => handleSelectReward('RED_PACKET')}
            className="group relative h-52 bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-6 shadow-2xl cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-orange-500/50 flex flex-col items-center justify-center border-4 border-white/10 active:scale-95"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/giftly.png')] opacity-10 rounded-2xl"></div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm shadow-inner">
                <Gift size={40} className="text-white drop-shadow-md" />
            </div>
            <h3 className="text-2xl font-bold tracking-wider">惊喜盲盒 A</h3>
            <div className="mt-2 text-xs font-medium bg-white/20 px-3 py-1 rounded-full">点击开启</div>
        </div>

        {/* Gift Box 2 */}
        <div 
            onClick={() => handleSelectReward('COUPON')}
            className="group relative h-52 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 shadow-2xl cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-purple-500/50 flex flex-col items-center justify-center border-4 border-white/10 active:scale-95"
        >
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/giftly.png')] opacity-10 rounded-2xl"></div>
             <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm shadow-inner">
                <Sparkles size={40} className="text-white drop-shadow-md" />
            </div>
            <h3 className="text-2xl font-bold tracking-wider">惊喜盲盒 B</h3>
            <div className="mt-2 text-xs font-medium bg-white/20 px-3 py-1 rounded-full">点击开启</div>
        </div>
      </div>
    </div>
  );

  const renderRewardClaimed = () => {
    // Only render if we have a selected reward
    if (!selectedReward) return null;

    return (
        <div className="h-screen flex flex-col relative overflow-hidden">
            {/* Ceremonial Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
            
            {/* Light Rays Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-rose-500/20 to-transparent blur-3xl"></div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full px-4 relative z-10">
                
                <div className="mb-6 text-center animate-fade-in-down">
                  <div className="inline-block p-3 bg-yellow-400/20 rounded-full backdrop-blur-sm mb-2 border border-yellow-400/50">
                    <Gift size={32} className="text-yellow-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">恭喜获得商家好礼</h2>
                  <p className="text-purple-200 text-sm">已自动存入卡包</p>
                </div>

                {/* Ritualistic Ticket Design */}
                <div className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl relative mb-8 transform hover:scale-105 transition-transform duration-500">
                    {/* Product Image Area */}
                    <div className="h-40 w-full relative">
                       <img src={selectedReward.imageUrl} className="w-full h-full object-cover" alt="Product" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute bottom-3 left-4 text-white">
                          <div className="text-xs font-bold opacity-80 uppercase tracking-widest">Rewards</div>
                          <div className="text-lg font-bold">{selectedReward.title}</div>
                       </div>
                    </div>
                    
                    {/* Ticket Body */}
                    <div className="p-6">
                        {/* Value & Content */}
                        <div className="flex justify-between items-center mb-6">
                           <div>
                              <div className="text-sm text-gray-500 mb-1">优惠价值</div>
                              <div className="text-4xl font-black text-rose-600 tracking-tighter">{selectedReward.value}</div>
                           </div>
                           <div className="text-right">
                              <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-bold mb-1 inline-block border border-rose-100">
                                仅限今日
                              </div>
                              <div className="text-xs text-gray-400">满额可用</div>
                           </div>
                        </div>

                        {/* Dashed Line */}
                        <div className="border-t-2 border-dashed border-gray-100 my-4 relative">
                           <div className="absolute -left-8 -top-3 w-6 h-6 bg-gray-900 rounded-full"></div>
                           <div className="absolute -right-8 -top-3 w-6 h-6 bg-gray-900 rounded-full"></div>
                        </div>

                        {/* Barcode / QR Simulation */}
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex-1">
                              <div className="text-[10px] text-gray-400 mb-1 uppercase">Code</div>
                              <div className="font-mono font-bold text-gray-800 text-lg tracking-widest">
                                 RW-{(Math.random()*10000).toFixed(0)}
                              </div>
                           </div>
                           <QrCode size={40} className="text-gray-800" />
                        </div>
                    </div>
                </div>

                {/* Fortune Cookie */}
                <div className="bg-white/10 backdrop-blur text-purple-100 px-6 py-4 rounded-xl text-sm italic font-medium mb-8 border border-white/10 shadow-lg max-w-xs text-center relative">
                   <Sparkles size={16} className="absolute -top-2 -left-2 text-yellow-300 animate-spin-slow" />
                   " {geminiFortune} "
                   <Sparkles size={16} className="absolute -bottom-2 -right-2 text-yellow-300 animate-spin-slow" />
                </div>

                <Button onClick={handleClaimSuccess} fullWidth className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)] border-none text-lg py-4">
                    立即使用 / 存入卡包
                </Button>
            </div>
        </div>
    );
  };

  const renderWallet = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
          <button onClick={() => setCurrentView(AppView.HOME)} className="p-2 -ml-2">
             <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold ml-2">我的卡包与碎片</h1>
       </div>

       <div className="p-4 space-y-4">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Crown className="text-yellow-300" />
                <div>
                   <div className="text-xs text-purple-200">我的许愿卡</div>
                   <div className="text-2xl font-bold">{userState.wishingCards} <span className="text-sm font-normal">张</span></div>
                </div>
             </div>
             <Button size="sm" className="bg-white/20 border-0 text-white hover:bg-white/30 text-xs">
                去许愿
             </Button>
          </div>

          <h3 className="text-sm font-bold text-gray-500 uppercase">当前任务收集</h3>
          {/* Fragment Grid */}
          <div className="grid grid-cols-4 gap-2 bg-white p-4 rounded-2xl border border-gray-100">
             {Array.from({ length: currentPrize.totalFragments }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-lg flex items-center justify-center border-2 ${
                   i < userState.collectedFragments 
                   ? 'bg-rose-50 border-rose-200 text-rose-500' 
                   : 'bg-gray-50 border-gray-100 text-gray-300'
                }`}>
                   {i < userState.collectedFragments ? <Puzzle size={24} fill="currentColor" /> : <span className="text-xs font-bold">{i+1}</span>}
                </div>
             ))}
             <div className="col-span-4 mt-2 text-center text-xs text-gray-400">
                再收集 {currentPrize.totalFragments - userState.collectedFragments} 个碎片即可兑换 <span className="text-gray-800 font-bold">{currentPrize.name}</span>
             </div>
          </div>

          <h3 className="text-sm font-bold text-gray-500 uppercase mt-6">优惠券与奖品 ({userState.wallet.length})</h3>
          <div className="space-y-3">
             {userState.wallet.filter(i => i.type !== 'FRAGMENT').map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center relative overflow-hidden">
                   {/* Decorative circle */}
                   <div className="absolute -right-4 -top-4 w-16 h-16 bg-gray-50 rounded-full z-0"></div>
                   
                   <div className="flex items-center gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 ${!item.imageUrl ? (item.type === 'RED_PACKET' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500') : ''}`}>
                         {item.imageUrl ? (
                             <img src={item.imageUrl} alt="icon" className="w-full h-full object-cover" />
                         ) : (
                             <Ticket size={18} />
                         )}
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-800">{item.title}</h4>
                         <p className="text-xs text-gray-500">{item.description || item.date}</p>
                      </div>
                   </div>
                   <span className="text-lg font-bold text-gray-800 relative z-10">{item.value}</span>
                </div>
             ))}
             {userState.wallet.filter(i => i.type !== 'FRAGMENT').length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-dashed">
                   空空如也，快去打卡吧！
                </div>
             )}
          </div>
       </div>
    </div>
  );

  const renderMissionComplete = () => (
    <div className="h-screen flex flex-col bg-white overflow-y-auto">
       {/* Celebration Header */}
       <div className="bg-rose-600 text-white p-8 text-center rounded-b-[3rem] relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti-doodles.png')] opacity-20"></div>
          <div className="relative z-10 animate-fade-in-up">
             <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
                <Gift size={48} className="text-rose-600" />
             </div>
             <h1 className="text-3xl font-extrabold mb-2">任务达成!</h1>
             <p className="text-rose-100">恭喜集齐所有碎片</p>
          </div>
       </div>

       <div className="flex-1 px-6 py-8 flex flex-col items-center">
          <h2 className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-4">你的终极大奖</h2>
          
          <div className="w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8 max-w-xs mx-auto">
             <img src={currentPrize.imageUrl} className="w-full h-48 object-cover" alt="Prize" />
             <div className="p-6 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentPrize.name}</h3>
                <p className="text-gray-500 text-sm">{currentPrize.description}</p>
                <div className="mt-4 flex justify-center">
                   <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                      <CheckCircle2 size={12} className="mr-1" /> 资格已锁定
                   </div>
                </div>
             </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                   <MapPin size={16} className="mr-2 text-gray-500" /> 领奖服务中心
                </h4>
                <div className="space-y-2 text-sm text-gray-600 pl-6 border-l-2 border-gray-200 ml-2">
                   <p>📍 地址：朝阳区工人体育场北路58号 · 服务台</p>
                   <p>⏰ 时间：10:00 - 22:00</p>
                   <p className="flex items-center gap-2">
                      <Phone size={14} /> 010-8888-8888
                   </p>
                </div>
                <div className="mt-4 flex gap-2">
                   <Button variant="outline" size="sm" fullWidth className="text-xs">
                      <Phone size={14} className="mr-1" /> 致电客服
                   </Button>
                   <Button variant="primary" size="sm" fullWidth className="text-xs">
                      <Navigation size={14} className="mr-1" /> 导航前往
                   </Button>
                </div>
             </div>

             <Button onClick={() => setCurrentView(AppView.HOME)} variant="ghost" fullWidth>
                稍后领取，返回主页
             </Button>
          </div>
       </div>
    </div>
  );

  const renderPrizeSelector = () => (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="flex items-center mb-6">
        <button onClick={() => setCurrentView(AppView.HOME)} className="p-2 -ml-2 hover:bg-white rounded-full transition-colors">
           <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">选择心愿大奖</h2>
      </div>

      <div className="space-y-5">
         {GRAND_PRIZES.map((prize) => (
            <div 
              key={prize.id}
              onClick={() => handleSwitchPrize(prize.id)}
              className={`relative rounded-3xl overflow-hidden bg-white shadow-md border-2 transition-all cursor-pointer ${
                 userState.currentPrizeId === prize.id ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-transparent'
              }`}
            >
               <div className="h-40 w-full relative">
                  <img src={prize.imageUrl} className="w-full h-full object-cover" alt={prize.name} />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded-full font-medium">
                     需收集 {prize.totalFragments} 块碎片
                  </div>
               </div>
               <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-bold text-gray-900">{prize.name}</h3>
                     {userState.currentPrizeId === prize.id && <CheckCircle2 className="text-blue-500" />}
                  </div>
                  <p className="text-sm text-gray-500">{prize.description}</p>
               </div>
            </div>
         ))}
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
        {/* Animated NFC Ripple Effect */}
        <div className="relative mb-12 w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping delay-75"></div>
          <div className="absolute inset-4 bg-blue-500/40 rounded-full animate-ping delay-150"></div>
          <div className="relative z-10 bg-gradient-to-b from-slate-800 to-slate-950 p-6 rounded-full border border-slate-700 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
            <Scan size={56} className="text-blue-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 tracking-wider">打卡收集碎片</h2>
        <p className="text-slate-400 mb-12 max-w-xs mx-auto leading-relaxed">
          请将手机靠近<br/>
          <span className="text-blue-300 font-semibold text-lg">"{upcomingMerchants[0]?.name || '活动'}"</span> NFC标签
        </p>

        <Button 
          variant="primary" 
          onClick={handleSimulateNFC}
          disabled={!isScanning}
          className="animate-bounce bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/50 border-0"
        >
          {isScanning ? "模拟NFC感应" : "正在识别..."}
        </Button>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white p-4 shadow-sm z-10 sticky top-0 flex items-center">
            <button onClick={() => setCurrentView(AppView.HOME)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
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
            
            <div className="h-20"></div> 
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
      {currentView === AppView.PRIZE_SELECTOR && renderPrizeSelector()}
      {currentView === AppView.WALLET && renderWallet()}
      {currentView === AppView.MISSION_COMPLETE && renderMissionComplete()}
    </div>
  );
}