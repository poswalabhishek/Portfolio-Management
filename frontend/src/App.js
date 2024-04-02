import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Typography from '@material-ui/core/Typography';
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard';
import CounterpartyList from './pages/CounterpartyList';
import Counterparty from './pages/Counterparty/Counterparty';
import TopicList from './pages/TopicList';
import { ThemeProvider } from '@material-ui/styles';
import NewCounterparty from './pages/NewCounterparty';
import EditTopic from './pages/EditTopic';
import { useState } from 'react';
import Fab from '@material-ui/core/Fab';
import { CssBaseline, Snackbar } from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

import {
  BrowserRouter,
  Switch,
  Route
} from "react-router-dom";

import { createTheme } from '@material-ui/core/styles';
import { colors } from '@material-ui/core';

const theme = createTheme({
  palette: {
    background: {
      default: '#e2e7e9',
    },
    primary: {
      main: '#000'
    },
    secondary: {
      main: '#E9041E'
    },
  },
  props: {
    MuiPaper: { elevation: 3}
  }
});

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: 1201,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  page: {
    flexGrow: 1,
    padding: theme.spacing(2)
  }, 
  menuButton: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    }
  },
  fab: {
    position: 'fixed',
    bottom: 16,
    left:16,
    backgroundColor: '#101F33',
    color: '#e0e0e0'
  }
}));

function App() {

  const classes = useStyles();
  const [ mobileSidebarOpen, setMobileSidebarOpen ] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarParam, setSnackbarParam] = useState({});

  function displayMessage(param){
    setSnackbarOpen(true)
    setSnackbarParam(param)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <div className={classes.root}>
          <Sidebar mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}/>
          <div className={classes.page}>
            <Switch>
              <Route exact path="/" render={(props) => <Dashboard displayMessage={displayMessage}/>}/>
              <Route exact path="/counterparty-list" render={(props) => <CounterpartyList displayMessage={displayMessage}/>}/>
              <Route exact path="/counterparty" render={props => <Counterparty displayMessage={displayMessage}/>}/>
              <Route exact path="/new-counterparty" render={props => <NewCounterparty displayMessage={displayMessage}/>}/>
              <Route exact path="/edit-topic" render={props => <EditTopic displayMessage={displayMessage}/>}/>
              <Route exact path="/topic-list" render={(props) => <TopicList displayMessage={displayMessage}/>}/>
            </Switch>
          </div>
          <Fab className={classes.fab} onClick={()=>setMobileSidebarOpen(true)}>
            <MenuIcon />
          </Fab>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={snackbarParam.persist? null: 6000}
            onClose={()=>setSnackbarOpen(false)}
          >
            <MuiAlert onClose={()=>setSnackbarOpen(false)} severity={snackbarParam.severity}>{snackbarParam.message}</MuiAlert>
          </Snackbar>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
