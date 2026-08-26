import { readFile } from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AccountHeader } from "@/components/account/AccountHeader";
import { NoticeBanner } from "@/components/dashboard/NoticeBanner";

/**
 * Reads docs/SRS.md from disk at request time. Works because this app runs
 * as a long-lived Node server (pnpm start / next dev) — a serverless
 * platform that traces/prunes unreferenced files out of the deploy bundle
 * would need docs/SRS.md added to its file-tracing include list.
 */
export default async function DocsPage() {
  const filePath = path.join(process.cwd(), "docs", "SRS.md");
  const content = await readFile(filePath, "utf8");

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <AccountHeader />
      <main className="flex flex-1 justify-center overflow-x-auto px-4 pb-24 pt-12 sm:px-10">
        <article className="prose prose-sm w-full max-w-[768px] prose-headings:font-display prose-headings:font-semibold prose-headings:text-[#030303] prose-p:text-[#464646] prose-a:text-[#030303]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </main>
      <NoticeBanner />
    </div>
  );
}
