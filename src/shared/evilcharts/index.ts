import type { Registry } from "shadcn/schema";

import { examples } from "@/shared/evilcharts/registry-example";
import { charts } from "@/shared/evilcharts/registry-chart";
import { ui } from "@/shared/evilcharts/registry-ui";
import { blocks } from "@/shared/evilcharts/registry-blocks";

export const registry = {
  homepage: "https://hub.local",
  name: "Hub",
  items: [...ui, ...charts, ...examples, ...blocks],
} satisfies Registry;
