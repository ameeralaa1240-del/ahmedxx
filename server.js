const express = require("express");
const app = express();

// ===== CORS =====
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

const ADMIN_TOKEN = "medo123";
const PORT = process.env.PORT || 3000;

// ===== التخزين المؤقت =====
let lastSystemInfo = {
    username: "في انتظار البيانات",
    pc_name: "في انتظار البيانات",
    os: "في انتظار البيانات",
    cpu: "في انتظار البيانات",
    ram: "في انتظار البيانات",
    mac: "في انتظار البيانات",
    public_ip: "في انتظار البيانات",
    hwid: "في انتظار البيانات",
    is_vm: false,
    received_at: new Date().toISOString()
};

// ===== التحقق من التوكن =====
const checkAuth = (req) => {
    const auth = req.get("Authorization");
    return (auth === ADMIN_TOKEN || auth === `Bearer ${ADMIN_TOKEN}`);
};

// ============================================================
// ====== مسارات API ======
// ============================================================

app.post("/api/system-info", (req, res) => {
    console.log("📥 POST /api/system-info");
    
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const data = req.body;
        lastSystemInfo = {
            ...data,
            received_at: new Date().toISOString(),
            ip: req.ip || req.connection?.remoteAddress || 'unknown'
        };

        console.log(`✅ تم استقبال من: ${data.username || 'مجهول'}`);
        res.json({ 
            success: true, 
            message: "تم استقبال معلومات النظام",
            data: lastSystemInfo
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/api/system-info", (req, res) => {
    console.log("📤 GET /api/system-info");
    res.json(lastSystemInfo);
});

app.delete("/api/system-info", (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    lastSystemInfo = {
        username: "تم مسح البيانات",
        pc_name: "تم مسح البيانات",
        os: "تم مسح البيانات",
        cpu: "تم مسح البيانات",
        ram: "تم مسح البيانات",
        mac: "تم مسح البيانات",
        public_ip: "تم مسح البيانات",
        hwid: "تم مسح البيانات",
        is_vm: false,
        received_at: new Date().toISOString()
    };
    
    res.json({ success: true, message: "Data cleared" });
});

// ============================================================
// ====== مسارات الصفحات ======
// ============================================================

app.get("/system-info", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>📊 معلومات النظام</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial; background: #0d0d0d; color: #fff; padding: 20px; }
        .container { max-width: 1100px; margin: 0 auto; }
        h1 { text-align: center; color: #00e676; border-bottom: 2px solid #00e676; padding-bottom: 15px; margin-bottom: 20px; }
        .controls { text-align: center; margin: 20px 0; }
        .btn { padding: 10px 25px; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: bold; cursor: pointer; margin: 5px; }
        .btn-primary { background: #00e676; color: #000; }
        .btn-info { background: #2196F3; color: #fff; }
        .btn-danger { background: #ff5252; color: #fff; }
        .token-input { padding: 10px 15px; background: #1a1a2e; border: 1px solid #2a2a4a; color: #fff; border-radius: 8px; width: 200px; text-align: center; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .card { background: #1a1a2e; border-radius: 12px; padding: 18px; border: 1px solid #2a2a4a; }
        .card .label { font-size: 0.7rem; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 6px; }
        .card .value { font-size: 1rem; font-weight: 600; color: #fff; word-break: break-all; }
        .vm-true { color: #ff5252; }
        .vm-false { color: #00e676; }
        .timestamp { text-align: center; margin-top: 20px; color: #666; }
        .status-box { background: #1a1a2e; padding: 10px; text-align: center; border: 1px solid #2a2a4a; border-radius: 8px; margin-bottom: 15px; }
        .status-online { color: #00e676; }
        .status-offline { color: #ff5252; }
    </style>
</head>
<body>
<div class="container">
    <h1>🖥️ معلومات النظام</h1>
    <div class="controls">
        <input type="password" id="tokenInput" class="token-input" placeholder="التوكن" value="medo123">
        <button class="btn btn-primary" onclick="loadData()">🔄 تحديث</button>
        <button class="btn btn-info" onclick="sendTest()">🧪 اختبار</button>
        <button class="btn btn-danger" onclick="clearData()">🗑️ مسح</button>
    </div>

    <div class="status-box" id="statusBox">
        <span id="statusText">🔄 جاري التحميل...</span>
    </div>

    <div id="loading" style="text-align:center;color:#ffa726;padding:40px;display:none;">⏳ جاري التحميل...</div>
    <div id="error" style="text-align:center;color:#ff5252;padding:25px;display:none;"></div>
    <div id="empty" style="text-align:center;color:#888;padding:50px;display:none;">
        <div style="font-size:3rem;">📭</div>
        <h3>لا توجد بيانات</h3>
        <p>لم يتم استقبال معلومات من العميل بعد</p>
    </div>
    <div class="grid" id="cards" style="display:none;"></div>
    <div class="timestamp" id="timestamp"></div>
</div>

<script>
    const API_URL = '/api/system-info';

    async function loadData() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const empty = document.getElementById('empty');
        const cards = document.getElementById('cards');
        const timestamp = document.getElementById('timestamp');
        const statusText = document.getElementById('statusText');

        loading.style.display = 'block';
        error.style.display = 'none';
        empty.style.display = 'none';
        cards.style.display = 'none';
        timestamp.innerText = '';
        statusText.innerText = '🔄 جاري التحميل...';
        statusText.style.color = '#ffa726';

        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();

            loading.style.display = 'none';
            statusText.innerText = '✅ متصل';
            statusText.style.color = '#00e676';

            if (!data || data.username === 'في انتظار البيانات' || data.username === 'تم مسح البيانات') {
                empty.style.display = 'block';
                return;
            }

            cards.style.display = 'grid';
            const time = data.received_at ? new Date(data.received_at).toLocaleString('ar-EG') : 'الآن';
            timestamp.innerText = '🕐 آخر تحديث: ' + time;

            const fields = [
                { label: '👤 المستخدم', key: 'username' },
                { label: '💻 اسم الجهاز', key: 'pc_name' },
                { label: '🖥️ نظام التشغيل', key: 'os' },
                { label: '⚙️ المعالج', key: 'cpu' },
                { label: '💾 الذاكرة', key: 'ram' },
                { label: '🌐 MAC', key: 'mac' },
                { label: '🌍 IP العام', key: 'public_ip' },
                { label: '🆔 HWID', key: 'hwid' },
                { 
                    label: '🎭 VM', 
                    key: 'is_vm',
                    render: (val) => val ? '<span class="vm-true">✅ نعم</span>' : '<span class="vm-false">❌ لا</span>'
                }
            ];

            let html = '';
            for (const f of fields) {
                let val = data[f.key] || 'غير متوفر';
                if (f.render) val = f.render(data[f.key]);
                html += '<div class="card"><div class="label">' + f.label + '</div><div class="value">' + val + '</div></div>';
            }

            if (data.ip) {
                html += '<div class="card"><div class="label">📡 IP العميل</div><div class="value">' + data.ip + '</div></div>';
            }

            cards.innerHTML = html;

        } catch (err) {
            loading.style.display = 'none';
            error.style.display = 'block';
            statusText.innerText = '❌ غير متصل';
            statusText.style.color = '#ff5252';
            error.innerHTML = '❌ ' + err.message;
        }
    }

    async function sendTest() {
        const testData = {
            username: "Test_User_" + Math.floor(Math.random() * 1000),
            pc_name: "DESKTOP-TEST",
            os: "Windows 10 Pro",
            cpu: "Intel Core i7-10700K",
            ram: "32768 MB",
            mac: "AA-BB-CC-DD-EE-FF",
            public_ip: "192.168.1." + Math.floor(Math.random() * 255),
            hwid: "S-1-5-21-TEST-" + Date.now(),
            is_vm: false
        };

        try {
            const token = document.getElementById('tokenInput').value;
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                alert('✅ تم إرسال بيانات اختبار بنجاح!');
                loadData();
            } else {
                alert('❌ فشل الإرسال');
            }
        } catch (err) {
            alert('❌ خطأ: ' + err.message);
        }
    }

    async function clearData() {
        if (!confirm('مسح البيانات؟')) return;
        try {
            const token = document.getElementById('tokenInput').value;
            await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });
            alert('✅ تم المسح');
            loadData();
        } catch (err) {
            alert('❌ خطأ: ' + err.message);
        }
    }

    loadData();
    setInterval(loadData, 15000);
</script>
</body>
</html>
    `);
});

app.get("/test", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "السيرفر يعمل! 🚀",
        time: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.send(`
        <h1>🚀 Integrity Server</h1>
        <ul>
            <li><a href="/system-info">📊 معلومات النظام</a></li>
            <li><a href="/api/system-info">📡 API</a></li>
            <li><a href="/test">🧪 اختبار</a></li>
        </ul>
        <p>السيرفر يعمل 🚀</p>
        <p>التوكن: <code>medo123</code></p>
    `);
});

// ============================================================
// ====== تشغيل السيرفر ======
// ============================================================
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    console.log(`📊 /system-info`);
    console.log(`📡 /api/system-info`);
    console.log(`🧪 /test`);
});
