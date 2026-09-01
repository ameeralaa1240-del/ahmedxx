const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const ADMIN_TOKEN = "medo123";
const PORT = 3000;

// بيانات افتراضية
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

const checkAuth = (req) => {
    const auth = req.get("Authorization");
    return auth === ADMIN_TOKEN || auth === `Bearer ${ADMIN_TOKEN}`;
};

// ===== مسار الاختبار =====
app.get("/test", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "السيرفر يعمل! 🚀",
        time: new Date().toISOString()
    });
});

// ===== استقبال البيانات =====
app.post("/api/system-info", (req, res) => {
    console.log("📥 POST /api/system-info");
    
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const data = req.body;
    lastSystemInfo = {
        ...data,
        received_at: new Date().toISOString(),
        ip: req.ip || 'unknown'
    };

    console.log(`✅ تم استقبال من: ${data.username || 'مجهول'}`);
    res.json({ success: true, data: lastSystemInfo });
});

// ===== جلب البيانات =====
app.get("/api/system-info", (req, res) => {
    console.log("📤 GET /api/system-info");
    res.json(lastSystemInfo);
});

// ===== مسح البيانات =====
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
    res.json({ success: true });
});

// ===== الصفحات =====
app.get("/system-info", (req, res) => {
    res.sendFile(path.join(__dirname, "system-info.html"));
});

app.get("/", (req, res) => {
    res.send(`
        <h1>🚀 Integrity Server</h1>
        <ul>
            <li><a href="/system-info">📊 معلومات النظام</a></li>
            <li><a href="/api/system-info">📡 API</a></li>
            <li><a href="/test">🧪 اختبار</a></li>
        </ul>
        <p>السيرفر يعمل على http://localhost:${PORT}</p>
        <p>التوكن: <code>medo123</code></p>
    `);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 السيرفر يعمل على:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://localhost:${PORT}/system-info`);
    console.log(`   http://localhost:${PORT}/api/system-info`);
    console.log(`   http://localhost:${PORT}/test\n`);
});