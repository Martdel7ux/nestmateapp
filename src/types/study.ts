export type UserCourseStatus = 'currently_taking' | 'completed' | 'planning_to_take';
export type NoteVisibility = 'private' | 'group' | 'public';
export type StudyGroupRole = 'owner' | 'admin' | 'member';
export type StudyMessageConvType = 'group' | 'direct';
export type MentorRequestStatus = 'pending' | 'accepted' | 'declined';

export interface Course {
  id: string;
  code?: string | null;
  title: string;
  university?: string | null;
  department?: string | null;
  description?: string | null;
  is_approved?: boolean;
  created_at: string;
}

export interface UserCourse {
  user_id: string;
  course_id: string;
  status: UserCourseStatus;
  grade?: string | null;
  year?: string | null;
  is_mentor: boolean;
  created_at: string;
  course?: Course;
}

export interface Note {
  id: string;
  owner_id: string;
  course_id?: string | null;
  title: string;
  content?: string | null;
  visibility: NoteVisibility;
  group_id?: string | null;
  tags?: string[];
  attachment_urls?: string[];
  upvote_count: number;
  view_count: number;
  created_at: string;
  updated_at?: string;
  course?: Course | null;
  owner?: { id: string; full_name: string; avatar_url?: string | null; university?: string | null } | null;
  is_upvoted?: boolean;
}

export interface NoteFilters {
  course_id?: string | null;
  visibility?: NoteVisibility | null;
  tags?: string[];
  query?: string;
  sort?: 'newest' | 'upvotes' | 'views';
}

export interface StudyGroup {
  id: string;
  name: string;
  description?: string | null;
  course_id?: string | null;
  is_private: boolean;
  max_members: number;
  created_by?: string | null;
  created_at: string;
  course?: Course | null;
  member_count?: number;
  member_role?: StudyGroupRole | null;
}

export interface StudyGroupMember {
  group_id: string;
  user_id: string;
  role: StudyGroupRole;
  joined_at: string;
  profile?: { id: string; full_name: string; avatar_url?: string | null; university?: string | null } | null;
}

export interface StudyMessage {
  id: string;
  conversation_id: string;
  conversation_type: StudyMessageConvType;
  sender_id?: string | null;
  content: string;
  attachment_url?: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  sender?: { id: string; full_name: string; avatar_url?: string | null } | null;
}

export interface DirectConversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  other_user?: { id: string; full_name: string; avatar_url?: string | null; university?: string | null } | null;
  last_message?: StudyMessage | null;
  unread_count?: number;
}

export interface ConversationListItem {
  id: string;
  type: StudyMessageConvType;
  name: string;
  avatar_url?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

export interface MentorRequest {
  id: string;
  requester_id: string;
  mentor_id: string;
  course_id: string;
  message?: string | null;
  status: MentorRequestStatus;
  created_at: string;
  responded_at?: string | null;
  course?: Course | null;
  requester?: { id: string; full_name: string; avatar_url?: string | null } | null;
  mentor?: { id: string; full_name: string; avatar_url?: string | null } | null;
}

export interface PeerProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  university?: string | null;
  bio?: string | null;
  user_courses?: UserCourse[];
  public_notes?: Note[];
  is_mentor?: boolean;
}
