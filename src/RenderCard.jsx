import React, { useState, useEffect } from 'react';

// ... (此处省略重复的 imports, 确保你有 React 和 useState/useEffect)

const THEME_COLOR = "#CCFF00"; 
const SHORT_LINK_BASE_URL = 'https://dhcx.me'; 

// 状态样式映射 (请确保这些和 App.jsx 里的风格一致)
const STATUS_STYLES = {
    '已签收': { color: '#CCFF00', bg: '#000' },
    '派件中': { color: '#00FFFF', bg: '#000' },
    '中转中': { color: '#BD00FF', bg: '#000' },
    '待揽收': { color: '#888', bg: '#EEE' },
    '异常件': { color: '#FF0055', bg: '#000' },
};

// 状态转换辅助函数
const getSimplifiedStatus = (status) => {
    if (!status) return '待揽收';
    const s = String(status).toUpperCase();
    if (s.includes('签收') || s.includes('SIGN')) return '已签收';
    if (s.includes('派件') || s.includes('DELIVER')) return '派件中';
    if (s.includes('异常') || s.includes('FAIL') || s.includes('REFUSE')) return '异常件';
    if (s.includes('待揽收') || s.includes('WAIT')) return '待揽收';
    return '中转中';
};

export default function RenderCard() {
    const [orderInfo, setOrderInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        // 1. 从 URL 获取运单号 (例如 dhcx.me/render-card?id=SF123456)
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
            setLoading(false);
            return;
        }

        // 2. 获取数据 (模拟数据，实际项目中您应该调用 DataService 从 Supabase 获取)
        const fetchData = async () => {
            // 模拟从后端获取的订单数据
            const mockOrder = {
                trackingNumber: id,
                recipientName: "客户", // 隐私保护
                product: "物流追踪服务",
                courier: "自动识别",
                lastApiStatus: "运输中",
                siteName: "DHCX.ME"
            };

            setOrderInfo(mockOrder);

            // 3. 生成二维码图片链接
            const shortLink = `${SHORT_LINK_BASE_URL}/${id.slice(0, 6)}`;
            // 使用高分辨率二维码 API (size=500x500)
            const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shortLink)}&bgcolor=ffffff&color=000000&margin=10`;
            setQrUrl(qrApi);
            
            // 图片预加载，确保截图时二维码已经显示
            const img = new Image();
            img.src = qrApi;
            img.onload = () => setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) return <div style={{padding: 50}}>准备数据中...</div>;
    if (!orderInfo) return <div style={{padding: 50}}>未找到订单</div>;

    const statusKey = getSimplifiedStatus(orderInfo.lastApiStatus);
    const theme = STATUS_STYLES[statusKey] || STATUS_STYLES['中转中'];

    return (
        // 外层容器：透明背景，用于截图定位
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: 'transparent', // 关键：背景透明，方便 Puppeteer 设置透明底
            fontFamily: 'sans-serif'
        }}>
            {/* 这里的 ID 必须和 api/screenshot.js 里的一致，摄影师只拍这个 ID 的内容 */}
            <div id="share-card-container" style={{
                width: '375px', // 稍微宽一点，接近手机屏幕宽度
                backgroundColor: '#fff',
                borderRadius: '24px',
                overflow: 'hidden',
                // 添加稍微重一点的阴影，增加立体感
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                position: 'relative'
            }}>
                {/* 顶部闲鱼黄风格色条 */}
                <div style={{ 
                    height: '50px', 
                    background: '#FFDA06', // 闲鱼黄
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 20px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{fontWeight: 900, fontSize: '18px'}}>DHCX</div>
                    <div style={{fontSize: '10px', fontWeight: 'bold', opacity: 0.6}}>OFFICIAL RECEIPT</div>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* 用户信息栏 */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            background: '#eee', marginRight: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px'
                        }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{orderInfo.recipientName}</div>
                            <div style={{ fontSize: '10px', color: '#999' }}>刚刚查询了物流</div>
                        </div>
                        <div style={{ marginLeft: 'auto', color: '#FF4400', fontWeight: 'bold', fontSize: '16px' }}>
                            {orderInfo.lastApiStatus}
                        </div>
                    </div>

                    {/* 商品信息 */}
                    <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#333', marginBottom: '20px' }}>
                        您的商品 <span style={{fontWeight: 'bold'}}>「{orderInfo.product}」</span> 
                        <br/>正由 {orderInfo.courier} 派送中
                    </div>

                    {/* 图片展示区 (模拟商品图) */}
                    <div style={{ 
                        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4px', 
                        height: '200px', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden' 
                    }}>
                        <div style={{ background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>包裹主图</div>
                        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
                            <div style={{ background: '#f4f4f4' }}></div>
                            <div style={{ background: '#f4f4f4' }}></div>
                        </div>
                    </div>

                    <hr style={{border: 'none', borderTop: '1px dashed #eee', margin: '20px 0'}} />

                    {/* 底部二维码区域 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '80px', height: '80px', 
                            border: '1px solid #eee', padding: '4px', borderRadius: '8px'
                        }}>
                            <img 
                                src={qrUrl} 
                                alt="QR" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                crossOrigin="anonymous" 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>① 保存图片到相册</div>
                            <div style={{ fontSize: '10px', color: '#999' }}>② 微信/浏览器扫一扫</div>
                            <div style={{ 
                                marginTop: '8px', 
                                background: '#FFF8D6', color: '#AA8800', 
                                fontSize: '10px', padding: '4px 8px', borderRadius: '4px',
                                display: 'inline-block'
                            }}>
                                长按识别查看完整轨迹 👆
                            </div>
                        </div>
                        {/* 闲鱼公仔装饰 (用Emoji代替) */}
                        <div style={{ fontSize: '40px' }}>🐠</div>
                    </div>
                </div>
            </div>
        </div>
    );
}