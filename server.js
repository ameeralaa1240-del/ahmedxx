const express = require("express");
const cors = require("cors");
const path = require("path");

// محاولة استيراد Redis (إذا لم يكن موجوداً، يعمل بدونه)
let redis = null;
let useRedis = false;
try {
    const { createClient } = require("redis");
    redis = createClient({ url: "redis://127.0.0.1:6379" });
    redis.on("error", (err) => {
        console.log("⚠️ Redis غير متصل، سيتم استخدام التخزين المحلي");
        useRedis = false;
    });
    redis.on("connect", () => {
        console.log("✅ Redis متصل");
        useRedis = true;
    });
} catch (e) {
    console.log("⚠️ Redis غير مثبت، سيتم استخدام التخزين المحلي");
}

const app = express();

// ===== إعدادات CORS =====
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ===== الثوابت =====
const ADMIN_TOKEN = "medo123";
const PORT = process.env.PORT || 3000;

// ===== التخزين المحلي (بديل Redis) =====
let localStorage = {
    expected_md5: "",
    server_status: "true",
    banned_hwids: [],
    last_system_info: {
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
    }
};

// ===== دوال مساعدة للـ Redis أو التخزين المحلي =====
async function getData(key) {
    if (useRedis && redis) {
        try {
            const value = await redis.get(key);
            return value;
        } catch (e) {
            return null;
        }
    }
    return localStorage[key] !== undefined ? localStorage[key] : null;
}

async function setData(key, value) {
    if (useRedis && redis) {
        try {
            await redis.set(key, value);
            return true;
        } catch (e) {
            return false;
        }
    }
    localStorage[key] = value;
    return true;
}

async function getJSON(key) {
    const data = await getData(key);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }
    return null;
}

async function setJSON(key, value) {
    return await setData(key, JSON.stringify(value));
}

// ===== التحقق من التوكن =====
const checkAuth = (req) => {
    const auth = req.get("Authorization");
    return (auth === ADMIN_TOKEN || auth === `Bearer ${ADMIN_TOKEN}`);
};

// ============================================================
// ====== 1. مسارات الهاش (MD5 Integrity) ======
// ============================================================
app.get("/integrity", async (req, res) => {
    const hash = await getData("expected_md5");
    res.json({ success: true, hash: hash || "" });
});

app.post("/integrity", async (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    await setData("expected_md5", req.body.hash?.toLowerCase() || "");
    res.json({ success: true });
});

// ============================================================
// ====== 2. مسارات حالة السيرفر (Status) ======
// ============================================================
app.get("/status", async (req, res) => {
    const status = await getData("server_status");
    res.json({ enabled: status !== "false" });
});

app.post("/status", async (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    await setData("server_status", req.body.enabled?.toString() || "true");
    res.json({ success: true });
});

// ============================================================
// ====== 3. مسارات الحظر (HWID Bans) ======
// ============================================================
app.get("/bans", async (req, res) => {
    const bans = await getJSON("banned_hwids");
    res.json({ banned_hwids: bans || [] });
});

app.post("/bans", async (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    await setJSON("banned_hwids", req.body.banned_hwids || []);
    res.json({ success: true });
});

// ============================================================
// ====== 4. مسارات معلومات النظام (System Info) ======
// ============================================================

// 4.1 استقبال البيانات
app.post("/api/system-info", async (req, res) => {
    console.log("📥 POST /api/system-info");
    
    if (!checkAuth(req)) {
        console.log("❌ Unauthorized");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const data = req.body;
        const enrichedData = {
            ...data,
            received_at: new Date().toISOString(),
            ip: req.ip || req.connection?.remoteAddress || 'unknown'
        };

        // تخزين في Redis أو محلياً
        await setJSON("last_system_info", enrichedData);
        
        // تحديث المتغير المحلي أيضاً
        localStorage.last_system_info = enrichedData;

        console.log(`✅ تم استقبال من: ${data.username || 'مجهول'}`);
        res.json({ 
            success: true, 
            message: "تم استقبال معلومات النظام",
            data: enrichedData
        });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 4.2 جلب البيانات
app.get("/api/system-info", async (req, res) => {
    console.log("📤 GET /api/system-info");
    
    try {
        let data = await getJSON("last_system_info");
        
        if (!data || Object.keys(data).length === 0) {
            data = localStorage.last_system_info;
        }

        res.json(data || {
            username: "لا توجد بيانات",
            pc_name: "لا توجد بيانات",
            os: "لا توجد بيانات",
            message: "لم يتم استقبال معلومات من العميل بعد"
        });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 4.3 مسح البيانات
app.delete("/api/system-info", async (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const emptyData = {
        username: "تم مسح البيانات",
        pc_name: "تم مسح البيانات",
        os: "تم مسح البيانات",
        cpu: "تم مسح البيانات",
        ram: "تم مسح البيانات",
        mac: "تم مسح البيانات",
        public_ip: "تم مسح البيانات",
        hwid: "تم مسح البيانات",
        is_vm: false,
        received_at: new Date().toISOString(),
        message: "تم مسح البيانات يدوياً"
    };

    await setJSON("last_system_info", emptyData);
    localStorage.last_system_info = emptyData;
    
    console.log("🗑️ Data cleared");
    res.json({ success: true, message: "Data cleared" });
});

// ============================================================
// ====== 5. الصفحات ======
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
        time: new Date().toISOString(),
        redis: useRedis ? "متصل" : "غير متصل",
        storage: useRedis ? "Redis" : "محلي"
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
                    <li><a href="/admin.html">🔐 لوحة التحكم</a></li>
                    <li><a href="/test">🧪 اختبار السيرفر</a></li>
                    <li><a href="/integrity">🔑 الهاش</a></li>
                    <li><a href="/status">📊 الحالة</a></li>
                    <li><a href="/bans">🚫 المحظورين</a></li>
                </ul>
            </div>
            <div class="box">
                <p>✅ السيرفر يعمل على <strong>http://localhost:${PORT}</strong></p>
                <p>🔑 التوكن: <code style="background:#333;padding:2px 8px;border-radius:4px;">medo123</code></p>
                <p>💾 التخزين: <span class="status">${useRedis ? '✅ Redis' : '📁 محلي'}</span></p>
            </div>
        </body>
        </html>
    `);
});

// ============================================================
// ====== 6. تشغيل السيرفر ======
// ============================================================

async function start() {
    // محاولة الاتصال بـ Redis
    if (redis) {
        try {
            await redis.connect();
            useRedis = true;
            console.log("✅ Redis متصل");
        } catch (err) {
            console.log("⚠️ فشل الاتصال بـ Redis، سيتم استخدام التخزين المحلي");
            useRedis = false;
        }
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
        console.log(`📊 معلومات النظام: http://localhost:${PORT}/system-info`);
        console.log(`📡 API: http://localhost:${PORT}/api/system-info`);
        console.log(`🧪 اختبار: http://localhost:${PORT}/test`);
        console.log(`💾 التخزين: ${useRedis ? 'Redis' : 'محلي'}`);
        console.log(`${'='.repeat(50)}\n`);
    });
}

start();