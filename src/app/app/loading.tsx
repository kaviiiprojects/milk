
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

export default function Loading() {
  // This loading UI will be shown for any route segment under /app/* during navigation and initial load.
  return (
    <>
      <GlobalPreloaderScreen message="Loading page..." />
    </>
  );
}
