import { withRouter } from "react-router-dom"
import { DataGrid } from "@mui/x-data-grid";
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { serverURL } from '../constants'
import { useState, useEffect } from "react";
import { CircularProgress, Paper } from "@material-ui/core";


const useStyles = makeStyles((theme) => ({
  counterpartyList: {
    textAlign: 'center',
    padding: theme.padding
  },
  buttonRow: {
    textAlign: 'left',
    marginBottom: theme.spacing(1),
    '& > *': {
      marginRight: theme.spacing(1),
    }
  }
}));

const TopicList = (props) => {

  const classes = useStyles();
  const { history, displayMessage } = props;
  const [ topics, setTopics ] = useState([]);
  const [ selectedTopics, setSelectedTopics ] = useState([]);

  function handleDelteTopics(){
    const promises = selectedTopics.map(
      id => axios.delete(serverURL+'topic?id='+id)
    )

    Promise.all(promises)
      .then(()=>{
        displayMessage({severity: 'success', message: 'Deleted topics: '+ selectedTopics.map(x => topics.find(y => y.id == x).title)})
        setSelectedTopics([])
        fetchTopicList()
      }).catch((error) => displayMessage({severity: 'error', message: error.toString()}))
  }

  function fetchTopicList(){
    axios.get(serverURL + 'topic')
    .then((response)=>{
      setTopics(response.data)
    })
    .catch((error) => displayMessage({severity: 'error', message: error.toString()}))
  }

  useEffect(fetchTopicList, []);

  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      width: 130
    },
    {
      field: 'keywords',
      headerName: 'Keywords',
      width: 300
    }, {
      field: 'counterparties',
      headerName: 'Counterparties',
      width: 300,
      sortComparator: function (v1, v2){
        return v1.toString() > v2.toString()
      }
    }
  ]

  return (
    <div className={classes.counterpartyList}>
      <div className={classes.buttonRow}>
        <Button variant="contained" color="primary" 
          onClick={(event) => history.push("/edit-topic")}
        >
          New
        </Button>
        <Button variant="contained" color="secondary" 
          onClick={handleDelteTopics}
        >
          Delete
        </Button>
      </div>
      <Paper>
      { topics.length? <DataGrid
          autoHeight
          checkboxSelection
          columns={columns}
          rows={topics}
          //getRowId={(row) => row.id}
          onRowClick={({row})=>history.push("/edit-topic?topicId="+row.id)}
          onSelectionModelChange={(val)=>setSelectedTopics(val)}
        />:
        <CircularProgress />
      }
      </Paper>
    </div>
  )
}

export default withRouter(TopicList)