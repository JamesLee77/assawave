import i18n from "i18next";
import type { InitOptions, Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";

// English only (사용자 지시). 언어 자동감지/localStorage 캐시 없음, ko/ja 미로드 →
// 어떤 환경에서도 항상 영어로 렌더. (ko.json/ja.json 파일은 남겨두되 사용 안 함.)
const NAMESPACES = ["common", "nav", "footer", "home"] as const;

type Bundle = Record<string, Record<string, unknown>>;

const resources: Resource = {
  en: en as Bundle,
};

const options: InitOptions = {
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en"],
  resources,
  ns: [...NAMESPACES],
  defaultNS: "common",
  interpolation: { escapeValue: false },
};

void i18n.use(initReactI18next).init(options);

export default i18n;
