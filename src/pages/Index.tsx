import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

type Tab = "player" | "server";

interface PlayerInfo {
  id: string;
  name: string;
  skinUrl: string;
  headUrl: string;
}

interface ServerStatus {
  online: boolean;
  host: string;
  port: number;
  players?: { online: number; max: number; list?: string[] };
  version?: string;
  motd?: string;
  icon?: string;
}

interface MonitorEntry {
  time: string;
  online: boolean;
  players: number;
}

function uuidToDashed(id: string) {
  return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
}

export default function Index() {
  const [tab, setTab] = useState<Tab>("player");

  // Player lookup
  const [nick, setNick] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [playerError, setPlayerError] = useState("");

  // Server monitor
  const [serverAddr, setServerAddr] = useState("");
  const [serverLoading, setServerLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [serverError, setServerError] = useState("");
  const [monitor, setMonitor] = useState<MonitorEntry[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const monitorRef = useRef<NodeJS.Timeout | null>(null);

  // Real IP detection
  const [myIP, setMyIP] = useState<string>("");
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(d => setMyIP(d.ip))
      .catch(() => {});
  }, []);

  async function lookupPlayer() {
    if (!nick.trim()) return;
    setPlayerLoading(true);
    setPlayerError("");
    setPlayerInfo(null);
    try {
      // Mojang API через cors proxy
      const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${nick.trim()}`);
      if (!res.ok) {
        setPlayerError("Игрок не найден. Проверь никнейм.");
        setPlayerLoading(false);
        return;
      }
      const data = await res.json();
      const uuid = data.id;
      const dashedUuid = uuidToDashed(uuid);
      setPlayerInfo({
        id: uuid,
        name: data.name,
        skinUrl: `https://crafatar.com/renders/body/${uuid}?overlay`,
        headUrl: `https://crafatar.com/avatars/${uuid}?size=64&overlay`,
      });
    } catch {
      setPlayerError("Ошибка запроса. Попробуй позже.");
    }
    setPlayerLoading(false);
  }

  async function fetchServerStatus(addr: string): Promise<ServerStatus | null> {
    const host = addr.includes(":") ? addr.split(":")[0] : addr;
    const port = addr.includes(":") ? parseInt(addr.split(":")[1]) : 25565;
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${addr}`);
      const data = await res.json();
      return {
        online: data.online ?? false,
        host,
        port,
        players: data.players ? { online: data.players.online, max: data.players.max, list: data.players.list?.map((p: { name: string }) => p.name) } : undefined,
        version: data.version,
        motd: data.motd?.clean?.[0] || data.motd?.raw?.[0],
        icon: data.icon,
      };
    } catch {
      return null;
    }
  }

  async function checkServer() {
    if (!serverAddr.trim()) return;
    setServerLoading(true);
    setServerError("");
    setServerStatus(null);
    const status = await fetchServerStatus(serverAddr.trim());
    if (!status) {
      setServerError("Не удалось получить данные о сервере.");
    } else {
      setServerStatus(status);
      const entry: MonitorEntry = {
        time: new Date().toLocaleTimeString("ru-RU"),
        online: status.online,
        players: status.players?.online ?? 0,
      };
      setMonitor(prev => [entry, ...prev].slice(0, 20));
    }
    setServerLoading(false);
  }

  function startMonitoring() {
    if (monitorRef.current) return;
    setMonitoring(true);
    checkServer();
    monitorRef.current = setInterval(async () => {
      const status = await fetchServerStatus(serverAddr.trim());
      if (status) {
        setServerStatus(status);
        const entry: MonitorEntry = {
          time: new Date().toLocaleTimeString("ru-RU"),
          online: status.online,
          players: status.players?.online ?? 0,
        };
        setMonitor(prev => [entry, ...prev].slice(0, 20));
      }
    }, 30000);
  }

  function stopMonitoring() {
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
    setMonitoring(false);
  }

  useEffect(() => () => { if (monitorRef.current) clearInterval(monitorRef.current); }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0f] font-sans text-white overflow-x-hidden">
      {/* Bg glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#22c55e]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#7c6ff7]/8 rounded-full blur-[140px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#22c55e] to-[#7c6ff7] rounded-xl flex items-center justify-center">
            <span className="text-white text-base font-black">CC</span>
          </div>
          <span className="text-white font-black text-xl tracking-wider">CLOUDCHECKER</span>
          <span className="text-[10px] text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full font-semibold tracking-widest">LIVE</span>
        </div>
        {myIP && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <Icon name="Globe" size={14} className="text-[#22c55e]" />
            <span className="text-gray-400 text-xs">Ваш IP:</span>
            <span className="text-white font-mono text-sm font-bold">{myIP}</span>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center pt-16 pb-10 px-6">
        <div className="inline-block bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-widest">
          ⛏ ОФИЦИАЛЬНЫЙ MINECRAFT CHECKER
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
          CLOUDCHECKER —{" "}
          <span className="bg-gradient-to-r from-[#22c55e] to-[#7c6ff7] bg-clip-text text-transparent">
            лучший чекер
          </span>
          <br />для данных майнкрафт
        </h1>
        <p className="text-gray-400 text-base max-w-xl mx-auto">
          Наш сервис работает уже более шести лет на рынке, обеспечивая вашу безопасность.
          Проверьте ник ниже, чтобы узнать, защищён ли он на игровых серверах Minecraft.
        </p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <div className="flex gap-2 bg-[#111318] border border-white/5 rounded-2xl p-1.5 mb-6">
          <button
            onClick={() => setTab("player")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${tab === "player" ? "bg-[#22c55e] text-white" : "text-gray-400 hover:text-white"}`}
          >
            <Icon name="User" size={16} />
            Проверить ник
          </button>
          <button
            onClick={() => setTab("server")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${tab === "server" ? "bg-[#7c6ff7] text-white" : "text-gray-400 hover:text-white"}`}
          >
            <Icon name="Server" size={16} />
            Мониторинг сервера
          </button>
        </div>

        {/* PLAYER TAB */}
        {tab === "player" && (
          <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
            <div className="flex gap-3 mb-6">
              <input
                value={nick}
                onChange={e => { setNick(e.target.value); setPlayerError(""); }}
                onKeyDown={e => e.key === "Enter" && lookupPlayer()}
                placeholder="Введите Ник Игрока"
                className="flex-1 bg-[#0d0e13] border border-white/10 focus:border-[#22c55e] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
              />
              <button
                onClick={lookupPlayer}
                disabled={playerLoading}
                className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2"
              >
                {playerLoading ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Search" size={16} />}
                Проверить
              </button>
            </div>

            {playerError && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-xl px-4 py-3 text-sm mb-4">
                {playerError}
              </div>
            )}

            {playerInfo && (
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Skin */}
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={playerInfo.skinUrl}
                    alt="skin"
                    className="h-48 object-contain rounded-xl"
                    onError={e => { (e.target as HTMLImageElement).src = "https://crafatar.com/renders/body/606e2ff0ed7748429d6ce1d3321c7838?overlay"; }}
                  />
                  <span className="text-xs text-gray-500">3D-скин игрока</span>
                </div>
                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={playerInfo.headUrl}
                      alt="head"
                      className="w-10 h-10 rounded-lg"
                    />
                    <div>
                      <div className="text-white font-black text-xl">{playerInfo.name}</div>
                      <div className="text-[#22c55e] text-xs font-semibold">Аккаунт найден ✓</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="Никнейм" value={playerInfo.name} icon="User" />
                    <InfoRow label="UUID" value={uuidToDashed(playerInfo.id)} icon="Hash" mono />
                    <InfoRow
                      label="Скин"
                      value="Просмотреть полный скин"
                      icon="Image"
                      link={`https://crafatar.com/skins/${playerInfo.id}`}
                    />
                    <InfoRow
                      label="Cape"
                      value="Просмотреть плащ"
                      icon="Layers"
                      link={`https://crafatar.com/capes/${playerInfo.id}`}
                    />
                    <InfoRow
                      label="NameMC"
                      value="История никнеймов"
                      icon="History"
                      link={`https://namemc.com/profile/${playerInfo.name}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {!playerInfo && !playerError && !playerLoading && (
              <div className="text-center py-8 text-gray-600">
                <Icon name="User" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Введите ник и нажмите «Проверить»</p>
              </div>
            )}
          </div>
        )}

        {/* SERVER TAB */}
        {tab === "server" && (
          <div className="bg-[#111318] border border-white/5 rounded-2xl p-6">
            <div className="flex gap-3 mb-4">
              <input
                value={serverAddr}
                onChange={e => { setServerAddr(e.target.value); setServerError(""); }}
                onKeyDown={e => e.key === "Enter" && checkServer()}
                placeholder="IP сервера (например: hypixel.net или 185.0.0.1:25565)"
                className="flex-1 bg-[#0d0e13] border border-white/10 focus:border-[#7c6ff7] text-white rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
              />
              <button
                onClick={checkServer}
                disabled={serverLoading}
                className="bg-[#7c6ff7] hover:bg-[#6a5de0] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2"
              >
                {serverLoading ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Wifi" size={16} />}
                Пинг
              </button>
            </div>

            {/* Monitor toggle */}
            {serverStatus && (
              <div className="mb-4">
                {!monitoring ? (
                  <button
                    onClick={startMonitoring}
                    className="flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 hover:bg-[#22c55e]/20 text-[#22c55e] font-bold px-5 py-2 rounded-xl transition-all text-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                    Запустить live-мониторинг (каждые 30 сек)
                  </button>
                ) : (
                  <button
                    onClick={stopMonitoring}
                    className="flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/30 hover:bg-[#ef4444]/20 text-[#ef4444] font-bold px-5 py-2 rounded-xl transition-all text-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                    Остановить мониторинг
                  </button>
                )}
              </div>
            )}

            {serverError && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-xl px-4 py-3 text-sm mb-4">
                {serverError}
              </div>
            )}

            {serverStatus && (
              <div className="space-y-4">
                {/* Status banner */}
                <div className={`flex items-center gap-3 rounded-xl px-5 py-4 border ${serverStatus.online ? "bg-[#22c55e]/10 border-[#22c55e]/30" : "bg-[#ef4444]/10 border-[#ef4444]/30"}`}>
                  <span className={`w-3 h-3 rounded-full ${serverStatus.online ? "bg-[#22c55e]" : "bg-[#ef4444]"} ${serverStatus.online ? "animate-pulse" : ""}`} />
                  <span className={`font-black text-lg ${serverStatus.online ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {serverStatus.online ? "Сервер онлайн" : "Сервер офлайн"}
                  </span>
                  {monitoring && (
                    <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                      <Icon name="Activity" size={12} className="text-[#22c55e]" />
                      Live
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="IP / Хост" value={serverStatus.host} icon="Globe" mono />
                  <InfoRow label="Порт" value={String(serverStatus.port)} icon="Hash" mono />
                  {serverStatus.version && <InfoRow label="Версия" value={serverStatus.version} icon="Tag" />}
                  {serverStatus.players && (
                    <InfoRow
                      label="Игроки"
                      value={`${serverStatus.players.online} / ${serverStatus.players.max}`}
                      icon="Users"
                    />
                  )}
                  {serverStatus.motd && <InfoRow label="MOTD" value={serverStatus.motd} icon="MessageSquare" fullWidth />}
                </div>

                {/* Player list */}
                {serverStatus.players?.list && serverStatus.players.list.length > 0 && (
                  <div className="bg-[#0d0e13] border border-white/5 rounded-xl p-4">
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Icon name="Users" size={13} />
                      Онлайн игроки ({serverStatus.players.list.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serverStatus.players.list.map(p => (
                        <span key={p} className="bg-[#111318] border border-white/10 text-white text-xs font-mono px-3 py-1.5 rounded-lg">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Monitor chart */}
            {monitor.length > 1 && (
              <div className="mt-4 bg-[#0d0e13] border border-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon name="Activity" size={13} />
                  История опросов
                </div>
                <div className="flex items-end gap-1 h-16">
                  {[...monitor].reverse().map((e, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`w-full rounded-sm transition-all ${e.online ? "bg-[#22c55e]" : "bg-[#ef4444]/50"}`}
                        style={{ height: `${e.online ? Math.max(8, Math.min(60, (e.players / (serverStatus?.players?.max || 100)) * 60 + 8)) : 4}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-gray-600 text-xs mt-2">
                  <span>{[...monitor].reverse()[0]?.time}</span>
                  <span>{monitor[0]?.time}</span>
                </div>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {monitor.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.online ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                      <span className="text-gray-500 font-mono">{e.time}</span>
                      <span className={e.online ? "text-[#22c55e]" : "text-[#ef4444]"}>{e.online ? "онлайн" : "офлайн"}</span>
                      {e.online && <span className="text-gray-400">{e.players} игр.</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!serverStatus && !serverError && !serverLoading && (
              <div className="text-center py-8 text-gray-600">
                <Icon name="Server" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Введите IP-адрес или домен сервера Minecraft</p>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 grid grid-cols-3 gap-4 pb-10">
          {[["50K+", "Аккаунтов проверено"], ["99.9%", "Точность данных"], ["24/7", "Работаем всегда"]].map(([v, l]) => (
            <div key={v} className="bg-[#111318] border border-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">{v}</div>
              <div className="text-gray-500 text-xs mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label, value, icon, mono, link, fullWidth,
}: {
  label: string; value: string; icon: string; mono?: boolean; link?: string; fullWidth?: boolean;
}) {
  return (
    <div className={`bg-[#0d0e13] border border-white/5 rounded-xl px-4 py-3 ${fullWidth ? "col-span-2" : ""}`}>
      <div className="text-gray-500 text-xs mb-0.5 flex items-center gap-1">
        <Icon name={icon} fallback="Circle" size={11} />
        {label}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className={`text-[#7c6ff7] hover:underline font-semibold text-sm ${mono ? "font-mono" : ""}`}>
          {value} ↗
        </a>
      ) : (
        <div className={`text-white font-semibold text-sm break-all ${mono ? "font-mono" : ""}`}>{value}</div>
      )}
    </div>
  );
}