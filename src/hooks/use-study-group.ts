import { useQuery } from "@tanstack/react-query";
import { fetchGroupMembers, fetchGroupNotes, fetchStudyGroup } from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";

export function useStudyGroup(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["study-group", id, user?.id],
    queryFn: () => fetchStudyGroup(id, user?.id),
    enabled: !!id,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => fetchGroupMembers(groupId),
    enabled: !!groupId,
  });
}

export function useGroupNotes(groupId: string) {
  return useQuery({
    queryKey: ["group-notes", groupId],
    queryFn: () => fetchGroupNotes(groupId),
    enabled: !!groupId,
  });
}
