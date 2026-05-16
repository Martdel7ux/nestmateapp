import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addUserCourse,
  fetchCourses,
  fetchUserCourses,
  removeUserCourse,
  updateUserCourse,
} from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";
import type { UserCourse } from "@/types/study";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    staleTime: 10 * 60 * 1000, // 10 minutes — courses change rarely
  });
}

export function useUserCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-courses", user?.id],
    queryFn: () => fetchUserCourses(user!.id),
    enabled: !!user,
  });
}

export function useAddUserCourse() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      status,
    }: {
      courseId: string;
      status: UserCourse["status"];
    }) => addUserCourse(user!.id, courseId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-courses", user?.id] });
    },
  });
}

export function useRemoveUserCourse() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => removeUserCourse(user!.id, courseId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-courses", user?.id] });
    },
  });
}

export function useUpdateUserCourse() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      updates,
    }: {
      courseId: string;
      updates: Partial<Pick<UserCourse, "status" | "grade" | "year" | "is_mentor">>;
    }) => updateUserCourse(user!.id, courseId, updates),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["user-courses", user?.id] });
    },
  });
}
