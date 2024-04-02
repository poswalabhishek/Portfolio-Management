export const pieChartConfig = {
    chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        height: '80%'
    },
    title: { margin: 0, style:{fontSize: 16} },
    tooltip: {pointFormat: '{point.percentage:.1f}% ({point.y})'},
    plotOptions: {
      pie: {
        allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            distance: -10,
            format: '<b>{point.name}</b>: <br> {point.percentage:.0f}% ({point.y})'
          }
        }
    },
    series: {
        name: '',
        innerSize: '60%',
        size: '100%',
        colorByPoint: true,
    }
}