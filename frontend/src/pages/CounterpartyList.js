import { withRouter } from "react-router-dom"
import { DataGrid } from "@mui/x-data-grid";
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { serverURL } from '../constants'
import React, { useState, useEffect } from "react";
import { Chip, CircularProgress } from "@material-ui/core";
import { getSentimentColor } from "../helper";
import CircularBarWithLabel from "../components/CircularBarWithLabel";
import { Paper } from "@material-ui/core";
import SearchBox from "../components/SearchBox";
import { escapeRegExp } from "../helper";
import debounce from 'lodash/debounce';
import { Typography } from "@material-ui/core";
import TopicsRow from "./Counterparty/components/TopicsRow";

const useStyles = makeStyles((theme) => ({
  counterpartyList: {
    textAlign: 'center',
  },
  buttonRow: {
    display: 'flex',
    textAlign: 'left',
    marginBottom: theme.spacing(1),
    '& > *': {
      marginRight: theme.spacing(1),
    }
  },
  keywordChips: {
    marginRight: theme.spacing(0.5)
  }
}));

const CounterpartyList = (props) => {

  const classes = useStyles();
  const { history, displayMessage } = props;
  const [ data, setData ] = useState([]);
  const [ selectedCounterparties, setSelectedCounterparties ] = useState([]);
  const [searchText, setSearchText] = React.useState('');
  const counterparties = data.map(c => ({
    sentiment: c?.data?.sentiments?.rolling_avg,
    keywords: c?.data?.topic_count,
    symbol: c.symbol,
    name: c.name
  }))


  const searchRegex = new RegExp(escapeRegExp(searchText), 'i');
  const filteredCounterparties = counterparties.filter((row) =>
    Object.keys(row).some(
      (field) =>  searchRegex.test(
        typeof row[field] == 'object'? 
          Object.entries(row[field]).sort(([,a],[,b]) => a<b).slice(0,3).toString():
          row[field]?.toString()
      )
    )
  )

  function handleDeleteCounterparties(){
    const promises = selectedCounterparties.map(
      counterparty => axios.delete(serverURL+'counterparty?symbol='+counterparty)
    )

    Promise.all(promises)
      .then(function(){
        displayMessage({severity: 'success', message: 'Deleted counterparties: '+ selectedCounterparties})
        setSelectedCounterparties([])
        fetchCounterpartyList()
      })
      .catch(error=> displayMessage({severity: 'error', message: error.toString()}))
  }

  function fetchCounterpartyList(){
    axios.get(serverURL + 'counterparty?detailed=true')
    .then((response)=>{
      setData(response.data)
    })
    .catch((error)=>{
      displayMessage({severity: 'error', message: 'Fetch counterparty list failed: '+ error})
    })
  }

  useEffect(fetchCounterpartyList, []);

  const columns = [
    {
      field: 'symbol',
      headerName: 'Symbol',
      width: 100
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200
    },
    {
      field: 'sentiment',
      headerName: 'Sentiment',
      renderCell: (params) => 
        <CircularBarWithLabel
          max={1} min={-1} 
          color={getSentimentColor(params.value)} 
          value={params.value}
        />,
      width: 100
    },
    {
      field: 'keywords',
      headerName: 'Keywords',
      width: 500,
      renderCell: (params) => 
        <TopicsRow topic_count={params.value}/>
    }
  ]

  return (
    <div className={classes.counterpartyList}>
      <div className={classes.buttonRow}>
        <Button variant="contained" color="primary" 
          onClick={(event) => history.push("new-counterparty")}
        >
          New
        </Button>
        <Button variant="contained" color="secondary" 
          onClick={handleDeleteCounterparties}
        >
          Delete
        </Button>
        {<SearchBox
          clearOnBlur={false}
          onInputChange={(evt, val)=>{debounce(setSearchText, 100)(val)}}
          open={false}
        />}
      </div>
      <Paper className={classes.listContainer}>
      { data.length > 0 ?
        <DataGrid
          autoHeight
          checkboxSelection
          columns={columns}
          rows={filteredCounterparties}
          getRowId={(row) => row.symbol}
          onRowClick={({row})=>history.push("/counterparty?symbol="+row.symbol)}
          onSelectionModelChange={(val)=>setSelectedCounterparties(val)}
          pageSize={50}
        /> :
        <CircularProgress/>
      }
      </Paper>
    </div>
  )
}

export default withRouter(CounterpartyList)