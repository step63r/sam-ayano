import React, { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Loader2 } from "lucide-react";

import {
  ConsentStatus,
  consumeSignupConsent,
  getConsentStatus,
  recordConsent,
} from "../lib/consent";
import ConsentPage from "./ConsentPage";

type GateState =
  | { phase: "checking" }
  | { phase: "allowed" }
  | { phase: "mustAgree"; status: ConsentStatus };

/**
 * ログイン後の画面を、規約への同意状況で守る。
 * 現在の規約バージョンに同意していないユーザーには、同意するまで本体の画面を見せない
 * （規約が改定されたときの再同意も、これで実現する）。
 */
const ConsentGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GateState>({ phase: "checking" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let status: ConsentStatus;
      try {
        status = await getConsentStatus();
      } catch (error) {
        // 一時的な通信障害などで、全員がログインできなくなるのを避けるため、取得できなければ利用を許可する。
        // その間は同意の確認が行われないが、次回のログイン時に改めて確認される
        console.log("getConsentStatus ERROR! (allowing access)", error);
        if (!cancelled) setState({ phase: "allowed" });
        return;
      }

      if (status.mustAgree) {
        try {
          // 新規登録画面で同意済みなら、初回ログイン直後に同じ同意をもう一度求めない
          const user = await getCurrentUser();
          const email = user.signInDetails?.loginId;
          if (email && consumeSignupConsent(email)) {
            status = await recordConsent();
          }
        } catch (error) {
          // 自動の記録に失敗しても、同意が必要な状態は変わらないため、同意画面で改めて同意してもらう
          console.log("auto recordConsent ERROR!", error);
        }
      }

      if (!cancelled) {
        setState(status.mustAgree ? { phase: "mustAgree", status } : { phase: "allowed" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.phase === "checking") {
    return (
      <div className="glass-backdrop flex min-h-svh items-center justify-center text-foreground">
        <div role="status" aria-label="読み込み中" className="glass rounded-3xl p-6">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (state.phase === "mustAgree") {
    return <ConsentPage status={state.status} onAgreed={() => setState({ phase: "allowed" })} />;
  }

  return <>{children}</>;
};

export default ConsentGate;
