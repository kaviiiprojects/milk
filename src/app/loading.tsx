
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

export default function Loading() {
  //// This loading UI will be shown while the root page (e.g., login page) is loading its content.
  return (
    <>
      <GlobalPreloaderScreen message="Loading application..." />
    </>
  );
}
