import { redirect } from "next/navigation";

/** /research has no page of its own: Timeline is the first Research section. */
export default function Page() {
  redirect("/research/timeline");
}
