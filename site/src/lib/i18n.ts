import i18n from "i18next";
import type { InitOptions, Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ko from "../locales/ko.json";
import en from "../locales/en.json";
import ja from "../locales/ja.json";

// ASSA: ko 기본 / en / ja (ccm은 en만). 결정: ko 기본.
const NAMESPACES = ["common", "nav", "footer", "home"] as const;

type Bundle = Record<string, Record<string, unknown>>;

const resources: Resource = {
  ko: ko as Bundle,
  en: en as Bundle,
  ja: ja as Bundle,
};

const options: InitOptions = {
  // 영어 기본 — navigator 자동감지 제외(브라우저 로캘과 무관히 en 기본). ?lng=ko/ja 또는
  // localStorage(향후 언어 셀렉터)로만 전환. 미스 키는 en으로 폴백.
  fallbackLng: "en",
  supportedLngs: ["en", "ko", "ja"],
  resources,
  ns: [...NAMESPACES],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  detection: {
    order: ["querystring", "localStorage"],
    lookupQuerystring: "lng",
    lookupLocalStorage: "assawave-lng",
    caches: ["localStorage"],
  },
};

void i18n.use(LanguageDetector).use(initReactI18next).init(options);

export default i18n;
