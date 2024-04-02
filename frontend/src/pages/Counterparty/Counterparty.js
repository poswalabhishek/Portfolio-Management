import React from 'react';
import { CircularProgress, colors, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { withRouter } from 'react-router-dom';
import Chip from '@material-ui/core/Chip';
import ListItemText from '@material-ui/core/ListItemText';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import classnames from 'classnames'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { serverURL } from '../../constants'
import Chart from './components/Chart';
import { parseCalculationData, parsePriceData, parseAlertData } from './components/chartHelper';
import NewsList from './components/NewsList';
import AlertList from './components/AlertList';
import CircularBarWithLabel from '../../components/CircularBarWithLabel';
import { getSentimentColor } from '../../helper';
import { SentimentPopover } from './components/popover';
import TopicsRow from './components/TopicsRow';

const useStyles = makeStyles((theme) => ({
  counterparty: {
  },
  currentRow: {
    display: 'flex',
    marginBottom: theme.spacing(1),
    alignItems: 'center',
    '& > *': {
      display: 'inline-flex',
      marginRight: theme.spacing(0.5),
    }
  },
  title: {
    flexGrow: 1
  },
  alertListItem: {
    padding: 0,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },
  alert: {
    backgroundColor: colors.red[400],
  },
  warning: {
    backgroundColor: colors.amber[400],
  },
  button: {
    marginRight: theme.spacing(1)
  },
  paper: {
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1.5)
  },
  marginLeft:{
    marginLeft: theme.spacing(1)
  },
  keywordChipsContainer: {
    '& > *': {
      marginRight: theme.spacing(0.5),
      '&:last-child': {
        marginRight: 0
      }
    },
  }
}));

const Counterparty = (props) => {

  const classes = useStyles();
  const { history, displayMessage } = props;

  const queryParams = new URLSearchParams(document.location.search);
  const counterparty = queryParams.get('symbol')

  const [ data, setData ] = useState({});
  const [ chartData, setChartData ] = useState({});
  
  const [ newsListParam, setNewsListParam ] = useState({page: 1})

  useEffect(()=>{
    setData({})
    setChartData({})

    axios.get(serverURL + `counterparty?symbol=${counterparty}&detailed=true`)
    .then((response)=>{
      setData(prevState =>({...prevState, counterpartyInfo: response.data[0]}))
    })
    .catch((error)=> displayMessage({severity: 'error', message: error.toString()}))

    
    axios.get(serverURL + `chart/calculation?counterparty=${counterparty}`)
      .then((response)=>{
        setChartData(prevState => ({...prevState, calculation: parseCalculationData(response.data)}))
      })
      .catch((error)=> displayMessage({severity: 'error', message: error.toString()}))

    axios.get(serverURL + `chart/price?counterparty=${counterparty}`)
      .then((response)=>{
        setChartData(prevState => ({...prevState, price: parsePriceData(response.data)}))
      })
      .catch((error)=> displayMessage({severity: 'error', message: error.toString()}))
    
    axios.get(serverURL + `alert?counterparty=${counterparty}`)
      .then((response)=>{
        setData(prevState =>({...prevState, alert: response.data}));
        setChartData(prevState => ({...prevState, alert: parseAlertData(response.data)}))
      })
      .catch((error)=> displayMessage({severity: 'error', message: error.toString()}))

  }, [counterparty]);


  return (
    <div className={classes.counterparty}>
      <div className={classes.currentRow}>
        <Typography variant='h6'> Counterparty Analytics -  </Typography>
        <Typography variant="h6" className={classes.title}>
          {data.counterpartyInfo?.name} ({counterparty})
        </Typography>
        <Typography>
          Sentiment:
        </Typography>
        <CircularBarWithLabel
          max={1} min={-1} 
          color={getSentimentColor(data?.counterpartyInfo?.data?.sentiments?.rolling_avg)} 
          value={data?.counterpartyInfo?.data?.sentiments?.rolling_avg}
        />
        <SentimentPopover />
        <Typography className={classes.marginLeft}>
          Keywords:
        </Typography>
        <TopicsRow topic_count={data?.counterpartyInfo?.data?.topic_count}/>
      </div>
      <Paper className={classes.paper}>
        {(chartData.price && chartData.calculation) ?
           <Chart chartData={chartData} setNewsListParam={setNewsListParam} counterparty={counterparty}/>:
           <CircularProgress/>
        }
      </Paper>
      <Paper className={classes.paper}>
        <NewsList counterparty={counterparty} newsListParam={newsListParam} setNewsListParam={setNewsListParam}/>
      </Paper>
      <Paper className={classes.paper}>
        <AlertList data={data.alert}/>
      </Paper>
    </div>
  )
}

export default withRouter(Counterparty)