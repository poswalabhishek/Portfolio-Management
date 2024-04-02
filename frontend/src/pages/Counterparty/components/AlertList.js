import { useState, useEffect, Fragment } from "react";
import { makeStyles } from "@material-ui/styles";
import ListItemText from '@material-ui/core/ListItemText';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Avatar from "@material-ui/core/Avatar";
import Typography from '@material-ui/core/Typography';
import { Pagination } from "@material-ui/lab";
import axios from "axios";
import { colors, serverURL } from "../../../constants";
import Chip from '@material-ui/core/Chip';
import { title, generateAlertContent } from '../../../helper.js'
import classnames from "classnames";
import { Box, IconButton } from "@material-ui/core";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import { colors as muicolors } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  headerRow: {
    display: 'flex',
    paddingLeft: theme.spacing(1),
    '& > *': {
      marginRight: theme.spacing(5)
    }
  },
  listItem: {
    display: 'flex',
    marginBottom: theme.spacing(0.5),
    '& > *': {
      color: '#555',
    }
  },
  listTitle: {
    color: '#000'
  },
  bodyText: {
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
  },
  infoRow: {
    '& > *': {
      margin: theme.spacing(0.5),
      display: 'inline-flex'
    }
  },
  image: {
    width: 130,
    height: 80,
    maxWidth: '30%',
    marginRight: theme.spacing(2)  
  },
  iconButton: {
    padding: 0,
    color: muicolors.grey[400],
    '&:hover':{
      color: muicolors.grey[600]
    }
  },
  iconButtonActive: {
    color: muicolors.grey[600]
  },
}));

const AlertListItem = ({alertItem}) => {

  const classes = useStyles();
  const [ feedback, setFeedback ] = useState(alertItem.feedback);

  function submitFeedback(id, feedback){
    axios.put( serverURL+'alert?id='+id, {
      feedback: feedback,
    })
    setFeedback(feedback)
  }
  return (
  <ListItem button onClick={()=>{}} className={classes.listItem}
    style={{backgroundColor: alertItem.category == 'alert'? muicolors.red[100]: muicolors.green[100]}}
  >
    <Box marginRight={6}>
      <Typography className={classes.listTitle}>{title(alertItem.type)}</Typography>
      <Typography variant="subtitle2">{title(alertItem.category)} - {alertItem.date.substring(0, 10)}</Typography>
      <Typography variant="body2" className={classes.bodyText}>{generateAlertContent(alertItem)}</Typography>
    </Box>
    <div className={classes.feedbackButtonContainer}>
        <IconButton className={classnames(classes.iconButton, feedback? classes.iconButtonActive: null)} onClick={()=>submitFeedback(alertItem.id, true)}>
          <CheckCircleIcon/>
        </IconButton>
        <IconButton className={classnames(classes.iconButton, feedback === false? classes.iconButtonActive: null)} onClick={()=>submitFeedback(alertItem.id, false)}>
        <CancelIcon/>
        </IconButton>
      </div>
  </ListItem>
  )
};

const AlertList = (props) => {

  const { data } = props

  const [ page, setPage ] = useState(1);
  const pageCount = Math.ceil((data?.length || 0)/ 5)

  const classes = useStyles();

  function handlePageChange(evt, page){
    setPage(page)
  }

  return (
  <div>
    <div className={classes.headerRow}>
      <Typography variant="h6">
          Past Alerts
      </Typography>
      <Pagination count={pageCount} page={page} onChange={handlePageChange}/>
    </div>
    <List>
      {data?.slice((page -1) *5, Math.min(page*5, data?.length))
        ?.map((alertItem, index) => <AlertListItem alertItem={alertItem} key={index}/>)}
    </List>
  </div>
  )

}

export default AlertList;