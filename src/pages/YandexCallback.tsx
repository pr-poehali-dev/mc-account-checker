import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useYandexAuth } from "@/components/extensions/yandex-auth/useYandexAuth";

const AUTH_URL = "https://functions.poehali.dev/fd906f57-f15c-4c93-a3e0-174a893bcbbb";

export default function YandexCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const auth = useYandexAuth({
    apiUrls: {
      authUrl: `${AUTH_URL}?action=auth-url`,
      callback: `${AUTH_URL}?action=callback`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setStatus("error");
      setErrorMsg("Яндекс отклонил авторизацию");
      return;
    }
    auth.handleCallback(params).then(ok => {
      if (ok) {
        navigate("/", { replace: true });
      } else {
        setStatus("error");
        setErrorMsg(auth.error || "Ошибка авторизации");
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      {status === "loading" ? (
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FC3F1D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white font-bold text-lg">Входим через Яндекс...</div>
          <div className="text-gray-500 text-sm mt-1">Пожалуйста, подождите</div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-[#ef4444] text-5xl mb-4">✗</div>
          <div className="text-white font-bold text-lg mb-2">Ошибка входа</div>
          <div className="text-gray-400 text-sm mb-6">{errorMsg}</div>
          <button
            onClick={() => navigate("/")}
            className="bg-[#FC3F1D] hover:bg-[#E53517] text-white font-bold px-6 py-3 rounded-xl transition-all"
          >
            Вернуться на главную
          </button>
        </div>
      )}
    </div>
  );
}