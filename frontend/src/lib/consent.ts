import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

import config from "../config.json";

/**
 * 利用規約・プライバシーポリシーの同意状況
 */
export type ConsentStatus = {
  /** 現在の規約バージョン（サーバー側で管理） */
  currentVersion: string;
  /** 現在のバージョンへの同意が必要か */
  mustAgree: boolean;
  /** 現在のバージョンに同意した日時（ISO 8601）。未同意なら undefined */
  agreedAt?: string;
};

/**
 * 同意系 API を呼ぶ。ユーザーの特定はサーバー側が認証トークンから行うため、本文は送らない
 */
const postConsentApi = async (path: string): Promise<ConsentStatus> => {
  const session = await fetchAuthSession();
  const token = session?.tokens?.idToken?.toString();

  const response = await axios.post(`${config.ApiEndpoint}${path}`, {}, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
    },
  });

  return response.data as ConsentStatus;
};

/**
 * 現在の規約バージョンに対する同意状況を取得する
 */
export const getConsentStatus = (): Promise<ConsentStatus> => postConsentApi("/get-consent-status");

/**
 * 現在の規約バージョンへの同意を記録する。バージョンはサーバー側が決める
 */
export const recordConsent = (): Promise<ConsentStatus> => postConsentApi("/record-consent");

/** 新規登録画面で同意したことの控え（localStorage のキー） */
const SIGNUP_CONSENT_KEY = "tsundoku.signupConsent";

/**
 * 控えの有効期間。Cognito の確認コードの有効期間（24時間）に合わせている。
 * これを過ぎてからのログインは、その間に規約が改定されている可能性があるため、改めて同意画面を出す
 */
const SIGNUP_CONSENT_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * 新規登録画面で規約に同意したことを控える。
 * 登録直後は未認証で同意 API を呼べないため、初回ログイン時に同じ同意を再度求めずに済むよう、
 * メールアドレスと時刻だけをこの端末に残しておく
 * @param email 登録したメールアドレス
 */
export const rememberSignupConsent = (email: string): void => {
  try {
    localStorage.setItem(SIGNUP_CONSENT_KEY, JSON.stringify({
      email: normalizeEmail(email),
      at: Date.now(),
    }));
  } catch (error) {
    // 控えが残せなくても、初回ログイン時に同意画面が出るだけで済むため無視する
    console.log("rememberSignupConsent failed", error);
  }
};

/**
 * 新規登録時の同意の控えが、このメールアドレスのものとして有効なら true を返し、控えを破棄する
 * @param email ログインしたメールアドレス
 */
export const consumeSignupConsent = (email: string): boolean => {
  try {
    const saved = localStorage.getItem(SIGNUP_CONSENT_KEY);
    if (!saved) {
      return false;
    }

    const parsed = JSON.parse(saved) as { email?: string; at?: number };

    // 壊れた控えと、期限切れの控えは破棄する
    if (typeof parsed.at !== "number" || Date.now() - parsed.at >= SIGNUP_CONSENT_TTL_MS) {
      localStorage.removeItem(SIGNUP_CONSENT_KEY);
      return false;
    }

    // 別のメールアドレスでのログインでは使わず、控えも残す（登録したご本人が後でログインできるように）
    if (typeof parsed.email !== "string" || normalizeEmail(parsed.email) !== normalizeEmail(email)) {
      return false;
    }

    localStorage.removeItem(SIGNUP_CONSENT_KEY);
    return true;
  } catch (error) {
    console.log("consumeSignupConsent failed", error);
    return false;
  }
};
