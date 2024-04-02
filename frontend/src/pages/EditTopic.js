import { makeStyles } from '@material-ui/core/styles';
import { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { serverURL } from '../constants';
import { CircularProgress, Snackbar, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';
import CounterpartyList from '../components/CounterpartyList';
import { Button } from '@material-ui/core';
import { FormControlLabel, Switch, Grid, Box } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  page: {
    padding: theme.spacing(1),
  },
  row: {
    alignContent: 'center',
    marginBottom: theme.spacing(1.5),
    '& > *': {
      marginRight: theme.spacing(1),
      display: 'inline-flex'
    },
  },
  title: {
    marginRight: theme.spacing(2)
  },
  autocomplete: {
    margin: 0,
    marginTop: -2.5
  },
  label: {
    marginRight: theme.spacing(1)
  }
}));

const EditTopic = (props) => {

  const classes = useStyles();
  const { history, displayMessage } = props;

  const queryParams = new URLSearchParams(document.location.search);
  const topicId = queryParams.get('topicId')
  const counterparty = queryParams.get('symbol')

  const [options, setOptions] = useState([])
  const [selectedCounterpartyForSuggestion, setSelectedCounterpartyForSuggestion] = useState(
    counterparty? {symbol: counterparty, title: ''}: undefined
  )
  const [topicData, setTopicData] = useState({
    counterparties: counterparty? [counterparty]:'global',
    keywords: [],
    title: ''
  });
  const [ldaSuggestion, setLdaSuggestion] = useState({});

  useEffect(function(){
    if (!selectedCounterpartyForSuggestion) return;
    axios.get(serverURL + `lda?symbol=${selectedCounterpartyForSuggestion.symbol}`)
    .then((response)=>{
      setLdaSuggestion(response.data)
    })
    .catch((error)=> displayMessage({severity: 'error', message: error.toString()}))
  }, [selectedCounterpartyForSuggestion])

  useEffect(function(){
    axios.get(serverURL + 'counterparty')
      .then(function(response){
        setOptions(response.data)
      })
    
    if (!topicId) return;
    axios.get(serverURL + `topic/?id=${topicId}`)
    .then((response)=>{
      setTopicData(response.data)
    })
    .catch((error)=> displayMessage({severity: 'error', message: error.toString()}))
  }, [])

  function renderAutocompleteInput(params){
    return (
    <TextField
      {...params}
      label="LDA Counterparty"
      variant="outlined"
      margin="dense"
    />)
  }

  const TopicSuggestion = () => {
    function addKeyword(keyword){
      setTopicData({
        ...topicData, 
        keywords: [...topicData.keywords, keyword]
      })
    }

    return <div>
      <Box display='flex' alignItems='center' marginBottom={1}>
        <Typography className={classes.label}> Show LDA Topics suggestion for: </Typography>
        <Autocomplete
          renderInput={renderAutocompleteInput}
          style={{ width: 250 }}
          className={classes.autocomplete}
          value={selectedCounterpartyForSuggestion}
          options={options}
          getOptionLabel={(option)=>option.symbol}
          renderOption={(option)=>
            <Box>
              {option.symbol} - <span>{option.name}</span>
            </Box>
          }
          getOptionSelected={(option) => option.symbol == selectedCounterpartyForSuggestion.symbol}
          onChange={function(evt, value){setSelectedCounterpartyForSuggestion(value)}}
        />
      </Box>
      {ldaSuggestion?.topics?.map((topic, i) =>
        <div className={classes.row}>
          <Typography>LDA {i}:</Typography>
          {topic[1].slice(0, 8).map(keyword =>
            <Chip size="small" onClick={()=>{addKeyword(keyword[0])}} label={keyword[0]}/>
          )}
        </div>
      )}
    </div>
  }

  function handleSwitchClick(){
    if (topicData.counterparties === 'global') {
      setTopicData({...topicData, counterparties: []})
    } else {
      setTopicData({...topicData, counterparties: 'global'})
    }
  }

  function submit(){
    if (topicData.keywords.length == 0){
      displayMessage({severity: 'warning', message: 'Keywords cannot be empty'})
      return
    }
    displayMessage({severity: 'info', message: <Box display="flex" alignItems="center">Submiting Topics <CircularProgress size={25}/></Box>, persist: true})
    axios(serverURL + 'topic', {
      method: topicId? 'put': 'post',
      data: topicData
    }).then(
      function(){
        displayMessage({severity: 'success', message: `Topic '${topicData.title}' added!`})
        history.goBack()
      }
    ).catch(error=> displayMessage({severity: 'error', message: error.toString()}))
  }

  return (
    <div className={classes.page}>
      <div className={classes.row}>
        <Typography variant='h6' className={classes.title}>Edit Topics</Typography>
        <Button variant="contained" color="primary" onClick={submit}>Save</Button>
        <Button variant="contained" color="secondary" onClick={()=>history.goBack()}>Cancel</Button>
        <Button variant="contained" onClick={()=>history.go()}>Reset</Button>
      </div>
      <div className={classes.row}>
        <TextField
          variant="outlined"
          label="Title"
          margin="dense"
          value={topicData.title}
          onChange={function(evt){setTopicData({...topicData, title: evt.target.value})}}
          InputLabelProps={{ shrink: Boolean(topicData?.title) }}
        />
        <Autocomplete
          multiple
          freeSolo
          style={{ minWidth: 250 }}
          className={classes.autocomplete}
          options={[]}
          value={topicData?.keywords}
          onChange={function(evt, val){setTopicData({...topicData, keywords: val})}}
          renderInput={params =>
            <TextField
              {...params}
              variant="outlined"
              label="Keywords"
              margin="dense"
              helperText="Type in the vocab then click 'Enter' or select vocab from suggestions"
            />
          }
        />
      </div>
      <TopicSuggestion />
      
      <Grid component="label" container alignItems="center" spacing={0}>
        <Grid item>Track this topic for Selected</Grid>
        <Grid item>
          <Switch checked={topicData.counterparties == 'global'} onClick={handleSwitchClick} name="checkedC" />
        </Grid>
        <Grid item>All Counterparties</Grid>
      </Grid>
      { topicData.counterparties !== 'global' &&
        <CounterpartyList
          selectedCounterparties={topicData.counterparties}
          setSelectedCounterparties={function(val){setTopicData({...topicData, counterparties: val})}}
          pageSize={10} 
        />
      }
    </div>
  );
}

export default withRouter(EditTopic)