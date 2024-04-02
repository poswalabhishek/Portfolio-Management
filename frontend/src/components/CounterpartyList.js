import { withRouter } from "react-router-dom"
import { DataGrid } from "@mui/x-data-grid";
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { serverURL } from '../constants'
import { useState, useEffect } from "react";


const useStyles = makeStyles((theme) => ({

}));

const CounterpartyList = (props) => {

  const classes = useStyles();
  const { selectedCounterparties, setSelectedCounterparties, ...rest } = props;
  const [ counterparties, setCounterparties ] = useState();


  useEffect(()=>{
    axios.get(serverURL + 'counterparty')
      .then((response)=>{
        setCounterparties(response.data)
      })
      .catch((error)=>{
        console.log("TODO error catching")
      })
  }, []);

  const columns = [
    {
      field: 'symbol',
      headerName: 'Symbol',
      width: 130
    },
    {
      field: 'name',
      headerName: 'Counterparty Name',
      width: 500
    }
  ]

  return counterparties? (
    <div className={classes.counterpartyList}>
      <DataGrid
        autoHeight
        checkboxSelection
        columns={columns}
        rows={counterparties}
        getRowId={(row) => row.symbol}
        selectionModel={selectedCounterparties}
        onSelectionModelChange={(val)=>{ console.log(val); setSelectedCounterparties(val)}}
        style={{width: 700}}
        {...rest}
      />
    </div>
  ): null
}

export default CounterpartyList