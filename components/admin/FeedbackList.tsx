import { SettingsCard } from "../account/SettingsPrimitives";
import { RelativeTime } from "../account/RelativeTime";
import { getFeedbackList } from "@/lib/queries/feedback";

export async function FeedbackList() {
  const feedback = await getFeedbackList();

  return (
    <div className="flex w-full flex-col items-start gap-6">

      <SettingsCard>
        {feedback.length === 0 ? (
          <div className="flex w-full flex-col items-center gap-1 p-8 text-center">
            <p className="text-[13px] font-medium text-foreground">
              No feedback yet
            </p>
            <p className="text-[13px] font-medium text-foreground-muted">
              Submissions from the Feedback button will appear here.
            </p>
          </div>
        ) : (
          feedback.map((item, i) => (
            <div
              key={item.id}
              className={`flex w-full flex-col gap-1.5 p-4 ${
                i < feedback.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-[13px] font-medium text-foreground">
                  {item.submittedBy}
                </span>
                <span className="shrink-0 text-xs font-medium text-foreground-muted">
                  <RelativeTime iso={item.createdAt} />
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-[13px] font-medium text-foreground-secondary">
                {item.message}
              </p>
            </div>
          ))
        )}
      </SettingsCard>
    </div>
  );
}
