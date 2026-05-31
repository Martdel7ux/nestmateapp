import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupCard } from "@/components/features/study/GroupCard";
import { CourseSelect } from "@/components/features/study/CourseSelect";
import { useDiscoverGroups, useMyStudyGroups } from "@/hooks/use-study-groups";
import { useI18n } from "@/contexts/i18n-context";

export function StudyGroupsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [discoverCourseId, setDiscoverCourseId] = useState<string | null>(null);

  const { data: myGroups = [], isLoading: loadingMine } = useMyStudyGroups();
  const { data: discoverGroups = [], isLoading: loadingDiscover } =
    useDiscoverGroups(discoverCourseId ?? undefined);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-32 pt-4 space-y-6">
          {/* My Groups */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">{t("studyGroupsMyGroups")}</h2>
              <button
                type="button"
                onClick={() => navigate("/study/groups/new")}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                <Plus size={12} />
                {t("studyGroupsCreate")}
              </button>
            </div>

            {loadingMine ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : myGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">{t("studyGroupsNoGroups")}</p>
                <button
                  type="button"
                  onClick={() => navigate("/study/groups/new")}
                  className="mt-2 text-sm font-medium text-primary"
                >
                  {t("studyGroupsCreateOne")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onClick={() => navigate(`/study/groups/${group.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Discover Groups */}
          <section>
            <h2 className="mb-3 font-semibold text-foreground">{t("studyGroupsDiscover")}</h2>

            <div className="mb-3">
              <CourseSelect
                value={discoverCourseId}
                onChange={setDiscoverCourseId}
                placeholder={t("studyGroupsFilter")}
              />
            </div>

            {loadingDiscover ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : discoverGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">{t("studyGroupsNoPublic")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {discoverGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onClick={() => navigate(`/study/groups/${group.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
