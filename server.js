const express = require("express");
const path = require("path");

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
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

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

// استقبال البيانات
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

// جلب البيانات
app.get("/api/system-info", (req, res) => {
    console.log("📤 GET /api/system-info");
    res.json(lastSystemInfo);
});

// مسح البيانات
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

// صفحة معلومات النظام
app.get("/system-info", (req, res) => {
    res.sendFile(path.join(__dirname, "system-info.html"));
});

// صفحة الاختبار
app.get("/test", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "السيرفر يعمل! 🚀",
        time: new Date().toISOString()
    });
});

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🚀 Integrity Server</title>
            <style>
                body { font-family: Arial; background: #0d0d0d; color: #fff; padding: 30px; }
                h1 { color: #00e676; }
                a { color: #00e676; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .box { background: #1a1a2e; padding: 20px; border-radius: 10px; margin: 10px 0; }
                .status { color: #00e676; }
            </style>
        </head>
        <body>
            <h1>🚀 Integrity Server</h1>
            <div class="box">
                <h3>📊 الروابط:</h3>
                <ul>
                    <li><a href="/system-info">📊 معلومات النظام</a></li>
                    <li><a href="/api/system-info">📡 API - معلومات النظام</a></li>
                    <li><a href="/test">🧪 اختبار السيرفر</a></li>
                </ul>
            </div>
            <div class="box">
                <p>✅ السيرفر يعمل على <strong>Railway</strong></p>
                <p>🔑 التوكن: <code style="background:#333;padding:2px 8px;border-radius:4px;">medo123</code></p>
            </div>
        </body>
        </html>
    `);
});

// ============================================================
// ====== تشغيل السيرفر ======
// ============================================================
app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 السيرفر يعمل على port ${PORT}`);
    console.log(`📊 /system-info`);
    console.log(`📡 /api/system-info`);
    console.log(`🧪 /test\n`);
});
