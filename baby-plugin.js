/**
 * ====================================================
 *  奇遇空间 (养娃) 功能模块 (重构暖色面包系 + 完善流程)
 *  baby-plugin.js
 * ====================================================
 */

let babyActionTimer = null; // 用于控制动作切换的定时器

// 把男女娃的图片库放在全局，方便复用
const globalGirlImages = [
    "https://img.heliar.top/file/1773359645255_de22a3981443f9f716e5217a05c07388.png",
    "https://img.heliar.top/file/1773359763623_516b4835a2260d3497ffaf36488315b4.png",
    "https://img.heliar.top/file/1773363198260_6539b1902ab6d935ece61475f2d5b2a4.png"
];
const globalBoyImages = [
    "https://img.heliar.top/file/1773359832310_f34a8031443c88b1e8eca35e7a9055af.png",
    "https://img.heliar.top/file/1773359831234_66ae9011f14fa1d5c3453e067588f523.png",
    "https://img.heliar.top/file/1773359833023_e8d5c5ea9f83f8291f68679124b6f8d7.png"
];

// ==============================================================
// 1. 打开奇遇空间主列表
// ==============================================================
function openBabyListScreen() {
    setActivePage('babyListScreen');
    renderBabyList();
}

function renderBabyList() {
    const container = document.getElementById('babyListContainer');
    container.innerHTML = '';

    if (babies.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 50px; color: #A67C52;">
                <i class="ri-egg-line" style="font-size: 48px; opacity: 0.5;"></i>
                <p>还没有小宝宝哦<br>点击右上角领养一个吧~</p>
            </div>
        `;
        return;
    }

    babies.forEach(baby => {
        const partner = friends.find(f => f.id === baby.partnerId) || { name: '未知' };
        const card = document.createElement('div');
        card.style.cssText = "background: #FFF; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(212,163,115,0.1); border: 2px solid #F5E6D3; display: flex; align-items: center; cursor: pointer; margin-bottom: 15px;";
        card.onclick = () => openBabyRoom(baby.id);

        const avatarUrl = baby.avatar || 'https://img.icons8.com/bubbles/100/baby.png';

        card.innerHTML = `
            <img src="${avatarUrl}" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid #FFF3E0; margin-right: 15px; object-fit: cover;">
            <div style="flex: 1;">
                <div style="font-size: 18px; font-weight: bold; color: #8C6239;">${baby.name} <span style="font-size: 12px; color: ${baby.gender === '男孩' ? '#8fd3f4' : '#ff9a9e'};">${baby.gender}</span></div>
                <div style="font-size: 12px; color: #A67C52; margin-top: 5px;">你和 ${partner.name} 的宝宝 · ${baby.age}岁</div>
            </div>
            <i class="ri-arrow-right-s-line" style="color: #D4A373; font-size: 20px;"></i>
        `;
        container.appendChild(card);
    });
}

// ==============================================================
// 2. 领养流程
// ==============================================================
function openBabyAdoptionModal() {
    if (babies.length >= 5) return showAlert("最多只能抚养5个宝宝哦~");

    const list = document.getElementById('babyPartnerList');
    list.innerHTML = '';

    // 过滤：非群聊，且没有和你生过孩子的AI
    const existingPartnerIds = babies.map(b => b.partnerId);
    const availablePartners = friends.filter(f => !f.isGroup && !existingPartnerIds.includes(f.id));

    if (availablePartners.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">没有合适的好友了</div>';
    } else {
        availablePartners.forEach(f => {
            const item = document.createElement('div');
            item.className = 'multi-select-item';
            item.style.padding = "10px";
            item.innerHTML = `
                <input type="radio" name="babyPartner" id="bp-${f.id}" value="${f.id}" style="accent-color: #D4A373;">
                <label for="bp-${f.id}" style="color: #555; font-weight: bold; margin-left: 10px;">${f.remark || f.name}</label>
            `;
            list.appendChild(item);
        });
    }
    document.getElementById('babyAdoptionModal').classList.add('show');
}

// 触发扭蛋/确认伴侣 (带智能性别平衡机制)
function startBabyAdoption() {
    const selected = document.querySelector('input[name="babyPartner"]:checked');
    if (!selected) return showToast("请选择一位抚养人");

    document.getElementById('babyAdoptionModal').classList.remove('show');

    // 模拟抽卡动画
    showToast("🌟 奇迹正在降临...", 2000);
    setTimeout(() => {
        // --- 核心修改：智能性别平衡算法 ---
        let girlChance = 0.5; // 默认 50% 概率
        
        if (babies.length > 0) {
            // 统计当前女孩和男孩的数量
            const girlCount = babies.filter(b => b.gender === '女孩').length;
            const boyCount = babies.length - girlCount;
            
            // 如果女孩比男孩多，把生女孩的概率降到 10% (生男孩概率提升到 90%)
            if (girlCount > boyCount) {
                girlChance = 0.1; 
            } 
            // 如果男孩比女孩多，把生女孩的概率提升到 90%
            else if (boyCount > girlCount) {
                girlChance = 0.9;
            }
        }
        
        // 生成最终性别
        const isGirl = Math.random() < girlChance;
        // ------------------------------------

        document.getElementById('babyGenderDisplay').innerHTML = isGirl ? '女孩 ♀' : '男孩 ♂';
        document.getElementById('babyGenderDisplay').style.color = isGirl ? '#ff9a9e' : '#8fd3f4';

        // 记录临时数据在 DOM attribute 里
        document.getElementById('babyInfoSetupModal').setAttribute('data-partner-id', selected.value);
        document.getElementById('babyInfoSetupModal').setAttribute('data-gender', isGirl ? '女孩' : '男孩');

        // 根据性别自动分配并显示头像
        const avatarUrl = isGirl 
            ? "https://img.heliar.top/file/1773406179317_0dbc48d4a85da468d34fae99f89d9cac.jpeg" 
            : "https://img.heliar.top/file/1773406186786_18633a9b4972e3d5f7983874a9ea4837.jpeg";
        document.getElementById('newBabyAvatarDisplay').src = avatarUrl;

        // 重置表单
        document.getElementById('newBabyName').value = '';
        document.getElementById('newBabyBirthday').valueAsDate = new Date();

        document.getElementById('babyInfoSetupModal').classList.add('show');
    }, 2000);
}

function handleBabyAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            // 使用主文件的压缩函数
            tempNewBabyAvatar = await compressImage(file, { maxWidth: 300 });
            document.getElementById('newBabyAvatarUpload').style.backgroundImage = `url(${tempNewBabyAvatar})`;
            document.getElementById('newBabyAvatarUpload').style.backgroundSize = 'cover';
            document.getElementById('newBabyAvatarPreview').textContent = '';
        };
        reader.readAsDataURL(file);
    }
}

// 确认创建并立刻跳转房间
async function confirmBabyCreation() {
    const name = document.getElementById('newBabyName').value.trim();
    if (!name) return showAlert("宝宝必须有个名字哦");

    const partnerId = document.getElementById('babyInfoSetupModal').getAttribute('data-partner-id');
    const gender = document.getElementById('babyInfoSetupModal').getAttribute('data-gender');
    const birthday = document.getElementById('newBabyBirthday').value;

    const girlImages = [
        "https://img.heliar.top/file/1773359645255_de22a3981443f9f716e5217a05c07388.png",
        "https://img.heliar.top/file/1773359763623_516b4835a2260d3497ffaf36488315b4.png",
        "https://img.heliar.top/file/1773363198260_6539b1902ab6d935ece61475f2d5b2a4.png"
    ];
    const boyImages = [
        "https://img.heliar.top/file/1773359832310_f34a8031443c88b1e8eca35e7a9055af.png",
        "https://img.heliar.top/file/1773359831234_66ae9011f14fa1d5c3453e067588f523.png",
        "https://img.heliar.top/file/1773359833023_e8d5c5ea9f83f8291f68679124b6f8d7.png"
    ];

    const bodyImage = gender === '女孩' 
        ? girlImages[Math.floor(Math.random() * girlImages.length)] 
        : boyImages[Math.floor(Math.random() * boyImages.length)];

    // --- 核心修改：根据性别直接写入指定的头像URL ---
    const finalAvatarUrl = gender === '女孩' 
        ? "https://img.heliar.top/file/1773406179317_0dbc48d4a85da468d34fae99f89d9cac.jpeg"
        : "https://img.heliar.top/file/1773406186786_18633a9b4972e3d5f7983874a9ea4837.jpeg";

    const babyId = `baby_${Date.now()}`;
    const newBaby = {
        id: babyId,
        partnerId: partnerId,
        name: name,
        gender: gender,
        birthday: birthday,
        age: 3, 
        avatar: finalAvatarUrl, // <--- 使用判断好的头像
        bodyImage: bodyImage,
        traits: null, 
        diaryLogs: []
    };

    babyChats[babyId] = {
        baby: [],
        partner: [],
        group: []
    };

    babies.push(newBaby);
    await saveData();
    
    document.getElementById('babyInfoSetupModal').classList.remove('show');
    showToast("🎉 宝宝入驻奇遇空间！");
    
    // 立刻进入房间
    openBabyRoom(babyId);
    
    // 进入房间后后台异步生成特质
    generateBabyTraits(babyId);
}

// 异步生成宝宝特质
async function generateBabyTraits(babyId) {
    const baby = babies.find(b => b.id === babyId);
    if (!baby || baby.traits) return; // 如果已经有了就不生成

    const friend = friends.find(f => f.id === baby.partnerId);
    if (!friend) return;
    const personaId = friend.activeUserPersonaId || 'default_user';
    const persona = userPersonas.find(p => p.id === personaId) || userProfile;

    const settings = await dbManager.get('apiSettings', 'settings');
    if (!settings || !settings.apiKey) return;

    const prompt = `
    【任务】: 用户 "${persona.name}" (人设: ${persona.personality}) 和 AI角色 "${friend.name}" (人设: ${friend.role}) 共同领养了一个 ${baby.gender} 宝宝，名叫 "${baby.name}"。
    请根据"父母"双方的人设基因，合理推断并生成这个宝宝的初始特质。
    
    【要求返回纯净的JSON格式】:
    {
        "appearanceLevel": "颜值评级(如 S, A+, 绝美)",
        "appearanceDesc": "样貌描述(融合父母特征，50字内)",
        "hobbies": ["爱好1", "爱好2", "爱好3"],
        "badHabits": ["小毛病1", "小毛病2"],
        "dailyPlan": "今天的计划(如：学习画画、和爸爸去公园)",
        "wishes": "目前的心愿"
    }`;

    try {
        const res = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        const data = await res.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            baby.traits = JSON.parse(jsonMatch[0]);
            await saveData();
            
            // 如果用户手快此时就在看成长档案，自动刷新
            if (document.getElementById('babyInfoScreen').classList.contains('active')) {
                renderBabyInfo();
            }
        }
    } catch (e) {
        console.error("AI生成特质失败，使用默认值", e);
        // 兜底
        baby.traits = {
            appearanceLevel: "A级", appearanceDesc: "继承了父母的优点，非常可爱。",
            hobbies: ["发呆", "吃零食"], badHabits: ["挑食"], dailyPlan: "吃饱睡好", wishes: "快快长大"
        };
        await saveData();
        if (document.getElementById('babyInfoScreen').classList.contains('active')) {
            renderBabyInfo();
        }
    }
}

// ==============================================================
// 3. 宝宝房间导航 & 渲染
// ==============================================================

function backToBabyList() {
    setActivePage('babyListScreen');
    renderBabyList();
}

function openBabyRoom(babyId) {
    currentBabyId = babyId;
    const baby = babies.find(b => b.id === babyId);
    if (!baby) return;

    document.getElementById('roomBabyName').textContent = `${baby.name} 的房间`;
    
    // 1. 动态注入拖拽特效和气泡动画 (去除了呼吸动效)
    if (!document.getElementById('baby-dynamic-style')) {
        const style = document.createElement('style');
        style.id = 'baby-dynamic-style';
        style.innerHTML = `
            .baby-body-anim {
                transition: opacity 0.3s ease; /* 切换图片时稍微柔和点 */
            }
            .baby-blob-wrapper.dragging .baby-body-anim {
                transform: scale(1.05) translateY(-10px); /* 拎起来的效果保留 */
            }
            /* 补充缺失的气泡动画 */
            @keyframes babyFloatThinking {
                0%, 100% { opacity: 1; transform: translateX(-50%) translateY(0); }
                50% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
            }
            @keyframes babyFloatReply {
                0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                80% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
            .baby-poke-float {
                z-index: 100;
            }
            .baby-poke-float.thinking {
                /* 思考时：常亮并轻轻上下浮动 */
                animation: babyFloatThinking 1.5s infinite ease-in-out;
            }
            .baby-poke-float.reply {
                /* 回复后：显示 4 秒后渐渐向上消失 */
                animation: babyFloatReply 4s ease-in-out forwards;
            }
        `;
        document.head.appendChild(style);
    }

    const roomContainer = document.querySelector('.baby-room-container');
    if (roomContainer) {
        roomContainer.innerHTML = `
            <img src="https://img.heliar.top/file/1773417897163_ee0b3ec45928dc5d8fa1fd18dc36cf8f.jpeg" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; pointer-events: none;">
            
            <div class="baby-blob-wrapper" id="babyDraggable" onclick="pokeBaby()" style="position:absolute; bottom: 12%; left: 50%; transform: translateX(-50%); z-index: 10;">
                <img src="${baby.bodyImage}" style="width: 320px; height: auto; object-fit:contain; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.15)); pointer-events: none;" class="baby-body-anim">
                <div id="babyPokeFloat" class="baby-poke-float"></div>
            </div>
        `;

        // 2. 绑定随意拖拽逻辑
        const wrapper = document.getElementById('babyDraggable');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        wrapper.addEventListener('touchstart', (e) => {
            isDragging = true;
            wrapper.classList.add('dragging');
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;

            const rect = wrapper.getBoundingClientRect();
            const parentRect = roomContainer.getBoundingClientRect();
            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;

            wrapper.style.bottom = 'auto';
            wrapper.style.right = 'auto';
            wrapper.style.transform = 'none';
            wrapper.style.left = initialLeft + 'px';
            wrapper.style.top = initialTop + 'px';
        }, {passive: false});

        wrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); 
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            wrapper.style.left = (initialLeft + dx) + 'px';
            wrapper.style.top = (initialTop + dy) + 'px';
        }, {passive: false});

        wrapper.addEventListener('touchend', () => {
            isDragging = false;
            wrapper.classList.remove('dragging');
        });

        // 3. 随机切换动作
        clearInterval(babyActionTimer); 
        const imgArray = baby.gender === '女孩' ? globalGirlImages : globalBoyImages;
        
        babyActionTimer = setInterval(() => {
            const imgEl = document.querySelector('.baby-body-anim');
            if (imgEl && !wrapper.classList.contains('dragging')) {
                const randomImg = imgArray[Math.floor(Math.random() * imgArray.length)];
                imgEl.src = randomImg;
            }
        }, 6000 + Math.random() * 4000); 
    }

    setActivePage('babyRoomScreen');
}

function backToBabyRoom() {
    setActivePage('babyRoomScreen');
}

function openBabyInfoScreen() {
    setActivePage('babyInfoScreen');
    renderBabyInfo();
}

function openBabyChatListScreen() {
    setActivePage('babyChatListScreen');
    renderBabyChatList();
}

function openBabyDiaryScreen() {
    setActivePage('babyDiaryScreen');
    renderBabyDiary();
}

// ==============================================================
// 4. 成长档案渲染 (手帐线圈本重构版)
// ==============================================================
function renderBabyInfo() {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    // 获取整个本子内页的容器
    const pageContainer = document.querySelector('#babyInfoScreen .notebook-page');
    if (!pageContainer) return;

    // 清空页面
    pageContainer.innerHTML = '';

    if (!baby.traits) {
        pageContainer.innerHTML = `
            <div style="text-align:center; padding: 80px 20px; color:#A67C52;">
                <i class="ri-loader-4-line fa-spin" style="font-size:32px;"></i><br><br>
                正在用魔法测算宝宝的基因特质...
            </div>`;
        return;
    }

    const tr = baby.traits;

    // 处理兴趣爱好和习惯的标签
    const hobbiesHtml = (tr.hobbies || []).map(h => `<span class="scrap-tag">${h}</span>`).join('');
    const habitsHtml = (tr.badHabits || []).map(h => `<span class="scrap-tag bad">${h}</span>`).join('');

    // 【1. 拍立得照片：基础信息】
    const polaroidHtml = `
        <div class="scrap-polaroid">
            <div class="washi-tape pink" style="top: -10px; left: 50%; transform: translateX(-50%) rotate(-3deg); width: 80px;"></div>
            <div style="width: 100%; aspect-ratio: 1/1; background-image: url('${baby.avatar}'); background-size: cover; background-position: center; border-radius: 4px; background-color: #eee;"></div>
            <div style="text-align: center; margin-top: 15px;">
                <div style="font-size: 20px; font-weight: bold; color: #333;">${baby.name}</div>
                <div style="font-size: 13px; color: #888; font-family: sans-serif;">${baby.gender} · ${baby.age} 岁</div>
            </div>
        </div>
    `;

    // 【2. 牛皮纸碎片：颜值鉴定】
    const appearanceHtml = `
        <div class="scrap-kraft">
            <div class="washi-tape" style="top: -8px; right: -15px; width: 60px; transform: rotate(45deg);"></div>
            <div class="scrap-title"><i class="ri-sparkling-line" style="color: #F4A261;"></i> 颜值鉴定：[${tr.appearanceLevel}]</div>
            <div class="scrap-text">${tr.appearanceDesc}</div>
        </div>
    `;

    // 【3. 奶油便利贴：习惯与爱好】
    const traitsHtml = `
        <div class="scrap-sticky">
            <div class="washi-tape blue" style="top: -10px; left: 10px; width: 50px;"></div>
            <div style="margin-bottom: 15px;">
                <div class="scrap-title"><i class="ri-palette-line" style="color: #2A9D8F;"></i> 兴趣爱好</div>
                <div>${hobbiesHtml || '<span style="color:#999;font-size:12px;">还在发掘中...</span>'}</div>
            </div>
            <div>
                <div class="scrap-title"><i class="ri-error-warning-line" style="color: #E76F51;"></i> 待纠正小毛病</div>
                <div>${habitsHtml || '<span style="color:#999;font-size:12px;">乖宝宝一个~</span>'}</div>
            </div>
        </div>
    `;

    // 【4. 格子纸片段：计划与心愿】
    const planHtml = `
        <div class="scrap-grid">
            <div class="washi-tape green" style="bottom: -10px; right: 20px; width: 70px;"></div>
            <div style="margin-bottom: 15px;">
                <div class="scrap-title"><i class="ri-calendar-todo-line" style="color: #619B8A;"></i> 今日计划</div>
                <div class="scrap-text" style="font-family: sans-serif; background: rgba(255,255,255,0.6); padding: 5px;">${tr.dailyPlan || '今天只想开心玩耍！'}</div>
            </div>
            <div>
                <div class="scrap-title"><i class="ri-star-smile-line" style="color: #E9C46A;"></i> 当前心愿</div>
                <div class="scrap-text" style="font-family: sans-serif; background: rgba(255,255,255,0.6); padding: 5px;">${tr.wishes || '无忧无虑长大'}</div>
            </div>
        </div>
    `;

    // 组合插入
    pageContainer.innerHTML = polaroidHtml + appearanceHtml + traitsHtml + planHtml;
}

let isBabyThinking = false; // 加一个状态锁，防止狂点导致重复请求

async function pokeBaby() {
    // 如果宝宝正在想事情，或者拖拽动作误触了点击，就直接返回
    if (isBabyThinking || document.getElementById('babyDraggable')?.classList.contains('dragging')) return;

    const img = document.querySelector('.baby-body-anim');
    const floatText = document.getElementById('babyPokeFloat');
    if (!img || !floatText) return;

    // 1. 简单的被戳到的缩放动画
    img.style.transform = 'scale(0.95) skewX(2deg)';
    setTimeout(() => img.style.transform = 'scale(1) skewX(0deg)', 150);

    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    // 2. 气泡换上循环的“思考中”样式
    isBabyThinking = true;
    floatText.textContent = "🐾..."; 
    floatText.className = 'baby-poke-float thinking';

    // 3. 调用 AI 接口
    try {
        const settings = await dbManager.get('apiSettings', 'settings');
        if (!settings || !settings.apiUrl || !settings.apiKey) {
            floatText.textContent = "麻麻没配API，饿饿~";
            floatText.className = 'baby-poke-float reply';
            isBabyThinking = false;
            return;
        }

        let traitsDesc = baby.traits ? `爱好：${baby.traits.hobbies.join(',')}。习惯：${baby.traits.badHabits.join(',')}。` : '软萌可爱';
        
        const prompt = `
【场景】：你是 ${baby.age}岁的${baby.gender}宝宝 "${baby.name}"。
【特质】：${traitsDesc}。
【动作】：你的爸爸/妈妈（用户）刚刚用手指戳了戳你/摸了摸你。
【任务】：请做出你当下的即时反应。
【要求】：
1. 语气必须符合你的年龄，充满童真（可带叠词、颜文字或拟声词）。
2. 非常简短！绝对不能超过 15 个字！
3. 只返回你嘴里说出的话或发出的声音，纯文本，不要引号。
`;

        const response = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: settings.modelName,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9,
                max_tokens: 30
            })
        });

        const data = await response.json();
        let aiReply = data.choices[0].message.content.trim().replace(/^["“”]|["“”]$/g, '');

        // 4. 获取到回复后，切换到 4 秒后自动消失的样式
        floatText.textContent = aiReply;
        // 先剥除旧的类强行重绘，再赋上新类以激活单次动画
        floatText.className = 'baby-poke-float';
        void floatText.offsetWidth; 
        floatText.className = 'baby-poke-float reply';

    } catch (error) {
        console.error("宝宝思考失败", error);
        floatText.textContent = "要抱抱！"; 
        floatText.className = 'baby-poke-float reply';
    } finally {
        isBabyThinking = false;
    }
}

// ==============================================================
// 6. 家族群聊列表 & 聊天详情
// ==============================================================

function renderBabyChatList() {
    const container = document.getElementById('babyChatListContainer');
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;
    const partner = friends.find(f => f.id === baby.partnerId);

    const chats = babyChats[currentBabyId] || { baby:[], partner:[], group:[] };

    const getPreview = (msgs) => {
        if (!msgs || msgs.length === 0) return '暂无消息';
        return msgs[msgs.length - 1].content.substring(0, 20) + '...';
    };

    container.innerHTML = `
        <div class="baby-chat-item" onclick="openBabyChatDetail('baby')">
            <div class="baby-chat-avatar" style="background-image: url('${baby.avatar}')"></div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; color: #333;">${baby.name}</div>
                <div style="font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${getPreview(chats.baby)}</div>
            </div>
        </div>

        <div class="baby-chat-item" onclick="openBabyChatDetail('partner')">
            <div class="baby-chat-avatar" style="background-image: url('${partner?.avatarImage || ''}')">${partner?.avatarImage ? '' : partner?.name[0]}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; color: #333;">${partner?.remark || partner?.name || '未知'}</div>
                <div style="font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${getPreview(chats.partner)}</div>
            </div>
        </div>

        <div class="baby-chat-item" onclick="openBabyChatDetail('group')">
            <div class="baby-chat-avatar" style="background: #F5E6D3; display:flex; align-items:center; justify-content:center; color:#8C6239; font-size:20px;"><i class="ri-group-line"></i></div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; color: #333;">相亲相爱一家人</div>
                <div style="font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${getPreview(chats.group)}</div>
            </div>
        </div>
    `;
}

function openBabyChatDetail(target) {
    currentBabyChatTarget = target;
    const baby = babies.find(b => b.id === currentBabyId);
    const partner = friends.find(f => f.id === baby.partnerId);

    let title = "";
    if (target === 'baby') title = baby.name;
    else if (target === 'partner') title = partner?.remark || partner?.name || '伴侣';
    else title = "相亲相爱一家人";

    document.getElementById('babyChatTitle').textContent = title;
    document.querySelector('.phone').classList.add('status-bar-hidden');

    // 动态注入接收按钮并设置面包暖色输入框
    const chatInputDiv = document.querySelector('#babyChatDetailScreen .chat-input');
    if (chatInputDiv) {
        chatInputDiv.innerHTML = `
            <button class="chat-btn" style="color: #D4A373; padding: 0 10px;" onclick="receiveBabyChatMessage()" title="接收回复">
                <i class="ri-mail-download-line" style="font-size: 24px;"></i>
            </button>
            <textarea id="babyChatInput" rows="1" placeholder="哄哄孩子..." style="flex:1; background: #FDF8F5; border: 1px solid #E6CCB2; border-radius: 20px; padding: 10px 15px; outline: none;"></textarea>
            <button class="chat-btn send-btn active" style="background: #D4A373; color: white; width: 40px; margin-left: 10px;" onclick="sendBabyChatMessage()">
                <i class="ri-send-plane-fill"></i>
            </button>
        `;
    }

    setActivePage('babyChatDetailScreen');
    renderBabyMessages();
}

function closeBabyChatDetail() {
    setActivePage('babyChatListScreen');
    applyStatusBarVisibility();
    renderBabyChatList();
}

function renderBabyMessages() {
    const container = document.getElementById('babyChatMessagesArea');
    container.innerHTML = '';

    const msgs = babyChats[currentBabyId][currentBabyChatTarget] || [];
    const baby = babies.find(b => b.id === currentBabyId);
    const partner = friends.find(f => f.id === baby.partnerId);

    msgs.forEach(m => {
        const isMe = m.senderId === 'user';
        const div = document.createElement('div');
        div.className = `message ${isMe ? 'sent' : 'received'}`;

        let avatarUrl = '';
        let nameInitial = '';
        let senderNameHtml = '';

        if (isMe) {
            avatarUrl = userProfile.avatarImage;
            nameInitial = '我';
        } else {
            if (m.senderId === 'baby') {
                avatarUrl = baby.avatar;
                if (currentBabyChatTarget === 'group') senderNameHtml = `<div class="message-sender-name">${baby.name}</div>`;
            } else {
                avatarUrl = partner ? partner.avatarImage : '';
                nameInitial = partner ? partner.name[0] : '?';
                if (currentBabyChatTarget === 'group') senderNameHtml = `<div class="message-sender-name">${partner?.name || '未知'}</div>`;
            }
        }

        const avatarHtml = avatarUrl
            ? `<div class="chat-avatar" style="background-image:url('${avatarUrl}'); border: 2px solid ${isMe ? '#D4A373' : '#E6CCB2'};"></div>`
            : `<div class="chat-avatar" style="background:#FFF3E0; color:#8C6239;">${nameInitial}</div>`;

        const bubbleHtml = `
            <div class="message-body">
                ${senderNameHtml}
                <div class="message-content">${m.content}</div>
            </div>
        `;

        div.innerHTML = isMe ? (bubbleHtml + avatarHtml) : (avatarHtml + bubbleHtml);
        
        // --- 核心修复：绑定长按菜单事件 (增加滑动容错) ---
        const contentEl = div.querySelector('.message-content');
        if (contentEl) {
            const showMenuFn = (e) => showBabyMessageMenu(e, contentEl, m.id, isMe);
            contentEl.addEventListener('contextmenu', showMenuFn);
            
            let timer;
            let startX, startY;
            contentEl.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                timer = setTimeout(() => showMenuFn(e), 500); // 500ms 触发
            }, { passive: true });
            
            contentEl.addEventListener('touchend', () => clearTimeout(timer));
            
            // 加入位移判断，手滑超过 10 像素才取消长按（防止肉颤）
            contentEl.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) {
                    clearTimeout(timer);
                }
            }, { passive: true });
        }
        // ------------------------------------------

        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}


// 1. 显示气泡操作菜单
function showBabyMessageMenu(event, el, msgId, isMe) {
    event.preventDefault();
    event.stopPropagation();
    
    const menu = document.getElementById('messageMenu');
    let menuItems = '';

    // 【修改点1】: 拼接变量加上单引号，防呆处理
    if (!isMe) {
        menuItems += `<div class="message-menu-item" onclick="regenerateBabyMessage('${msgId}')">重回</div>`;
    }
    menuItems += `<div class="message-menu-item danger" onclick="deleteBabyMessage('${msgId}')">删除</div>`;

    menu.innerHTML = menuItems;
    menu.classList.add('show');
    
    // 【核心修复】: 强行将菜单的层级提到 9999，碾压聊天页面的 2000！
    menu.style.zIndex = '9999';
    
    // 定位菜单
    const rect = el.getBoundingClientRect();
    let x = rect.left + window.scrollX;
    let y = rect.bottom + window.scrollY + 5;
    if (x + menu.offsetWidth > window.innerWidth) x = window.innerWidth - menu.offsetWidth - 10;
    if (y + menu.offsetHeight > window.innerHeight) y = rect.top + window.scrollY - menu.offsetHeight - 5;
    
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    setTimeout(() => document.addEventListener('click', hideMessageMenu, { once: true }), 0);
}

// 2. 删除单条消息
async function deleteBabyMessage(msgIdStr) {
    hideMessageMenu();
    const msgs = babyChats[currentBabyId][currentBabyChatTarget];
    
    // 【修改点2】: 统一转化为 String 比较，杜绝类型隐患
    babyChats[currentBabyId][currentBabyChatTarget] = msgs.filter(m => String(m.id) !== String(msgIdStr));
    
    await saveData();
    renderBabyMessages();
}

// 3. 消息重回（删除这轮AI的消息并重新请求）
async function regenerateBabyMessage(msgIdStr) {
    hideMessageMenu();
    const msgs = babyChats[currentBabyId][currentBabyChatTarget];
    
    // 【修改点3】: 统一转化为 String 查找
    const startIndex = msgs.findIndex(m => String(m.id) === String(msgIdStr));
    if (startIndex === -1) return;

    const messagesToDeleteIds = new Set();
    messagesToDeleteIds.add(msgs[startIndex].id);

    // 往前找，把同一次回复中AI连发的消息都删掉
    for (let i = startIndex - 1; i >= 0; i--) {
        if (msgs[i].senderId !== 'user') messagesToDeleteIds.add(msgs[i].id);
        else break;
    }
    // 往后找
    for (let i = startIndex + 1; i < msgs.length; i++) {
        if (msgs[i].senderId !== 'user') messagesToDeleteIds.add(msgs[i].id);
        else break;
    }

    // 过滤掉这些消息并保存
    babyChats[currentBabyId][currentBabyChatTarget] = msgs.filter(m => !messagesToDeleteIds.has(m.id));
    await saveData();
    renderBabyMessages();
    
    // 触发重新生成
    triggerBabyChatAI();
}

// 发送消息
async function sendBabyChatMessage() {
    const input = document.getElementById('babyChatInput');
    const text = input.value.trim();
    if (!text) return;

    if (!babyChats[currentBabyId]) babyChats[currentBabyId] = { baby:[], partner:[], group:[] };
    
    babyChats[currentBabyId][currentBabyChatTarget].push({
        id: Date.now(),
        senderId: 'user',
        content: text
    });

    input.value = '';
    renderBabyMessages();
    await saveData();
}

async function receiveBabyChatMessage() {
    const input = document.getElementById('babyChatInput');
    const titleEl = document.getElementById('babyChatTitle');
    
    const oldPlaceholder = input.placeholder;
    const oldTitle = titleEl.textContent;

    input.placeholder = "正在输入...";
    titleEl.textContent = "对方正在输入...";
    input.disabled = true;

    await triggerBabyChatAI();

    // 恢复状态
    titleEl.textContent = oldTitle;
    input.placeholder = oldPlaceholder;
    input.disabled = false;
}

async function triggerBabyChatAI() {
    const baby = babies.find(b => b.id === currentBabyId);
    const partner = friends.find(f => f.id === baby.partnerId);
    if (!partner) return;

    const personaId = partner.activeUserPersonaId || 'default_user';
    const persona = userPersonas.find(p => p.id === personaId) || userProfile;

    const settings = await dbManager.get('apiSettings', 'settings');
    if (!settings || !settings.apiUrl) {
        showToast("请先配置API");
        return;
    }

    // 1. 读取当前聊天的历史 (增加到30条)
    const history = (babyChats[currentBabyId][currentBabyChatTarget] || []).slice(-30).map(m =>
        `${m.senderId === 'user' ? persona.name : (m.senderId === 'baby' ? baby.name : partner.name)}: ${m.content}`
    ).join('\n');

    // 2. 跨区记忆：读取微信主聊天记录 (最近10条)
    const wechatHistory = (chatHistories[partner.id] || []).slice(-10).map(m => 
        `${m.type === 'sent' ? persona.name : partner.name}: ${m.content}`
    ).join('\n');

    // 3. 跨区记忆：如果在私聊，就读点群聊；如果在群聊，就读点私聊
    let crossChatContext = "";
    if (currentBabyChatTarget === 'partner') {
        crossChatContext = "【你们在家族群聊的近期动态】:\n" + (babyChats[currentBabyId]['group'] || []).slice(-5).map(m => `${m.senderId === 'user' ? persona.name : (m.senderId === 'baby' ? baby.name : partner.name)}: ${m.content}`).join('\n');
    } else if (currentBabyChatTarget === 'group') {
        crossChatContext = "【你和用户在私聊的近期动态】:\n" + (babyChats[currentBabyId]['partner'] || []).slice(-5).map(m => `${m.senderId === 'user' ? persona.name : partner.name}: ${m.content}`).join('\n');
    }

    let traitsDesc = baby.traits ? `爱好：${baby.traits.hobbies.join(',')}。习惯：${baby.traits.badHabits.join(',')}。` : '一个可爱的小孩。';

    // 强调这是电子娃，防止AI代入现实
    const virtualBabyRule = `【绝对设定】：这是一款名叫“奇遇空间”的手机APP里的【虚拟电子宝宝】。你们是在手机上“云养娃”。绝对禁止出现“宝宝把家里的真沙发弄脏了”、“带宝宝去现实的医院”等涉及物理现实破坏/接触的违和话语！如果是互动，也是“在屏幕上戳一戳”、“在APP里买电子零食”等概念。`;
    
    // 强制输出JSON数组以实现分段回复
    const formatRule = `【回复要求】：请将你的回复随机拆分为 1 到 4 条短消息，甚至更多，模拟真实的聊天打字节奏。必须返回纯净的 JSON 数组格式。`;

    let prompt = "";
    if (currentBabyChatTarget === 'baby') {
        prompt = `【场景】：你是 ${baby.age}岁的虚拟宝宝 "${baby.name}"，正在手机APP上和用户也就是你的妈妈 "${persona.name}" 聊天。
        你的性格特征：${traitsDesc}
        ${virtualBabyRule}
        【历史记录】：\n${history || '暂无'}
        【任务】：用儿童的口吻回复 "${persona.name}"。
        ${formatRule}
        【JSON格式示例】：["麻麻！", "我要吃电子小饼干~"]`;
    } else if (currentBabyChatTarget === 'partner') {
        prompt = `【场景】：你("${partner.name}")正和用户("${persona.name}")在"奇遇空间"APP的私聊界面聊天。
        【你的人设】：${partner.role}
        【用户人设】：${persona.personality}
        
        【记忆互通库】：
        微信主聊天记录参考：\n${wechatHistory || '无'}
        ${crossChatContext}
        【当前私聊记录】：\n${history || '暂无'}
        
        【聊天铁律】：
        1. 保持你原本的人设和说话方式！你只是恰好在这个APP里聊天，**不要变成三句不离孩子的带娃机器**。
        2. 像平时一样正常闲聊、吐槽、调情或谈正事。可以自然地提起“微信主聊天记录”或“群聊”里发生的事。
        3. 只有当用户主动提起宝宝（"${baby.name}"，${baby.age}岁，${traitsDesc}）时，你才顺着话题聊几句，否则就聊你们自己的事。
        4.可以在聊天里偶尔提起宝宝寻找话题
        ${virtualBabyRule}
        【任务】：回复用户。${formatRule}
        【JSON格式示例】：["好啊", "听你的"]`;
    } else {
        prompt = `【场景】：你("${partner.name}")、用户("${persona.name}")和你们的电子宝宝("${baby.name}")正在"相亲相爱一家人"群聊。
        【你的人设】：${partner.role}
        【用户人设】：${persona.personality}
        
        【记忆互通库】：
        微信主聊天记录参考：\n${wechatHistory || '无'}
        ${crossChatContext}
        【当前群聊记录】：\n${history || '暂无'}
        
        【聊天铁律】：
        1. **维持你原本的人设！** 不要因为在家庭群就变得死板或全是慈父/慈母腔调。如果是傲娇/高冷/沙雕人设，请继续保持。
        2. 可以和用户聊日常，也可以逗逗宝宝，或者把“微信私聊”里的话题拿到群里说。
        3. 电子宝宝特征：${baby.age}岁，${traitsDesc}。
        ${virtualBabyRule}
        【任务】：让 "${partner.name}" 或 "${baby.name}"（或两人交替）发言，总共生成 1 到 3 条消息。
        ${formatRule}
        【JSON格式示例】：[{"sender": "${partner.name}", "content": "刚微信跟你说的你看了没？"}, {"sender": "${baby.name}", "content": "拔拔麻麻在聊什么呀！"}]`;
    }

    try {
        const response = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                model: settings.modelName, 
                messages: [{ role: 'user', content: prompt }], 
                temperature: parseFloat(settings.apiTemperature) || 0.9 
            })
        });
        const data = await response.json();
        
        // 增加数据预清洗
        let resText = data.choices[0].message.content.trim();
        resText = resText.replace(/```json\s*|```/g, ''); // 移除可能的 markdown 标记

        let replies = [];
        const jsonMatch = resText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                replies = JSON.parse(jsonMatch[0]);
            } catch (e) {
                replies = [resText.replace(/["“”]/g, '')];
            }
        } else {
            replies = [resText.replace(/["“”]/g, '')];
        }

        // 逐条上屏，模拟打字延迟
        for (const item of replies) {
            await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

            let sId, content;
            
            // --- 核心修复：智能解析文本与对象 ---
            // 判断返回的 item 是不是一个对象
            if (typeof item === 'object' && item !== null) {
                // 如果是对象，挖出里面的 content 字段
                content = item.content || item.message || item.text || JSON.stringify(item);
                // 群聊需要判断说话人，私聊不需要
                if (currentBabyChatTarget === 'group') {
                    const senderName = item.sender || item.author || '';
                    sId = senderName.includes(baby.name) ? 'baby' : partner.id;
                } else {
                    sId = currentBabyChatTarget === 'baby' ? 'baby' : partner.id;
                }
            } else {
                // 如果本来就是纯文本字符串
                content = String(item);
                sId = currentBabyChatTarget === 'baby' ? 'baby' : partner.id;
            }
            // ---------------------------------

            babyChats[currentBabyId][currentBabyChatTarget].push({ 
                id: Date.now(), 
                senderId: sId, 
                content: content 
            });

            await saveData();
            
            // 立即刷新UI
            if (document.getElementById('babyChatDetailScreen').classList.contains('active')) {
                renderBabyMessages();
            }
        }

    } catch (e) {
        console.error("聊天AI请求失败", e);
        showToast("网络波动，请重试");
    }
}

// ==============================================================
// 7. 涂鸦手账（日记）
// ==============================================================
function renderBabyDiary() {
    const container = document.getElementById('babyDiaryListContainer');
    const baby = babies.find(b => b.id === currentBabyId);
    container.innerHTML = '';

    if (!baby.diaryLogs || baby.diaryLogs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px 20px; color:#A67C52; opacity:0.6;">手账本还是新的呢<br>点击右上角让宝宝记录今天吧</div>';
        return;
    }

    // 找到伴侣（爸爸）的信息，用来显示名字
    const partner = friends.find(f => f.id === baby.partnerId);
    const dadName = partner ? (partner.remark || partner.name) : '爸爸';

    baby.diaryLogs.slice().reverse().forEach(log => {
        // 兼容旧日记（如果旧日记没有爸爸批语，就不显示这一行）
        const dadCommentHtml = log.dadComment 
            ? `<div style="text-align:right; font-size:12px; color:#8C6239; margin-top:6px; font-weight:bold;">🧑 ${dadName}的留言: ${log.dadComment}</div>` 
            : '';

        container.innerHTML += `
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px dashed #F5E6D3;">
                <div style="font-weight:bold; color:#D84315; font-size:14px; margin-bottom:8px;">📅 ${log.date} · 天气：${log.weather}</div>
                <div style="color:#4C4033; font-size:15px; line-height:1.8; text-indent: 2em; text-align: justify;">${log.content}</div>
                <div style="text-align:right; font-size:12px; color:#A67C52; margin-top:15px; font-style:italic;">✎ 老师批语: ${log.teacherComment}</div>
                ${dadCommentHtml}
            </div>
        `;
    });
}

// AI 生成宝宝日记（每天一篇限制）
async function generateBabyDiary() {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;
    
    // 检查今天是否已经写过日记
    const todayStr = new Date().toLocaleDateString('zh-CN');
    const hasWrittenToday = baby.diaryLogs && baby.diaryLogs.some(log => log.date === todayStr);
    
    if (hasWrittenToday) {
        return showAlert("宝宝今天已经写过日记啦，明天再来辅导吧~");
    }

    const btn = document.querySelector('#babyDiaryScreen .nav-btn[onclick="generateBabyDiary()"]');
    if (btn) btn.textContent = "辅导中...";

    showToast("宝宝正在咬着笔头写日记...", 3000);
    const partner = friends.find(f => f.id === baby.partnerId);
    const settings = await dbManager.get('apiSettings', 'settings');
    
    if (!settings || !settings.apiUrl) {
        if (btn) btn.textContent = "辅导";
        return showToast("请先配置API");
    }

    const chats = babyChats[currentBabyId] || { baby: [], partner: [], group: [] };
    const chatSum = [...chats.baby, ...chats.group].slice(-20).map(m => m.content).join(' | ');

    // --- 核心修改：在 Prompt 中加入爸爸的人设，并要求返回 dadComment ---
    const prompt = `
    【任务】: 扮演 ${baby.age}岁的宝宝 "${baby.name}" 写一篇绘本风格的短日记。
    【今天家里发生的聊天素材】: ${chatSum || "今天在房间里玩玩具，爸爸妈妈也来看我了。"}
    【另一位家长(爸爸)的人设】: ${partner ? partner.role : '普通的爸爸'}
    
    【要求】:
    1. 语气符合年龄，充满童真，可以有错别字或奇怪的拼音，逻辑可以跳跃。
    2. 必须包含宝宝的日记正文，以及两份大人的批语。
    3. 严格返回以下 JSON 格式：
    {
      "weather": "晴/雨/云等", 
      "content": "日记正文(100字左右)", 
      "teacherComment": "幼儿园老师的幽默批注(20字内)",
      "dadComment": "爸爸看完这篇日记后的批注，语气必须极度符合【爸爸的人设】(20字内)"
    }
    `;

    try {
        const response = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        const data = await response.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if(!jsonMatch) throw new Error("JSON Parse Error");
        const log = JSON.parse(jsonMatch[0]);

        log.date = todayStr;
        if (!baby.diaryLogs) baby.diaryLogs = [];
        // 插入到最前面
        baby.diaryLogs.unshift(log);

        await saveData();
        renderBabyDiary();
        showToast("日记写好了！爸爸也签了字！");
    } catch (e) {
        console.error(e);
        showAlert("辅导失败，请重试。");
    } finally {
        if (btn) btn.textContent = "辅导";
    }
}

// ==============================================================
// 8. 孩子删除/送别功能
// ==============================================================

// 打开删除弹窗
function openBabyDeleteModal() {
    if (babies.length === 0) return showToast("当前没有宝宝可以送别哦~");

    const list = document.getElementById('babyDeleteList');
    list.innerHTML = '';

    babies.forEach(baby => {
        const partner = friends.find(f => f.id === baby.partnerId) || { name: '未知' };
        const item = document.createElement('div');
        item.className = 'multi-select-item';
        item.style.padding = "10px";
        item.innerHTML = `
            <input type="radio" name="babyToDelete" id="del-baby-${baby.id}" value="${baby.id}" style="accent-color: #ff4d4d;">
            <label for="del-baby-${baby.id}" style="color: #555; font-weight: bold; margin-left: 10px; cursor: pointer;">
                ${baby.name} <span style="font-size:12px; color:#999; font-weight:normal;">(和 ${partner.name})</span>
            </label>
        `;
        list.appendChild(item);
    });

    document.getElementById('babyDeleteModal').classList.add('show');
}

// 关闭弹窗
function closeBabyDeleteModal() {
    document.getElementById('babyDeleteModal').classList.remove('show');
}

// 确认删除逻辑
async function confirmDeleteBaby() {
    const selected = document.querySelector('input[name="babyToDelete"]:checked');
    if (!selected) return showToast("请选择要送别的宝宝");

    const babyId = selected.value;
    const baby = babies.find(b => b.id === babyId);
    if (!baby) return;

    showConfirm(`确定要送别宝宝 "${baby.name}" 吗？\nTA所有的成长档案、日记和聊天记录都将被永久清空！`, async (confirmed) => {
        if (!confirmed) return;

        // 1. 从数据库中硬删除
        await dbManager.delete('babies', babyId);
        await dbManager.delete('babyChats', babyId);

        // 2. 从内存中过滤掉
        babies = babies.filter(b => b.id !== babyId);
        delete babyChats[babyId];

        // 3. 强制保存一次确保同步
        await saveData();

        // 4. 刷新UI
        closeBabyDeleteModal();
        renderBabyList();
        showToast(`宝宝 "${baby.name}" 已经离开了...`);
    });
}

// ==============================================================
// 9. 幼儿园/学习系统 (属性养成 + 突发事件 + 考试)
// ==============================================================

// 页面导航
function openBabyActivityScreen() {
    setActivePage('babyActivityScreen');
}

function backToActivityList() {
    setActivePage('babyActivityScreen');
}

// 打开学习主页 (修复状态残留版)
async function openBabySchoolScreen() {
    // 【核心修复】：在显示页面前，强制清空上一个宝宝的缓存 UI
    document.getElementById('babyStatsPanel').innerHTML = `
        <div style="text-align: center; color: #999; padding: 20px;">
            <i class="ri-loader-4-line fa-spin"></i> 正在读取学籍档案...
        </div>
    `;
    document.getElementById('babyStudyCount').textContent = '-';

    setActivePage('babySchoolScreen');
    
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    // 1. 检查/重置每日次数
    const todayStr = new Date().toLocaleDateString();
    if (baby.lastStudyDate !== todayStr) {
        baby.studyCountToday = 0;
        baby.lastStudyDate = todayStr;
        await saveData();
    }
    document.getElementById('babyStudyCount').textContent = 3 - (baby.studyCountToday || 0);

    // 2. 初始化属性 (如果还没有)
    if (!baby.education) {
        document.getElementById('babyStatsPanel').innerHTML = `
            <div style="text-align: center; color: #999; padding: 20px;">
                <i class="ri-loader-4-line fa-spin"></i> 正在评估宝宝潜能...
            </div>
        `;
        await initBabyStats(baby);
    } else {
        renderBabyStats(baby);
    }
}

// AI生成初始潜能属性
async function initBabyStats(baby) {
    const settings = await dbManager.get('apiSettings', 'settings');
    if (!settings || !settings.apiUrl) {
        document.getElementById('babyStatsPanel').innerHTML = `<div style="color:red; text-align:center;">请先配置API以评估宝宝潜能</div>`;
        return;
    }

    const traitsDesc = baby.traits ? `基因特质：爱好[${baby.traits.hobbies.join(',')}]，缺点[${baby.traits.badHabits.join(',')}]` : '';
    const prompt = `
    你是一个儿童潜能评估专家。请根据宝宝"${baby.name}"的特质(${traitsDesc})，为TA随机生成初始的五维能力值(满分100)。
    请返回纯JSON对象：
    {
       "iq": 数字(智商,50-80),
       "eq": 数字(情商,50-80),
       "language": 数字(表达,30-60),
       "arts": 数字(艺术/想象,30-80),
       "health": 数字(体质,40-90),
       "eval": "一句简短的潜能评价词(如：极具艺术天赋的小捣蛋鬼)"
    }`;

    try {
        const response = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        const data = await response.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            baby.education = JSON.parse(jsonMatch[0]);
            baby.exams = []; // 初始化考试记录数组
            await saveData();
            renderBabyStats(baby);
        }
    } catch (e) {
        console.error("生成属性失败", e);
        // 兜底数据
        baby.education = { iq: 60, eq: 60, language: 50, arts: 50, health: 60, eval: "平平无奇的健康宝宝" };
        baby.exams = [];
        await saveData();
        renderBabyStats(baby);
    }
}

// 渲染属性面板
function renderBabyStats(baby) {
    const edu = baby.education;
    const panel = document.getElementById('babyStatsPanel');
    
    // 计算总分来判断是否触发考试
    const totalStats = edu.iq + edu.eq + edu.language + edu.arts + edu.health;

    panel.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; color: #8C6239; margin-bottom: 5px; text-align: center;">${baby.name} 的学籍卡</div>
        <div style="font-size: 12px; color: #A67C52; text-align: center; margin-bottom: 15px; font-style: italic;">"${edu.eval}"</div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; color: #555;">
            <div>智力: <b style="color:#D4A373;">${edu.iq}</b></div>
            <div>情商: <b style="color:#D4A373;">${edu.eq}</b></div>
            <div>表达: <b style="color:#D4A373;">${edu.language}</b></div>
            <div>艺术: <b style="color:#D4A373;">${edu.arts}</b></div>
            <div style="grid-column: 1/-1;">体质: <b style="color:#D4A373;">${edu.health}</b></div>
        </div>
        <div style="margin-top: 15px; font-size: 12px; color: #999; text-align: center;">综合能力值: ${totalStats}</div>
    `;
}

// 打开课程选择
function openStudySelectModal() {
    const baby = babies.find(b => b.id === currentBabyId);
    if (baby.studyCountToday >= 3) return showToast("宝宝今天太累了，明天再学吧！");
    document.getElementById('babyStudySelectModal').classList.add('show');
}

// 开始学习 -> 触发 3 个连续突发事件
async function startBabyStudy(subject, actionName) {
    document.getElementById('babyStudySelectModal').classList.remove('show');
    
    const baby = babies.find(b => b.id === currentBabyId);
    baby.studyCountToday++;
    document.getElementById('babyStudyCount').textContent = 3 - baby.studyCountToday;
    await saveData();

    showToast(`宝宝正在进行 [${actionName}]...`, 3000);
    
    const settings = await dbManager.get('apiSettings', 'settings');
    if (!settings.apiUrl) return;

    // --- 修改：指令改为生成 3 个事件，并直接带上数值加减 ---
    const prompt = `
    【场景】：${baby.age}岁的宝宝"${baby.name}"正在上幼儿园，当前的活动是：【${actionName}】。
    【任务】：请生成 3 个宝宝在这次学习过程中发生的突发小事件（例如：开小差、捣乱、或是出人意料的聪明举动等）。
    每次事件都会导致宝宝的一项能力值发生变化（加分或减分）。
    
    【格式严格要求纯JSON】：
    {
      "events": [
        { 
          "desc": "宝宝上课时偷偷在课本上画了一只小乌龟，被老师夸奖了。", 
          "statKey": "arts", 
          "statName": "艺术", 
          "change": 3 
        },
        { 
          "desc": "宝宝因为不想吃青菜，和同桌吵了一架，还哭了。", 
          "statKey": "eq", 
          "statName": "情商", 
          "change": -2 
        },
        { 
          "desc": "宝宝率先回答出了老师提问的算术题！", 
          "statKey": "iq", 
          "statName": "智力", 
          "change": 5 
        }
      ]
    }
    注意："statKey" 必须严格在 "iq"、"eq"、"language"、"arts"、"health" 这五个英文词中选择一个。
    "statName" 必须是你选的对应的中文名（智力、情商、表达、艺术、体质）。`;

    try {
        const res = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        const data = await res.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        const eventData = JSON.parse(jsonMatch[0]);

        showStudyEvent(eventData, baby);

    } catch (e) {
        console.error("事件生成失败", e);
        showToast("宝宝乖乖上完了课，能力微弱提升。");
        baby.education.iq += 1;
        await saveData();
        renderBabyStats(baby);
        checkExamTrigger(baby); 
    }
}

// 弹出事件结算报告 (自动加减属性)
function showStudyEvent(eventData, baby) {
    const listContainer = document.getElementById('studyEventList');
    listContainer.innerHTML = '';

    if (eventData.events && Array.isArray(eventData.events)) {
        eventData.events.forEach(evt => {
            // 1. 自动结算属性变化
            if (baby.education[evt.statKey] !== undefined) {
                baby.education[evt.statKey] += evt.change;
                // 防止属性扣到负数
                if (baby.education[evt.statKey] < 0) baby.education[evt.statKey] = 0;
            }

            // 2. 渲染单条事件卡片
            const sign = evt.change > 0 ? '+' : '';
            const color = evt.change > 0 ? '#388E3C' : '#E76F51'; // 绿加红减
            const icon = evt.change > 0 ? 'ri-arrow-up-circle-fill' : 'ri-arrow-down-circle-fill';

            const item = document.createElement('div');
            item.style.cssText = 'background: #FDF8F5; border: 1px dashed #D4A373; border-radius: 12px; padding: 12px; font-size: 14px; color: #555;';
            
            item.innerHTML = `
                <div style="margin-bottom: 8px; line-height: 1.5;">${evt.desc}</div>
                <div style="font-weight: bold; color: ${color}; display: flex; align-items: center; gap: 5px; font-size: 13px;">
                    <i class="${icon}"></i> ${evt.statName} ${sign}${evt.change}
                </div>
            `;
            listContainer.appendChild(item);
        });
    }

    // 3. 在后台保存并立刻更新主页的五维面板数值
    saveData().then(() => {
        renderBabyStats(baby);
    });

    // 4. 绑定底部的“我知道了”按钮
    const confirmBtn = document.getElementById('confirmStudyEventBtn');
    confirmBtn.onclick = () => {
        document.getElementById('babyStudyEventModal').classList.remove('show');
        checkExamTrigger(baby); // 确认阅读报告后，检查是否达标触发考试
    };

    // 显示弹窗
    document.getElementById('babyStudyEventModal').classList.add('show');
}

// ==============================================================
// 考试系统逻辑
// ==============================================================

// ==============================================================
// 考试系统逻辑 (学习3次后触发，成绩循序渐进 + 随机失常)
// ==============================================================

// 检查是否触发考试
async function checkExamTrigger(baby) {
    // 触发条件：当天的学习次数刚好达到 3 次时，触发考试
    if (baby.studyCountToday === 3) {
        setTimeout(() => {
            const examName = baby.exams.length === 0 ? '【入学摸底考】' : '【随堂小测验】';
            // 不给取消的机会，直接通知并开始批卷
            showToast(`叮铃铃！课程结束，${examName} 开始！`);
            generateExamPaper(baby);
        }, 800);
    }
}

// AI生成试卷 (动态分数计算)
async function generateExamPaper(baby) {
    showToast("老师正在批改试卷...", 3000);
    
    const settings = await dbManager.get('apiSettings', 'settings');
    const isEntrance = baby.exams.length === 0;
    
    // --- 核心逻辑：计算本次考试的预期分数 ---
    let expectedScore = 0;
    
    if (isEntrance) {
        // 第一次入学考：基于宝宝的智商给个初始分，通常在 30~70 之间，突出“有待提高”
        const iq = baby.education.iq || 60;
        expectedScore = Math.floor(iq * 0.8 + (Math.random() * 20 - 10)); 
    } else {
        // 后续考试：基于上一次的成绩来波动
        const lastScore = baby.exams[0].score; // exams 数组是最新的在最前，所以 [0] 是上次成绩
        
        // 20% 概率宝宝今天状态不好（考砸了）
        if (Math.random() < 0.20) {
            // 突然考差：比上次低 10 ~ 25 分
            expectedScore = lastScore - Math.floor(Math.random() * 15 + 10);
            console.log(`[考试系统] 宝宝今天发挥失常，预计减分。`);
        } else {
            // 80% 概率稳步提升：比上次高 2 ~ 8 分
            expectedScore = lastScore + Math.floor(Math.random() * 7 + 2);
        }
    }
    
    // 分数边界控制 (不能超过100，不能低于0)
    if (expectedScore > 100) expectedScore = 100;
    if (expectedScore < 0) expectedScore = 0;

    // --- 构建 AI 指令 ---
    const prompt = `
    【任务】：为 ${baby.age} 岁宝宝 "${baby.name}" 生成一张${isEntrance ? '入学摸底' : '随堂测试'}试卷。
    
    【核心指令：成绩设定】
    本次考试的最终得分为：【${expectedScore} 分】。
    请严格根据这个分数，来设定宝宝犯错的离谱程度：
    - 如果分数低于60分：错题多，答案极其离谱、充满童言无忌。
    - 如果分数在60-80分：有些粗心大意的小错。
    - 如果分数高于80分：只有偶尔一两个小错，甚至只是拼音写错。

    【题目要求】
    生成 1 到 3 道宝宝【做错】或【做得很搞笑】的具体题目记录。
    
    【格式严格要求纯JSON】：
    {
      "score": ${expectedScore}, 
      "examName": "${isEntrance ? '入学摸底考试' : '随堂小测验'}",
      "teacherEval": "老师的一句话评语(结合${expectedScore}分给出表扬或恨铁不成钢的批评)",
      "questions": [
        {
          "q": "问题内容(比如：1+1=?)",
          "babyAns": "宝宝写的答案(比如：等于小鸭子)",
          "correctAns": "正确答案(比如：2)",
          "correction": "老师的红笔批注(比如：上课别想小鸭子了！)"
        }
      ]
    }`;

    try {
        const res = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        const data = await res.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        const examData = JSON.parse(jsonMatch[0]);

        // 强制确保分数是我们计算好的那个，防止 AI 乱改
        examData.score = expectedScore;
        examData.id = `exam_${Date.now()}`;
        examData.date = new Date().toLocaleDateString();
        examData.parentSignature = null; // 等待签字

        // 存入档案（插到数组最前面，保证 [0] 永远是最新一次考试）
        baby.exams.unshift(examData);
        await saveData();
        
        // 弹出试卷
        openExamPaperView(examData.id);

    } catch (e) {
        console.error("生成试卷失败", e);
        showAlert("老师改卷子太累睡着了，本次成绩暂未录入。");
    }
}

// 打开试卷界面 (支持双人签字版)
function openExamPaperView(examId) {
    const baby = babies.find(b => b.id === currentBabyId);
    const exam = baby.exams.find(e => e.id === examId);
    if (!exam) return;

    setActivePage('babyExamPaperScreen');
    
    const paper = document.getElementById('examPaperContent');
    
    let qHtml = exam.questions.map((q, i) => `
        <div style="margin-bottom: 20px;">
            <div class="exam-question">${i+1}. ${q.q}</div>
            <div class="baby-handwriting">答：${q.babyAns}</div>
            <div class="teacher-correction">✗ 老师批语：${q.correction} (正解：${q.correctAns})</div>
        </div>
    `).join('');

    let signHtml = '';
    // 检查是否已经有签字数据
    if (exam.parentSignature) {
        let dadSign = '';
        let momSign = '';
        
        // 兼容新版双人签字结构
        if (exam.parentSignature.dad || exam.parentSignature.mom) {
            if (exam.parentSignature.mom) {
                momSign = `
                    <div class="parent-signature-box">
                        <div class="parent-comment-text">${exam.parentSignature.mom.comment}</div>
                        <div class="parent-sign-name">${exam.parentSignature.mom.name}</div>
                    </div>`;
            }
            if (exam.parentSignature.dad) {
                // 爸爸的签字紧跟在妈妈下面，去掉顶部的虚线
                dadSign = `
                    <div class="parent-signature-box" style="margin-top: 15px; border-top: none; padding-top: 0;">
                        <div class="parent-comment-text">${exam.parentSignature.dad.comment}</div>
                        <div class="parent-sign-name">${exam.parentSignature.dad.name}</div>
                    </div>`;
            }
            signHtml = momSign + dadSign;
        } else {
            // 兼容旧版单人签字数据
            signHtml = `
                <div class="parent-signature-box">
                    <div class="parent-comment-text">${exam.parentSignature.comment}</div>
                    <div class="parent-sign-name">签字：${exam.parentSignature.name}</div>
                </div>`;
        }
        // 如果有签字了，隐藏底部的按钮
        document.getElementById('examSignatureArea').style.display = 'none';
    } else {
        // 还没签字，显示底部按钮
        document.getElementById('examSignatureArea').style.display = 'block';
    }

    paper.innerHTML = `
        <div class="exam-score-stamp">${exam.score}</div>
        <div class="exam-header">
            <div class="exam-title">${exam.examName}</div>
            <div class="exam-info-row">
                <span>姓名：${baby.name}</span>
                <span>日期：${exam.date}</span>
            </div>
        </div>
        <div style="font-size: 14px; color: #555; margin-bottom: 20px;"><b>班主任评语：</b>${exam.teacherEval}</div>
        
        <div style="border-top: 2px dashed #ccc; padding-top: 20px;">
            ${qHtml}
        </div>
        
        ${signHtml}
    `;
}

function closeExamPaper() {
    // 退出全屏试卷，回到学堂
    setActivePage('babySchoolScreen');
}

// 父母联合签字逻辑 (妈妈先签，爸爸AI自动跟评)
async function signExamPaper() {
    const baby = babies.find(b => b.id === currentBabyId);
    const exam = baby.exams[0]; // 当前刚考完的最新卷子
    
    // 1. 弹出输入框，让妈妈(用户)先写评语
    openNameInputModal('请写下你的家长评语：', async (userComment) => {
        if (!userComment) return; // 如果用户取消或没填，直接返回

        // 提取用户(妈妈)和伴侣(爸爸)的人设信息
        const partner = friends.find(f => f.id === baby.partnerId);
        const personaId = partner ? partner.activeUserPersonaId : 'default_user';
        const persona = userPersonas.find(p => p.id === personaId) || userProfile;
        
        // 2. 存入妈妈的签字，并立刻刷新试卷显示
        exam.parentSignature = {
            mom: { name: persona.name, comment: userComment }
        };
        await saveData();
        openExamPaperView(exam.id); 
        
        // 如果没有绑定爸爸AI，到这里就结束了
        if (!partner) return; 

        // 3. 妈妈签完后，触发爸爸AI自动接力签字
        showToast(`${partner.remark || partner.name} 正在看你写的评语...`, 3000);
        
        const settings = await dbManager.get('apiSettings', 'settings');
        if (!settings || !settings.apiUrl) return;

        // 让AI不仅看到成绩，还能看到妈妈的吐槽，从而产生互动感
        const prompt = `
        【场景】：你们的宝宝"${baby.name}"考了 ${exam.score} 分。
        试卷上一道搞笑的错题是：“${exam.questions[0].q}”，宝宝居然答了“${exam.questions[0].babyAns}”。
        宝宝的妈妈（"${persona.name}"）看完试卷后，刚刚在签字栏写了评语：“${userComment}”。
        
        【你的人设】：${partner.role}。你是宝宝的爸爸。
        
        【任务】：请以你的身份，在试卷的“爸爸签字栏”补充一句评语。
        要求：
        1. 语气必须符合你的人设。
        2. 可以顺着妈妈的话去附和、或者是安慰考砸的宝宝、或者是吐槽这道错题。
        3. 简短有力，纯文本，不要带引号。
        `;
        
        try {
            const res = await fetch(`${settings.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }] })
            });
            const data = await res.json();
            const dadComment = data.choices[0].message.content.trim().replace(/^["“]|["”]$/g, '');
            
            // 4. 将爸爸的签字追加到对象中，再次保存并刷新
            exam.parentSignature.dad = { name: partner.name, comment: dadComment };
            await saveData();
            
            openExamPaperView(exam.id); // 刷新试卷，此时双人签名都会显示
            showToast("爸爸也签好字啦！");
            
        } catch (e) {
            console.error("生成爸爸签字失败", e);
            showToast("爸爸在忙，暂时没签上字。");
        }
    });
}

// 查看历史记录
function openExamRecordsModal() {
    const baby = babies.find(b => b.id === currentBabyId);
    const list = document.getElementById('examRecordsList');
    list.innerHTML = '';

    if (!baby.exams || baby.exams.length === 0) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">还没有考过试哦</div>';
    } else {
        baby.exams.forEach(exam => {
            const item = document.createElement('div');
            item.className = 'friend-item';
            item.onclick = () => {
                document.getElementById('examRecordsModal').classList.remove('show');
                openExamPaperView(exam.id);
            };
            item.innerHTML = `
                <div class="friend-info">
                    <div class="friend-name" style="color: ${exam.score < 60 ? '#E76F51' : '#333'};">${exam.examName} (${exam.score}分)</div>
                    <div class="friend-message">${exam.date}</div>
                </div>
                <i class="ri-arrow-right-s-line" style="color: #ccc;"></i>
            `;
            list.appendChild(item);
        });
    }
    
    document.getElementById('examRecordsModal').classList.add('show');
}

// ==============================================================
// 10. 宝宝旅行系统 (报纸UI + 礼物拆盲盒)
// ==============================================================

// 打开旅行列表页
function openBabyTravelList() {
    setActivePage('babyTravelListScreen');
    renderBabyTravelList();
}

function backToBabyTravelList() {
    setActivePage('babyTravelListScreen');
    renderBabyTravelList(); // 刷新列表状态
}

// 渲染机票列表
function renderBabyTravelList() {
    const container = document.getElementById('babyTravelListContainer');
    container.innerHTML = '';
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    if (!baby.travelLogs || baby.travelLogs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #999;">
                <i class="ri-luggage-cart-line" style="font-size: 48px; opacity: 0.5;"></i>
                <p>宝宝还没出过远门呢<br>点击右上角 + 号送TA去旅行吧</p>
            </div>
        `;
        return;
    }

    // 倒序排列，最新的机票在最上面
    const sortedLogs = [...baby.travelLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedLogs.forEach(log => {
        const giftStatusHtml = log.isGiftOpened 
            ? `<span style="color:#2A9D8F; font-size:11px;">已带回礼物</span>` 
            : `<span style="color:#E76F51; font-size:11px; font-weight:bold;">🎁 有未拆礼物!</span>`;

        const card = document.createElement('div');
        card.className = 'travel-ticket-card';
        card.onclick = () => openBabyTravelDetail(log.id);
        
        card.innerHTML = `
            <div class="ticket-left">
                <i class="ri-flight-takeoff-line" style="font-size: 24px; margin-bottom: 5px;"></i>
                <span style="font-size: 12px; font-weight: bold; writing-mode: vertical-rl; letter-spacing: 2px;">BOARDING</span>
            </div>
            <div class="ticket-right">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="font-size: 18px; font-weight: 900; color: #333;">${log.destination}</div>
                    <div style="font-size: 12px; color: #999;">${log.date}</div>
                </div>
                <div style="font-size: 12px; color: #666; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    📰 ${log.newspaperTitle}
                </div>
                <div style="text-align: right;">${giftStatusHtml}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 触发旅行生成
async function startBabyTravel() {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    // 每天限制一次
    const todayStr = new Date().toLocaleDateString('zh-CN');
    if (!baby.travelLogs) baby.travelLogs = [];
    const hasTraveledToday = baby.travelLogs.some(log => log.date === todayStr);
    
    if (hasTraveledToday) {
        return showAlert("宝宝今天已经去旅行过啦，让TA休息一下明天再出发吧~");
    }

    const btn = document.getElementById('startTravelBtn');
    if (btn.querySelector('i').classList.contains('fa-spin')) return; // 防止重复点击
    
    // UI 反馈
    btn.innerHTML = '<i class="ri-loader-4-line fa-spin" style="font-size: 24px; color: #8C6239;"></i>';
    showToast("正在为宝宝收拾行李并预订机票...", 3000);

    const partner = friends.find(f => f.id === baby.partnerId);
    const dadRole = partner ? partner.role : "一位慈爱的父亲";
    const dadName = partner ? partner.name : "爸爸";

    const settings = await dbManager.get('apiSettings', 'settings');
    if (!settings || !settings.apiUrl) {
        btn.innerHTML = '<i class="ri-add-line" style="font-size: 24px; color: #8C6239;"></i>';
        return showAlert("请先配置API");
    }

    const prompt = `
    【任务】: ${baby.age}岁的${baby.gender}宝宝 "${baby.name}" 今天独自出门去旅行了。请为这趟旅行生成一份完整的趣味报告。
    【爸爸的人设】: "${dadName}" (${dadRole})。注意：爸爸负责给宝宝收拾行李，并在报纸角落写下留言。

    【生成要求】:
    1. 目的地(destination): 国内外随机著名城市或景点。
    2. 报纸标题(newspaperTitle): 用极其夸张、搞笑的UC震惊部风格来形容宝宝在当地的所作所为。
   3. 经历正文(story): 请用新闻报道的口吻，极其详尽地描写宝宝在目的地的奇葩、搞笑或惊险经历。字数必须在 300 到 500 字之间。要求包含生动的环境描写、不知所措的路人反应、以及宝宝的具体搞怪动作，请使用换行符 (\n) 分段。
    4. 行李清单(luggage): 爸爸为宝宝准备的3件物品，以及准备这件物品的“硬核/搞笑理由”(需符合爸爸人设)。
    5. 爸爸的评价(dadTripComment): 爸爸看完这篇报道后的反应(符合人设，20字内)。
    6. 带回的礼物(giftName): 宝宝带回来给父母的奇葩或贴心特产。
    7. 宝宝留言(babyMessage): 宝宝给父母写的便签(带拼音或错别字等童真感)。
    8. 爸爸对礼物的反应(dadGiftComment): 爸爸收到礼物后的吐槽或感动。

    【严格返回纯JSON对象格式】:
    {
      "destination": "巴黎",
      "newspaperTitle": "震惊！三岁萌娃竟在埃菲尔铁塔下做出此事...",
      "story": "今天，我们的特派记者在巴黎街头捕获了一只野生萌娃...",
      "luggage": [
        {"item": "不锈钢大水壶", "reason": "爸爸怕国外的水喝不惯"}
      ],
      "dadTripComment": "这小兔崽子，又上头条了！",
      "giftName": "一个闪闪发光的法棍面包",
      "babyMessage": "粑粑麻麻，这ge给你们chi！",
      "dadGiftComment": "这面包硬得能防身了..."
    }`;

    try {
        const res = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        const data = await res.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("JSON解析失败");
        const travelData = JSON.parse(jsonMatch[0]);

        // 构建数据并保存
        travelData.id = `travel_${Date.now()}`;
        travelData.date = todayStr;
        travelData.timestamp = new Date().toISOString();
        travelData.isGiftOpened = false;

        baby.travelLogs.push(travelData);
        await saveData();

        // 渲染并进入详情页
        renderBabyTravelList();
        openBabyTravelDetail(travelData.id);
        showToast("宝宝已到达目的地并登上了头条！");

    } catch (e) {
        console.error(e);
        showAlert("旅行准备失败，请重试。");
    } finally {
        btn.innerHTML = '<i class="ri-add-line" style="font-size: 24px; color: #8C6239;"></i>';
    }
}

// 渲染旅行详情页 (报纸 + 盲盒)
function openBabyTravelDetail(travelId) {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;
    const log = baby.travelLogs.find(l => l.id === travelId);
    if (!log) return;
    const partner = friends.find(f => f.id === baby.partnerId);

    setActivePage('babyTravelDetailScreen');
    
    const container = document.getElementById('babyTravelDetailContainer');
    
    // 渲染行李清单 HTML
    let luggageHtml = '';
    if (log.luggage && Array.isArray(log.luggage)) {
        luggageHtml = log.luggage.map(l => `
            <div class="luggage-item">
                <span style="font-weight:bold; color:#D84315;">[${l.item}]</span> 
                - ${partner.name}的理由：${l.reason}
            </div>
        `).join('');
    }

    // 渲染底部礼物区域
    let giftSectionHtml = '';
    if (log.isGiftOpened) {
        // 已拆开的状态
        giftSectionHtml = `
            <div class="gift-note" style="display:block;">
                <div style="font-size:12px; color:#999; margin-bottom:10px;">宝宝从 ${log.destination} 给你带回了：</div>
                <div style="font-size:18px; font-weight:bold; color:#D81B60; text-align:center; margin-bottom:15px;">🎁 ${log.giftName}</div>
                <div style="font-size:15px; color:#555; font-family:'ZCOOL KuaiLe', cursive;">“${log.babyMessage}”</div>
                <div class="dad-comment-box" style="margin-top:15px; border-top:1px dashed #ccc; padding-top:10px; color:#8C6239;">
                    ${partner.name} : ${log.dadGiftComment}
                </div>
            </div>
        `;
    } else {
        // 未拆开的盲盒状态
        giftSectionHtml = `
            <div class="travel-gift-box" id="giftBoxContainer-${log.id}" onclick="openTravelGift('${log.id}')">
                <div class="gift-box-img">📦</div>
                <div style="font-size:12px; color:#A67C52; margin-top:5px; font-weight:bold;">宝宝寄回了一个包裹，点击拆开</div>
            </div>
            <div class="gift-note" id="giftNote-${log.id}">
                <div style="font-size:12px; color:#999; margin-bottom:10px;">宝宝从 ${log.destination} 给你带回了：</div>
                <div style="font-size:18px; font-weight:bold; color:#D81B60; text-align:center; margin-bottom:15px;">🎁 ${log.giftName}</div>
                <div style="font-size:15px; color:#555; font-family:'ZCOOL KuaiLe', cursive;">“${log.babyMessage}”</div>
                <div class="dad-comment-box" style="margin-top:15px; border-top:1px dashed #ccc; padding-top:10px; color:#8C6239;">
                    ${partner.name} : ${log.dadGiftComment}
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <!-- 报纸 UI -->
        <div class="newspaper-container">
            <div class="newspaper-header">
                <div style="font-size: 12px; color: #666; letter-spacing: 5px; margin-bottom: 5px;">THE QIYU TIMES</div>
                <div style="font-size: 10px; color: #999;">Date: ${log.date} · Location: ${log.destination}</div>
            </div>
            
          <div class="newspaper-title">${log.newspaperTitle}</div>
            
            <div class="newspaper-content">
                ${log.story.replace(/\n/g, '<br><br>')}
            </div>

            <div class="luggage-box">
                <div style="font-weight:bold; margin-bottom:10px; font-size:14px; color:#333;"><i class="ri-suitcase-2-line"></i> 爸爸准备的行李箱大揭秘：</div>
                ${luggageHtml}
            </div>
            
            <div class="dad-comment-box">
                ✎ 爸爸批注：${log.dadTripComment}
            </div>
        </div>

        <!-- 礼物区 -->
        ${giftSectionHtml}
    `;
}

// 拆礼物动画
async function openTravelGift(travelId) {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;
    const log = baby.travelLogs.find(l => l.id === travelId);
    if (!log) return;

    const boxContainer = document.getElementById(`giftBoxContainer-${travelId}`);
    const noteEl = document.getElementById(`giftNote-${travelId}`);
    if (!boxContainer || !noteEl) return;

    // 1. 播放摇晃动画
    boxContainer.classList.add('shaking');
    
    // 2. 延迟后拆开
    setTimeout(async () => {
        boxContainer.style.display = 'none'; // 隐藏盒子
        noteEl.style.display = 'block'; // 显示纸条
        
        // 保存已拆开状态到数据库
        log.isGiftOpened = true;
        await saveData();
        
        // 播放个提示音或者震动
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
    }, 1000); // 摇晃 1 秒钟
}

// 模块配置字典 (增加爸爸留言的提示)
const EXPLORE_MODULES = [
    { id: 'wardrobe', name: '宝宝的衣柜', icon: 'ri-t-shirt-2-fill', color: '#D81B60', theme: 'theme-wardrobe', prompt: '列出3件宝宝衣柜里最常穿或最奇葩的衣服/装扮，详细描写款式和宝宝穿上后的样子。' },
    { id: 'toybox', name: '玩具箱', icon: 'ri-bear-smile-fill', color: '#8B4513', theme: 'theme-toybox', prompt: '列出3个宝宝最喜欢的玩具，详细描写玩具破损的程度以及宝宝是怎么蹂躏它们的。' },
    { id: 'doodle', name: '涂鸦本', icon: 'ri-brush-3-fill', color: '#4A90E2', theme: 'theme-doodle', prompt: '描述3幅宝宝最近在涂鸦本上画的“抽象大作”。标题写画的名字，正文描述画面到底画成了什么鬼样子。' },
    { id: 'snack', name: '零食箱', icon: 'ri-cake-3-fill', color: '#FF8C00', theme: 'theme-snack', prompt: '列出3种宝宝偷偷藏起来的、或者最爱吃的零食，以及TA吃零食时护食的可爱模样。' },
    { id: 'question', name: '十万个为什么', icon: 'ri-questionnaire-fill', color: '#E65100', theme: 'theme-question', prompt: '列出3个宝宝最近向父母提出的极其刁钻、搞笑或童真的“为什么”问题。标题是问题，正文是宝宝问这个问题时的场景。' },
    { id: 'secret', name: '秘密基地', icon: 'ri-safe-2-fill', color: '#5D4037', theme: 'theme-secret', prompt: '列出3件宝宝藏在床底/沙发缝里的“宝藏”（比如漂亮的石头、死虫子、硬币等），以及被发现时的反应。' },
    { id: 'naughty', name: '闯祸备忘录', icon: 'ri-error-warning-fill', color: '#FF6B6B', theme: 'theme-naughty', prompt: '列出3件宝宝最近闯的祸（如打碎东西、把家里弄乱），标题是罪名，正文是“作案”过程和事后的狡辩。' },
    { id: 'friends', name: '幼稚园交友圈', icon: 'ri-group-fill', color: '#2A9D8F', theme: 'theme-friends', prompt: '列出3个宝宝在幼稚园/小区里交到的好朋友（可以是其他小孩或宠物），标题写朋友的名字，正文写他们是怎么一起玩的。' },
    { id: 'dream', name: '枕边梦话', icon: 'ri-moon-clear-fill', color: '#FFD700', theme: 'theme-dream', prompt: '列出3句宝宝最近睡觉时说的神奇梦话。标题是梦话原句，正文推测TA在梦里到底在干嘛。' },
    { id: 'habit', name: '奇葩小习惯', icon: 'ri-medal-fill', color: '#DC143C', theme: 'theme-habit', prompt: '列出3个宝宝生活中极其奇葩、好笑但又可爱的小习惯（比如必须抱着某样东西睡、特定姿势拉臭臭等）。' }
];

let currentExploreType = null;

// 1. 打开列表页
function openBabyExploreList() {
    setActivePage('babyExploreListScreen');
    const grid = document.getElementById('babyExploreGrid');
    grid.innerHTML = '';
    
    EXPLORE_MODULES.forEach(mod => {
        const card = document.createElement('div');
        card.className = 'explore-card';
        card.onclick = () => openBabyExploreDetail(mod.id);
        card.innerHTML = `
            <i class="${mod.icon}" style="color: ${mod.color};"></i>
            <div class="title">${mod.name}</div>
        `;
        grid.appendChild(card);
    });
}

function backToBabyExploreList() {
    setActivePage('babyExploreListScreen');
    // 退出时清除容器的主题，防止污染
    document.getElementById('exploreDetailContainer').className = 'explore-detail-container';
}

// 2. 打开详情页
async function openBabyExploreDetail(typeId) {
    currentExploreType = typeId;
    const mod = EXPLORE_MODULES.find(m => m.id === typeId);
    if (!mod) return;

    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    // UI 设置
    document.getElementById('exploreDetailTitle').textContent = mod.name;
    const container = document.getElementById('exploreDetailContainer');
    
    // 核心：清空旧类名，加上基础类名和当前主题类名
    container.className = `explore-detail-container ${mod.theme}`; 
    
    setActivePage('babyExploreDetailScreen');

    // 数据检查
    if (!baby.exploreData) baby.exploreData = {};

    if (baby.exploreData[typeId] && baby.exploreData[typeId].length > 0) {
        renderExploreContent(baby.exploreData[typeId]);
    } else {
        await refreshExploreContent();
    }
}

// 3. 点击右上角刷新
async function refreshExploreContent() {
    const baby = babies.find(b => b.id === currentBabyId);
    const mod = EXPLORE_MODULES.find(m => m.id === currentExploreType);
    if (!baby || !mod) return;

    const btn = document.getElementById('refreshExploreBtn');
    if (btn.querySelector('i').classList.contains('fa-spin')) return; 

    btn.innerHTML = '<i class="ri-loader-4-line fa-spin" style="font-size: 22px; color: #8C6239;"></i>';
    const container = document.getElementById('exploreDetailContainer');
    
    // 加载动画提示，为了在所有背景下都能看清，加个半透明白底
    container.innerHTML = `<div style="text-align:center; padding:50px; color:#333; font-family:sans-serif; background: rgba(255,255,255,0.8); border-radius: 12px; margin-top: 50px;">正在翻找宝宝的${mod.name}...</div>`;

    const settings = await dbManager.get('apiSettings', 'settings');
    if (!settings || !settings.apiUrl) {
        btn.innerHTML = '<i class="ri-refresh-line" style="font-size: 22px; color: #8C6239;"></i>';
        return showAlert("请先配置API");
    }

    const partner = friends.find(f => f.id === baby.partnerId);
    const dadName = partner ? partner.name : '爸爸';
    const dadDesc = partner ? `父亲是：${partner.name} (人设: ${partner.role})` : '';

    // 【修改】Prompt 明确要求生成 dad_comment
    const prompt = `
    【任务】: 作为观察者，请描述 ${baby.age}岁的${baby.gender}宝宝 "${baby.name}" 的【${mod.name}】。
    【家庭背景】: ${dadDesc}。宝宝的特质: ${baby.traits ? baby.traits.badHabits.join(',') + ' ' + baby.traits.hobbies.join(',') : '活泼可爱'}。
    
    【内容要求】:
    1. ${mod.prompt}
    2. 对于你列出的每一项，都必须生成一句“爸爸（${dadName}）的留言/吐槽”。要求绝对符合爸爸的人设！
    语言要生动、搞笑、充满画面感，符合养娃的鸡飞狗跳和温馨。
    
    【格式要求 (严格纯JSON数组)】:
    必须返回一个包含3个对象的JSON数组，每个对象包含 title, content, dad_comment 三个键。
    [
      { 
        "title": "名字/标题", 
        "content": "详细描述文字...",
        "dad_comment": "爸爸看到这个东西/这件事后的反应或吐槽（15字以内）"
      }
    ]`;

    try {
        const res = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        
        const data = await res.json();
        const jsonMatch = data.choices[0].message.content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("JSON解析失败");
        
        const parsedData = JSON.parse(jsonMatch[0]);

        baby.exploreData[currentExploreType] = parsedData;
        await saveData();

        renderExploreContent(parsedData);
        showToast("刷新成功！");

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div style="text-align:center; padding:50px; color:red; font-family:sans-serif; background: rgba(255,255,255,0.8); border-radius: 12px; margin-top: 50px;">翻找失败了，请再试一次</div>`;
    } finally {
        btn.innerHTML = '<i class="ri-refresh-line" style="font-size: 22px; color: #8C6239;"></i>';
    }
}

// 4. 渲染内容到 UI (结构重构以适应高级CSS)
function renderExploreContent(dataList) {
    const container = document.getElementById('exploreDetailContainer');
    container.innerHTML = '';

    if (!dataList || dataList.length === 0) return;

    // 获取爸爸的名字用于显示
    const baby = babies.find(b => b.id === currentBabyId);
    const partner = friends.find(f => f.id === baby.partnerId);
    const dadName = partner ? partner.name : '爸爸';

    dataList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'explore-item-wrapper';
        
        // 统一的结构，具体长什么样完全由外层的 theme-xxx class 控制
        div.innerHTML = `
            <div class="explore-item-visual"></div> 
            <div class="explore-item-title">${item.title}</div>
            <div class="explore-item-content">${item.content.replace(/\n/g, '<br>')}</div>
            <div class="explore-item-dad-comment">
                <span style="opacity: 0.8;">[${dadName} 的留言]：</span>${item.dad_comment || '这孩子...'}
            </div>
        `;
        
        container.appendChild(div);
    });
}

// ==============================================================
// 11. 许愿瓶系统 (生成星星、折星星、打开纸条)
// ==============================================================

// 打开许愿瓶主页面
function openBabyWishBottle() {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    // 确保数据结构存在
    if (!baby.wishes) baby.wishes = [];

    setActivePage('babyWishBottleScreen');
    renderWishBottle(baby);
    
    // 检查每日限制，置灰按钮 (可选)
    checkWishBottleLimits(baby);
}

// 返回活动列表 (复用已有的 setActivePage)
// 注意：在返回时，清除屏幕上可能残留的动画 DOM
function closeBabyWishBottle() {
    backToActivityList();
}

// 检查今天是否还能摇/折
function checkWishBottleLimits(baby) {
    const todayStr = new Date().toLocaleDateString('zh-CN');
    
    const btnShake = document.getElementById('btnShakeBottle');
    const btnFold = document.getElementById('btnFoldStar');

    if (baby.lastWishShakeDate === todayStr) {
        btnShake.style.opacity = '0.5';
        btnShake.style.filter = 'grayscale(100%)';
    } else {
        btnShake.style.opacity = '1';
        btnShake.style.filter = 'none';
    }

    if (baby.lastWishFoldDate === todayStr) {
        btnFold.style.opacity = '0.5';
        btnFold.style.filter = 'grayscale(100%)';
    } else {
        btnFold.style.opacity = '1';
        btnFold.style.filter = 'none';
    }
}

// 渲染瓶子里的星星
function renderWishBottle(baby) {
    const container = document.getElementById('wishBottleContent');
    document.getElementById('bottleStarCount').textContent = baby.wishes.length;

    // 保留瓶底高光，移除旧的星星
    Array.from(container.children).forEach(child => {
        if (child.className.includes('wish-star')) {
            child.remove();
        }
    });

    baby.wishes.forEach(wish => {
        const star = document.createElement('div');
        star.className = 'wish-star';
        
        // 分配不同的星星颜色
        let starColor = '#FFD166'; // 用户=黄色
        if (wish.type === 'baby') starColor = '#ff9a9e'; // 宝宝=粉色
        if (wish.type === 'partner') starColor = '#8fd3f4'; // AI=蓝色

        star.innerHTML = `<i class="ri-star-fill" style="color: ${starColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"></i>`;
        
        // 恢复星星在瓶子里保存的随机坐标
        star.style.left = wish.x + '%';
        star.style.bottom = wish.y + '%';
        star.style.transform = `translateX(-50%) rotate(${wish.rot}deg)`;
        
        // 点击打开纸条
        star.onclick = () => readWish(wish);
        
        container.appendChild(star);
    });
}

// 触发【摇摇许愿瓶】-> 调用AI生成
async function shakeWishBottle() {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    const todayStr = new Date().toLocaleDateString('zh-CN');
    if (baby.lastWishShakeDate === todayStr) {
        return showAlert("今天已经摇过啦，明天再来听听TA们的心愿吧~");
    }

    const btn = document.getElementById('btnShakeBottle');
    if (btn.querySelector('i').classList.contains('fa-spin')) return;
    
    // UI 反馈
    const oldIcon = btn.innerHTML;
    btn.innerHTML = '<i class="ri-loader-4-line fa-spin"></i><span>倾听中</span>';
    showToast("正在听取TA们在瓶子里留下的愿望...", 3000);

    const partner = friends.find(f => f.id === baby.partnerId) || { name: '未知', role: '普通人' };
    const settings = await dbManager.get('apiSettings', 'settings');
    
    if (!settings || !settings.apiUrl) {
        btn.innerHTML = oldIcon;
        return showAlert("请先配置API");
    }

    const prompt = `
    【任务】：你现在需要扮演两个角色。
    角色A是 "${partner.name}" (人设: ${partner.role})。
    角色B是你们共同抚养的 ${baby.age}岁 ${baby.gender}宝宝 "${baby.name}"。
    
    【场景】：你们家有一个“许愿瓶”。每天大家都会把心里的小小愿望折成纸星星扔进去。
    
    【要求】：
    1. 请为 "${partner.name}" 写一个愿望。愿望内容要符合TA的人设，可以关于家庭、关于另一半(用户)、或者关于工作/生活。语气要日常、温馨或符合人设。
    2. 请为 "${baby.name}" 写一个愿望。愿望必须充满童真、幼稚，甚至有点搞笑不切实际（比如想吃一千个冰淇淋、想变成奥特曼）。
    3. 每个愿望严格控制在 30 个字以内。

    【输出格式】：
    必须返回纯净的 JSON 对象：
    {
      "partnerWish": "伴侣的愿望...",
      "babyWish": "宝宝的愿望..."
    }`;

    try {
        const res = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: settings.modelName, messages: [{ role: 'user', content: prompt }], temperature: 0.9 })
        });
        
        const data = await res.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("解析失败");
        
        const wishesData = JSON.parse(jsonMatch[0]);

        // 保存日期限制
        baby.lastWishShakeDate = todayStr;

        // 创建两颗星星
        createAndDropStar(baby, 'partner', partner.name, wishesData.partnerWish);
        setTimeout(() => {
            createAndDropStar(baby, 'baby', baby.name, wishesData.babyWish);
        }, 800); // 间隔0.8秒掉第二颗

        await saveData();
        checkWishBottleLimits(baby);

    } catch (e) {
        console.error(e);
        showAlert("愿望收集失败，请重试。");
    } finally {
        btn.innerHTML = oldIcon;
    }
}

// 触发【折星星】-> 用户输入
function openFoldStarModal() {
    const baby = babies.find(b => b.id === currentBabyId);
    const todayStr = new Date().toLocaleDateString('zh-CN');
    
    if (baby.lastWishFoldDate === todayStr) {
        return showAlert("你今天已经折过星星啦，把位置留一点给明天吧~");
    }

    document.getElementById('userWishInput').value = '';
    document.getElementById('foldStarModal').classList.add('show');
}

// 提交用户折的星星
async function submitUserWish() {
    const text = document.getElementById('userWishInput').value.trim();
    if (!text) return showAlert("愿望不能为空哦");
    
    const baby = babies.find(b => b.id === currentBabyId);
    baby.lastWishFoldDate = new Date().toLocaleDateString('zh-CN');

    document.getElementById('foldStarModal').classList.remove('show');
    
    createAndDropStar(baby, 'user', userProfile.name || '我', text);
    
    await saveData();
    checkWishBottleLimits(baby);
    showToast("愿望已妥善安放~");
}

// 工具：创建星星并触发掉落动画
function createAndDropStar(baby, type, authorName, content) {
    // 随机计算星星在瓶底堆积的坐标
    // X轴范围: 15% 到 85%
    const randomX = 15 + Math.random() * 70;
    // Y轴范围: 随着星星数量增多，Y轴上限慢慢变高，模拟堆积效果 (基础5%，最高50%)
    const maxH = Math.min(50, 5 + (baby.wishes.length * 1.5));
    const randomY = 5 + Math.random() * maxH;
    // 随机旋转角度
    const randomRot = Math.floor(Math.random() * 360);

    const newStar = {
        id: `star_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
        type: type,
        authorName: authorName,
        content: content,
        date: new Date().toLocaleDateString('zh-CN'),
        x: randomX.toFixed(1),
        y: randomY.toFixed(1),
        rot: randomRot
    };

    baby.wishes.push(newStar);

    // 动态在界面上创建一个用来执行掉落动画的星星
    const container = document.getElementById('wishBottleContent');
    const starEl = document.createElement('div');
    starEl.className = 'wish-star';
    
    let starColor = '#FFD166'; 
    if (type === 'baby') starColor = '#ff9a9e'; 
    if (type === 'partner') starColor = '#8fd3f4'; 

    starEl.innerHTML = `<i class="ri-star-fill" style="color: ${starColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"></i>`;
    
    // 初始化在顶部，然后通过 animation 掉下去
    starEl.style.left = newStar.x + '%';
    starEl.style.bottom = newStar.y + '%';
    starEl.style.setProperty('--rot', `${newStar.rot}deg`);
    starEl.style.animation = 'starDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    
    starEl.onclick = () => readWish(newStar);
    
    container.appendChild(starEl);
    document.getElementById('bottleStarCount').textContent = baby.wishes.length;
}

// 读取星星 (打开纸条)
function readWish(wishObj) {
    const textEl = document.getElementById('wishPaperText');
    const authorEl = document.getElementById('wishPaperAuthor');
    
    // 如果是宝宝，用点童真字体或颜色 (通过 CSS class 实现，这里直接写内联)
    if (wishObj.type === 'baby') {
        textEl.style.color = '#D81B60';
        textEl.style.fontFamily = "'ZCOOL KuaiLe', cursive, sans-serif";
    } else {
        textEl.style.color = '#5C4033';
        textEl.style.fontFamily = "'Zhi Mang Xing', 'Ma Shan Zheng', cursive, serif";
    }

    textEl.textContent = wishObj.content;
    authorEl.textContent = `—— ${wishObj.authorName} (${wishObj.date})`;

    document.getElementById('readWishModal').classList.add('show');
}

// ==============================================================
// 12. 投喂宝宝系统 (20款零食 + AI互动)
// ==============================================================

// 20款零食配置 (带emoji图标，纯文字渲染)
const BABY_FOODS = [
    { id: 'f1', icon: '🍼', name: '温热奶奶', price: 5 },
    { id: 'f2', icon: '🥚', name: '嫩滑蛋羹', price: 8 },
    { id: 'f3', icon: '🍎', name: '苹果泥泥', price: 10 },
    { id: 'f4', icon: '🍌', name: '香蕉切片', price: 12 },
    { id: 'f5', icon: '🥦', name: '蔬菜小溶豆', price: 15 },
    { id: 'f6', icon: '🍓', name: '草莓酸奶', price: 18 },
    { id: 'f7', icon: '🍪', name: '动物饼干', price: 20 },
    { id: 'f8', icon: '🍮', name: '焦糖布丁', price: 25 },
    { id: 'f9', icon: '🍦', name: '香草冰淇淋', price: 30 },
    { id: 'f10', icon: '🍩', name: '甜甜圈', price: 35 },
    { id: 'f11', icon: '🍟', name: '炸薯条', price: 38 },
    { id: 'f12', icon: '🍗', name: '大鸡腿', price: 45 },
    { id: 'f13', icon: '🍕', name: '迷你披萨', price: 50 },
    { id: 'f14', icon: '🍔', name: '儿童汉堡', price: 55 },
    { id: 'f15', icon: '🍣', name: '三文鱼寿司', price: 60 },
    { id: 'f16', icon: '🍬', name: '彩虹糖果', price: 16 },
    { id: 'f17', icon: '🍫', name: '黑巧克力', price: 28 },
    { id: 'f18', icon: '🍰', name: '黑森林蛋糕', price: 68 },
    { id: 'f19', icon: '🥩', name: '原切牛排', price: 88 },
    { id: 'f20', icon: '🍱', name: '豪华儿童套餐', price: 128 }
];

let selectedBabyFood = null;

// 打开小卖部
function openBabyFeedModal() {
    selectedBabyFood = null;
    const container = document.getElementById('babyFoodListContainer');
    container.innerHTML = '';

    BABY_FOODS.forEach(food => {
        const item = document.createElement('div');
        item.className = 'baby-food-item';
        item.onclick = () => {
            document.querySelectorAll('.baby-food-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            selectedBabyFood = food;
        };
        item.innerHTML = `
            <div class="baby-food-icon">${food.icon}</div>
            <div class="baby-food-name">${food.name}</div>
            <div class="baby-food-price">¥${food.price}</div>
        `;
        container.appendChild(item);
    });

    document.getElementById('babyFeedModal').classList.add('show');
}

// 点击付款投喂
function confirmBabyFeed() {
    if (!selectedBabyFood) return showToast("请先选一样好吃的哦");

    document.getElementById('babyFeedModal').classList.remove('show');
    
    // 调用主系统的支付流程
    // 注意：这里需要我们在主 JS 文件里加一个挂载点
    startPaymentProcess('baby_feed', selectedBabyFood.price, {
        foodName: `${selectedBabyFood.icon}${selectedBabyFood.name}`
    });
}

// 付款成功后的核心触发逻辑 (分条发送版)
async function triggerBabyFeedReaction(foodName) {
    const baby = babies.find(b => b.id === currentBabyId);
    if (!baby) return;

    // 1. 头顶冒泡“吧唧吧唧”的等待提示
    const floatText = document.getElementById('babyPokeFloat');
    if (floatText) {
        floatText.textContent = "吧唧吧唧..."; 
        floatText.className = 'baby-poke-float thinking';
    }

    // 2. 准备 AI 请求
    const settings = await dbManager.get('apiSettings', 'settings');
    if (!settings || !settings.apiUrl) return;

    let traitsDesc = baby.traits ? `爱好：${baby.traits.hobbies.join(',')}。习惯：${baby.traits.badHabits.join(',')}。` : '贪吃';

    // 【核心修改1：改变Prompt，要求聊天消息返回数组】
    const prompt = `
【场景】：你是一个${baby.age}岁的虚拟电子宝宝 "${baby.name}"。
【特征】：${traitsDesc}。
【事件】：你的妈妈（用户）刚刚花钱给你买了一份好吃的：【${foodName}】。
【任务】：请你做出反应。
【要求】：
1. 语气必须充满童真、幼稚，可以撒娇。
2. 必须返回一个纯净的 JSON 对象，包含两个键：
   - "bubble": 宝宝头顶立刻冒出的一句话（极短，10字以内，如"好甜呀！"、"还要！"）。
   - "chat_messages": 宝宝在微信聊天里主动发给妈妈的消息。为了模拟真人打字，**必须是一个字符串数组**，包含 1 到 3 条短消息。

【输出格式示例】：
{
  "bubble": "啊呜！真好吃！",
  "chat_messages": [
    "麻麻买的蛋糕好软好甜呀！",
    "我肚子都吃得圆滚滚啦~",
    "下次还要吃！"
  ]
}
`;

    try {
        const response = await fetch(`${settings.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: settings.modelName,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9
            })
        });

        const data = await response.json();
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("JSON解析失败");
        const reaction = JSON.parse(jsonMatch[0]);

        // 3. UI: 气泡显示
        if (floatText) {
            floatText.textContent = reaction.bubble || "好吃！";
            floatText.className = 'baby-poke-float';
            void floatText.offsetWidth; 
            floatText.className = 'baby-poke-float reply';
        }

        // 4. 数据: 分条存入宝宝私聊记录
        if (!babyChats[currentBabyId]) babyChats[currentBabyId] = { baby:[], partner:[], group:[] };
        
        // 提取消息数组（兼容AI抽风只返回字符串或旧版键名的情况）
        let messagesToAnimate = [];
        if (Array.isArray(reaction.chat_messages)) {
            messagesToAnimate = reaction.chat_messages;
        } else if (reaction.chat_messages) {
            messagesToAnimate = [reaction.chat_messages];
        } else if (reaction.chat_message) {
            messagesToAnimate = [reaction.chat_message];
        } else {
            messagesToAnimate = ["谢谢麻麻！"];
        }

        // 【核心修改2：加入循环和随机延迟，模拟打字并逐条存入】
        let msgCount = 0;
        for (const msgText of messagesToAnimate) {
            if (!msgText.trim()) continue;
            
            // 模拟 0.6秒 ~ 1.2秒 的打字延迟
            await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

            babyChats[currentBabyId]['baby'].push({
                id: Date.now(),
                senderId: 'baby',
                content: msgText
            });
            await saveData();
            msgCount++;
        }
        
        showToast(`宝宝给你发了 ${msgCount} 条新消息~`, 3000);

    } catch (e) {
        console.error("投喂反应生成失败", e);
        if (floatText) {
            floatText.textContent = "好吃！"; 
            floatText.className = 'baby-poke-float reply';
        }
    }
}