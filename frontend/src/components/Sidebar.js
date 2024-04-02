import { withRouter, useLocation } from "react-router-dom"
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import BarChartIcon from '@material-ui/icons/BarChart';
import BusinessIcon from '@material-ui/icons/Business';
import TextFieldsIcon from '@material-ui/icons/TextFields';
import { colors, makeStyles, Typography } from "@material-ui/core";
import Hidden from '@material-ui/core/Hidden';
import SearchBox from '../components/SearchBox';
import { serverURL } from "../constants";
import { Box } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  sidebarList: {
    marginTop: 16
  },
  paper: {
    backgroundColor: '#101F33',
    color: '#e0e0e0'
  },
  title: {
    color: 'white',
    margin: 16,
    fontSize: '1.2rem'
  },
  icon: {
    color: '#e0e0e0',
    minWidth: 'unset',
    marginRight: theme.spacing(1)
  },
  listItem: {
    paddingRight: 16,
    '&:hover':{
      backgroundColor: 'rgba(256, 256, 256, 0.2)' 
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(256, 256, 256, 0.3)',
      '&:hover':{
        backgroundColor: 'rgba(256, 256, 256, 0.2)' 
      }
    }
  },
  else: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: 175,
      flexShrink: 0,
    },
  },
  name: {
    color: colors.grey[800]
  }
}));

const Sidebar = (props) => {

  function renderOption(option){
    return(
    <Box>
      {option.symbol} - <span className={classes.name}>{option.name}</span>
    </Box>
    )
  }
  

  const sideBarItems = [
    {
      label: 'Dashboard',
      route: '/',
      icon: <BarChartIcon />
    },
    {
      label: 'Counterparties',
      route: '/counterparty-list',
      icon: <BusinessIcon />,
      else: <SearchBox
        suggestionURL={serverURL+'counterparty/search?query='}
        onChange={(evt, val) => history.push('counterparty?symbol='+val.symbol)}
        style={{width: 140, backgroundColor: 'white', opacity: '70%'}}
        renderOption={renderOption}
        getOptionLabel={(option) => option.symbol}
      />
    },
    {
      label: 'Topics',
      route: 'topic-list',
      icon: <TextFieldsIcon />
    }
  ]

  const { history, mobileSidebarOpen, setMobileSidebarOpen } = props;
  const location = useLocation();
  const classes = useStyles();

  function handleClose(){
    setMobileSidebarOpen(false)
  }

  const SideBarListItem = (props) => {

    const { item } = props;
  
    return (
    <div >
    <ListItem button className={classes.listItem}  key={item.label}
      onClick={()=> history.push(item.route)}
      selected={location.pathname == item.route} 
    >
      <ListItemIcon className={classes.icon}>
        {item.icon}
      </ListItemIcon>
      <ListItemText primary={item.label} />  
    </ListItem>
    {item.else && <div className={classes.else}>{item.else}</div>}
    </div>
    )
  }
  

  const SidebarList = () => (
    <List className={classes.sidebarList}>
      {sideBarItems.map(item => <SideBarListItem item={item} key={item.label}/>)}
    </List>
  )

  const DrawerContent = () => (
    <>
      <Typography variant="h6" className={classes.title}>Portfolio <br/> Management</Typography>
      <SidebarList />
    </>
  )

  return (
    <nav className={classes.drawer}>
    <Hidden xsDown implementation="css">
      <Drawer variant="permanent" anchor='left' classes={{ paper: classes.paper }}>
        <DrawerContent />
      </Drawer>
    </Hidden>
    <Hidden smUp implementation="css">
      <Drawer 
        variant="temporary" 
        anchor="left" 
        open={mobileSidebarOpen} onClose={handleClose}
        classes={{ paper: classes.paper }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <DrawerContent />
      </Drawer>
    </Hidden>
    </nav>
  );

};

export default withRouter(Sidebar);