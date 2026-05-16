import { toast } from "sonner";
import { useCourses } from "@/hooks/use-user-courses";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}

export function CourseSelect({ value, onChange, placeholder = "Select a course…" }: Props) {
  const { data: courses = [], isLoading } = useCourses();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__request_new__") {
      toast.success("Contact admin@nestmate.app to add a new course");
      return;
    }
    onChange(val === "" ? null : val);
  };

  // Group courses by university
  const grouped = courses.reduce<Record<string, typeof courses>>((acc, course) => {
    const uni = course.university ?? "General";
    if (!acc[uni]) acc[uni] = [];
    acc[uni].push(course);
    return acc;
  }, {});

  return (
    <select
      value={value ?? ""}
      onChange={handleChange}
      disabled={isLoading}
      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
    >
      <option value="">{isLoading ? "Loading courses…" : placeholder}</option>
      {Object.entries(grouped).map(([uni, uniCourses]) => (
        <optgroup key={uni} label={uni}>
          {uniCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code ? `${course.code} — ${course.title}` : course.title}
            </option>
          ))}
        </optgroup>
      ))}
      <optgroup label="Other">
        <option value="__request_new__">+ Request a new course…</option>
      </optgroup>
    </select>
  );
}
