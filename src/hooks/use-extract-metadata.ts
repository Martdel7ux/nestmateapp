import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { extractEventMetadata, type ExtractionResult } from "@/lib/admin-events-api";
import { supabase } from "@/lib/supabase";

export function useExtractMetadata() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (url: string): Promise<ExtractionResult> => {
      const session = supabase
        ? (await supabase.auth.getSession()).data.session
        : null;
      const token = session?.access_token ?? "";
      return extractEventMetadata(url, token);
    },
    onError: (err) => {
      console.error("[useExtractMetadata]", err);
    },
  });
}
