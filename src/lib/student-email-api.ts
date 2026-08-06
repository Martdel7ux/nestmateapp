import { supabase } from "@/lib/supabase";

export interface StudentStatus { verifiedAt: string | null; email: string | null; }

interface SendResult { ok: boolean; reason?: string; retryIn?: number; university?: string | null }
interface VerifyResult { ok: boolean; reason?: string; remaining?: number; university?: string | null; email?: string }

/** Ask the edge function to email a one-time code. Throws if the function is
 *  unreachable (e.g. not deployed yet) so callers can fall back gracefully. */
export async function sendStudentEmailCode(email: string): Promise<SendResult> {
  const { data, error } = await supabase!.functions.invoke("verify-student-email", { body: { action: "send", email } });
  if (error) throw error;
  return data as SendResult;
}

export async function verifyStudentEmailCode(code: string): Promise<VerifyResult> {
  const { data, error } = await supabase!.functions.invoke("verify-student-email", { body: { action: "verify", code } });
  if (error) throw error;
  return data as VerifyResult;
}

/** Read the server-side verification status (badge + owner-only email).
 *  Returns nulls if the columns don't exist yet (migration not applied). */
export async function fetchStudentStatus(userId: string): Promise<StudentStatus> {
  if (!supabase) return { verifiedAt: null, email: null };
  const [pub, priv] = await Promise.all([
    supabase.from("profiles").select("student_verified_at").eq("id", userId).maybeSingle(),
    supabase.from("profiles_private").select("student_email").eq("id", userId).maybeSingle(),
  ]);
  return {
    verifiedAt: (pub.data as { student_verified_at?: string | null } | null)?.student_verified_at ?? null,
    email: (priv.data as { student_email?: string | null } | null)?.student_email ?? null,
  };
}
