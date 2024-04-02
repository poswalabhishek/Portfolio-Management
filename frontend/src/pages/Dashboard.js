import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import AlertCard from '../components/AlertCard';
import { serverURL } from '../constants';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import { colors, Paper, Typography } from '@material-ui/core';
import CheckboxWithLabel from '../components/CheckboxWithLabel';
import SearchBox from '../components/SearchBox';
import { Box } from '@material-ui/core';
import Overview from '../components/Overview';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { IconButton } from '@material-ui/core';
import { SentimentPopover } from './Counterparty/components/popover';

const useStyles = makeStyles((theme) => ({
  dashboard: {
    textAlign: 'center',
    display: 'flex',
    flexWrap: 'wrap'
  },
  overviewContainer: {
    textAlign: 'left',
    width: theme.spacing(70),
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  headerContainer: {
    width: theme.spacing(70),
    marginRight: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-around',
    '& > .MuiTypography-root': {
      marginTop: 'auto',
      marginBottom: 'auto',
      position: 'relative',
      top: 2
    }
  },
  cardsContainer: {
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    textAlign: 'left',
    width: theme.spacing(70),
  },
  name: {
    color: colors.grey[800]
  }
}));

const Dashboard = (props) => {

  const classes = useStyles();
  const { history, displayMessage } = props;
  const [selectedDate, setSelectedDate] = useState({
    from: new Date(Date.now() - 5*24*60*60*1000),
    to: new Date()
  })
  const [ selectedCounterparties, setSelectedCounterparties ] = useState([])
  const selectedSymbols = selectedCounterparties.map(i => i.symbol)
  const [showDismissed, setShowDismissed] = useState(false)
  const [alerts, setAlerts] = useState([]);

  useEffect(function(){
    axios.get(
      serverURL + 'alert?dashboard=true&date_from=' +
      selectedDate.from.toISOString().substring(0, 10) + 
      '&date_to=' + selectedDate.to.toISOString().substring(0, 10)
    )
      .then((response)=>{
        setAlerts(response.data)
      })
      .catch((error)=>{
        displayMessage({severity: 'error', message: 'Fetch alerts failed: ' + error})
      })
  }, [selectedDate])

  function renderOption(option){
    return(
    <Box>
      {option.symbol} - <span className={classes.name}>{option.name}</span>
    </Box>
    )
  }

  function setSelectedDateTo(date){
    setSelectedDate({from: date < selectedDate.from? date: selectedDate.from , to: date})
  }


  return (
    <div className={classes.dashboard}>
      <div>
        <Paper className={classes.headerContainer}>
          <Typography>Date Range:</Typography>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              style={{width: 140}}
              disableToolbar
              variant="inline"
              format="MM/dd/yyyy"
              margin="normal"
              id="date-picker-inline"
              value={selectedDate.from}
              onChange={(date)=>setSelectedDate({from: date, to: selectedDate.to > date? selectedDate.to: date})}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
          </MuiPickersUtilsProvider>
          <Typography>~</Typography>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              style={{width: 140}}
              disableToolbar
              variant="inline"
              format="MM/dd/yyyy"
              margin="normal"
              id="date-picker-inline"
              value={selectedDate.to}
              onChange={setSelectedDateTo}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
          </MuiPickersUtilsProvider>
          <Box display="flex" alignItems="center">
            <IconButton onClick={()=>setSelectedDateTo(new Date(selectedDate.to.getTime() - 24*3600*1000))}><ArrowBackIosIcon/></IconButton>
            <IconButton onClick={()=>setSelectedDateTo(new Date(selectedDate.to.getTime() + 24*3600*1000))}><ArrowForwardIosIcon/></IconButton>
          </Box>
        </Paper>
        <Paper className={classes.overviewContainer}>
          <Typography variant="h6" display="inline">Overview</Typography>
          <SentimentPopover />
          <Overview date={selectedDate.to} displayMessage={displayMessage}/>
        </Paper>
      </div>
      <Paper className={classes.cardsContainer}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant='h6'>Alerts</Typography>
          <Box display="flex" alignItems="center">
            <SearchBox
                multiple
                suggestionURL={serverURL+'counterparty/search?query='}
                getOptionSelected={(option, value) => option.symbol === value.symbol}
                filterOptions={x=>x}
                renderOption={renderOption}
                getOptionLabel={(option) => option.symbol}
                onChange={(evt, value)=>setSelectedCounterparties(value)}
                value={selectedCounterparties}
                label="Counterparty"
                margin='dense'
                style={{ width: 180, marginRight: 6, position: 'relative', top: -8 }}
              />
              <CheckboxWithLabel
                label="Show dismissed"
                value={showDismissed}
                onClick={()=>setShowDismissed(!showDismissed)}
              />
            </Box>
          </Box>
        { alerts
          .filter((item)=> selectedCounterparties.length? selectedSymbols.includes(item.counterparty.symbol): true)
          .map((item) =>
            <AlertCard item={item} key={item.id} showDismissed={showDismissed}/>
        )}
      </Paper>
    </div>
  );
}

export default withRouter(Dashboard)