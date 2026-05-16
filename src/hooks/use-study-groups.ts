import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudyGroup,
  fetchDiscoverGroups,
  fetchMyStudyGroups,
  joinStudyGroup,
  leaveStudyGroup,
} from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";

export function useMyStudyGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-study-groups", user?.id],
    queryFn: () => fetchMyStudyGroups(user!.id),
    enabled: !!user,
  });
}

export function useDiscoverGroups(courseId?: string) {
  return useQuery({
    queryKey: ["discover-groups", courseId],
    queryFn: () => fetchDiscoverGroups(courseId),
  });
}

export function useCreateStudyGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (group: {
      name: string;
      description?: string;
      course_id?: string;
      is_private?: boolean;
      max_members?: number;
    }) => createStudyGroup({ ...group, created_by: user!.id }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-study-groups", user?.id] });
      void qc.invalidateQueries({ queryKey: ["discover-groups"] });
    },
  });
}

export function useJoinStudyGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => joinStudyGroup(groupId, user!.id),
    onSuccess: (_data, groupId) => {
      void qc.invalidateQueries({ queryKey: ["my-study-groups", user?.id] });
      void qc.invalidateQueries({ queryKey: ["study-group", groupId] });
    },
  });
}

export function useLeaveStudyGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => leaveStudyGroup(groupId, user!.id),
    onSuccess: (_data, groupId) => {
      void qc.invalidateQueries({ queryKey: ["my-study-groups", user?.id] });
      void qc.invalidateQueries({ queryKey: ["study-group", groupId] });
    },
  });
}
