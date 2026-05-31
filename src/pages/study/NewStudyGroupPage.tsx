import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { toast } from "sonner";
import { CourseSelect } from "@/components/features/study/CourseSelect";
import { useCreateStudyGroup } from "@/hooks/use-study-groups";
import { useI18n } from "@/contexts/i18n-context";

export function NewStudyGroupPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { mutate: createGroup, isPending } = useCreateStudyGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [maxMembers, setMaxMembers] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    createGroup(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        course_id: courseId ?? undefined,
        is_private: isPrivate,
        max_members: maxMembers,
      },
      {
        onSuccess: (group) => {
          toast.success(t("studyGroupCreated"));
          navigate(`/study/groups/${group.id}`);
        },
        onError: () => toast.error("Failed to create group"),
      }
    );
  };

  const PRIVACY_OPTIONS = [
    { label: t("studyGroupPrivate"), value: true, desc: t("studyGroupByInvite") },
    { label: t("studyGroupPublic"), value: false, desc: t("studyGroupAnyoneJoin") },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={t("studyGroupCreate")} right={{ type: "none" }} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-4 py-5 pb-32">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("studyGroupNameLabel")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("studyGroupNamePh")}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("studyGroupDesc")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("studyGroupDescPh")}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Course */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("studyGroupCourseOpt")}
            </label>
            <CourseSelect
              value={courseId}
              onChange={setCourseId}
              placeholder="Select a course…"
            />
          </div>

          {/* Privacy toggle */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("studyGroupPrivacy")}</p>
            <div className="flex gap-3">
              {PRIVACY_OPTIONS.map((opt) => (
                <label
                  key={String(opt.value)}
                  className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="privacy"
                    checked={isPrivate === opt.value}
                    onChange={() => setIsPrivate(opt.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Max members slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">{t("studyGroupMaxMembers")}</label>
              <span className="text-sm font-semibold text-primary">{maxMembers}</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>2</span>
              <span>50</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {isPending ? t("studyGroupCreating") : t("studyGroupCreateBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}
