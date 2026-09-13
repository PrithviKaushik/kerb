import { getIncidents, type IncidentListItem } from "./incidents";
import { getReports, type ReportListItem } from "./reports";

export type OverviewData = {
  incidents: IncidentListItem[];
  reports: ReportListItem[];
};

export async function getOverview(): Promise<OverviewData> {
  const [incidents, reports] = await Promise.all([getIncidents(), getReports()]);
  return { incidents: incidents.items, reports: reports.items };
}
