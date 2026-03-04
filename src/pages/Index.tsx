import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { YandexLoginButton } from "@/components/extensions/yandex-auth/YandexLoginButton";
import { useYandexAuth } from "@/components/extensions/yandex-auth/useYandexAuth";
import func2url from "../../func2url.json";

const AUTH_URL = func2url["yandex-auth-yandex-auth"];

type Page = "home" | "register" | "login" | "dashboard" | "plans" | "payment";
type PlanId = "vip1" | "vip2" | "vip3" | "deluxe";

interface User {
  username: string;
  email: string;
  password: string;
  plan: PlanId | null;
  planExpiry: string | null;
  checksUsed: number;
  registeredAt: string;
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  message: string;
  time: string;
}

const PLANS = {
  vip1: {
    name: "VIP",
    price: 150,
    period: "месяц",
    color: "#7c6ff7",
    borderColor: "#7c6ff7",
    btnColor: "bg-[#7c6ff7]",
    maxChecks: 8,
    features: [
      { label: "Проверить ник", icon: "User" },
      { label: "Чекнуть IP-адрес", icon: "Globe" },
      { label: "Узнать пароль (8 раз)", icon: "Lock" },
      { label: "История входов", icon: "Clock" },
    ],
    disabled: [],
    duration: "30 дней",
  },
  vip2: {
    name: "VIP",
    price: 250,
    period: "три месяца",
    color: "#22c55e",
    borderColor: "#22c55e",
    btnColor: "bg-[#22c55e]",
    maxChecks: 16,
    features: [
      { label: "Проверить ник", icon: "User" },
      { label: "Чекнуть IP-адрес", icon: "Globe" },
      { label: "Узнать пароль (16 раз)", icon: "Lock" },
      { label: "История входов", icon: "Clock" },
      { label: "Алерты активности", icon: "Bell" },
      { label: "Скрыть 2 ника", icon: "EyeOff" },
    ],
    disabled: [],
    duration: "90 дней",
  },
  vip3: {
    name: "VIP",
    price: 450,
    period: "навсегда",
    color: "#eab308",
    borderColor: "#eab308",
    btnColor: "bg-[#eab308]",
    maxChecks: 32,
    features: [
      { label: "Проверить ник", icon: "User" },
      { label: "Чекнуть IP-адрес", icon: "Globe" },
      { label: "Узнать пароль (32 раза)", icon: "Lock" },
      { label: "История входов FULL", icon: "Clock" },
      { label: "Алерты активности", icon: "Bell" },
      { label: "AUTO-CHECKER", icon: "Zap" },
      { label: "HARD-ДЕКОДЕР", icon: "Shield" },
    ],
    disabled: [],
    duration: "навсегда",
  },
  deluxe: {
    name: "DELUXE",
    price: 850,
    period: "месяц",
    color: "#ef4444",
    borderColor: "#ef4444",
    btnColor: "bg-[#ef4444]",
    maxChecks: 64,
    features: [
      { label: "Все функции VIP", icon: "Crown" },
      { label: "Элитные базы серверов", icon: "Database" },
      { label: "Логи серверов", icon: "FileText" },
      { label: "Узнать пароль (64 раза)", icon: "Lock" },
      { label: "ПАРСЕР+", icon: "Cpu" },
      { label: "Моментальная окупаемость", icon: "TrendingUp" },
    ],
    disabled: [],
    duration: "30 дней",
  },
};

const MC_SERVERS = [
  "HypixelRU", "FunTime", "SunRise", "AresMine", "ReallyWorld",
  "HolyWorld", "SpookyTime", "CraftWorld", "MinePlex", "SkyBlock",
];

const PAYMENT_METHODS = [
  { name: "Банковские карты", sub: "VISA / МИР", icon: "💳", color: "#1a56db" },
  { name: "СберБанк", sub: "Онлайн", icon: "🟢", color: "#22c55e" },
  { name: "Telegram Бот", sub: "Быстрый перевод", icon: "✈️", color: "#0ea5e9" },
  { name: "Крипта", sub: "TON · BTC · ETH · XMR", icon: "₿", color: "#f59e0b" },
  { name: "CryptoBot", sub: "Telegram", icon: "🤖", color: "#7c3aed" },
];

function generateFakeIP() {
  return `${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateFakePassword(server: string, nick: string) {
  const parts = [nick.toLowerCase(), server.slice(0, 3).toLowerCase(), Math.floor(Math.random() * 9999)];
  return parts.join("_");
}

export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const yandexAuth = useYandexAuth({
    apiUrls: {
      authUrl: `${AUTH_URL}?action=auth-url`,
      callback: `${AUTH_URL}?action=callback`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
    },
    onAuthChange: (yUser) => {
      if (yUser) {
        const newUser: User = {
          username: yUser.name || yUser.email || "Яндекс пользователь",
          email: yUser.email || "",
          password: "",
          plan: null,
          planExpiry: null,
          checksUsed: 0,
          registeredAt: new Date().toLocaleString("ru-RU"),
          alerts: [],
        };
        saveUser(newUser);
        setPage("dashboard");
      }
    },
  });

  // Auth forms
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // Checker states
  const [checkerNick, setCheckerNick] = useState("");
  const [checkerServer, setCheckerServer] = useState("");
  const [checkerResult, setCheckerResult] = useState<null | { ip: string; password: string; nick: string; server: string }>(null);
  const [checkerStep, setCheckerStep] = useState<"nick" | "server" | "waiting" | "result">("nick");
  const [waitTimer, setWaitTimer] = useState(300);
  const [waitInterval, setWaitInterval] = useState<NodeJS.Timeout | null>(null);
  const [ipResult, setIpResult] = useState<null | string>(null);
  const [activeTab, setActiveTab] = useState<"checker" | "ip" | "history" | "alerts">("checker");

  useEffect(() => {
    const stored = localStorage.getItem("mc_stresser_user");
    if (stored) {
      setUser(JSON.parse(stored));
      setPage("dashboard");
    }
  }, []);

  function saveUser(u: User) {
    localStorage.setItem("mc_stresser_user", JSON.stringify(u));
    setUser(u);
  }

  function handleRegister() {
    if (!regUsername || !regEmail || !regPassword) {
      setAuthError("Заполните все поля");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("Пароль минимум 6 символов");
      return;
    }
    const newUser: User = {
      username: regUsername,
      email: regEmail,
      password: regPassword,
      plan: null,
      planExpiry: null,
      checksUsed: 0,
      registeredAt: new Date().toLocaleString("ru-RU"),
      alerts: [],
    };
    saveUser(newUser);
    setRegSuccess(true);
    setTimeout(() => {
      setPage("dashboard");
      setRegSuccess(false);
    }, 1200);
  }

  function handleLogin() {
    const stored = localStorage.getItem("mc_stresser_user");
    if (!stored) { setAuthError("Аккаунт не найден"); return; }
    const u: User = JSON.parse(stored);
    if (u.email !== loginEmail || u.password !== loginPassword) {
      setAuthError("Неверный email или пароль");
      return;
    }
    setUser(u);
    setPage("dashboard");
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("mc_stresser_user");
    setPage("home");
  }

  function handleSelectPlan(planId: PlanId) {
    setSelectedPlan(planId);
    setPage("payment");
  }

  function handleBuyPlan() {
    if (!user || !selectedPlan) return;
    const plan = PLANS[selectedPlan];
    const expiry = selectedPlan === "vip3" ? "навсегда" : new Date(Date.now() + (selectedPlan === "vip2" ? 90 : 30) * 86400000).toLocaleDateString("ru-RU");
    const updated: User = { ...user, plan: selectedPlan, planExpiry: expiry, checksUsed: 0 };
    saveUser(updated);
    setPage("dashboard");
    setSelectedPlan(null);
  }

  function startCheckerFlow() {
    if (!checkerNick.trim()) return;
    setCheckerStep("server");
  }

  function startWaiting() {
    if (!checkerServer) return;
    setCheckerStep("waiting");
    setWaitTimer(300);
    const iv = setInterval(() => {
      setWaitTimer(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          const result = {
            ip: generateFakeIP(),
            password: generateFakePassword(checkerServer, checkerNick),
            nick: checkerNick,
            server: checkerServer,
          };
          setCheckerResult(result);
          setCheckerStep("result");
          if (user) {
            const alert: Alert = {
              id: Date.now().toString(),
              type: "warning",
              message: `Аккаунт ${checkerNick} проверен на сервере ${checkerServer}`,
              time: new Date().toLocaleTimeString("ru-RU"),
            };
            const updated: User = {
              ...user,
              checksUsed: user.checksUsed + 1,
              alerts: [alert, ...user.alerts].slice(0, 20),
            };
            saveUser(updated);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setWaitInterval(iv);
  }

  function resetChecker() {
    setCheckerNick("");
    setCheckerServer("");
    setCheckerResult(null);
    setCheckerStep("nick");
    setWaitTimer(300);
    if (waitInterval) clearInterval(waitInterval);
  }

  function checkIP() {
    if (!checkerNick.trim()) return;
    setIpResult(generateFakeIP());
  }

  const plan = user?.plan ? PLANS[user.plan] : null;
  const checksLeft = plan ? plan.maxChecks - (user?.checksUsed || 0) : 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ===================== HOME =====================
  if (page === "home") return (
    <div className="min-h-screen bg-[#0a0b0f] font-montserrat overflow-x-hidden">
      {/* Animated bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7c6ff7]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#22c55e]/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ef4444]/5 rounded-full blur-[150px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#7c6ff7] to-[#ef4444] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-black">MC</span>
          </div>
          <span className="text-white font-black text-xl tracking-wider">STRESSER</span>
          <span className="text-[10px] text-[#7c6ff7] bg-[#7c6ff7]/10 px-2 py-0.5 rounded-full font-semibold tracking-widest">PRO</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPage("plans")} className="text-gray-400 hover:text-white text-sm transition-colors px-4 py-2">Тарифы</button>
          <button onClick={() => setPage("login")} className="text-gray-400 hover:text-white text-sm transition-colors px-4 py-2">Войти</button>
          <button onClick={() => setPage("register")} className="bg-[#7c6ff7] hover:bg-[#6a5de0] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all">Регистрация</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center pt-24 pb-16 px-6">
        <div className="inline-block bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest">
          ⚡ MINECRAFT ACCOUNT STRESSER
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          Проверка<br />
          <span className="bg-gradient-to-r from-[#7c6ff7] via-[#a855f7] to-[#ef4444] bg-clip-text text-transparent">аккаунтов</span><br />
          Minecraft
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Узнай пароль, IP-адрес и историю входов любого аккаунта.<br />
          Профессиональные инструменты для серьёзных задач.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={() => setPage("register")} className="bg-gradient-to-r from-[#7c6ff7] to-[#a855f7] hover:opacity-90 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105">
            Начать бесплатно
          </button>
          <button onClick={() => setPage("plans")} className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all">
            Посмотреть тарифы
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex justify-center gap-12 pb-16 flex-wrap">
        {[["50K+", "Аккаунтов проверено"], ["99%", "Точность данных"], ["5мин", "Время взлома"], ["24/7", "Работаем всегда"]].map(([val, label]) => (
          <div key={val} className="text-center">
            <div className="text-3xl font-black text-white mb-1">{val}</div>
            <div className="text-gray-500 text-sm">{label}</div>
          </div>
        ))}
      </div>

      {/* Plans preview */}
      <div className="relative z-10 px-6 pb-20">
        <h2 className="text-center text-3xl font-black text-white mb-12">Выберите тариф</h2>
        <PlansGrid onSelect={handleSelectPlan} isLoggedIn={!!user} />
      </div>

      {/* Payment section */}
      <div className="relative z-10 px-6 pb-20">
        <h2 className="text-center text-2xl font-black text-white mb-8">Выберите удобный способ оплаты</h2>
        <PaymentMethods />
      </div>
    </div>
  );

  // ===================== PLANS =====================
  if (page === "plans") return (
    <div className="min-h-screen bg-[#0a0b0f] font-montserrat">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7c6ff7]/10 rounded-full blur-[120px]" />
      </div>
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={18} />
          <span className="text-white font-black text-xl tracking-wider">MC STRESSER</span>
        </button>
        <div className="flex gap-3">
          {user ? (
            <button onClick={() => setPage("dashboard")} className="bg-[#7c6ff7] text-white text-sm font-semibold px-5 py-2 rounded-lg">Личный кабинет</button>
          ) : (
            <button onClick={() => setPage("register")} className="bg-[#7c6ff7] text-white text-sm font-semibold px-5 py-2 rounded-lg">Регистрация</button>
          )}
        </div>
      </nav>
      <div className="relative z-10 px-6 py-16">
        <h1 className="text-center text-4xl font-black text-white mb-4">Тарифные планы</h1>
        <p className="text-center text-gray-400 mb-12">Выберите подходящий план и получите доступ к инструментам</p>
        <PlansGrid onSelect={handleSelectPlan} isLoggedIn={!!user} />
        <div className="mt-20">
          <h2 className="text-center text-2xl font-black text-white mb-8">Способы оплаты</h2>
          <PaymentMethods />
        </div>
      </div>
    </div>
  );

  // ===================== REGISTER =====================
  if (page === "register") return (
    <div className="min-h-screen bg-[#0a0b0f] font-montserrat flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#7c6ff7]/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <div className="bg-[#111318] border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#7c6ff7] to-[#a855f7] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="UserPlus" size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Регистрация</h2>
            <p className="text-gray-500 text-sm mt-1">Создайте аккаунт MC Stresser</p>
          </div>

          {regSuccess && (
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-sm rounded-lg px-4 py-3 mb-4 text-center font-semibold">
              ✓ Аккаунт создан! Добро пожаловать
            </div>
          )}
          {authError && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm rounded-lg px-4 py-3 mb-4 text-center">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Никнейм</label>
              <input
                value={regUsername}
                onChange={e => { setRegUsername(e.target.value); setAuthError(""); }}
                placeholder="ProPlayer228"
                className="w-full bg-[#0d0e13] border border-white/10 focus:border-[#7c6ff7] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
              <input
                value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setAuthError(""); }}
                type="email"
                placeholder="your@email.com"
                className="w-full bg-[#0d0e13] border border-white/10 focus:border-[#7c6ff7] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Пароль</label>
              <input
                value={regPassword}
                onChange={e => { setRegPassword(e.target.value); setAuthError(""); }}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0d0e13] border border-white/10 focus:border-[#7c6ff7] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
              />
            </div>
            <button onClick={handleRegister} className="w-full bg-gradient-to-r from-[#7c6ff7] to-[#a855f7] hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all">
              Создать аккаунт
            </button>
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">или</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <YandexLoginButton onClick={yandexAuth.login} isLoading={yandexAuth.isLoading} className="w-full justify-center" />
          <p className="text-center text-gray-500 text-sm mt-6">
            Уже есть аккаунт?{" "}
            <button onClick={() => { setPage("login"); setAuthError(""); }} className="text-[#7c6ff7] hover:underline">Войти</button>
          </p>
        </div>
      </div>
    </div>
  );

  // ===================== LOGIN =====================
  if (page === "login") return (
    <div className="min-h-screen bg-[#0a0b0f] font-montserrat flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#22c55e]/8 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <div className="bg-[#111318] border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="LogIn" size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Вход</h2>
            <p className="text-gray-500 text-sm mt-1">Добро пожаловать обратно</p>
          </div>

          {authError && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm rounded-lg px-4 py-3 mb-4 text-center">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
              <input
                value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setAuthError(""); }}
                type="email"
                placeholder="your@email.com"
                className="w-full bg-[#0d0e13] border border-white/10 focus:border-[#22c55e] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Пароль</label>
              <input
                value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setAuthError(""); }}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0d0e13] border border-white/10 focus:border-[#22c55e] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
              />
            </div>
            <button onClick={handleLogin} className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all">
              Войти
            </button>
          </div>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">или</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <YandexLoginButton onClick={yandexAuth.login} isLoading={yandexAuth.isLoading} className="w-full justify-center" />
          <p className="text-center text-gray-500 text-sm mt-6">
            Нет аккаунта?{" "}
            <button onClick={() => { setPage("register"); setAuthError(""); }} className="text-[#7c6ff7] hover:underline">Зарегистрироваться</button>
          </p>
        </div>
      </div>
    </div>
  );

  // ===================== PAYMENT =====================
  if (page === "payment" && selectedPlan) {
    const p = PLANS[selectedPlan];
    return (
      <div className="min-h-screen bg-[#0a0b0f] font-montserrat flex items-center justify-center px-4">
        <div className="relative z-10 w-full max-w-lg">
          <button onClick={() => setPage("plans")} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm">
            <Icon name="ArrowLeft" size={16} />
            Назад к тарифам
          </button>
          <div className="bg-[#111318] border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-black text-white mb-2">Оплата тарифа</h2>
            <div className="flex items-center gap-3 mb-8">
              <span className="font-black text-3xl" style={{ color: p.color }}>{p.price}₽</span>
              <span className="text-gray-400">/ {p.period}</span>
              <span className="ml-auto text-xs bg-white/5 px-3 py-1 rounded-full text-gray-400">{p.name} • {p.duration}</span>
            </div>

            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Выберите способ оплаты</h3>
            <PaymentMethods />

            <div className="mt-8 p-4 bg-[#0d0e13] rounded-xl border border-white/5">
              <p className="text-gray-400 text-xs text-center">После оплаты — нажмите кнопку ниже для активации</p>
            </div>
            <button onClick={handleBuyPlan} className="w-full mt-4 font-bold py-4 rounded-xl text-white text-lg transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}99)` }}>
              Подтвердить оплату и активировать
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== DASHBOARD =====================
  if (page === "dashboard" && user) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] font-montserrat">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#7c6ff7]/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-[120px]" />
        </div>

        {/* Top Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7c6ff7] to-[#ef4444] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-black">MC</span>
            </div>
            <span className="text-white font-black text-lg tracking-wider">STRESSER</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white text-sm font-bold">{user.username}</div>
              <div className="text-gray-500 text-xs">{user.email}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors p-2">
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </nav>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
          {/* Status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111318] border border-white/5 rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-1">Аккаунт</div>
              <div className="text-white font-bold">{user.username}</div>
            </div>
            <div className="bg-[#111318] border border-white/5 rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-1">Тариф</div>
              <div className="font-bold" style={{ color: plan?.color || "#gray" }}>
                {plan ? `${plan.name} ${plan.price}₽` : "Нет тарифа"}
              </div>
            </div>
            <div className="bg-[#111318] border border-white/5 rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-1">Проверок осталось</div>
              <div className="text-white font-bold">{plan ? checksLeft : "—"}</div>
            </div>
            <div className="bg-[#111318] border border-white/5 rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-1">Действует до</div>
              <div className="text-white font-bold text-xs">{user.planExpiry || "—"}</div>
            </div>
          </div>

          {!user.plan && (
            <div className="bg-[#7c6ff7]/10 border border-[#7c6ff7]/30 rounded-xl p-5 mb-8 flex items-center justify-between">
              <div>
                <div className="text-white font-bold mb-1">У вас нет активного тарифа</div>
                <div className="text-gray-400 text-sm">Купите тариф чтобы начать проверку аккаунтов</div>
              </div>
              <button onClick={() => setPage("plans")} className="bg-[#7c6ff7] hover:bg-[#6a5de0] text-white font-bold px-6 py-2.5 rounded-xl transition-all whitespace-nowrap ml-4">
                Выбрать тариф
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-[#111318] border border-white/5 rounded-xl p-1 mb-6 overflow-x-auto">
            {([
              { id: "checker", label: "Чекер", icon: "Search" },
              { id: "ip", label: "IP-адрес", icon: "Globe" },
              { id: "history", label: "История", icon: "Clock" },
              { id: "alerts", label: "Алерты", icon: "Bell" },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-[#7c6ff7] text-white" : "text-gray-400 hover:text-white"}`}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* CHECKER TAB */}
          {activeTab === "checker" && (
            <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                <Icon name="Search" size={20} className="text-[#7c6ff7]" />
                Чекер паролей
              </h3>

              {!user.plan ? (
                <div className="text-center py-12">
                  <Icon name="Lock" size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Купите тариф для доступа к чекеру</p>
                </div>
              ) : checksLeft <= 0 ? (
                <div className="text-center py-12">
                  <Icon name="AlertTriangle" size={48} className="text-[#eab308] mx-auto mb-4" />
                  <p className="text-[#eab308] font-bold mb-2">Лимит проверок исчерпан</p>
                  <p className="text-gray-500 text-sm">Обновите тариф для продолжения</p>
                  <button onClick={() => setPage("plans")} className="mt-4 bg-[#7c6ff7] text-white font-bold px-6 py-2 rounded-xl">Обновить тариф</button>
                </div>
              ) : checkerStep === "nick" ? (
                <div className="max-w-md">
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Никнейм игрока</label>
                  <div className="flex gap-3">
                    <input
                      value={checkerNick}
                      onChange={e => setCheckerNick(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && startCheckerFlow()}
                      placeholder="Введите ник..."
                      className="flex-1 bg-[#0d0e13] border border-white/10 focus:border-[#7c6ff7] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono"
                    />
                    <button onClick={startCheckerFlow} className="bg-[#7c6ff7] hover:bg-[#6a5de0] text-white font-bold px-6 py-3 rounded-xl transition-all">
                      Далее
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mt-3">Осталось проверок: <span className="text-[#7c6ff7] font-bold">{checksLeft}</span></p>
                </div>
              ) : checkerStep === "server" ? (
                <div className="max-w-md">
                  <div className="bg-[#0d0e13] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                    <Icon name="User" size={16} className="text-[#7c6ff7]" />
                    <span className="text-gray-400 text-sm">Ник:</span>
                    <span className="text-white font-mono font-bold">{checkerNick}</span>
                  </div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                    Выберите сервер для поиска пароля
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {MC_SERVERS.map(s => (
                      <button
                        key={s}
                        onClick={() => setCheckerServer(s)}
                        className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${checkerServer === s ? "border-[#7c6ff7] bg-[#7c6ff7]/20 text-white" : "border-white/10 text-gray-400 hover:border-white/30 hover:text-white"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCheckerStep("nick")} className="border border-white/10 text-gray-400 hover:text-white font-semibold px-5 py-3 rounded-xl transition-all">
                      Назад
                    </button>
                    <button onClick={startWaiting} disabled={!checkerServer} className="flex-1 bg-[#7c6ff7] disabled:opacity-40 hover:bg-[#6a5de0] text-white font-bold py-3 rounded-xl transition-all">
                      Начать взлом
                    </button>
                  </div>
                </div>
              ) : checkerStep === "waiting" ? (
                <div className="text-center py-12">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1f2e" strokeWidth="8" />
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#7c6ff7" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (waitTimer / 300)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white font-mono">{formatTime(waitTimer)}</span>
                    </div>
                  </div>
                  <div className="text-[#7c6ff7] font-bold text-lg mb-2">Взламываем аккаунт...</div>
                  <div className="text-gray-500 text-sm mb-1">Ник: <span className="text-white font-mono">{checkerNick}</span></div>
                  <div className="text-gray-500 text-sm">Сервер: <span className="text-white font-mono">{checkerServer}</span></div>
                  <div className="mt-6 flex justify-center gap-2">
                    {["Сканирование базы", "Декодирование хэша", "Получение данных"].map((s, i) => (
                      <div key={s} className="text-xs text-gray-600 bg-[#0d0e13] px-3 py-1 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ) : checkerResult ? (
                <div>
                  <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <Icon name="CheckCircle" size={20} className="text-[#22c55e]" />
                    <span className="text-[#22c55e] font-bold">Аккаунт успешно взломан!</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    {[
                      { label: "Никнейм", value: checkerResult.nick, icon: "User" },
                      { label: "Сервер", value: checkerResult.server, icon: "Server" },
                      { label: "Пароль", value: checkerResult.password, icon: "Lock" },
                      { label: "IP-адрес", value: checkerResult.ip, icon: "Globe" },
                    ].map(row => (
                      <div key={row.label} className="bg-[#0d0e13] border border-white/5 rounded-xl px-5 py-4 flex items-center gap-4">
                        <Icon name={row.icon} fallback="Circle" size={18} className="text-[#7c6ff7]" />
                        <div className="flex-1">
                          <div className="text-gray-500 text-xs mb-0.5">{row.label}</div>
                          <div className="text-white font-mono font-bold">{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={resetChecker} className="bg-[#7c6ff7] hover:bg-[#6a5de0] text-white font-bold px-6 py-3 rounded-xl transition-all">
                    Проверить другой аккаунт
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* IP TAB */}
          {activeTab === "ip" && (
            <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                <Icon name="Globe" size={20} className="text-[#22c55e]" />
                IP-чекер
              </h3>
              {!user.plan ? (
                <div className="text-center py-12">
                  <Icon name="Lock" size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Купите тариф для доступа к IP-чекеру</p>
                  <button onClick={() => setPage("plans")} className="mt-4 bg-[#7c6ff7] text-white font-bold px-6 py-2 rounded-xl">Купить тариф</button>
                </div>
              ) : (
                <div className="max-w-md">
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Никнейм игрока</label>
                  <div className="flex gap-3 mb-6">
                    <input
                      value={checkerNick}
                      onChange={e => setCheckerNick(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && checkIP()}
                      placeholder="Введите ник..."
                      className="flex-1 bg-[#0d0e13] border border-white/10 focus:border-[#22c55e] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono"
                    />
                    <button onClick={checkIP} className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold px-6 py-3 rounded-xl transition-all">
                      Найти IP
                    </button>
                  </div>
                  {ipResult && (
                    <div className="bg-[#0d0e13] border border-[#22c55e]/30 rounded-xl p-5">
                      <div className="text-gray-500 text-xs mb-1">IP-адрес игрока {checkerNick}</div>
                      <div className="text-[#22c55e] font-mono font-black text-2xl">{ipResult}</div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-[#111318] rounded-lg p-3">
                          <div className="text-gray-500 mb-1">Страна</div>
                          <div className="text-white font-semibold">🇷🇺 Россия</div>
                        </div>
                        <div className="bg-[#111318] rounded-lg p-3">
                          <div className="text-gray-500 mb-1">Провайдер</div>
                          <div className="text-white font-semibold">Ростелеком</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                <Icon name="Clock" size={20} className="text-[#eab308]" />
                История проверок
              </h3>
              {user.alerts.filter(a => a.type === "warning").length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="ClockIcon" fallback="Clock" size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">История пуста. Проведите первую проверку.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.alerts.map(a => (
                    <div key={a.id} className="bg-[#0d0e13] border border-white/5 rounded-xl px-5 py-4 flex items-center gap-4">
                      <Icon name="Search" size={16} className="text-[#7c6ff7]" />
                      <div className="flex-1">
                        <div className="text-white text-sm">{a.message}</div>
                        <div className="text-gray-600 text-xs mt-0.5">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === "alerts" && (
            <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
                <Icon name="Bell" size={20} className="text-[#ef4444]" />
                Алерты активности
              </h3>
              {!user.plan || (user.plan === "vip1") ? (
                <div className="text-center py-12">
                  <Icon name="ShieldAlert" fallback="Shield" size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Алерты доступны с тарифа <span className="text-[#22c55e] font-bold">VIP 250₽</span></p>
                  <button onClick={() => setPage("plans")} className="mt-2 bg-[#22c55e] text-white font-bold px-6 py-2 rounded-xl">Обновить тариф</button>
                </div>
              ) : user.alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="BellOff" size={48} className="text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">Подозрительной активности не обнаружено</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.alerts.map(a => (
                    <div key={a.id} className={`border rounded-xl px-5 py-4 flex items-center gap-4 ${a.type === "danger" ? "bg-[#ef4444]/10 border-[#ef4444]/30" : a.type === "warning" ? "bg-[#eab308]/10 border-[#eab308]/30" : "bg-[#7c6ff7]/10 border-[#7c6ff7]/30"}`}>
                      <Icon name="AlertTriangle" size={16} className={a.type === "danger" ? "text-[#ef4444]" : a.type === "warning" ? "text-[#eab308]" : "text-[#7c6ff7]"} />
                      <div className="flex-1">
                        <div className="text-white text-sm">{a.message}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ===================== PLANS GRID COMPONENT =====================
function PlansGrid({ onSelect, isLoggedIn }: { onSelect: (p: PlanId) => void; isLoggedIn: boolean }) {
  const plans: { id: PlanId; p: typeof PLANS.vip1 }[] = [
    { id: "vip1", p: PLANS.vip1 },
    { id: "vip2", p: PLANS.vip2 },
    { id: "vip3", p: PLANS.vip3 },
    { id: "deluxe", p: PLANS.deluxe },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
      {plans.map(({ id, p }) => (
        <div
          key={id}
          className="relative bg-[#111318] rounded-2xl p-6 flex flex-col transition-all hover:scale-105"
          style={{ border: `2px solid ${p.borderColor}33`, boxShadow: `0 0 30px ${p.color}15` }}
        >
          {/* Glow top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 rounded-full" style={{ background: p.color }} />

          <div className="text-center mb-5">
            <div className="text-sm font-black tracking-widest mb-1" style={{ color: p.color }}>{p.name}</div>
            <div className="text-5xl font-black text-white">{p.price}<span className="text-2xl">₽</span></div>
            <div className="text-xs mt-1" style={{ color: p.color }}>{p.period}</div>
          </div>

          <div className="h-px mb-5" style={{ background: `${p.color}40` }} />

          <ul className="space-y-2.5 flex-1 mb-6">
            {p.features.map(f => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                {f.label}
              </li>
            ))}
          </ul>

          <div className="text-gray-500 text-xs text-center mb-4">
            Доступ выдаётся {p.duration}, после оплаты
          </div>

          <button
            onClick={() => onSelect(id)}
            className="w-full py-3 rounded-xl font-black text-white text-sm tracking-wider transition-all hover:opacity-90 hover:scale-105"
            style={{ background: p.color }}
          >
            Выбрать
          </button>
        </div>
      ))}
    </div>
  );
}

// ===================== PAYMENT METHODS =====================
function PaymentMethods() {
  const methods = [
    { name: "Банковские карты", sub: "VISA · МИР", icon: "💳", color: "#1a56db" },
    { name: "СберБанк", sub: "Онлайн", icon: "🟢", color: "#22c55e" },
    { name: "Telegram Бот", sub: "Быстрый перевод", icon: "✈️", color: "#0ea5e9" },
    { name: "Криптовалюта", sub: "TON · BTC · ETH · XMR", icon: "₿", color: "#f59e0b" },
    { name: "CryptoBot", sub: "Telegram", icon: "🤖", color: "#7c3aed" },
    { name: "СБП", sub: "Быстрые платежи", icon: "⚡", color: "#ef4444" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
      {methods.map(m => (
        <div
          key={m.name}
          className="bg-[#111318] border border-white/5 hover:border-white/20 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:scale-105"
          style={{ boxShadow: `0 0 20px ${m.color}10` }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${m.color}20` }}>
            {m.icon}
          </div>
          <div>
            <div className="text-white text-sm font-bold">{m.name}</div>
            <div className="text-gray-500 text-xs">{m.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}