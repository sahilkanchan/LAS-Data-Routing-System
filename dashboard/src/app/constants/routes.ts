import { NavigationMeta } from "../types/main"
import { MapIcon, PresentationChartLineIcon } from "@heroicons/react/24/outline";

import { useBatchStore } from "@/app/store/batchStore";

export const navLinks: Record<string, NavigationMeta> = {
  "/overview": {
    name: "Overview",
    icon: MapIcon,
    href: () => {
      const b = useBatchStore.getState().getSelectedBatchCommaSeparated();
      return b ? `overview/?b=${b}` : "overview/";
    }
  },
  "/visualization": {
    name: "Visualization",
    icon: PresentationChartLineIcon,
    href: () => {
      const b = useBatchStore.getState().getSelectedBatchCommaSeparated();
      return b ? `/visualization?b=${b}` : "/visualization";
    }
  }
};
