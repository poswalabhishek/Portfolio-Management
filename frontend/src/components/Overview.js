
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { useState, useEffect, memo } from 'react'
import { colors, serverURL } from '../constants'
import axios from 'axios';
import { Box } from '@material-ui/core';
import { pieChartConfig } from './Ovierview.chartConfig';
import { colors as muicolors } from '@material-ui/core';

const PieSentiment = ({data}) => {
  const sentiment_param = {
    positive: {name: 'Positive', color: colors.positive},
    neutral: {name: 'Neutral', color: colors.neutral},
    negative: {name: 'Negative', color: colors.negative}
  }
  const options = data? {
    ...pieChartConfig,
    title: {...pieChartConfig.title, text: 'Counterparty Sentiments',},
    series: [{
      ...pieChartConfig.series,
      data: Object.entries(data || {}).map(([k, v])=>({...sentiment_param[k], y: v}))
    }]
  }: null
  return data? <HighchartsReact
    highcharts={Highcharts}
    options={options}
    containerProps={{style: {width: '100%'}}}
  />: null
}

const PieCompareToYesterday = ({data}) => {
  const d_sentiment_param = {
    positive: {name: 'Risers', color: colors.positive},
    neutral: {name: 'Neutral', color: colors.neutral},
    negative: {name: 'Fallers', color: colors.negative}
  }
  const options = data? {
    ...pieChartConfig,
    title: {...pieChartConfig.title, text: 'Intraday Variation'},
    series: [{
      ...pieChartConfig.series,
      data: Object.entries(data || {}).map(([k, v])=>({...d_sentiment_param[k], y: v}))
    }]
  }: null

  return data? <HighchartsReact
    highcharts={Highcharts}
    options={options}
    containerProps={{style: {width: '100%'}}}
  />: null
}

const LineSentiment = ({data}) => {
  const options = data? {
    chart: {height: 350},
    title: { text: 'Portfolio Sentiment'},
    navigator: {enabled: false},
    rangeSelector: {selected: 1},
    yAxis: [{
      plotBands: [
        {from: -1, to: 0, color: muicolors.red[200], label:{text: 'Negative'}},
        {from: 0, to: 0.3, color: muicolors.grey[200], label:{text: 'Neutral'}},
        {from: 0.3, to: 1, color: muicolors.green[200], label:{text: 'Positive'}},
      ]
    }],
    series: [{
      name: 'Sentiment',
      data: [...data].reverse().map(([date, value])=>[Date.parse(date), value])
    }]
  }: null

  return data? <HighchartsReact
    highcharts={Highcharts}
    options={options}
    constructorType={'stockChart'}
  />: null
}

const Overview = ({date, displayMessage}) => {

  const [ data, setData ] = useState({})
  useEffect(function(){
    axios.get(serverURL+'overview?date='+ date.toISOString().substring(0,10))
      .then((response)=> setData(response.data))
      .catch((error) => displayMessage({severity: 'error', message: "Fetch overview failed: "+ error}))
  }, [date])

  return <div>
    <Box display='flex' marginBottom={2}>
      <PieSentiment
        data={data.sentiment}
      />
      <PieCompareToYesterday
        data={data.d_sentiment}
      />
    </Box>
    <LineSentiment 
      data={data.sentiment?.history}
    />
  </div>
}

export default memo(Overview)