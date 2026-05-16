import { supabase } from "@/lib/supabase";
import type {
  Course,
  UserCourse,
  Note,
  NoteFilters,
  StudyGroup,
  StudyGroupMember,
  StudyGroupRole,
  StudyMessage,
  DirectConversation,
  MentorRequest,
  PeerProfile,
  ConversationListItem,
} from "@/types/study";

// ── Courses ──────────────────────────────────────────────────────────────────

export async function fetchCourses(): Promise<Course[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("courses").select("*").eq("is_approved", true).order("title");
  return (data ?? []) as Course[];
}

export async function fetchUserCourses(userId: string): Promise<UserCourse[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("user_courses")
    .select("*, course:courses(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as UserCourse[];
}

export async function addUserCourse(
  userId: string,
  courseId: string,
  status: UserCourse["status"]
): Promise<void> {
  if (!supabase) return;
  await supabase.from("user_courses").upsert({ user_id: userId, course_id: courseId, status });
}

export async function removeUserCourse(userId: string, courseId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("user_courses").delete().eq("user_id", userId).eq("course_id", courseId);
}

export async function updateUserCourse(
  userId: string,
  courseId: string,
  updates: Partial<Pick<UserCourse, "status" | "grade" | "year" | "is_mentor">>
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("user_courses")
    .update(updates)
    .eq("user_id", userId)
    .eq("course_id", courseId);
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function fetchMyNotes(userId: string, filters: NoteFilters): Promise<Note[]> {
  if (!supabase) return [];
  let q = supabase
    .from("notes")
    .select("*, course:courses(id,title,code)")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (filters.course_id) q = q.eq("course_id", filters.course_id);
  if (filters.visibility) q = q.eq("visibility", filters.visibility);
  if (filters.tags?.length) q = q.overlaps("tags", filters.tags);

  const { data } = await q;
  return (data ?? []) as Note[];
}

export async function fetchNote(id: string, userId?: string): Promise<Note | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("notes")
    .select(
      "*, course:courses(id,title,code), owner:profiles!owner_id(id,full_name,avatar_url,university)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const note = data as Note;
  if (userId) {
    const { data: upvote } = await supabase
      .from("note_upvotes")
      .select("note_id")
      .eq("user_id", userId)
      .eq("note_id", id)
      .maybeSingle();
    note.is_upvoted = !!upvote;
    // Increment view count (fire-and-forget)
    void supabase
      .from("notes")
      .update({ view_count: (note.view_count || 0) + 1 })
      .eq("id", id);
  }
  return note;
}

export async function fetchPublicNotes(filters: NoteFilters, page: number): Promise<Note[]> {
  if (!supabase) return [];
  const PAGE_SIZE = 20;
  let q = supabase
    .from("notes")
    .select(
      "*, course:courses(id,title,code), owner:profiles!owner_id(id,full_name,avatar_url,university)"
    )
    .eq("visibility", "public")
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters.course_id) q = q.eq("course_id", filters.course_id);
  if (filters.tags?.length) q = q.overlaps("tags", filters.tags);
  if (filters.sort === "upvotes") q = q.order("upvote_count", { ascending: false });
  else if (filters.sort === "views") q = q.order("view_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data } = await q;
  return (data ?? []) as Note[];
}

export async function searchNotes(query: string, userId: string): Promise<Note[]> {
  if (!supabase || !query.trim()) return [];
  const { data } = await supabase.rpc("search_notes", {
    query: query.trim(),
    p_user_id: userId,
  });
  return (data ?? []) as Note[];
}

export async function createNote(
  note: Partial<Note> & { owner_id: string; title: string }
): Promise<Note> {
  if (!supabase) throw new Error("Not configured");
  const { data, error } = await supabase.from("notes").insert(note).select().single();
  if (error) throw error;
  // TODO: emit gamification event — note created; if public, award XP for public note creation
  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  if (!supabase) throw new Error("Not configured");
  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("notes").delete().eq("id", id);
}

export async function toggleNoteUpvote(
  userId: string,
  noteId: string,
  currentlyUpvoted: boolean
): Promise<void> {
  if (!supabase) return;
  if (currentlyUpvoted) {
    await supabase
      .from("note_upvotes")
      .delete()
      .eq("user_id", userId)
      .eq("note_id", noteId);
  } else {
    await supabase.from("note_upvotes").insert({ user_id: userId, note_id: noteId });
    // TODO: emit gamification event — note upvoted; award XP to note owner
  }
}

// ── Study Groups ──────────────────────────────────────────────────────────────

export async function fetchMyStudyGroups(userId: string): Promise<StudyGroup[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("study_group_members")
    .select("role, group:study_groups(*, course:courses(id,title,code))")
    .eq("user_id", userId);

  return (data ?? []).map((row: unknown) => {
    const r = row as { role: StudyGroupRole; group: StudyGroup };
    return { ...r.group, member_role: r.role };
  }) as StudyGroup[];
}

export async function fetchDiscoverGroups(courseId?: string): Promise<StudyGroup[]> {
  if (!supabase) return [];
  let q = supabase
    .from("study_groups")
    .select("*, course:courses(id,title,code)")
    .eq("is_private", false)
    .order("created_at", { ascending: false });
  if (courseId) q = q.eq("course_id", courseId);
  const { data } = await q;
  return (data ?? []) as StudyGroup[];
}

export async function fetchStudyGroup(id: string, userId?: string): Promise<StudyGroup | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("study_groups")
    .select("*, course:courses(id,title,code)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const group = data as StudyGroup;
  if (userId) {
    const { data: member } = await supabase
      .from("study_group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    group.member_role = (member as { role: StudyGroupRole } | null)?.role ?? null;
  }
  return group;
}

export async function fetchGroupMembers(groupId: string): Promise<StudyGroupMember[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("study_group_members")
    .select("*, profile:profiles!user_id(id,full_name,avatar_url,university)")
    .eq("group_id", groupId)
    .order("joined_at");
  return (data ?? []) as StudyGroupMember[];
}

export async function fetchGroupNotes(groupId: string): Promise<Note[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("notes")
    .select("*, course:courses(id,title,code), owner:profiles!owner_id(id,full_name,avatar_url)")
    .eq("group_id", groupId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as Note[];
}

export async function createStudyGroup(group: {
  name: string;
  description?: string;
  course_id?: string;
  is_private?: boolean;
  max_members?: number;
  created_by: string;
}): Promise<StudyGroup> {
  if (!supabase) throw new Error("Not configured");
  const { data: groupData, error } = await supabase
    .from("study_groups")
    .insert(group)
    .select()
    .single();
  if (error) throw error;
  // Auto-add creator as owner
  await supabase.from("study_group_members").insert({
    group_id: groupData.id,
    user_id: group.created_by,
    role: "owner",
  });
  return groupData as StudyGroup;
}

export async function joinStudyGroup(groupId: string, userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("study_group_members")
    .insert({ group_id: groupId, user_id: userId, role: "member" });
}

export async function leaveStudyGroup(groupId: string, userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("study_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export async function fetchConversations(userId: string): Promise<ConversationListItem[]> {
  if (!supabase) return [];
  const [{ data: directConvos }, { data: groupMemberships }] = await Promise.all([
    supabase
      .from("direct_conversations")
      .select(
        "*, user_a:profiles!user_a_id(id,full_name,avatar_url), user_b:profiles!user_b_id(id,full_name,avatar_url)"
      )
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("study_group_members")
      .select("group:study_groups(id,name)")
      .eq("user_id", userId),
  ]);

  const directItems: ConversationListItem[] = (directConvos ?? []).map(
    (c: {
      id: string;
      user_a_id: string;
      user_a: { id: string; full_name: string; avatar_url?: string | null };
      user_b: { id: string; full_name: string; avatar_url?: string | null };
    }) => {
      const other = c.user_a_id === userId ? c.user_b : c.user_a;
      return {
        id: c.id,
        type: "direct" as const,
        name: other.full_name,
        avatar_url: other.avatar_url,
        unread_count: 0,
      };
    }
  );

  const groupItems: ConversationListItem[] = (groupMemberships ?? []).map((m: unknown) => {
    const row = m as { group: { id: string; name: string } };
    return { id: row.group.id, type: "group" as const, name: row.group.name, unread_count: 0 };
  });

  return [...directItems, ...groupItems];
}

export async function fetchOrCreateDirectConversation(
  userId: string,
  otherUserId: string
): Promise<DirectConversation> {
  if (!supabase) throw new Error("Not configured");
  const { data: existing } = await supabase
    .from("direct_conversations")
    .select("*")
    .or(
      `and(user_a_id.eq.${userId},user_b_id.eq.${otherUserId}),and(user_a_id.eq.${otherUserId},user_b_id.eq.${userId})`
    )
    .maybeSingle();
  if (existing) return existing as DirectConversation;
  const { data, error } = await supabase
    .from("direct_conversations")
    .insert({ user_a_id: userId, user_b_id: otherUserId })
    .select()
    .single();
  if (error) throw error;
  return data as DirectConversation;
}

export async function fetchMessages(
  conversationId: string,
  convType: "group" | "direct"
): Promise<StudyMessage[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("study_messages")
    .select("*, sender:profiles!sender_id(id,full_name,avatar_url)")
    .eq("conversation_id", conversationId)
    .eq("conversation_type", convType)
    .order("created_at")
    .limit(100);
  return (data ?? []) as StudyMessage[];
}

export async function sendStudyMessage(msg: {
  conversation_id: string;
  conversation_type: "group" | "direct";
  sender_id: string;
  content: string;
  attachment_url?: string;
}): Promise<StudyMessage> {
  if (!supabase) throw new Error("Not configured");
  const { data, error } = await supabase
    .from("study_messages")
    .insert(msg)
    .select("*, sender:profiles!sender_id(id,full_name,avatar_url)")
    .single();
  if (error) throw error;
  // TODO: emit gamification event — message sent in mentor conversation; award XP if helpful
  return data as StudyMessage;
}

export async function softDeleteStudyMessage(id: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("study_messages")
    .update({ deleted_at: new Date().toISOString(), content: "" })
    .eq("id", id);
}

export async function markConversationRead(userId: string, conversationId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("study_message_reads").upsert({
    user_id: userId,
    conversation_id: conversationId,
    last_read_at: new Date().toISOString(),
  });
}

// ── Mentor Requests ───────────────────────────────────────────────────────────

export async function sendMentorRequest(req: {
  requester_id: string;
  mentor_id: string;
  course_id: string;
  message?: string;
}): Promise<MentorRequest> {
  if (!supabase) throw new Error("Not configured");
  const { data, error } = await supabase
    .from("mentor_requests")
    .insert(req)
    .select()
    .single();
  if (error) throw error;
  // TODO: emit gamification event — mentor request sent
  return data as MentorRequest;
}

export async function respondToMentorRequest(
  id: string,
  status: "accepted" | "declined",
  mentorId: string,
  requesterId?: string
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("mentor_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", id);
  if (status === "accepted" && requesterId) {
    // Auto-create direct conversation
    await fetchOrCreateDirectConversation(mentorId, requesterId);
    // TODO: emit gamification event — mentor request accepted; award XP to mentor
  }
}

export async function fetchMentorRequests(userId: string): Promise<MentorRequest[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("mentor_requests")
    .select(
      "*, course:courses(id,title,code), requester:profiles!requester_id(id,full_name,avatar_url), mentor:profiles!mentor_id(id,full_name,avatar_url)"
    )
    .or(`requester_id.eq.${userId},mentor_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return (data ?? []) as MentorRequest[];
}

// ── Peer Profiles ─────────────────────────────────────────────────────────────

export async function fetchPeerProfile(userId: string): Promise<PeerProfile | null> {
  if (!supabase) return null;
  const [{ data: profile }, { data: courses }, { data: notes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,avatar_url,university,bio")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_courses")
      .select("*, course:courses(id,title,code)")
      .eq("user_id", userId),
    supabase
      .from("notes")
      .select("*, course:courses(id,title,code)")
      .eq("owner_id", userId)
      .eq("visibility", "public")
      .order("upvote_count", { ascending: false })
      .limit(10),
  ]);
  if (!profile) return null;
  const userCoursesList = (courses ?? []) as UserCourse[];
  return {
    ...(profile as PeerProfile),
    user_courses: userCoursesList,
    public_notes: (notes ?? []) as Note[],
    is_mentor: userCoursesList.some((c) => c.is_mentor),
  };
}

// ── Moderation ────────────────────────────────────────────────────────────────

export async function blockStudyUser(blockerId: string, blockedId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("study_blocked_users")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function unblockStudyUser(blockerId: string, blockedId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("study_blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
}

export async function reportContent(report: {
  reporter_id: string;
  reported_id?: string;
  content_type: string;
  content_id?: string;
  reason: string;
}): Promise<void> {
  if (!supabase) return;
  await supabase.from("study_reports").insert(report);
}

export async function fetchBlockedStudyUsers(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("study_blocked_users")
    .select("blocked_id")
    .eq("blocker_id", userId);
  return (data ?? []).map((r: { blocked_id: string }) => r.blocked_id);
}

// ── File upload ───────────────────────────────────────────────────────────────

export async function uploadNoteAttachment(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Not configured");
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("study-notes").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("study-notes").getPublicUrl(path);
  return data.publicUrl;
}
