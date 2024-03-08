import type { Lo } from "$lib/services/models/lo-types";
import { LabSheet } from "./lab-sheet";
import { deepScheme } from "./heat-map-colours";
import type { UserMetric } from "$lib/services/types/metrics";

export class LabCountSheet extends LabSheet {
  title = "Tutors Time";
  subtitle = "Number of minutes a lab is active";

  populateCols(los: Lo[]) {
    los.forEach((lab) => {
      this.columnDefs.push({
        headerName: lab.title,
        width: 48,
        field: lab.title,
        suppressSizeToFit: true,
        cellClassRules: deepScheme,
        menuTabs: []
      });
    });
  }

  populateRow(user: UserMetric, los: Lo[]) {
    const row = this.creatRow(user);
    this.zeroEntries(los, row);
    let summaryCount = 0;
    user.labActivity.forEach((labMetric) => {
      let labSummaryCount = 0;
      if (labMetric) {
          if (labMetric.count) labSummaryCount = labSummaryCount + labMetric.count;
        labSummaryCount = Math.round(labSummaryCount / 2);
        row[`${labMetric.title}`] = labSummaryCount;
      }
      summaryCount = summaryCount + labSummaryCount;
    });

    row.summary = summaryCount;
    this.rowData.push(row);
  }
 }
