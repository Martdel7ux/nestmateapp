import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CourseSelect } from "@/components/features/study/CourseSelect";
import { useCreateStudyGroup } from "@/hooks/use-study-groups";

export function NewStudyGroupPage() {
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
          toast.success("Group created!");
          navigate(`/study/groups/${group.id}`);
        },
        onError: () => toast.error("Failed to create group"),
      }
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-foreground">Create Study Group</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-4 py-5 pb-32">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Group Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS-101 Study Crew"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Course */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Course (optional)
            </label>
            <CourseSelect
              value={courseId}
              onChange={setCourseId}
              placeholder="Select a course…"
            />
          </div>

          {/* Privacy toggle */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Privacy</p>
            <div className="flex gap-3">
              {[
                { label: "Private", value: true, desc: "Members by invitation" },
                { label: "Public", value: false, desc: "Anyone can join" },
              ].map((opt) => (
                <label
                  key={opt.label}
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
              <label className="text-sm font-medium text-foreground">Max Members</label>
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
            {isPending ? "Creating…" : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
}
