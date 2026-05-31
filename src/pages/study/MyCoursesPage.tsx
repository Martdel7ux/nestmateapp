import { useState } from "react";
import { BookOpen, Plus, Trash2, X } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseBadge } from "@/components/features/study/CourseBadge";
import { CourseSelect } from "@/components/features/study/CourseSelect";
import {
  useUserCourses,
  useAddUserCourse,
  useRemoveUserCourse,
  useUpdateUserCourse,
} from "@/hooks/use-user-courses";
import type { UserCourse, UserCourseStatus } from "@/types/study";
import { useI18n } from "@/contexts/i18n-context";

interface EditingState {
  courseId: string;
  status: UserCourseStatus;
  grade: string;
  year: string;
  isMentor: boolean;
}

export function MyCoursesPage() {
  const { t } = useI18n();

  const STATUS_OPTIONS: { value: UserCourseStatus; label: string }[] = [
    { value: "currently_taking", label: t("coursesCurrent") },
    { value: "completed", label: t("coursesCompleted") },
    { value: "planning_to_take", label: t("coursesPlanned") },
  ];

  const { data: userCourses = [], isLoading } = useUserCourses();
  const { mutate: addCourse, isPending: adding } = useAddUserCourse();
  const { mutate: removeCourse } = useRemoveUserCourse();
  const { mutate: updateCourse } = useUpdateUserCourse();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newCourseId, setNewCourseId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<UserCourseStatus>("currently_taking");
  const [editing, setEditing] = useState<EditingState | null>(null);

  const handleAdd = () => {
    if (!newCourseId) {
      toast.error("Please select a course");
      return;
    }
    addCourse(
      { courseId: newCourseId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(t("coursesAdded"));
          setShowAddSheet(false);
          setNewCourseId(null);
          setNewStatus("currently_taking");
        },
        onError: () => toast.error("Failed to add course"),
      }
    );
  };

  const handleRemove = (uc: UserCourse) => {
    if (!confirm(`Remove ${uc.course?.title ?? "this course"}?`)) return;
    removeCourse(uc.course_id, {
      onSuccess: () => toast.success(t("coursesRemoved")),
      onError: () => toast.error("Failed to remove course"),
    });
  };

  const openEdit = (uc: UserCourse) => {
    setEditing({
      courseId: uc.course_id,
      status: uc.status,
      grade: uc.grade ?? "",
      year: uc.year ?? "",
      isMentor: uc.is_mentor,
    });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateCourse(
      {
        courseId: editing.courseId,
        updates: {
          status: editing.status,
          grade: editing.grade || null,
          year: editing.year || null,
          is_mentor: editing.isMentor,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("coursesUpdated"));
          setEditing(null);
        },
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={t("coursesTitle")}
        right={{
          type: "custom",
          element: (
            <button
              type="button"
              onClick={() => setShowAddSheet(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus size={15} />
              {t("coursesAdd")}
            </button>
          ),
        }}
      />

      {/* Course list */}
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="px-4 pb-32 pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : userCourses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <BookOpen size={40} className="text-muted-foreground/40" />
              <p className="font-semibold text-foreground">{t("coursesNone")}</p>
              <p className="text-sm text-muted-foreground">
                {t("coursesNoneDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userCourses.map((uc) => (
                <div
                  key={uc.course_id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {uc.course && <CourseBadge course={uc.course} />}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 font-medium",
                          uc.status === "currently_taking"
                            ? "bg-primary/10 text-primary"
                            : uc.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        )}>
                          {STATUS_OPTIONS.find((s) => s.value === uc.status)?.label}
                        </span>
                        {uc.grade && <span>{t("coursesGrade")}: {uc.grade}</span>}
                        {uc.year && <span>{t("coursesYear")}: {uc.year}</span>}
                        {uc.is_mentor && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {t("coursesMentor")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(uc)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(uc)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add course sheet */}
      {showAddSheet && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddSheet(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-xl">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">{t("coursesAddTitle")}</h2>
              <button type="button" onClick={() => setShowAddSheet(false)}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <CourseSelect
                value={newCourseId}
                onChange={setNewCourseId}
                placeholder="Select a course…"
              />
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserCourseStatus)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {adding ? t("coursesAdding") : t("coursesAddBtn")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit sheet */}
      {editing && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-xl">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">{t("coursesEditTitle")}</h2>
              <button type="button" onClick={() => setEditing(null)}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">{t("coursesStatus")}</label>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, status: e.target.value as UserCourseStatus } : null
                    )
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">{t("coursesGrade")}</label>
                  <input
                    value={editing.grade}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, grade: e.target.value } : null
                      )
                    }
                    placeholder="e.g. A, 8.5"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">{t("coursesYear")}</label>
                  <input
                    value={editing.year}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, year: e.target.value } : null
                      )
                    }
                    placeholder="e.g. 2024"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isMentor}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, isMentor: e.target.checked } : null
                    )
                  }
                  className="accent-primary h-4 w-4"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("coursesOfferMentoring")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("coursesMentorDesc")}
                  </p>
                </div>
              </label>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
              >
                {t("coursesSave")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
