import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Package, Copy, Plus, Trash2, LogIn, LogOut, User, Truck, CheckCircle, AlertCircle, X, Save, ExternalLink, MapPin, Globe, ArrowRight, Zap, ChevronDown, ChevronUp, RefreshCw, Clock, Disc, Settings, Upload, FileText, Share2, CornerUpRight, ClipboardList, PackageCheck, Hourglass, XCircle, Sparkles, Phone, MessageSquare, Menu, Globe2, ShieldCheck, Lock, Download, BarChart2, PieChart, LayoutGrid, List, CheckSquare, Square, Box, ChevronRight, Info, Home, Edit, Clipboard, AlertTriangle, Filter, Smartphone, Image as ImageIcon, Signal, Wifi, Battery, Calendar, Palette, Check, FileSpreadsheet, CreditCard, Layers, Activity, Eye, EyeOff, Play, Pause, Database, FileJson, MoreHorizontal, Volume2, VolumeX, Gift, Sparkle, Type, Link as LinkIcon, QrCode, Scissors, Bot, Cpu, Brain, Sparkles as SparklesIcon, ImageDown } from 'lucide-react';

// --- 配置区域 (Supabase 信息) ---
const SUPABASE_URL = "https://vfwgmzsppkdeqccflian.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmd2dtenNwcGtkZXFjY2ZsaWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDQzNTgsImV4cCI6MjA4MDAyMDM1OH0.BeYDz7MeUwNf8LZmd7Ji33JaOeYZ3YnhNCsMjYL46I8"; 

// --- 核心配置 ---
const LOCAL_SETTINGS_KEY = 'dhcx.me_settings_v3_production'; 
const SHORT_LINK_BASE_URL = 'https://dhcx.me'; 

// --- 通用工具 ---
const loadScript = (src, globalName) => { 
    return new Promise((resolve, reject) => { 
        if (window[globalName]) { resolve(window[globalName]); return; } 
        const script = document.createElement('script'); 
        script.src = src; 
        script.async = true; 
        script.onload = () => resolve(window[globalName]); 
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`)); 
        document.head.appendChild(script); 
    }); 
};

// --- 安全编码工具 ---
const encodeToken = (str) => {
    if (!str) return '';
    if (/^[A-Za-z0-9]+$/.test(str)) return str;
    try {
        const base64 = btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return 'tk_' + base64;
    } catch (e) { return str; }
};

const decodeToken = (str) => {
    if (!str) return '';
    try {
        if (!str.startsWith('tk_')) return str;
        let base64 = str.slice(3).replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) base64 += '='.repeat(4 - pad);
        return decodeURIComponent(escape(atob(base64)));
    } catch (e) { console.warn("解码失败:", e); return null; }
};

const generateShortCode = (length = 5) => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// --- 初始化 Supabase ---
let supabase = null;
const initSupabase = async () => {
    if (supabase) return supabase;
    if (typeof window !== 'undefined' && window.supabase) {
         supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
         return supabase;
    }
    try {
        const sb = await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'supabase');
        if (sb && sb.createClient) {
            supabase = sb.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    } catch (e) { console.error("Supabase 初始化失败:", e); }
    return supabase;
};

// --- [组件] 二维码卡片弹窗 ---
const QrCodeModal = ({ show, onClose, data, themeColor }) => {
    const cardRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!show) setPreviewUrl(null);
    }, [show]);

    if (!show) return null;

    const handleDownloadImage = async () => {
        setIsSaving(true);
        try {
            if (!window.htmlToImage) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js', 'htmlToImage');
            }

            const element = cardRef.current;
            if (!element) return;
            await new Promise(resolve => setTimeout(resolve, 100));

            const filter = (node) => {
                return !node.classList?.contains('exclude-from-capture');
            };

            const options = {
                quality: 1.0, 
                backgroundColor: null, 
                cacheBust: true, 
                skipAutoScale: true, 
                filter: filter
            };

            let dataUrl;
            try {
                dataUrl = await window.htmlToImage.toPng(element, { ...options, pixelRatio: 3 });
            } catch (highResError) {
                console.warn('3x capture failed, falling back to 2x', highResError);
                dataUrl = await window.htmlToImage.toPng(element, { ...options, pixelRatio: 2 });
            }

            setPreviewUrl(dataUrl); 
        } catch (error) {
            console.error('截图生成失败:', error);
            try {
                 await new Promise(resolve => setTimeout(resolve, 500));
                 const element = cardRef.current;
                 const dataUrl = await window.htmlToImage.toPng(element, { 
                    quality: 0.9, backgroundColor: null, pixelRatio: 2, cacheBust: true
                 });
                 setPreviewUrl(dataUrl);
            } catch (retryError) {
                alert("图片生成失败，可能是浏览器兼容性问题，请尝试直接截屏。");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (previewUrl) {
        return (
            <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/95 backdrop-blur-md p-6" onClick={() => setPreviewUrl(null)}>
                <div className="flex flex-col items-center gap-6 w-full max-w-[300px] animate-in zoom-in-95 duration-300">
                    <div className="text-white text-center space-y-1">
                        <div className="flex items-center justify-center gap-2 text-[#CCFF00] mb-2">
                            <CheckCircle size={24} className="animate-bounce"/>
                            <h3 className="text-xl font-bold">卡片已生成</h3>
                        </div>
                        <p className="text-sm text-white/60">请长按或右键点击图片复制</p>
                    </div>
                    
                    <img 
                        src={previewUrl} 
                        alt="Long press or Right Click to Copy" 
                        className="w-full rounded-3xl shadow-2xl border border-white/10 select-none touch-auto" 
                        onClick={e => e.stopPropagation()} 
                        style={{ WebkitTouchCallout: 'default' }} 
                    />
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }} 
                            className="flex-1 bg-white text-black py-3.5 rounded-full font-bold text-sm hover:brightness-90 transition-all active:scale-95"
                        >
                            返回
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onClose(); }} 
                            className="flex-1 bg-white/10 text-white py-3.5 rounded-full font-bold text-sm border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={onClose}>
            <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 w-full max-w-[300px]">
                <div ref={cardRef} className="w-full relative overflow-hidden bg-white rounded-3xl shadow-2xl antialiased" onClick={e => e.stopPropagation()}>
                    <div className="h-1.5 w-full" style={{ backgroundColor: themeColor }}></div>
                    <div className="p-5 pb-2 relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-black italic tracking-tighter text-black leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    DHCX<span style={{ color: themeColor }}>.ME</span>
                                </h1>
                                <p className="text-[8px] font-mono text-gray-400 tracking-[0.2em] mt-1">LOGISTICS SERVICE</p>
                            </div>
                            <div className="bg-black text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                                <ShieldCheck size={9} className="opacity-70" />
                                <span className="text-[9px] font-bold tracking-wider">内部查询通道</span>
                            </div>
                        </div>
                        <div className="border-t-2 border-black mb-5"></div>
                        <div className="space-y-5">
                            <div className="flex justify-between items-baseline">
                                <div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">RECEIVER / 收件人</div>
                                    <div className="text-sm font-bold text-black">{data.info?.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">COURIER / 快递</div>
                                    <div className="text-sm font-black text-black font-mono">{data.info?.courier}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">ITEM / 商品</div>
                                <div className="text-xs font-bold text-black break-words leading-relaxed border-l-2 pl-2" style={{ borderColor: themeColor }}>
                                    {data.info?.product}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">TRACKING NO. / 单号</div>
                                <div className="font-mono text-lg font-black text-black tracking-tight break-all leading-none">
                                    {data.info?.trackingNumber}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-full h-5 flex items-center justify-center mt-2">
                        <div className="absolute left-[-6px] w-3 h-3 rounded-full bg-[#111] z-10"></div> 
                        <div className="absolute right-[-6px] w-3 h-3 rounded-full bg-[#111] z-10"></div>
                        <div className="w-full border-t border-dashed border-gray-300 mx-4"></div>
                    </div>
                    <div className="p-5 pt-1 bg-white flex flex-col items-center">
                        <div className="flex gap-3 items-center w-full">
                            <div className="w-16 h-16 bg-white p-1 rounded-lg border border-black/5 shadow-sm shrink-0">
                                {data.loading ? (
                                    <div className="w-full h-full flex items-center justify-center"><RefreshCw size={20} className="animate-spin text-black/20"/></div>
                                ) : (
                                    <img src={data.url} alt="QR" className="w-full h-full object-contain mix-blend-multiply" crossOrigin="anonymous" />
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center h-16">
                                <div className="text-[10px] font-bold text-black mb-0.5">长按识别查看进度</div>
                                <div className="text-[9px] text-gray-400 leading-tight transform scale-95 origin-left">微信内长按图片识别二维码<br/>即可查看实时物流</div>
                                <div className="h-2 w-24 mt-1.5 opacity-20" style={{ backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGAEESAAEGAAGRgE+bRsBPwAAAAASUVORK5CYII=")`, backgroundRepeat: 'repeat' }}></div>
                            </div>
                        </div>
                        <div className="mt-4 text-[8px] font-mono text-gray-300 w-full text-center">
                            ISSUED BY DHCX SYSTEM · NO.{new Date().toISOString().slice(0,10).replace(/-/g,'')}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full" onClick={e => e.stopPropagation()}>
                    <button onClick={handleDownloadImage} disabled={isSaving || data.loading} className="flex-1 bg-white hover:bg-gray-100 text-black py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg">
                        {isSaving ? <RefreshCw size={16} className="animate-spin"/> : <ImageDown size={16}/>}
                        {isSaving ? "生成中..." : "生成卡片"}
                    </button>
                    <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all active:scale-95 backdrop-blur-md border border-white/10">
                        <X size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 数据服务层 ---
const DataService = {
    getOrCreateShortLink: async (queryText) => {
        if (!supabase) throw new Error("数据库未连接");
        const { data: existing, error: findError } = await supabase.from('short_urls').select('id').eq('original_query', queryText).limit(1);
        if (findError) throw new Error("短链服务暂不可用");
        if (existing && existing.length > 0) return existing[0].id;
        let attempts = 0;
        while (attempts < 3) {
            const code = generateShortCode(5);
            const { error: insertError } = await supabase.from('short_urls').insert([{ id: code, original_query: queryText }]);
            if (!insertError) return code;
            if (insertError.code === '23505') { attempts++; continue; } 
            else throw new Error("短链创建失败: " + insertError.message);
        }
        throw new Error("短链生成繁忙，请使用长链");
    },
    resolveShortLink: async (shortCode) => {
        if (!supabase) return null;
        const { data, error } = await supabase.from('short_urls').select('original_query').eq('id', shortCode).single();
        if (error || !data) return null;
        return data.original_query;
    },
    getOrders: async (page, pageSize, filters = {}) => {
        if (!supabase) throw new Error("数据库未连接");
        let query = supabase.from('orders').select('*', { count: 'exact' });
        if (filters.search) {
            const q = filters.search;
            query = query.or(`recipientName.ilike.%${q}%,phone.ilike.%${q}%,trackingNumber.ilike.%${q}%`);
        }
        query = query.order('timestamp', { ascending: false });
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return { data: data || [], total: count || 0 };
    },
    searchPublic: async (queryText) => {
        if (!supabase) throw new Error("系统初始化中，请刷新页面重试"); 
        if (!queryText) return [];
        const cleanQuery = queryText.trim().replace(/\s+/g, '');
        const isPhoneNumber = /^\d{11}$/.test(cleanQuery);
        let orConditions = [];
        orConditions.push(`trackingNumber.eq.${cleanQuery}`);
        if (isPhoneNumber) orConditions.push(`phone.eq.${cleanQuery}`);
        const { data, error } = await supabase.from('orders').select('*').or(orConditions.join(',')).order('timestamp', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    saveOrder: async (order) => {
        if (!supabase) throw new Error("数据库未连接");
        const orderData = { ...order, lastUpdated: Date.now() };
        if (!orderData.timestamp) orderData.timestamp = Date.now();
        const { data, error } = await supabase.from('orders').upsert(orderData).select().single();
        if (error) throw error;
        return data;
    },
    batchSaveOrders: async (orders) => {
        if (!supabase) throw new Error("数据库未连接");
        const { data, error } = await supabase.from('orders').upsert(orders);
        if (error) throw error;
        return data;
    },
    // --- 新增：检查数据库中是否已存在指定的单号集合 ---
    checkExistingOrders: async (ids) => {
        if (!supabase) throw new Error("数据库未连接");
        const existingIds = new Set();
        if (!ids || ids.length === 0) return existingIds;
        
        // Supabase / PostgREST 的 in 查询对 URL 长度有限制，为安全起见每 200 个分批查询
        const BATCH_SIZE = 200;
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const chunk = ids.slice(i, i + BATCH_SIZE);
            const { data, error } = await supabase.from('orders').select('id').in('id', chunk);
            if (error) throw error;
            if (data) {
                data.forEach(item => existingIds.add(item.id));
            }
        }
        return existingIds;
    },
    deleteOrders: async (ids) => {
        if (!supabase) throw new Error("数据库未连接");
        const { error } = await supabase.from('orders').delete().in('id', ids);
        if (error) throw error;
    },
    deleteAllOrders: async () => {
        if (!supabase) throw new Error("数据库未连接");
        const { error } = await supabase.from('orders').delete().gt('timestamp', 0);
        if (error) throw error;
    },
    removeDuplicates: async () => {
        if (!supabase) throw new Error("数据库未连接");
        const { data, error } = await supabase.from('orders').select('id, trackingNumber, timestamp').order('timestamp', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) return 0;
        const seenTrackingNumbers = new Set();
        const idsToDelete = [];
        data.forEach(item => {
            const tn = item.trackingNumber ? item.trackingNumber.trim() : null;
            if (!tn) return; 
            if (seenTrackingNumbers.has(tn)) idsToDelete.push(item.id);
            else seenTrackingNumbers.add(tn);
        });
        if (idsToDelete.length > 0) {
            const BATCH_SIZE = 100;
            for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
                const batch = idsToDelete.slice(i, i + BATCH_SIZE);
                const { error: delError } = await supabase.from('orders').delete().in('id', batch);
                if (delError) throw delError;
            }
        }
        return idsToDelete.length;
    },
    login: async (email, password) => {
        if (!supabase) throw new Error("数据库未连接");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    },
    logout: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    },
    queryLogisticsFromEdge: async (trackingNumber, courierCode, phone) => {
        if (!supabase) throw new Error("数据库未连接");
        if (!trackingNumber || trackingNumber.trim() === '') throw new Error("订单未关联快递单号");
        const mobileSuffix = phone ? String(phone).replace(/\D/g, '').slice(-4) : '';
        try {
            const { data, error } = await supabase.functions.invoke('query-logistics', {
                body: { no: trackingNumber, type: courierCode, mobile: mobileSuffix }
            });
            if (error) {
                let detailMsg = "服务暂时不可用";
                try {
                    if (error.context) {
                        const rawText = await error.context.text();
                        try { const body = JSON.parse(rawText); detailMsg = body.error || body.message || rawText; } catch (jsonErr) { detailMsg = rawText; }
                    } else { detailMsg = error.message; }
                } catch (e) { detailMsg = error.message || "未知网络错误"; }
                if (detailMsg.includes("400") || detailMsg.includes("Bad Request")) detailMsg = "快递单号不存在或格式有误";
                else if (detailMsg.includes("403") || detailMsg.includes("Forbidden")) detailMsg = "查询接口额度不足或已过期 (403)";
                throw new Error(detailMsg);
            }
            return data;
        } catch (err) { console.error("调用过程异常:", err); throw err; }
    },
    getSiteConfig: async () => {
        if (!supabase) return null;
        const { data, error } = await supabase.from('site_config').select('settings').eq('id', 1).single();
        if (error || !data) return null;
        return data.settings;
    },
    saveSiteConfig: async (settings) => {
        if (!supabase) throw new Error("数据库未连接");
        const { error } = await supabase.from('site_config').upsert({ id: 1, settings });
        if (error) throw error;
    }
};

const DEFAULT_SITE_NAME = "DHCX.ME";
const DEFAULT_SITE_TITLE = "内部单号自助查询系统";
const DEFAULT_FOOTER_MSG = "安全加密传输通道";
const DEFAULT_THEME_COLOR = "#CCFF00";

const DEFAULT_TEMPLATES = {
    'WAIT_ACCEPT': "亲爱的 {name}，您的「{product}」已打包好啦📦\n快递：{courier}\n单号：{no}\n状态：等待快递小哥揽收中，请耐心等待更新~\n自助查询：{link}",
    'DELIVERING': "亲爱的 {name}，好消息！您的「{product}」正在派送中🚚\n快递：{courier}\n单号：{no}\n请保持电话畅通，留意接听电话哦~\n自助查询：{link}",
    'SIGN': "亲爱的 {name}，您的「{product}」已经签收啦✅\n快递：{courier}\n单号：{no}\n感谢您的信任与支持，期待下次光临！\n自助查询：{link}",
    'ABNORMAL': "亲爱的 {name}，您的「{product}」物流状态稍有异常⚠️\n快递：{courier}\n单号：{no}\n当前状态：{status}\n我们正在为您核实处理，请放心！\n自助查询：{link}",
    'TRANSPORT': "亲爱的 {name}，您的「{product}」正在运输途中🚚\n快递：{courier}\n单号：{no}\n最新动态：{status}\n宝贝正在奔向您的怀抱，请留意查收~\n自助查询：{link}"
};

const DEFAULT_SETTINGS = {
    useMock: false, 
    showRecipient: true, 
    showProduct: true,
    announcement: "1. 输入姓名或手机号即可查询单号以及转运信息\n2. 正常情况下单号每日凌晨4点左右上传至本系统 一般第二天早晨7点左右会有转运信息！ 如没有转运信息代表还未发货！影响发货效率不可控因素有很多 比如 市场严查，工厂码数配错，小瑕疵等！则会顺延至第二天凌晨！具体请联系客服咨询！ \n3. 此系统仅支持申通快递查询，如需发其他快递，客服会私聊您单号！", 
    siteName: DEFAULT_SITE_NAME, 
    siteTitle: DEFAULT_SITE_TITLE, 
    footerMsg: DEFAULT_FOOTER_MSG, 
    logoUrl: "https://user.yichadan.com/static/img/logo/299042_1763737465.jpg", 
    themeColor: DEFAULT_THEME_COLOR,
};

const THEME_PRESETS = [{ color: '#CCFF00', name: '酸性绿' }, { color: '#FF00FF', name: '霓虹粉' }, { color: '#00FFFF', name: '赛博蓝' }, { color: '#FF3300', name: '熔岩红' }, { color: '#9D00FF', name: '电子紫' }, { color: '#FFFFFF', name: '极简白' }];
const COURIER_CODE_MAP = { '顺丰速运': 'SFEX', '顺丰': 'SFEX', '京东物流': 'JD', '京东': 'JD', '圆通速递': 'YTO', '圆通': 'YTO', '中通快递': 'ZTO', '中通': 'ZTO', '申通快递': 'STO', '申通': 'STO', '韵达快递': 'YD', '韵达': 'YD', '极兔速递': 'JTS', '极兔': 'JTS', 'EMS': 'EMS', '邮政包裹': 'PS', '邮政': 'PS', '德邦快递': 'DEPPON', '德邦': 'DEPPON', '通用快递': '' };
const STATUS_MAP = { "WAIT_ACCEPT": "待揽收", "ACCEPT": "已揽收", "TRANSPORT": "运输中", "DELIVERING": "派件中", "AGENT_SIGN": "已代签收", "SIGN": "已签收", "FAILED": "包裹异常", "RECEIVE": "接单中", "SEND_ON": "转单/转寄", "ARRIVE_CITY": "到达城市", "STA_INBOUND": "已入柜/站", "STA_SIGN": "从柜/站取出", "RETURN_SIGN": "退回签收", "REFUSE_SIGN": "拒收", "DELIVER_ABNORMAL": "派件异常", "RETENTION": "滞留件", "ISSUE": "问题件", "RETURN": "退回件", "DAMAGE": "破损", "CANCEL_ORDER": "揽件取消" };

const IllusPlane=({className})=>(<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 50 L40 50 L55 20 L65 50 L90 50 L70 70 L80 90 L50 75 L20 90 L30 70 Z"/><path d="M55 20 L50 75" opacity="0.5"/><path d="M10 50 L50 75 L90 50" opacity="0.5"/><path d="M50 90 L50 50"/><path d="M30 40 L70 20" opacity="0.5" strokeDasharray="5 5"/></svg>);
const IllusTruck=({className})=>(<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="10" y="30" width="50" height="40" rx="5"/><path d="M60 30 L80 30 L90 50 L90 70 L60 70 Z"/><circle cx="25" cy="70" r="10"/><circle cx="75" cy="70" r="10"/><path d="M10 45 L60 45" opacity="0.5"/><path d="M5 30 L-5 30 M5 40 L-5 40 M5 50 L-5 50" strokeWidth="3" opacity="0.6"/></svg>);
const IllusPackage=({className})=>(<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z"/><path d="M10 30 L50 50 L90 30"/><path d="M50 90 L50 50"/><path d="M30 40 L70 20" opacity="0.5" strokeDasharray="5 5"/></svg>);
const IllusCheck=({className})=>(<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="20" y="20" width="60" height="60" rx="10"/><path d="M20 40 L80 40" opacity="0.5"/><path d="M20 60 L80 60" opacity="0.5"/><path d="M35 50 L45 60 L65 40" strokeWidth="6" stroke="#fff"/><circle cx="85" cy="15" r="10" fill="currentColor" stroke="none" opacity="0.8"/><path d="M80 15 L83 18 L89 12" stroke="#000" strokeWidth="2"/></svg>);
const IllusAlert=({className})=>(<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M50 10 L90 85 L10 85 Z"/><path d="M50 35 L50 60" strokeWidth="4"/><circle cx="50" cy="72" r="3" fill="currentColor"/><path d="M80 20 L90 10 M75 30 L85 20" strokeWidth="3" opacity="0.6"/></svg>);

const STATUS_STYLES = {
    '已签收': { color: 'text-[#CCFF00]', bg: 'bg-[#CCFF00]/10', border: 'border-[#CCFF00]/30', icon: CheckCircle, label: '已签收', glow: 'shadow-[0_0_15px_rgba(204,255,0,0.3)]', illustration: IllusCheck },
    '派件中': { color: 'text-[#00FFFF]', bg: 'bg-[#00FFFF]/10', border: 'border-[#00FFFF]/30', icon: Truck, label: '派件中', glow: 'shadow-[0_0_15px_rgba(0,255,255,0.3)]', illustration: IllusTruck },
    '中转中': { color: 'text-[#BD00FF]', bg: 'bg-[#BD00FF]/10', border: 'border-[#BD00FF]/30', icon: Activity, label: '中转中', glow: 'shadow-[0_0_15px_rgba(189,0,255,0.3)]', illustration: IllusPlane },
    '待揽收': { color: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-700', icon: Package, label: '待揽收', glow: '', illustration: IllusPackage },
    '异常件': { color: 'text-[#FF0055]', bg: 'bg-[#FF0055]/10', border: 'border-[#FF0055]/30', icon: AlertTriangle, label: '异常件', glow: 'shadow-[0_0_15px_rgba(255,0,85,0.3)]', illustration: IllusAlert },
};

const Typewriter = ({ text }) => {
    const [currentText, setCurrentText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    useEffect(() => {
        if (!text) return;
        const CACHE_KEY = 'dhcx_announcement_read_state';
        const hasSeen = localStorage.getItem(CACHE_KEY);
        if (hasSeen) { setCurrentText(text); setIsTyping(false); return; }
        let i = 0; setCurrentText(''); setIsTyping(true);
        const timer = setInterval(() => { if (i < text.length) { setCurrentText(prev => prev + text.charAt(i)); i++; } else { clearInterval(timer); localStorage.setItem(CACHE_KEY, 'true'); setIsTyping(false); } }, 30);
        return () => clearInterval(timer);
    }, [text]);
    return <span>{currentText}{isTyping && <span className="animate-pulse">|</span>}</span>;
};

const ClickEffects = ({ themeColor }) => {
    const [clicks, setClicks] = useState([]);
    useEffect(() => {
        const handleClick = (e) => {
            const newClick = { id: Date.now(), x: e.clientX, y: e.clientY };
            setClicks(prev => [...prev, newClick]);
            setTimeout(() => { setClicks(prev => prev.filter(c => c.id !== newClick.id)); }, 600);
        };
        window.addEventListener('click', handleClick); return () => window.removeEventListener('click', handleClick);
    }, []);
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {clicks.map(click => (<div key={click.id} className="absolute w-4 h-4 rounded-full animate-ping-fast" style={{ left: click.x - 8, top: click.y - 8, backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}, 0 0 20px ${themeColor}` }} />))}
            {clicks.map(click => (<React.Fragment key={`burst-${click.id}`}>{ [...Array(6)].map((_, i) => (<div key={i} className="absolute w-1 h-1 rounded-full animate-particle-burst" style={{ left: click.x, top: click.y, backgroundColor: '#fff', '--tx': `${Math.cos(i * 60 * Math.PI / 180) * 40}px`, '--ty': `${Math.sin(i * 60 * Math.PI / 180) * 40}px` }} />))}</React.Fragment>))}
        </div>
    );
};

const TiltCard = ({ children, className = "", style = {} }) => {
    const ref = useRef(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });
    const handleMouseMove = (e) => {
        if (!ref.current || window.matchMedia("(max-width: 768px)").matches) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        setRotate({ x: ((y - rect.height / 2) / (rect.height / 2)) * -5, y: ((x - rect.width / 2) / (rect.width / 2)) * 5 });
    };
    return (<div ref={ref} className={`transition-transform duration-200 ease-out transform-gpu ${className}`} onMouseMove={handleMouseMove} onMouseLeave={() => setRotate({ x: 0, y: 0 })} style={{ transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`, ...style }}>{children}</div>);
};

const NoiseOverlay = () => (<div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>);

const AcidBackground = ({ themeColor, mode = 'default', lowPowerMode = false }) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    useEffect(() => {
        if (lowPowerMode) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resizeCanvas); resizeCanvas();
        const handleMouseMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
        const handleTouchMove = (e) => { if(e.touches.length > 0) { mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('touchmove', handleTouchMove);
        const matrixFontSize = 14; const matrixColumns = Math.floor(canvas.width / matrixFontSize);
        const matrixDrops = []; for (let i = 0; i < matrixColumns; i++) matrixDrops[i] = Math.floor(Math.random() * (canvas.height / matrixFontSize));
        const matrixChars = "0123456789ABCDEFアァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
        let particleCount = 100;
        if (mode === 'party') particleCount = 150; if (mode === 'galaxy') particleCount = 300; if (mode === 'rain') particleCount = 200;
        if (particlesRef.current.length === 0 || particlesRef.current.length !== particleCount) {
             particlesRef.current = Array.from({ length: particleCount }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, size: Math.random() * 2 + 1, hue: Math.random() * 360, angle: Math.random() * Math.PI * 2, radius: Math.random() * Math.max(canvas.width, canvas.height) * 0.4, orbitSpeed: (Math.random() * 0.005) + 0.001, rainLen: Math.random() * 20 + 10, rainSpeed: Math.random() * 15 + 10 }));
        }
        const animate = () => {
            if (mode === 'matrix' || mode === 'fire' || mode === 'rain') { const alpha = mode === 'matrix' ? 0.05 : 0.1; ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fillRect(0, 0, canvas.width, canvas.height); } else { ctx.clearRect(0, 0, canvas.width, canvas.height); }
            if (mode === 'matrix') { ctx.fillStyle = '#0F0'; ctx.font = `${matrixFontSize}px monospace`; for (let i = 0; i < matrixDrops.length; i++) { const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length)); ctx.fillText(text, i * matrixFontSize, matrixDrops[i] * matrixFontSize); if (matrixDrops[i] * matrixFontSize > canvas.height && Math.random() > 0.975) matrixDrops[i] = 0; matrixDrops[i]++; } } else {
                const centerX = canvas.width / 2; const centerY = canvas.height / 2;
                particlesRef.current.forEach(p => {
                    if (mode === 'snow') { p.x += Math.sin(p.y * 0.01) * 0.5 + (Math.random() - 0.5); p.y += Math.abs(p.vy) + 0.5; if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; } } 
                    else if (mode === 'fire') { p.y -= Math.abs(p.vy) + 1; p.x += Math.sin(p.y * 0.05); if (p.y < 0) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; } } 
                    else if (mode === 'party') { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1; const dx = mouseRef.current.x - p.x; const dy = mouseRef.current.y - p.y; if (Math.sqrt(dx*dx + dy*dy) < 150) { const angle = Math.atan2(dy, dx); p.vx -= Math.cos(angle) * 0.5; p.vy -= Math.sin(angle) * 0.5; } } 
                    else if (mode === 'galaxy') { p.angle += p.orbitSpeed; p.x = centerX + Math.cos(p.angle) * p.radius; p.y = centerY + Math.sin(p.angle) * p.radius; const mx = (mouseRef.current.x - centerX) * 0.05; const my = (mouseRef.current.y - centerY) * 0.05; p.x += mx; p.y += my; } 
                    else if (mode === 'rain') { p.y += p.rainSpeed; if (p.y > canvas.height) { p.y = -p.rainLen; p.x = Math.random() * canvas.width; } } 
                    else { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1; const dx = mouseRef.current.x - p.x; const dy = mouseRef.current.y - p.y; if (Math.sqrt(dx*dx + dy*dy) < 100) { const angle = Math.atan2(dy, dx); p.vx -= Math.cos(angle) * 0.5; p.vy -= Math.sin(angle) * 0.5; } const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy); if (speed > 4) { p.vx *= 0.9; p.vy *= 0.9; } if (speed < 0.5) { p.vx *= 1.05; p.vy *= 1.05; } }
                    if (mode === 'snow') { ctx.font = `${p.size * 6}px serif`; ctx.fillStyle = `rgba(255, 255, 255, 0.8)`; ctx.shadowBlur = 5; ctx.shadowColor = 'white'; ctx.fillText('❄', p.x, p.y); } 
                    else if (mode === 'rain') { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.rainLen); ctx.strokeStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.2})`; ctx.lineWidth = 1.5; ctx.shadowBlur = 5; ctx.shadowColor = 'cyan'; ctx.stroke(); } 
                    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); if (mode === 'fire') { const life = p.y / canvas.height; ctx.fillStyle = `rgba(255, ${Math.floor(life * 255)}, 0, ${life})`; ctx.shadowBlur = 10; ctx.shadowColor = 'orange'; } else if (mode === 'party') { p.hue = (p.hue + 1) % 360; ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, 0.8)`; ctx.shadowBlur = 5; ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, 0.8)`; } else if (mode === 'galaxy') { const dist = Math.sqrt((p.x-centerX)**2 + (p.y-centerY)**2); const alpha = 1 - Math.min(dist / (Math.max(canvas.width,canvas.height)*0.5), 1); ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`; ctx.shadowBlur = 2; ctx.shadowColor = 'white'; } else { ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.shadowBlur = 5; ctx.shadowColor = themeColor; } ctx.fill(); }
                });
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => { window.removeEventListener('resize', resizeCanvas); window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('touchmove', handleTouchMove); cancelAnimationFrame(animationFrameId); };
    }, [themeColor, mode, lowPowerMode]);

    return (
        <div className="fixed inset-0 z-0 bg-black overflow-hidden">
            {(mode !== 'matrix' && mode !== 'fire' && mode !== 'party' && mode !== 'rain') && (
                <>
                    {!lowPowerMode && (
                        <>
                            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-[0.04] animate-blob" style={{ backgroundColor: themeColor }}></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-[0.02] animate-blob animation-delay-2000" style={{ backgroundColor: '#4F46E5' }}></div>
                        </>
                    )}
                    <div className="absolute inset-0 bg-grid-white/[0.015] bg-[length:30px_30px]"></div>
                </>
            )}
            {!lowPowerMode && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />}
             {lowPowerMode && <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black opacity-80"></div>}
        </div>
    );
};

const getSimplifiedStatus = (apiStatus) => {
    if (!apiStatus) return '待揽收';
    const s = String(apiStatus).toUpperCase();
    if (s.includes('待揽收') || s.includes('WAIT_ACCEPT') || s.includes('暂无轨迹') || s.includes('稍后再试') || s.includes('暂无详细轨迹') || s.includes('未找到')) return '待揽收';
    if (s.includes('SIGN') || s.includes('签收') || s.includes('取件')) return '已签收';
    if (s.includes('FAIL') || s.includes('ISSUE') || s.includes('REFUSE') || s.includes('异常') || s.includes('拒收')) return '异常件';
    if (s.includes('DELIVER') || s.includes('派件') || s.includes('派送')) return '派件中';
    return '中转中';
};

const formatDate = (timestamp) => {
  if (!timestamp) return ''; const date = new Date(timestamp); if (isNaN(date.getTime())) return String(timestamp);
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const formatLogisticsTime = (val) => {
    if (!val) return '';
    if (typeof val === 'number' || (typeof val === 'string' && /^\d{10,13}$/.test(val))) { const timestamp = String(val).length === 10 ? Number(val) * 1000 : Number(val); const date = new Date(timestamp); if (!isNaN(date.getTime())) { return `${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`; } }
    return String(val);
};

const parseLogisticsDate = (val) => { if (!val) return new Date(0); const formatted = formatLogisticsTime(val); let parseStr = formatted.replace(/-/g, '/'); if (!/^\d{4}/.test(parseStr)) parseStr = `${new Date().getFullYear()}/${parseStr}`; const date = new Date(parseStr); return isNaN(date.getTime()) ? new Date(0) : date; };
const translateStatus = (code) => STATUS_MAP[code] || code;

const autoDetectCourier = (number) => { 
    if (!number) return '通用快递'; 
    const n = String(number).toUpperCase(); 
    if (n.startsWith('SF')) return '顺丰速运'; 
    if (n.startsWith('JD')) return '京东物流'; 
    if (n.startsWith('YT') || n.startsWith('8')) return '圆通速递'; 
    if (n.startsWith('STO') || n.startsWith('77')) return '申通快递'; 
    if (n.startsWith('ZTO') || n.startsWith('7') || n.startsWith('6')) return '中通快递'; 
    if (n.startsWith('YD') || n.startsWith('3') || n.startsWith('4')) return '韵达速递'; 
    if (n.startsWith('JTS')) return '极兔速递'; 
    if (n.startsWith('EMS') || n.startsWith('E')) return 'EMS'; 
    return '通用快递'; 
};

const getMockLogisticsData = (number, courier, errorMsg = "API 失败，已切换为演示数据") => { const now = new Date(); const oneDay = 24 * 60 * 60 * 1000; return [ { time: now.getTime(), status: `【系统提示】${errorMsg}。已自动切换为演示数据。` }, { time: now.getTime() - 1000 * 60 * 30, status: "【运输中】快件已到达 目的地转运中心" }, { time: now.getTime() - oneDay, status: "【运输中】快件已发往 目的地转运中心" }, ]; };
const STORAGE_KEY = 'sneaker.dh.cx_search_log';
const getSearchHistory = () => { try { const log = localStorage.getItem(STORAGE_KEY); return log ? log.split(',').filter(item => item.trim() !== '') : []; } catch (e) { return []; } };
const addSearchHistory = (query) => { if (!query) return; try { let log = getSearchHistory(); log = log.filter(item => item !== query); log.unshift(query); log = log.slice(10); localStorage.setItem(STORAGE_KEY, log.join(',')); } catch (e) {} };
const clearSearchHistory = () => { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} };

const LogisticsTimeline = ({ order, logisticsDataCache, themeColor }) => {
    const state = logisticsDataCache[order.id] || { loading: true, data: null, error: null };
    if (state.loading) { return ( <div className="mt-4 rounded-lg border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden relative min-h-[150px] flex items-center justify-center"> <div className="text-center p-6"> <RefreshCw size={24} className="text-white/50 animate-spin mx-auto mb-3" style={{ color: themeColor }} /> <p className="text-xs font-mono text-white/50 uppercase tracking-widest"> 正在加载物流轨迹... </p> </div> </div> ); }
    if (state.error || !state.data || !Array.isArray(state.data) || state.data.length === 0) {
        const isAppCodeError = typeof state.error === 'string' && (state.error.includes("AppCode") || state.error.includes("未配置")); const displayError = isAppCodeError ? "暂无轨迹信息" : (typeof state.error === 'string' ? state.error : '暂无轨迹');
        return ( <div className="p-8 text-center text-white/50"> <div className="bg-white/5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/10"><AlertCircle className="text-white/30" size={24} /></div> <p className="text-sm font-medium mb-4 font-mono tracking-wide">{displayError}</p> <button onClick={() => window.open(`https://www.baidu.com/s?wd=${order.trackingNumber}`, '_blank')} className="px-4 py-2 rounded-lg border border-white/20 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-all">百度搜索查询</button> </div> );
    }
    const validData = state.data.filter(item => item && (item.time || item.ftime)); const sortedData = [...validData].sort((a, b) => parseLogisticsDate(b.time || b.ftime) - parseLogisticsDate(a.time || a.ftime)); if (sortedData.length === 0) return null; const latestItem = sortedData[0]; const splitTime = (str) => { const formatted = formatLogisticsTime(str); const parts = formatted.split(' '); return { datePart: parts[0] || formatted, timePart: parts[1] || '' }; };
    return ( <div className="overflow-hidden mt-4 rounded-lg border border-white/10 bg-black/20 backdrop-blur-xl"> <div className="relative p-5 border-b border-white/10 overflow-hidden group"> <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div> <div className="relative z-10 flex items-start gap-4"> <div className="mt-1"> <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: themeColor, color: themeColor }}></div> <div className="w-px h-full bg-gradient-to-b from-white/20 to-transparent mx-auto mt-1"></div> </div> <div className="flex-1"> <div className="flex items-baseline gap-2 mb-1"> <span className="text-xs font-bold px-1.5 py-0.5 rounded-sm text-black" style={{ backgroundColor: themeColor }}>最新</span> <span className="text-xs font-mono text-white/60">{splitTime(latestItem.time || latestItem.ftime).datePart} {splitTime(latestItem.time || latestItem.ftime).timePart}</span> </div> <p className="text-sm font-medium text-white/90 leading-relaxed">{translateStatus(latestItem.status || latestItem.context || latestItem.desc)}</p> </div> </div> </div> <div className="p-5 pt-2 relative"> {sortedData.map((item, index) => { if (index === 0) return null; const { datePart, timePart } = splitTime(item.time || item.ftime); return ( <div key={index} className="flex gap-4 mb-6 last:mb-0 relative group"> <div className="absolute left-[5px] top-[-20px] bottom-0 w-px bg-white/10 -z-10 group-last:h-4"></div> <div className="mt-1.5 flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-white/20 ring-4 ring-black group-hover:bg-white/50 transition-colors"></div></div> <div className="flex-1 opacity-60 group-hover:opacity-90 transition-opacity"> <div className="text-[10px] font-mono text-white/40 mb-0.5">{datePart} {timePart}</div> <div className="text-xs text-white/80 leading-relaxed">{translateStatus(item.status || item.context || item.desc)}</div> </div> </div> ); })} </div> </div> );
};

const Toast = ({ message, type }) => ( <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[10000] px-6 py-3 rounded-full backdrop-blur-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${type === 'error' ? 'bg-red-900/80 border-red-500/50 text-white' : 'bg-black/80 border-white/20 text-white'}`}> {type === 'error' ? <AlertTriangle size={18} className="text-red-500"/> : <CheckCircle size={18} className="text-[#CCFF00]"/>} <span className="text-sm font-medium tracking-wide">{String(message)}</span> </div> );

export default function App() {
    const [orders, setOrders] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [currentView, setCurrentView] = useState('search');
    const [adminViewMode, setAdminViewMode] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null); 
    const [hasSearched, setHasSearched] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [logisticsDataCache, setLogisticsDataCache] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState(() => new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalOrdersCount, setTotalOrdersCount] = useState(0); 
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTime, setFilterTime] = useState('all');
    const [toast, setToast] = useState(null);
    const [viewingLogisticsOrder, setViewingLogisticsOrder] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null); 
    const [showImportModal, setShowImportModal] = useState(false);
    const [qrCodeModal, setQrCodeModal] = useState({ show: false, url: '', title: '', info: null, loading: false });
    const [importText, setImportText] = useState(''); 
    const [adminUsername, setAdminUsername] = useState(''); 
    const [adminPassword, setAdminPassword] = useState('');
    const [isNameMasked, setIsNameMasked] = useState(true); 
    const [isAdminMasked, setIsAdminMasked] = useState(true);
    const [easterEggMode, setEasterEggMode] = useState(null); 
    const [secretClickCount, setSecretClickCount] = useState(0);
    const clickTimeoutRef = useRef(null);
    const [adminSearchQuery, setAdminSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false); 
    const [isImporting, setIsImporting] = useState(false);
    const [isDeduplicating, setIsDeduplicating] = useState(false);
    const [lowPowerMode, setLowPowerMode] = useState(() => { try { return localStorage.getItem('dhcx_low_power_mode') === 'true'; } catch (e) { return false; } });
    const [apiSettings, setApiSettings] = useState(DEFAULT_SETTINGS);
    const [newOrder, setNewOrder] = useState({ recipientName: '', phone: '', product: '', trackingNumber: '', courier: '顺丰速运', note: '' });
    const [securityCodeInput, setSecurityCodeInput] = useState('');
    const statusClickRef = useRef({ count: 0, lastTime: 0 });

    const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
    const toggleLowPowerMode = () => { const nextState = !lowPowerMode; setLowPowerMode(nextState); localStorage.setItem('dhcx_low_power_mode', String(nextState)); showToast(nextState ? "已开启低电量模式 (关闭特效)" : "已开启高画质特效", "success"); };

    useEffect(() => {
        const initialize = async () => {
            const sb = await initSupabase();
            if (sb) {
                const remoteSettings = await DataService.getSiteConfig();
                if (remoteSettings && Object.keys(remoteSettings).length > 0) setApiSettings(prev => ({ ...prev, ...remoteSettings }));
                else { try { const storedSettings = localStorage.getItem(LOCAL_SETTINGS_KEY); if (storedSettings) { const loadedSettings = JSON.parse(storedSettings); setApiSettings(prev => ({ ...prev, ...loadedSettings })); } } catch (e) { console.error(e); } }
                const { data: { session } } = await sb.auth.getSession();
                setIsAdmin(!!session);
                if (session) fetchAdminOrders();
                sb.auth.onAuthStateChange((_event, session) => { setIsAdmin(!!session); if (session) { setCurrentView('admin'); fetchAdminOrders(); } else { setCurrentView('search'); } });
                const params = new URLSearchParams(window.location.search);
                let shortCode = params.get('s');
                const q = params.get('q');
                if (!shortCode && !q) { const pathSegment = window.location.pathname.slice(1); if (pathSegment && /^[a-zA-Z0-9]+$/.test(pathSegment)) shortCode = pathSegment; }
                if (!shortCode && !q) { const hash = window.location.hash; if (hash && hash.length > 1) { const code = hash.replace(/^#\/?/, ''); if (code && /^[a-zA-Z0-9]+$/.test(code)) shortCode = code; } }
                if (shortCode) { DataService.resolveShortLink(shortCode).then(originalQuery => { if (originalQuery) { setSearchQuery(originalQuery); handleSearch(null, originalQuery); } else { showToast("短链已失效或不存在", "error"); } }); } else if (q) { const decodedQuery = decodeToken(q); if (decodedQuery) { setSearchQuery(decodedQuery); handleSearch(null, decodedQuery); } }
            }
            setLoading(false);
        };
        initialize();
    }, []);

    const fetchAdminOrders = useCallback(async () => {
        setLoading(true);
        try { const { data, total } = await DataService.getOrders(currentPage, itemsPerPage, { search: adminSearchQuery, status: filterStatus, time: filterTime }); setOrders(data || []); setTotalOrdersCount(total || 0); } catch (e) { console.error(e); showToast("加载失败: " + String(e.message), "error"); } finally { setLoading(false); }
    }, [currentPage, itemsPerPage, adminSearchQuery, filterStatus, filterTime]);

    useEffect(() => { if (currentView === 'admin' && adminViewMode === 'list') fetchAdminOrders(); }, [fetchAdminOrders, currentView, adminViewMode]);

    const handleStatusMultiClick = (e, order) => { e.stopPropagation(); const now = Date.now(); const record = statusClickRef.current; if (now - record.lastTime > 500) record.count = 1; else record.count += 1; record.lastTime = now; if (record.count >= 5) { handleQuickCopyReply(order); record.count = 0; } };
    const handleClearAllClick = () => { setSecurityCodeInput(''); setConfirmModal({ type: 'clear_all' }); };
    
    const handleDeduplicate = async () => {
        if (!isAdmin) return;
        if (!window.confirm("⚠️ 确定要执行去重操作吗？\n\n系统将检查所有订单，对于重复的运单号，仅保留【最后一次上传/更新】的记录，删除旧记录。\n\n此操作不可恢复！")) return;
        setIsDeduplicating(true);
        try { const count = await DataService.removeDuplicates(); if (count > 0) { showToast(`去重成功！已清理 ${count} 条重复数据`, "success"); fetchAdminOrders(); } else { showToast("未发现重复运单", "success"); } } catch (e) { showToast("去重失败: " + String(e.message), "error"); } finally { setIsDeduplicating(false); }
    };

    const executeDelete = async () => { 
        if (!confirmModal) return; 
        try {
            if (confirmModal.type === 'clear_all') { if (securityCodeInput !== 'wT357212') { showToast("安全码错误，操作拒绝！", "error"); return; } await DataService.deleteAllOrders(); setOrders([]); setTotalOrdersCount(0); showToast("验证通过，所有订单已清空"); } else { let ordersToDelete = []; if (confirmModal.type === 'batch') { ordersToDelete = Array.from(selectedOrders); } else if (confirmModal.id) { ordersToDelete = [confirmModal.id]; } await DataService.deleteOrders(ordersToDelete); setSelectedOrders(new Set()); showToast("删除成功"); fetchAdminOrders(); } setConfirmModal(null); 
        } catch (e) { showToast("操作失败: " + String(e.message), "error"); }
    };

    const statusCounts = useMemo(() => { const counts = { total: totalOrdersCount || orders.length, '已签收': 0, '派件中': 0, '中转中': 0, '待揽收': 0, '异常件': 0 }; if (orders && Array.isArray(orders)) { orders.forEach(order => { const simplifiedStatus = getSimplifiedStatus(order.lastApiStatus); if (counts[simplifiedStatus] !== undefined) { counts[simplifiedStatus] += 1; } else { counts['中转中'] += 1; } }); } return counts; }, [orders, totalOrdersCount]);
    const totalPages = Math.ceil((totalOrdersCount || orders.length) / itemsPerPage);

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;800&display=swap');
            @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } } .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; } .animation-delay-4000 { animation-delay: 4s; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; } @keyframes pulse { 0% { opacity: 0.5; transform: scale(1); } 100% { opacity: 1; transform: scale(1.5); } } @keyframes driftX { 0% { transform: translateX(0); } 100% { transform: translateX(50px); } } @keyframes driftY { 0% { transform: translateY(0); } 100% { transform: translateY(50px); } } @keyframes ping-fast { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(3); opacity: 0; } } .animate-ping-fast { animation: ping-fast 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; } @keyframes particle-burst { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } } .animate-particle-burst { animation: particle-burst 0.5s ease-out forwards; } .safe-bottom { padding-bottom: env(safe-area-inset-bottom); } .pb-safe { padding-bottom: env(safe-area-inset-bottom); } .safe-top { padding-top: env(safe-area-inset-top); } @keyframes gradient-x { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }`;
        document.head.appendChild(style); return () => { document.head.removeChild(style); };
    }, []);

    useEffect(() => { if (apiSettings.siteTitle) document.title = apiSettings.siteTitle; }, [apiSettings.siteTitle]);
    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();
        if (query === 'matrix') setEasterEggMode('matrix'); else if (query === 'snow') setEasterEggMode('snow'); else if (query === 'fire') setEasterEggMode('fire'); else if (query === 'party') setEasterEggMode('party'); else if (query === 'galaxy') setEasterEggMode('galaxy'); else if (query === 'rain') setEasterEggMode('rain'); else setEasterEggMode(null); 
    }, [searchQuery]);
    const activeBackgroundMode = useMemo(() => { if (easterEggMode) return easterEggMode; return 'default'; }, [easterEggMode]);

    const [visitStats, setVisitStats] = useState({ pv: 0, uv: 0 });
    useEffect(() => { if (currentView !== 'search') return; const today = new Date().toISOString().slice(0, 10); const statsKey = `dhcx_stats_${today}`; let stats = JSON.parse(localStorage.getItem(statsKey) || '{"pv":0, "ips":[]}'); const sessionId = sessionStorage.getItem('dhcx_session_id') || crypto.randomUUID(); sessionStorage.setItem('dhcx_session_id', sessionId); stats.pv += 1; if (!stats.ips.includes(sessionId)) stats.ips.push(sessionId); localStorage.setItem(statsKey, JSON.stringify(stats)); setVisitStats({ pv: stats.pv, uv: stats.ips.length }); }, [currentView]);

    const saveApiSettings = async () => { if (!isAdmin) { showToast("无权限保存", "error"); return; } setIsSaving(true); try { await DataService.saveSiteConfig(apiSettings); localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(apiSettings)); showToast("配置已同步至全站！"); setTimeout(() => { setCurrentView('search'); }, 1000); } catch (e) { showToast("保存失败: " + String(e.message), "error"); } finally { setIsSaving(false); } };
    
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast("请上传图片文件", "error"); return; }
        const reader = new FileReader();
        reader.onload = (event) => { const base64Image = event.target.result; setApiSettings(p => ({...p, logoUrl: base64Image})); showToast("本地图片已上传 (保存后生效)", "success"); e.target.value = ''; };
        reader.onerror = () => { showToast("读取文件失败", "error"); };
        reader.readAsDataURL(file);
    };

    const handleImportFileChange = async (e) => { const file = e.target.files[0]; if (!file) return; if (file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')) { showToast("正在加载 Excel 解析引擎...", "success"); try { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX'); const reader = new FileReader(); reader.onload = (event) => { const data = new Uint8Array(event.target.result); const workbook = window.XLSX.read(data, { type: 'array', cellDates: true }); const text = window.XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]], { FS: " " }); setImportText(text); showToast(`Excel 解析成功！${text.split('\n').length} 行`, "success"); }; reader.readAsArrayBuffer(file); } catch (err) { showToast("解析引擎加载失败", "error"); } return; } const reader = new FileReader(); reader.onload = (event) => { setImportText(event.target.result); showToast("文件读取成功", "success"); }; reader.readAsText(file); };
    
    // --- 升级版批量导入逻辑 (包含防重复检测) ---
    const handleBatchImport = async () => {
        if (!importText || !importText.trim()) { showToast("请粘贴或上传文件！", "error"); return; }
        setIsImporting(true); await new Promise(resolve => setTimeout(resolve, 100));
        try {
            const lines = importText.replace(/"/g, '').trim().replace(/\r/g, '').split('\n'); let newOrdersData = [];
            lines.forEach((line, index) => { 
                if (!line.trim() || (index === 0 && line.includes('单号'))) return; 
                const parts = line.replace(/，/g, ',').replace(/\t/g, ' ').split(/[,，\s]+/).filter(p => p.trim().length > 0); 
                if (parts.length >= 2) { 
                    let phone = '', trackingNumber = '', courier = '', recipientName = '', product = ''; 
                    const phoneIndex = parts.findIndex(p => /^1[3-9]\d{9}$/.test(p)); if (phoneIndex !== -1) { phone = parts[phoneIndex]; parts.splice(phoneIndex, 1); }
                    const trackingIndex = parts.findIndex(p => /[a-zA-Z0-9]{9,}/.test(p) && !/^1[3-9]\d{9}$/.test(p)); if (trackingIndex !== -1) { trackingNumber = parts[trackingIndex]; parts.splice(trackingIndex, 1); }
                    const courierIndex = parts.findIndex(p => /快递|速运|物流|EMS|顺丰|圆通|中通|申通|韵达|极兔/.test(p)); if (courierIndex !== -1) { courier = parts[courierIndex]; parts.splice(courierIndex, 1); }
                    if (parts.length > 0) { recipientName = parts[0]; if (parts.length > 1) product = parts.slice(1).join(' '); }
                    if (trackingNumber) { 
                        let finalCourier = courier || autoDetectCourier(trackingNumber); if (courier && !/快递|速运|物流|EMS/.test(courier)) finalCourier += '快递';
                        const orderId = trackingNumber.trim();
                        newOrdersData.push({ id: orderId, recipientName: recipientName || '未知', phone: phone || '', product: product || '商品', courier: finalCourier, trackingNumber, note: '导入', timestamp: Date.now() - index, lastUpdated: Date.now() }); 
                    } 
                } 
            });
            if (newOrdersData.length > 0) { 
                // 1. 本次解析出的数据去重 (避免当前文本内就有重复单号)
                const uniqueMap = new Map(); newOrdersData.forEach(item => { if (item.id) uniqueMap.set(item.id, item); });
                const uniqueOrdersData = Array.from(uniqueMap.values());
                const currentBatchRemovedCount = newOrdersData.length - uniqueOrdersData.length;

                // 2. 数据库级防重复：查询要导入的单号，哪些在库里已经有了
                const batchIds = uniqueOrdersData.map(item => item.id);
                const existingIdsInDb = await DataService.checkExistingOrders(batchIds);
                
                // 3. 过滤出真正全新的订单
                const trulyNewOrdersData = uniqueOrdersData.filter(item => !existingIdsInDb.has(item.id));
                const dbSkippedCount = uniqueOrdersData.length - trulyNewOrdersData.length;

                // --- 新增：弹窗拦截提示逻辑 ---
                if (dbSkippedCount > 0) {
                    const duplicateSamples = Array.from(existingIdsInDb).slice(0, 3).join(', ');
                    const suffix = existingIdsInDb.size > 3 ? '...' : '';
                    
                    if (trulyNewOrdersData.length === 0) {
                        window.alert(`⚠️ 导入终止！\n\n您试图导入的数据中，共 ${dbSkippedCount} 个单号在系统中已全部存在（例如: ${duplicateSamples}${suffix}）。未执行任何新导入。`);
                        setIsImporting(false);
                        return;
                    } else {
                        const confirmMsg = `⚠️ 检测到重复单号！\n\n系统已存在 ${dbSkippedCount} 个您试图导入的单号（例如: ${duplicateSamples}${suffix}）。\n\n点击【确定】将跳过这些重复项，仅导入剩余的 ${trulyNewOrdersData.length} 个全新单号。`;
                        if (!window.confirm(confirmMsg)) {
                            setIsImporting(false);
                            return; // 用户点击取消，终止导入
                        }
                    }
                }

                if (trulyNewOrdersData.length > 0) {
                    await DataService.batchSaveOrders(trulyNewOrdersData);
                }

                // 4. 组装提示信息
                let msg = `成功导入 ${trulyNewOrdersData.length} 条新数据！`;
                if (currentBatchRemovedCount > 0 || dbSkippedCount > 0) {
                    msg += ` (自动跳过: 本次文本自身重复 ${currentBatchRemovedCount} 条, 系统已存在 ${dbSkippedCount} 条)`;
                }
                showToast(msg, "success");
                setImportText(''); setShowImportModal(false); fetchAdminOrders(); 
            } else { showToast("未识别到有效数据", "error"); }
        } catch (e) { showToast("导入失败: " + String(e.message), "error"); } finally { setIsImporting(false); }
    };

    const handleSaveOrder = async () => { 
        if (!isAdmin || !newOrder.trackingNumber) { showToast("无权限或信息不全", "error"); return; } 
        try { 
            const id = isEditing ? newOrder.id : newOrder.trackingNumber.trim(); 
            const updatedOrder = { ...newOrder, id };
            await DataService.saveOrder(updatedOrder);
            showToast(isEditing ? "修改成功" : "录入成功"); setIsEditing(false); setShowEditModal(false); setNewOrder({ recipientName: '', phone: '', product: '', trackingNumber: '', courier: '顺丰速运', note: '' }); fetchAdminOrders();
        } catch(e) { showToast("保存失败: " + String(e.message), "error"); } 
    };

    const handleDeleteOrderClick = (id) => { setConfirmModal({ type: 'single', id }); };
    const handleBatchDeleteClick = () => { if (selectedOrders.size === 0) return; setConfirmModal({ type: 'batch', count: selectedOrders.size }); };
    const handleEditOrderClick = (order) => { setNewOrder(order); setIsEditing(true); setShowEditModal(true); };
    const handleTrackingNumberChange = (e) => { const val = e.target.value; setNewOrder(p => ({...p, trackingNumber: val, courier: autoDetectCourier(val)})); };
    const toggleSelection = (id) => { const newSet = new Set(selectedOrders); newSet.has(id) ? newSet.delete(id) : newSet.add(id); setSelectedOrders(newSet); };
    const toggleSelectAll = () => { const newSet = new Set(); if (selectedOrders.size !== orders.length) orders.forEach(o => newSet.add(o.id)); setSelectedOrders(newSet); };
    
    const copyToClipboard = async (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) { try { await navigator.clipboard.writeText(text); showToast("复制成功"); return; } catch (err) { console.warn("Clipboard API 失败:", err); } }
        try {
            const textArea = document.createElement("textarea"); textArea.value = text; textArea.contentEditable = "true"; textArea.readOnly = false; textArea.style.position = "fixed"; textArea.style.left = "-9999px"; textArea.style.top = "0"; textArea.style.opacity = "0"; textArea.style.fontSize = "16px";
            document.body.appendChild(textArea); textArea.focus(); textArea.select();
            const range = document.createRange(); range.selectNodeContents(textArea); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); textArea.setSelectionRange(0, 999999);
            const successful = document.execCommand('copy'); document.body.removeChild(textArea);
            if (successful) showToast("复制成功"); else showToast("复制受限，请长按话术手动复制", "error");
        } catch (err) { console.error("复制失败:", err); showToast("复制受限，请长按话术手动复制", "error"); }
    };
    
    const handleAdminLogin = async (e) => { e.preventDefault(); if (!adminUsername || !adminPassword) { showToast("请输入账号和密码", "error"); return; } try { await DataService.login(adminUsername, adminPassword); setAdminUsername(''); setAdminPassword(''); showToast("管理员登录成功"); } catch (e) { showToast("登录失败: " + String(e.message), "error"); } };
    const handleAdminLogout = async () => { await DataService.logout(); };
    const handleSecretEntry = () => { setSecretClickCount(prev => { const newCount = prev + 1; if (newCount >= 5) { setCurrentView(isAdmin ? 'admin' : 'login'); return 0; } return newCount; }); if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current); clickTimeoutRef.current = setTimeout(() => { setSecretClickCount(0); }, 2000); };
    
    const handleSearch = useCallback(async (e, qParamOverride = null) => {
        if (e && e.preventDefault) e.preventDefault(); const q = (qParamOverride || searchQuery).trim(); if (!q) return;
        addSearchHistory(q); setHasSearched(true); setSearchResult(null);
        try {
            const results = await DataService.searchPublic(q);
            setSearchResult(results.length > 0 ? results : null);
            if (results.length > 0) { setExpandedOrderId(results[0].id); fetchLogistics(results[0]); }
        } catch (e) { showToast("查询出错: " + String(e.message), "error"); }
    }, [searchQuery]);

    const fetchLogistics = async (order) => {
        if (logisticsDataCache[order.id]?.data) return;
        setLogisticsDataCache(prev => ({ ...prev, [order.id]: { loading: true, data: null, error: null } }));
        try {
            let courierCode = COURIER_CODE_MAP[order.courier];
            if (!courierCode && order.courier !== '通用快递') { const mapKey = Object.keys(COURIER_CODE_MAP).find(k => order.courier.includes(k) || k.includes(order.courier)); if (mapKey) courierCode = COURIER_CODE_MAP[mapKey]; }
            if (!courierCode && order.courier !== '通用快递') throw new Error(`未找到快递代码: ${order.courier}`);
            const result = await DataService.queryLogisticsFromEdge(order.trackingNumber, courierCode, order.phone);
            const isSuccess = (result.code == 200) || (result.success === true) || (result.Success === true) || (String(result.status) === "0") || (String(result.status) === "200") || (Array.isArray(result.data) && result.data.length > 0) || (Array.isArray(result.list) && result.list.length > 0) || (Array.isArray(result.traces) && result.traces.length > 0) || (Array.isArray(result.Traces) && result.Traces.length > 0);
            if (isSuccess) { 
                let rawList = result.data || result.list || result.traces || result.Traces || result.logisticsTraceDetailList || [];
                if (!Array.isArray(rawList) && typeof rawList === 'object') rawList = rawList.list || rawList.traces || rawList.Traces || [];
                if (!Array.isArray(rawList) || rawList.length === 0) rawList = [{ time: Date.now(), status: "暂无详细轨迹，请稍后再试" }];
                const list = rawList.map(item => ({ time: item.time || item.ftime || item.AcceptTime || item.time_stamp || Date.now(), status: item.status || item.context || item.desc || item.AcceptStation || "未知状态" }));
                setLogisticsDataCache(prev => ({ ...prev, [order.id]: { loading: false, data: list, error: null } }));
            } else { const debugMsg = JSON.stringify(result).slice(0, 200); throw new Error(result.msg || result.reason || result.error || `API返回格式异常: ${debugMsg}`); }
        } catch (error) {
            const message = error.message; const isNetworkError = message === 'Failed to fetch' || message.includes('NetworkError'); const displayMsg = isNetworkError ? "网络请求失败" : message; const mockData = isNetworkError || message.includes("AppCode") || message.includes("HTTP") ? [] : getMockLogisticsData(order.trackingNumber, order.courier, displayMsg);
            setLogisticsDataCache(prev => ({ ...prev, [order.id]: { loading: false, data: mockData, error: displayMsg } }));
            if (isNetworkError) showToast(displayMsg, "error");
        }
    };
    
    const handleQuickCopyReply = async (order) => { 
        showToast("正在同步物流轨迹...", "success");
        
        let tracks = logisticsDataCache[order.id]?.data || [];
        
        try {
            let courierCode = COURIER_CODE_MAP[order.courier];
            if (!courierCode && order.courier !== '通用快递') { 
                const mapKey = Object.keys(COURIER_CODE_MAP).find(k => order.courier.includes(k) || k.includes(order.courier)); 
                if (mapKey) courierCode = COURIER_CODE_MAP[mapKey]; 
            }
            
            if (courierCode || order.courier === '通用快递') {
                 const result = await DataService.queryLogisticsFromEdge(order.trackingNumber, courierCode, order.phone);
                 const isSuccess = (result.code == 200) || (result.success === true) || (result.Success === true) || (String(result.status) === "0") || (String(result.status) === "200") || (Array.isArray(result.data) && result.data.length > 0) || (Array.isArray(result.list) && result.list.length > 0) || (Array.isArray(result.traces) && result.traces.length > 0) || (Array.isArray(result.Traces) && result.Traces.length > 0);
                 
                 if (isSuccess) {
                     let rawList = result.data || result.list || result.traces || result.Traces || result.logisticsTraceDetailList || [];
                     if (!Array.isArray(rawList) && typeof rawList === 'object') rawList = rawList.list || rawList.traces || rawList.Traces || [];
                     const list = rawList.map(item => ({ time: item.time || item.ftime || item.AcceptTime || item.time_stamp || Date.now(), status: item.status || item.context || item.desc || item.AcceptStation || "未知状态" }));
                     
                     tracks = list; 
                     setLogisticsDataCache(prev => ({ ...prev, [order.id]: { loading: false, data: list, error: null } }));
                 }
            }
        } catch (err) {
            console.warn("Auto-fetch failed during copy reply:", err);
        }

        showToast("正在生成话术...", "success");

        const createMessageTask = async () => {
            let realTimeStatus = order.lastApiStatus; 
            
            if (tracks && Array.isArray(tracks) && tracks.length > 0) { 
                const validData = tracks.filter(item => item && (item.time || item.ftime)); 
                const sortedData = [...validData].sort((a, b) => parseLogisticsDate(b.time || b.ftime) - parseLogisticsDate(a.time || a.time)); 
                if (sortedData.length > 0) realTimeStatus = sortedData[0].status || sortedData[0].context || sortedData[0].desc; 
            } 
            
            const statusSimple = getSimplifiedStatus(realTimeStatus); 
            let queryValue = order.trackingNumber.trim(); let queryLink;
            try { const shortCode = await DataService.getOrCreateShortLink(queryValue); queryLink = `${SHORT_LINK_BASE_URL}/${shortCode}`.replace('https://', '').replace('http://', ''); } catch (e) { console.warn("短链生成失败:", e.message); const safeToken = encodeToken(queryValue); queryLink = `${SHORT_LINK_BASE_URL}?q=${safeToken}`.replace('https://', '').replace('http://', ''); }
            let templateKey = 'TRANSPORT'; if (statusSimple === '待揽收') templateKey = 'WAIT_ACCEPT'; else if (statusSimple === '派件中') templateKey = 'DELIVERING'; else if (statusSimple === '已签收') templateKey = 'SIGN'; else if (statusSimple === '异常件') templateKey = 'ABNORMAL'; 
            let message = DEFAULT_TEMPLATES[templateKey]; message = message.replace(/{name}/g, order.recipientName || '客户').replace(/{product}/g, order.product || '商品').replace(/{courier}/g, order.courier).replace(/{no}/g, order.trackingNumber).replace(/{link}/g, queryLink).replace(/{status}/g, realTimeStatus || statusSimple);
            return message;
        };
        
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
            try { const textBlobPromise = createMessageTask().then(text => new Blob([text], { type: 'text/plain' })); const item = new ClipboardItem({ 'text/plain': textBlobPromise }); navigator.clipboard.write([item]).then(() => { showToast("复制成功"); if (navigator.vibrate) navigator.vibrate(200); }).catch(err => { createMessageTask().then(text => copyToClipboard(text)); }); return; } catch (e) {}
        }
        createMessageTask().then(text => { copyToClipboard(text); if (navigator.vibrate) navigator.vibrate(200); }).catch(err => { console.error("生成失败:", err); showToast("生成失败，请重试", "error"); });
    };

    const handleShowQrCode = async (order) => {
        const info = { name: order.recipientName, product: order.product, courier: order.courier, trackingNumber: order.trackingNumber };
        setQrCodeModal({ show: true, url: '', title: `单号：${order.trackingNumber}`, info, loading: true });
        try {
            let queryValue = order.trackingNumber.trim();
            const shortCode = await DataService.getOrCreateShortLink(queryValue);
            const jumpUrl = `${SHORT_LINK_BASE_URL}/${shortCode}`;
            const displayText = `${SHORT_LINK_BASE_URL.replace('https://', '')}/${shortCode}`;
            const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(jumpUrl)}&bgcolor=ffffff&color=000000&margin=10`;
            const img = new Image(); img.crossOrigin = "Anonymous"; img.onload = () => { setQrCodeModal({ show: true, url: apiUrl, title: displayText, info, loading: false }); }; img.onerror = () => { setQrCodeModal({ show: false, url: '', title: '', info: null, loading: false }); showToast("二维码生成服务繁忙", "error"); }; img.src = apiUrl;
        } catch (e) { console.error("二维码生成失败", e); showToast("生成失败: " + e.message, "error"); setQrCodeModal({ show: false, url: '', title: '', info: null, loading: false }); }
    };

    const handleShowLogistics = (order) => { setViewingLogisticsOrder(order); fetchLogistics(order); };
    
    if (currentView === 'login') {
        return (
            <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-black text-white p-6 relative overflow-hidden">
                <AcidBackground themeColor={apiSettings.themeColor} mode={activeBackgroundMode} lowPowerMode={lowPowerMode} /><NoiseOverlay /><ClickEffects themeColor={apiSettings.themeColor} />{toast && <Toast message={toast.message} type={toast.type} />}
                <TiltCard className="w-full max-w-sm bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center shadow-2xl relative z-10">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 shadow-[0_0_20px_currentColor]" style={{ borderColor: apiSettings.themeColor, color: apiSettings.themeColor }}><Lock size={32} className="animate-pulse"/></div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">管理员入口</h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4 mt-8">
                        <input type="text" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/50 transition-all text-white text-sm" placeholder="管理员账号" autoFocus />
                        <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-white/50 transition-all text-white text-sm" placeholder="登录密码" />
                        <button className="w-full h-12 text-black rounded-xl font-black tracking-widest hover:opacity-90 transition-all" style={{ backgroundColor: apiSettings.themeColor }}>验证身份</button>
                    </form>
                    <button onClick={() => setCurrentView('search')} className="mt-8 text-[10px] text-white/30 hover:text-white flex items-center justify-center gap-2 w-full"><ArrowRight size={10}/> 返回查询页</button>
                </TiltCard>
            </div>
        );
    }

    if (currentView === 'admin' && isAdmin) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#050505] text-white font-sans flex flex-col md:flex-row relative overflow-hidden">
                <NoiseOverlay /><ClickEffects themeColor={apiSettings.themeColor} />{toast && <Toast message={toast.message} type={toast.type} />}
                
                <div className="hidden md:flex w-64 bg-black/50 backdrop-blur-xl border-r border-white/5 flex-col z-10">
                    <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3"><div className="w-8 h-8 rounded flex items-center justify-center text-black font-bold" style={{ backgroundColor: apiSettings.themeColor }}><Package size={18}/></div><span className="font-black tracking-tighter text-lg">后台管理</span></div>
                    <nav className="flex-1 p-4 space-y-2">{[['dashboard','数据统计',BarChart2], ['list','订单管理',List], ['settings','系统设置',Settings]].map(([key, label, Icon]) => (<button key={key} onClick={() => { setAdminViewMode(key); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all ${adminViewMode===key ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}><Icon size={18} style={{ color: adminViewMode===key ? apiSettings.themeColor : 'currentColor' }}/> {label}</button>))}</nav>
                    <div className="p-4 border-t border-white/5 space-y-2"><button onClick={() => { setCurrentView('search'); }} className="w-full flex items-center gap-2 px-4 py-2 text-white/40 hover:text-white text-sm"><Home size={14}/> 预览前台</button><button onClick={handleAdminLogout} className="w-full flex items-center gap-2 px-4 py-2 text-white/40 hover:text-red-500 text-sm"><LogOut size={14}/> 退出登录</button></div>
                </div>
                <div className="flex-1 flex flex-col h-screen h-[100dvh] overflow-hidden z-10 relative">
                    <div className="md:hidden h-14 bg-black/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 shrink-0 safe-top">
                        <span className="font-black text-white text-lg">管理面板</span>
                        <div className="flex gap-4 text-white/50">
                            <Filter onClick={handleDeduplicate} size={20} className={`active:text-white transition-colors ${isDeduplicating ? 'animate-pulse text-[#CCFF00]' : ''}`}/>
                            <LogOut onClick={handleAdminLogout} size={20} className="text-white/50 hover:text-red-500 transition-colors"/>
                            <Home onClick={() => { setCurrentView('search'); }} size={20} className="active:text-white transition-colors"/>
                            <Settings onClick={() => { setAdminViewMode('settings'); }} size={20} className={adminViewMode==='settings'?'text-[#CCFF00]':'active:text-white'}/>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar pb-40 md:pb-8">
                        {adminViewMode === 'dashboard' && (
                            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                    {[ { label: 'PV', val: visitStats.pv, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10' }, { label: 'UV', val: visitStats.uv, icon: Globe, color: 'text-green-400', bg: 'bg-green-400/10' }, { label: '订单', val: statusCounts.total, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' }, { label: '异常', val: statusCounts['异常件'], icon: AlertTriangle, color: 'text-[#FF0055]', bg: 'bg-[#FF0055]/10' } ].map((stat, i) => ( <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-sm flex items-center justify-between group hover:bg-white/10 transition-colors"> <div> <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider mb-1">{stat.label}</div> <div className="text-2xl font-black text-white">{stat.val}</div> </div> <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}><stat.icon size={16} /></div> </div> ))}
                                </div>
                            </div>
                        )}
                        {adminViewMode === 'list' && (
                            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 md:p-6 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-0 z-20">
                                    <div className="flex justify-between w-full md:w-auto items-center"> 
                                        <div className="flex items-center gap-3"> <div><h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">订单管理</h2><p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">共 {totalOrdersCount} 条记录</p></div> <button onClick={() => setIsAdminMasked(!isAdminMasked)} className="text-white/30 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10 active:bg-white/20 active:scale-95"> {isAdminMasked ? <Eye size={24}/> : <EyeOff size={24}/>} </button> </div> 
                                        <button onClick={() => setShowImportModal(true)} className="md:hidden w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><Plus size={18}/></button> 
                                    </div>
                                    <div className="flex flex-col gap-3 w-full md:w-auto"> 
                                        <div className="flex gap-2 w-full md:w-auto"> 
                                            <div className="relative flex-1 md:w-48"> <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} /> <input type="text" placeholder="搜索..." value={adminSearchQuery} onChange={(e) => setAdminSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/10 rounded-lg text-sm outline-none focus:border-white/30 text-white placeholder-white/20 transition-all"/> </div> 
                                            <button onClick={handleDeduplicate} disabled={isDeduplicating} className="hidden md:flex px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white rounded-lg text-xs font-bold hover:bg-white/10 items-center gap-2 shrink-0 disabled:opacity-50 transition-all">{isDeduplicating ? <RefreshCw size={14} className="animate-spin"/> : <Filter size={14} />} {isDeduplicating ? "处理中" : "去重"}</button>
                                            <button onClick={() => setShowImportModal(true)} className="hidden md:flex px-4 py-2.5 text-black rounded-lg text-xs font-bold hover:opacity-80 items-center gap-2 shrink-0" style={{ backgroundColor: apiSettings.themeColor }}><Upload size={14} /> 导入</button> 
                                            {selectedOrders.size > 0 && (<button onClick={handleBatchDeleteClick} className="px-3 py-2.5 bg-red-900/50 text-red-400 border border-red-900 rounded-lg text-xs font-bold hover:bg-red-900/80"><Trash2 size={14}/></button>)} 
                                        </div> 
                                    </div>
                                </div>
                                <div className="hidden md:block bg-white/5 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead><tr className="bg-black/40 text-[10px] font-mono uppercase tracking-wider text-white/30 border-b border-white/5"><th className="p-4 w-10 text-center"><button onClick={toggleSelectAll}><CheckSquare size={16}/></button></th><th className="p-4">客户信息</th><th className="p-4">商品 / 快递</th><th className="p-4">单号</th><th className="p-4 text-center">操作</th></tr></thead>
                                            <tbody className="text-sm text-white/80">
                                            {orders.map(order => (
                                                <tr key={order.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${selectedOrders.has(order.id) ? 'bg-white/[0.05]' : ''}`}>
                                                    <td className="p-4 text-center"><button onClick={() => toggleSelection(order.id)} className={selectedOrders.has(order.id) ? 'text-[#CCFF00]' : 'text-white/20'}>{selectedOrders.has(order.id)?<CheckSquare size={18}/>:<Square size={18}/>}</button></td>
                                                    <td className="p-4"><div className="font-bold text-white">{isAdminMasked ? (order.recipientName?.[0] + '*'.repeat(Math.max(0, (order.recipientName?.length || 0) - 1))) : order.recipientName}</div><div className="text-xs text-white/40 font-mono mt-0.5">{isAdminMasked && order.phone && order.phone.length > 7 ? order.phone.replace(/(\d{3})\d+(\d{4})/, '$1****$2') : order.phone}</div></td>
                                                    <td className="p-4"><div onClick={() => handleEditOrderClick(order)} className="max-w-[180px] line-clamp-1 text-white/70 text-xs cursor-pointer hover:text-white hover:underline decoration-dashed decoration-white/30">{order.product}</div><div className="text-[10px] text-white/30 mt-1">{order.courier}</div></td>
                                                    <td className="p-4"><div className="font-mono text-[10px] text-white/30 select-all">{isAdminMasked && order.trackingNumber ? order.trackingNumber.slice(0,5) + '******' + order.trackingNumber.slice(-4) : order.trackingNumber}</div></td>
                                                    <td className="p-4 text-center"><div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleShowLogistics(order)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg" title="手动查询"><MapPin size={14}/></button>
                                                        <button onClick={() => handleQuickCopyReply(order)} className="p-2 bg-white/5 hover:bg-white/10 text-[#CCFF00] rounded-lg"><MessageSquare size={14}/></button>
                                                        <button onClick={() => handleShowQrCode(order)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"><QrCode size={14}/></button>
                                                        <button onClick={() => handleEditOrderClick(order)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"><Edit size={14}/></button>
                                                        <button onClick={() => handleDeleteOrderClick(order.id)} className="p-2 bg-white/5 hover:bg-white/10 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                                                    </div></td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="md:hidden space-y-3">
                                    {orders.map(order => (
                                        <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div><div className="flex items-center gap-2"><div className="text-white font-bold">{isAdminMasked ? (order.recipientName?.[0] + '*'.repeat(Math.max(0, (order.recipientName?.length || 0) - 1))) : order.recipientName}</div><div className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_STYLES[getSimplifiedStatus(order.lastApiStatus)]?.bg} ${STATUS_STYLES[getSimplifiedStatus(order.lastApiStatus)]?.color}`}>{getSimplifiedStatus(order.lastApiStatus)}</div></div><div onClick={() => handleEditOrderClick(order)} className="text-xs text-white/40 mt-1 cursor-pointer hover:text-white">{order.product}</div></div>
                                                <div className="text-right"><div className="text-xs font-mono text-white/60">{isAdminMasked && order.trackingNumber ? order.trackingNumber.slice(0,5) + '******' + order.trackingNumber.slice(-4) : order.trackingNumber}</div><div className="text-[10px] text-white/30 mt-1">{order.courier}</div></div>
                                            </div>
                                            <div className="grid grid-cols-5 gap-2 border-t border-white/5 pt-3 mt-1">
                                                <button onClick={() => handleShowLogistics(order)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10"><MapPin size={16}/> <span className="text-[10px]">轨迹</span></button>
                                                <button onClick={() => handleQuickCopyReply(order)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-white/5 text-[#CCFF00] hover:bg-white/10"><MessageSquare size={16}/> <span className="text-[10px]">话术</span></button>
                                                <button onClick={() => handleShowQrCode(order)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10"><ImageDown size={16}/> <span className="text-[10px]">卡片</span></button>
                                                <button onClick={() => handleEditOrderClick(order)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10"><Edit size={16}/> <span className="text-[10px]">编辑</span></button>
                                                <button onClick={() => handleDeleteOrderClick(order.id)} className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 size={16}/> <span className="text-[10px]">删除</span></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 rounded-xl">
                                    <div className="flex items-center gap-4"><span className="text-xs text-white/30 font-mono">第 {currentPage} 页 / 共 {totalPages} 页</span><select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-black/50 border border-white/10 text-white/60 text-xs rounded-lg px-2 py-1 outline-none focus:border-white/30 cursor-pointer hover:bg-white/5 transition-colors"><option value={20}>20 条/页</option><option value={50}>50 条/页</option><option value={100}>100 条/页</option></select></div>
                                    <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs disabled:opacity-30 hover:bg-white/10 text-white">上一页</button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs disabled:opacity-30 hover:bg-white/10 text-white">下一页</button></div>
                                </div>
                            </div>
                        )}
                        {adminViewMode === 'settings' && (
                            <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
                                <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                    <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3"><Settings size={24} className="text-[#CCFF00]" /> 系统配置</h3>
                                        <p className="text-xs text-white/40 mt-1 font-mono">自定义您的品牌形象与站点内容</p>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-8">
                                        <section>
                                            <h4 className="text-xs font-bold text-white/40 uppercase mb-5 tracking-widest flex items-center gap-2"><ImageIcon size={14}/> 品牌识别</h4>
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-white/20 relative group bg-black">
                                                        {apiSettings.logoUrl ? (<img src={apiSettings.logoUrl} className="w-full h-full object-cover transition-opacity group-hover:opacity-50" onError={(e) => {e.target.onerror = null; e.target.style.display = 'none';}} />) : (<div className="w-full h-full flex items-center justify-center text-white/20 font-black text-xl italic">LOGO</div>)}
                                                        <label htmlFor="local-logo-upload" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200"><Upload size={24} className="text-white drop-shadow-md"/></label>
                                                        <input id="local-logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                                    </div>
                                                    <div className="text-[10px] text-white/30 font-mono">点击图片上传</div>
                                                </div>
                                                <div className="flex-1 w-full space-y-4">
                                                    <div><label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">网站标题</label><div className="relative group"><input value={apiSettings.siteTitle} onChange={e => setApiSettings({...apiSettings, siteTitle: e.target.value})} className="w-full h-12 pl-4 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#CCFF00]/50 focus:bg-black transition-all outline-none" placeholder="例如：内部单号查询"/><div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00] transition-colors"><Type size={16}/></div></div></div>
                                                    <div><label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Logo 链接 (可选)</label><div className="flex gap-2"><input value={apiSettings.logoUrl && !apiSettings.logoUrl.startsWith('data:image/') ? apiSettings.logoUrl : ''} onChange={e => setApiSettings({...apiSettings, logoUrl: e.target.value})} placeholder="https://..." className="flex-1 h-10 pl-3 pr-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 focus:border-white/30 outline-none font-mono"/>{apiSettings.logoUrl && apiSettings.logoUrl.startsWith('data:image/') && (<button onClick={() => setApiSettings(p => ({...p, logoUrl: ''}))} className="px-3 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 text-xs font-bold transition-colors">清除</button>)}</div></div>
                                                </div>
                                            </div>
                                        </section>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <section>
                                            <h4 className="text-xs font-bold text-white/40 uppercase mb-5 tracking-widest flex items-center gap-2"><Palette size={14}/> 主题配色</h4>
                                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">{THEME_PRESETS.map((theme) => (<button key={theme.color} onClick={() => setApiSettings({...apiSettings, themeColor: theme.color})} className={`group relative w-12 h-12 rounded-xl transition-all duration-300 ${apiSettings.themeColor === theme.color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-105 opacity-70 hover:opacity-100'}`} style={{ backgroundColor: theme.color }} title={theme.name}>{apiSettings.themeColor === theme.color && (<div className="absolute inset-0 flex items-center justify-center animate-in zoom-in"><Check size={20} className="text-black/80 drop-shadow-sm" strokeWidth={3} /></div>)}</button>))}</div>
                                                <div className="mt-4 text-center md:text-left"><span className="text-xs text-white/30 font-mono">当前选择: {THEME_PRESETS.find(t => t.color === apiSettings.themeColor)?.name || apiSettings.themeColor}</span></div>
                                            </div>
                                        </section>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <section>
                                            <h4 className="text-xs font-bold text-white/40 uppercase mb-5 tracking-widest flex items-center gap-2"><MessageSquare size={14}/> 首页公告</h4>
                                            <div className="relative"><textarea value={apiSettings.announcement} onChange={e => setApiSettings({...apiSettings, announcement: e.target.value})} className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white/90 leading-relaxed focus:border-[#CCFF00]/50 outline-none resize-none transition-all placeholder-white/20 custom-scrollbar" placeholder="在此输入公告内容，支持换行..."/><div className="absolute bottom-3 right-3 pointer-events-none"><Edit size={14} className="text-white/20"/></div></div>
                                        </section>
                                        <button onClick={saveApiSettings} disabled={isSaving} className="w-full py-4 rounded-xl font-black tracking-widest text-sm uppercase transition-all transform active:scale-[0.98] hover:brightness-110 flex items-center justify-center gap-2 shadow-lg" style={{ backgroundColor: apiSettings.themeColor, color: '#000' }}>{isSaving ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>}{isSaving ? "正在同步..." : "保存并发布"}</button>
                                        <div className="w-full h-px bg-white/5"></div>
                                        <section>
                                            <h4 className="text-xs font-bold text-red-500/50 uppercase mb-5 tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> 危险区域</h4>
                                            <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/10">
                                                <div className="flex items-center justify-between">
                                                    <div><div className="text-sm font-bold text-red-400">清空所有订单数据</div><div className="text-xs text-red-400/50 mt-1">此操作将永久删除所有订单记录，不可恢复。</div></div>
                                                    <button onClick={handleClearAllClick} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-colors">立即清空</button>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                                <div className="md:hidden mt-6 grid grid-cols-2 gap-4"><button onClick={() => setCurrentView('search')} className="py-4 bg-white/5 border border-white/10 rounded-2xl text-white/80 font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"><Eye size={20} className="text-[#CCFF00]"/> 预览前台</button><button onClick={handleAdminLogout} className="py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold text-sm flex flex-col items-center justify-center gap-2 hover:bg-red-500/20 active:scale-95 transition-all"><LogOut size={20}/> 退出登录</button></div>
                                <div className="h-12 md:hidden"></div>
                            </div>
                        )}
                    </div>
                    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center h-20 pb-safe z-50">
                        <button onClick={() => { setAdminViewMode('dashboard'); }} className={`flex flex-col items-center gap-1 p-2 ${adminViewMode==='dashboard'?'text-white':'text-white/30'}`}> <BarChart2 size={20} style={{ color: adminViewMode==='dashboard' ? apiSettings.themeColor : 'currentColor' }}/> <span className="text-[10px] font-bold">概览</span> </button>
                        <button onClick={() => { setAdminViewMode('list'); }} className={`flex flex-col items-center gap-1 p-2 ${adminViewMode==='list'?'text-white':'text-white/30'}`}> <List size={20} style={{ color: adminViewMode==='list' ? apiSettings.themeColor : 'currentColor' }}/> <span className="text-[10px] font-bold">订单</span> </button>
                        <button onClick={() => { setAdminViewMode('settings'); }} className={`flex flex-col items-center gap-1 p-2 ${adminViewMode==='settings'?'text-white':'text-white/30'}`}> <Settings size={20} style={{ color: adminViewMode==='settings' ? apiSettings.themeColor : 'currentColor' }}/> <span className="text-[10px] font-bold">设置</span> </button>
                    </div>
                </div>

                <QrCodeModal show={qrCodeModal.show} onClose={() => setQrCodeModal({...qrCodeModal, show: false})} data={qrCodeModal} themeColor={apiSettings.themeColor} />

                {showImportModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                        <div className="bg-[#111] w-full max-w-3xl rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-white">批量导入</h3><button onClick={()=>setShowImportModal(false)} className="text-white/40 hover:text-white p-2"><X size={24}/></button></div>
                            <div className="mb-6 p-4 border border-dashed border-white/20 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors relative group"><input type="file" accept=".csv,.txt,.xls,.xlsx" onChange={handleImportFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/><div className="flex flex-col items-center justify-center py-4 text-center"><FileSpreadsheet size={32} className="text-white/40 mb-3 group-hover:text-white transition-colors"/><p className="text-sm font-bold text-white mb-1">上传 Excel / CSV</p><p className="text-[10px] font-mono text-white/30">点击或拖拽上传</p></div></div>
                            <textarea value={importText} onChange={e=>setImportText(e.target.value)} className="w-full h-64 bg-black border border-white/10 rounded-xl p-4 text-xs text-white/70 mb-6 font-mono leading-relaxed" placeholder="或者直接粘贴文本数据..." />
                            <div className="flex gap-3">
                                <button onClick={()=>setShowImportModal(false)} disabled={isImporting} className="flex-1 py-3 bg-white/5 text-white/60 rounded-lg text-xs font-bold hover:bg-white/10 disabled:opacity-50">取消</button>
                                <button onClick={handleBatchImport} disabled={isImporting} className={`flex-1 py-3 text-black rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 ${isImporting ? 'opacity-70 cursor-not-allowed' : ''}`} style={{ backgroundColor: apiSettings.themeColor }}>{isImporting ? (<><RefreshCw size={14} className="animate-spin"/><span>正在处理...</span></>) : ("处理数据")}</button>
                            </div>
                        </div>
                    </div>
                )}
                {viewingLogisticsOrder && (<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"><div className="bg-[#111] w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"><div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]"><div><div className="text-white font-bold text-lg mb-1">{viewingLogisticsOrder.recipientName}</div><div className="text-xs font-mono text-white/40">{viewingLogisticsOrder.trackingNumber}</div></div><button onClick={() => setViewingLogisticsOrder(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><X size={18}/></button></div><div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-black"><LogisticsTimeline order={viewingLogisticsOrder} logisticsDataCache={logisticsDataCache} themeColor={apiSettings.themeColor} /></div></div></div>)}
                
                {showEditModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                        <div className="bg-[#111] w-full max-w-lg rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-xl text-white">编辑订单</h3>
                                <button onClick={() => setShowEditModal(false)} className="p-2"><X size={24} className="text-white/40"/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:gap-5 mb-8">
                                <input value={newOrder.recipientName} onChange={e => setNewOrder({...newOrder, recipientName: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-lg text-white" placeholder="收件人"/>
                                <input value={newOrder.phone} onChange={e => setNewOrder({...newOrder, phone: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-lg text-white" placeholder="手机号"/>
                                <input value={newOrder.product} onChange={e => setNewOrder({...newOrder, product: e.target.value})} className="col-span-2 w-full p-3 bg-black border border-white/10 rounded-lg text-white" placeholder="商品名称" />
                                <input value={newOrder.trackingNumber} onChange={handleTrackingNumberChange} className="w-full p-3 bg-black border border-white/10 rounded-lg text-white" placeholder="运单号"/>
                                <input value={newOrder.courier} onChange={e => setNewOrder({...newOrder, courier: e.target.value})} className="w-full p-3 bg-black border border-white/10 rounded-lg text-white" placeholder="快递名称 (自动识别)"/>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button onClick={handleSaveOrder} className="px-6 py-3 text-black rounded-lg font-bold active:scale-95 transition-transform" style={{ backgroundColor: apiSettings.themeColor }}>保存</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {confirmModal && (<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"><div className="bg-[#111] w-full max-w-sm rounded-2xl p-8 border border-white/10 shadow-2xl text-center animate-in zoom-in-95 duration-200"><AlertTriangle size={32} className="text-red-500 mx-auto mb-6"/><h3 className="text-xl font-bold text-white mb-2">{confirmModal.type === 'clear_all' ? '确定清空所有数据?' : '确认删除?'}</h3><div className="text-white/50 text-sm mb-6">{confirmModal.type === 'clear_all' ? '此操作将永久删除所有订单记录，且无法恢复！' : (confirmModal.type === 'batch' ? `您即将删除 ${confirmModal.count} 条记录。` : '此操作不可撤销。')}</div>{confirmModal.type === 'clear_all' && (<div className="mb-6"><input type="text" value={securityCodeInput} onChange={(e) => setSecurityCodeInput(e.target.value)} className="w-full h-12 bg-black border border-red-900/50 rounded-lg text-center text-red-500 font-mono text-sm tracking-widest placeholder-red-900/50 outline-none focus:border-red-500 transition-colors" placeholder="请输入安全码" autoFocus /></div>)}<div className="flex gap-3 mt-8"><button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-white/5 text-white rounded-lg active:scale-95 transition-transform">取消</button><button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-lg active:scale-95 transition-transform">{confirmModal.type === 'clear_all' ? '验证并清空' : '删除'}</button></div></div></div>)}
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto min-h-screen min-h-[100dvh] relative overflow-hidden flex flex-col">
            <AcidBackground themeColor={apiSettings.themeColor} mode={activeBackgroundMode} lowPowerMode={lowPowerMode} /><NoiseOverlay /><ClickEffects themeColor={apiSettings.themeColor} />{toast && <Toast message={toast.message} type={toast.type} />}
            <div className="absolute top-4 right-4 z-50 flex gap-3">
                 <button onClick={toggleLowPowerMode} className={`p-2 rounded-full border backdrop-blur-md transition-all active:scale-95 ${lowPowerMode ? 'bg-[#CCFF00]/20 border-[#CCFF00] text-[#CCFF00]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`} title={lowPowerMode ? "点击开启特效" : "点击开启低电量模式"}> {lowPowerMode ? <Battery size={18} className="animate-pulse" /> : <Zap size={18} />} </button>
            </div>
            <div className="relative z-10 pt-12 pb-6 px-6 flex flex-col items-center">
                <div className="absolute top-6 w-full flex justify-start px-6"> <span className="text-[10px] font-mono tracking-[0.2em] text-white/20 select-none cursor-default">{apiSettings.siteName}</span> </div>
                <div className="relative group mb-6 mt-4"> <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: apiSettings.themeColor }}></div> <button onClick={handleSecretEntry} className="w-24 h-24 rounded-full overflow-hidden border-2 relative z-10 bg-black active:scale-95 transition-transform duration-100" style={{ borderColor: apiSettings.themeColor, cursor: 'default' }} title="" > {apiSettings.logoUrl ? <img key={apiSettings.logoUrl} src={apiSettings.logoUrl} className="w-full h-full object-cover" onError={(e) => {e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.classList.add('fallback-active');}} /> : <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl italic">DHCX</div>} </button> </div>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tighter italic uppercase text-center" style={{ textShadow: `0 0 20px ${apiSettings.themeColor}80` }}>{apiSettings.siteTitle}</h1>
                <TiltCard className="w-full relative z-20 group mt-8"><div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 flex gap-2 shadow-2xl"><form onSubmit={handleSearch} className="flex-1"><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="请输入完整手机号或运单号" className="w-full h-12 pl-4 pr-4 bg-transparent text-white placeholder-white/30 font-mono text-sm outline-none" inputMode="text"/></form><button onClick={handleSearch} className="h-12 px-6 rounded-lg font-bold text-black hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: apiSettings.themeColor }}>查询</button></div></TiltCard>
            </div>
            <div className="relative z-10 px-6 pb-20 flex-1">
                {!hasSearched && getSearchHistory().length > 0 && (<div className="mb-6 animate-in fade-in slide-in-from-bottom-4"><div className="flex justify-between items-end mb-3"><span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">最近查询</span><button onClick={clearSearchHistory} className="text-white/20 hover:text-red-500 p-2"><Trash2 size={12}/></button></div><div className="flex flex-wrap gap-2">{getSearchHistory().map((h, i) => (<button key={i} onClick={() => { setSearchQuery(h); handleSearch(null, h); }} className="px-3 py-1.5 border border-white/10 bg-white/5 rounded text-[10px] font-mono text-white/60 hover:bg-white/10 hover:text-white active:scale-95 transition-transform">{h}</button>))}</div></div>)}
                {(apiSettings.announcement && !hasSearched) && (<div className="mb-6 p-4 rounded-lg border border-white/10 bg-black/20 backdrop-blur-md"><div className="flex items-center gap-2 mb-2"><Zap size={12} style={{ color: apiSettings.themeColor }} className="animate-pulse"/><span className="text-[10px] font-bold uppercase tracking-widest text-white/50">公告</span></div><p className="text-xs text-white/80 font-mono leading-loose"><Typewriter text={apiSettings.announcement} /></p></div>)}
                {hasSearched && searchResult && searchResult.length > 0 && (
                    <div className="animate-in slide-in-from-bottom-10 duration-700 ease-out">
                       {(() => {
                           const resultItem = searchResult.find(o => o.id === expandedOrderId) || searchResult[0];
                           const dbOrder = orders.find(o => o.id === resultItem.id) || resultItem;
                           const apiCache = logisticsDataCache[dbOrder.id];
                           let apiLatestItem = null;
                           if (apiCache && Array.isArray(apiCache.data)) { if (apiCache.data.length > 0) { const validData = apiCache.data.filter(item => item && (item.time || item.ftime)); const sortedData = [...validData].sort((a, b) => parseLogisticsDate(b.time || b.ftime) - parseLogisticsDate(a.time || a.time)); if (sortedData.length > 0) { apiLatestItem = sortedData[0]; } } }
                           const rawStatusText = apiLatestItem ? (apiLatestItem.status || apiLatestItem.context || apiLatestItem.desc) : (dbOrder.lastApiStatus || '暂无轨迹');
                           const statusKey = getSimplifiedStatus(rawStatusText);
                           const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES['中转中'];
                           const StatusIllustration = statusStyle.illustration;
                           return (
                           <>
                                   {searchResult.length > 1 && ( <div className="mb-6"> <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2 ml-1">查询到 {searchResult.length} 条记录:</div> <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{searchResult.map(item => (<button key={item.id} onClick={() => { setExpandedOrderId(item.id); fetchLogistics(item); }} className={`flex-shrink-0 p-3 rounded-xl border transition-all min-w-[140px] text-left active:scale-95 ${expandedOrderId === item.id ? 'bg-white/10 border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}><div className={`text-[10px] font-mono mb-1 ${expandedOrderId === item.id ? 'text-[#CCFF00]' : 'text-white/40'}`}>{formatDate(item.timestamp)}</div><div className={`text-xs font-bold truncate ${expandedOrderId === item.id ? 'text-white' : 'text-white/70'}`}>{item.trackingNumber}</div></button>))}</div> </div> )}
                                    <TiltCard className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>
                                            <div className={`absolute -right-4 -bottom-4 w-48 h-48 opacity-20 ${statusStyle.color} rotate-[-10deg] transition-all duration-500`}><StatusIllustration className="w-full h-full" /></div>
                                            <div className="p-4 relative z-10">
                                                <div className="flex justify-between items-end mb-3">
                                                    <div> <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">当前状态</div> <div className={`flex items-center gap-2 px-2 py-1 rounded border backdrop-blur-md ${statusStyle.bg} ${statusStyle.border} ${statusStyle.glow} transition-all duration-500 cursor-pointer hover:brightness-110 active:scale-95 select-none`} onClick={(e) => handleStatusMultiClick(e, dbOrder)} title="点击5次复制回复话术"> <statusStyle.icon size={14} className={statusStyle.color}/> <span className={`text-xs font-bold uppercase tracking-wider ${statusStyle.color}`}>{statusKey}</span> </div> </div>
                                                    <div className="text-right relative z-20"> <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">快递公司</div> <div className="text-sm font-bold" style={{ color: apiSettings.themeColor }}>{dbOrder.courier}</div> </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {apiSettings.showProduct && ( <div> <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">商品名称</div> <div className="text-base font-bold break-words leading-snug relative z-20" style={{ color: apiSettings.themeColor }}>{dbOrder.product}</div> </div> )}
                                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                                        {apiSettings.showRecipient && ( <div> <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">收件人</div> <div className="flex items-center gap-2"> <div className="text-sm font-bold text-white">{isNameMasked ? (dbOrder.recipientName ? dbOrder.recipientName[0] + '*'.repeat(Math.max(0, dbOrder.recipientName.length - 1)) : '***') : dbOrder.recipientName}</div> <button onClick={() => setIsNameMasked(!isNameMasked)} className="text-white/30 hover:text-white transition-colors p-2 rounded active:bg-white/10"><Eye size={16}/></button> </div> </div> )}
                                                        <div> <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">运单号</div> <div className="flex items-center gap-2"> <span className="text-sm font-mono text-white/80">{dbOrder.trackingNumber}</span> <button onClick={() => copyToClipboard(dbOrder.trackingNumber)} className="text-white/40 hover:text-white transition-colors relative z-20 p-1" title="复制单号"><Copy size={12}/></button> <div className="w-px h-3 bg-white/10 mx-1"></div> </div> </div>
                                                    </div>
                                                </div>
                                            </div>
                                     </TiltCard>
                                     <LogisticsTimeline order={dbOrder} logisticsDataCache={logisticsDataCache} themeColor={apiSettings.themeColor} />
                           </>
                           )
                       })()}
                       <div className="flex justify-center pt-8"> <button onClick={() => { setHasSearched(false); setSearchQuery(''); setSearchResult(null); }} className="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95" > <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500"/> 清空查询结果 </button> </div>
                    </div>
                )}
                {hasSearched && (!searchResult || searchResult.length === 0) && (<div className="mt-10 p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm text-center animate-in zoom-in duration-300"><div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4"><Search size={24} className="text-white/20"/></div><h3 className="text-white font-bold text-lg mb-2">未查询到记录</h3><p className="text-white/40 text-xs font-mono mb-6">请检查输入是否正确 (需输入完整11位手机号或运单号)</p><button onClick={() => { setHasSearched(false); setSearchQuery(''); setSearchResult(null); }} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold text-white transition-colors uppercase tracking-wider active:scale-95">重试</button></div>)}
            </div>
            <div className="relative z-10 py-4 text-center border-t border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="flex items-center justify-center gap-2 text-[10px] text-white/30 font-mono tracking-widest uppercase">
                    <ShieldCheck size={12} className="text-[#CCFF00]"/> <span>{apiSettings.footerMsg}</span><span className="w-px h-3 bg-white/10 mx-2"></span><span className="text-white/20">V3.1 ShortLink</span>
                </div>
            </div>
            <QrCodeModal show={qrCodeModal.show} onClose={() => setQrCodeModal({...qrCodeModal, show: false})} data={qrCodeModal} themeColor={apiSettings.themeColor} />
        </div>
    );
}