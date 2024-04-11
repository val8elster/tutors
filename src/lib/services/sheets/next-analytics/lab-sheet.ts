import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  GridComponent,
  VisualMapComponent
} from 'echarts/components';
import { HeatmapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { UserMetric } from '$lib/services/types/metrics';
import { backgroundPattern } from '../next-charts/next-charts-background-url';
import { heatmap } from '../next-charts/heatmap';


echarts.use([
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  HeatmapChart,
  CanvasRenderer
]);

const bgPatternImg = new Image();
bgPatternImg.src = backgroundPattern;

export class LabSheet {
  chartRendered: boolean = false;

  constructor(allLabs, userData) {
    this.chartRendered = false;
    this.chartInstances = new Map();
    this.labs = allLabs; // Array of lab titles
    this.users = userData; // Array of user objects
    this.categories = new Set();
    this.user = null;
  }

  populateUsersData(usersData) {
    this.users = usersData;
    this.populateAndRenderUsersData(this.users, this.labs);
  }

  populateSingleUserData(user: UserMetric) {
    this.user = user;
    this.populateAndRenderSingleUserData(this.user, this.labs);
  }

  getChartContainer() {
    // Assuming there is one container for the whole heatmap
    const container = document.getElementById('heatmap-container');
    if (container) {
      container.style.width = '100%';
      container.style.height = '100%';
    }
    return container;
  }

  getIndexFromMap(map, key) {
    const keysArray = Array.from(map.keys());
    return keysArray.indexOf(key);
  }

  populateSeriesData(user, userIndex: number, allLabs) {
    const labTitles = allLabs.map(lab => lab.title.trim());
    this.categories = new Set(labTitles);

    //const seriesData = usersData.forEach((user, userIndex) => 
    const seriesData = user?.labActivity?.map(activity => [
      labTitles.indexOf(activity.title.trim()),
      userIndex, // yIndex is now the index of the user in usersData array
      activity.count
    ])

    return [{
      name: 'Lab Activity',
      type: 'heatmap',
      data: seriesData,
      label: {
        show: true
      }
    }];
  }

  populateSingleUserSeriesData(user: UserMetric, allLabs) {
    const labTitles = allLabs.map(lab => lab.title.trim());
    this.categories = new Set(labTitles);

    // This maps each lab activity to a single row with columns as lab activities
    const seriesData = user?.labActivity?.map(activity => [
      labTitles.indexOf(activity.title.trim()), 
      0, 
      activity.count 
    ])

    return [{
      name: 'Lab Activity',
      type: 'heatmap',
      data: seriesData,
      label: {
        show: true
      }
    }];
  }

  populateAndRenderSingleUserData(user: UserMetric, allLabs: any) {
    const container = this.getChartContainer();
    if (!container) return; // Exit if no container found

    // yAxisData for a single user should be an array with a single element
    let yAxisData = [user?.nickname]; // Even for a single user, this should be an array

    const seriesData = this.populateSingleUserSeriesData(user, allLabs);

    // Now seriesData contains the data for a single user
    const series = [{
      name: 'Lab Activity',
      type: 'heatmap',
      top: '5%',
      data: seriesData[0].data,
      label: {
        show: true
      }
    }];

    this.renderChart(container, yAxisData, series);
  };

  populateAndRenderUsersData(usersData, allLabs) {
    const container = this.getChartContainer();
    if (!container) return; // Exit if no container found

    let allSeriesData = [];
    //const yAxisData = usersData.forEach(user => user.nickname);
    let yAxisData: [] = [];
    usersData?.forEach((user, nickname) => {
      yAxisData.push(user?.nickname)

      const index = this.getIndexFromMap(usersData, nickname);

      const seriesData = this.populateSeriesData(user, index, allLabs);
      allSeriesData = allSeriesData.concat(seriesData[0].data);
    });

    // Now allSeriesData contains the combined data for all users
    const series = [{
      name: 'Lab Activity',
      type: 'heatmap',
      data: allSeriesData,
      label: {
        show: true
      }
    }] || [];

    this.renderChart(container, yAxisData, series);
  };

  renderChart(container, yAxisData, series) {
    const chartInstance = echarts.init(container);

    const option = heatmap(this.categories, yAxisData, series, bgPatternImg, 'Lab Time: Per Student');

    chartInstance.setOption(option);
  };

  populateAndRenderCombinedUsersData(usersData, allLabs) {
    const container = this.getChartContainer();
    if (!container) return;

    let allSeriesData = [];
    //const yAxisData = usersData.forEach(user => user.nickname);
    let yAxisData: [] = [];
    usersData?.forEach((user, nickname) => {
      yAxisData.push(user?.nickname)

      const index = this.getIndexFromMap(usersData, nickname);

      const seriesData = this.populateSeriesData(user, index, allLabs);
      allSeriesData = allSeriesData.concat(seriesData[0].data);
    });

    // Now allSeriesData contains the combined data for all users
    const series = [{
      name: 'Lab Activity',
      type: 'heatmap',
      data: allSeriesData,
      label: {
        show: true
      }
    }];

    this.renderChart(container, yAxisData, series);
  };

  prepareCombinedLabData(data) {
    const labActivities = new Map();

    // Aggregate counts and nicknames for each lab
    data.forEach(user => {
      user?.labActivity.forEach(lab => {
        if (!labActivities.has(lab.title)) {
          labActivities.set(lab.title, []);
        }
        // Push an object containing count and nickname
        labActivities.get(lab.title).push({ count: lab.count, nickname: user.nickname, image: user.picture });
      });
    });

    const boxplotData = Array.from(labActivities).map(([title, activities]) => {
      activities.sort((a, b) => a.count - b.count);
      const addedCount = activities.reduce((acc, curr) => acc + curr.count, 0);

      const lowData = activities[0];
      const topTwo = activities[1];

      const highData = activities[activities.length - 1];
      return {
        value: addedCount,
        title: title,
        lowValue: lowData.count,
        highValue: highData.count,
        lowNickname: lowData.nickname,
        highNickname: highData.nickname,
      };
    });

    return boxplotData;
  }

  renderCombinedBoxplotChart(container, boxplotData) {
    const chart = echarts.init(container);

    const heatmapData = boxplotData.map((item, index) => [index, 0, item.value]);
    const titles = boxplotData.map(item => item.title);

    // Heatmap option
    const option = {
      tooltip: {
        position: 'bottom',

        // Now the formatter should refer to the series data indices
        formatter: function (params) {
          const dataIndex = params.dataIndex;
          const dataItem = boxplotData[dataIndex];
          let tipHtml = dataItem.title + '<br />';
          tipHtml += 'Min: ' + dataItem.lowValue + ' (' + dataItem.lowNickname + ')<br />';
          tipHtml += 'Max: ' + dataItem.highValue + ' (' + dataItem.highNickname + ')';
          return tipHtml;
        }
      },
      backgroundColor: {
        image: bgPatternImg,
        repeat: 'repeat'
    },
      grid: {
        height: '10%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: titles,
      },
      yAxis: {
        type: 'category',
        data: [''] // Single category axis
      },
      visualMap: {
        min: 0,
        max: 250, // Adjust based on your data range
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%'
      },
      series: [{
        name: 'Value',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };

    // Set the option to the chart
    chart.setOption(option);
  };
}
