import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMentorRequests,
  respondToMentorRequest,
  sendMentorRequest,
} from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";

export function useMentorRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["mentor-requests", user?.id],
    queryFn: () => fetchMentorRequests(user!.id),
    enabled: !!user,
  });
}

export function useSendMentorRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      mentorId,
      courseId,
      message,
    }: {
      mentorId: string;
      courseId: string;
      message?: string;
    }) =>
      sendMentorRequest({
        requester_id: user!.id,
        mentor_id: mentorId,
        course_id: courseId,
        message,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mentor-requests", user?.id] });
    },
  });
}

export function useRespondToMentorRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      requesterId,
    }: {
      id: string;
      status: "accepted" | "declined";
      requesterId?: string;
    }) => respondToMentorRequest(id, status, user!.id, requesterId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mentor-requests", user?.id] });
      void qc.invalidateQueries({ queryKey: ["study-conversations", user?.id] });
    },
  });
}
