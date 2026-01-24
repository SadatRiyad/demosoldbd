import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { API_MODE } from "@/lib/api/config";
import { clearNodeTokens, getNodeAccessToken } from "@/lib/api/nodeAuth";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ session: null, user: null, loading: true });

  React.useEffect(() => {
    if (API_MODE === "node") {
      // Minimal node-mode auth: presence of an access token == signed in.
      // Admin gating is handled separately (role claim is checked server-side).
      const token = getNodeAccessToken();
      setState({ session: null, user: token ? ({ id: "node" } as any) : null, loading: false });
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });

    // Listener must be set before getSession
    supabase.auth
      .getSession()
      .then(({ data }) => setState({ session: data.session ?? null, user: data.session?.user ?? null, loading: false }))
      .catch(() => setState((s) => ({ ...s, loading: false })));

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = React.useCallback(async () => {
    if (API_MODE === "node") {
      clearNodeTokens();
      setState({ session: null, user: null, loading: false });
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = React.useMemo(() => ({ ...state, signOut }), [state, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
