import { colors as muicolors, Popover, Chip } from "@material-ui/core"
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { useState, Fragment, useRef } from "react";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles, Typography, Box } from "@material-ui/core";
import { colors } from "../../../constants";

const useStyles = makeStyles((theme) => ({
  popover: {
    pointerEvents: 'none',
  },
  paper: {
    padding: theme.spacing(1),
  },
  icon: {
    display: 'inline-block',
    marginLeft: theme.spacing(1),
    fontSize: 16,
    color: muicolors.grey[600]
  }
}));

export const SentimentPopover = (props) => {
  const iconRef = useRef();
  const [ open, setOpen ] = useState(false)
  const classes = useStyles();

  return <Fragment>
    <HelpOutlineIcon
      ref={iconRef}
      className={classes.icon}
      onMouseEnter={()=>setOpen(true)} 
      onMouseLeave={()=>setOpen(false)}
    />
    <Popover
      className={classes.popover}
      classes={{
        paper: classes.paper,
      }}
      open={open}  
      anchorEl={iconRef.current}
      anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
      }}
      transform={{
          vertical: 'top',
          horizontal: 'left',
      }}
      disableRestoreFocus
    >
      <Typography>Sentiment Score Definition:</Typography>
      <Box marginBottom={1}>
        <Chip size='small' style={{backgroundColor: colors.positive, marginRight: 4}}label='positive'/>
        <Typography variant='body2' display='inline'>: Score &gt; 0.3 (50%)</Typography>
      </Box>     
      <Box marginBottom={1}>
        <Chip size='small' style={{backgroundColor: colors.neutral, marginRight: 4}}label='neutral'/>
        <Typography variant='body2' display='inline'>: 0 ≤ Score &lt; 0.3 (44%)</Typography>
      </Box>
      <Box>
        <Chip size='small' style={{backgroundColor: colors.negative, marginRight: 4}}label='negative'/>
        <Typography variant='body2' display='inline'>: Score &lt; 0 (6%)</Typography>
      </Box>
    </Popover>
  </Fragment>
}