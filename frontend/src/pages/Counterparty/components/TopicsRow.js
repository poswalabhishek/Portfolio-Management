import { Box, Chip, makeStyles, Popover } from "@material-ui/core"
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { useRef, useState } from "react";
import { getIntensityColor } from "../../../helper";

const useStyles = makeStyles((theme)=>({
  topicsRow: {
    display: 'flex',
    alignItems: 'center',
    '& > *': {
      margin: theme.spacing(0.5),
    }
  },
  popover: {
    pointerEvents: 'none',
  },
  paper: {
    padding: theme.spacing(1),
    '& > *': {
      margin: theme.spacing(0.5),
    }
  }
}))

const TopicsRow = ({topic_count, threshold = 0, displayRest = false}) => {

  const classes = useStyles()
  const [ open, setOpen ] = useState(false)
  const ref = useRef()

  const items = Object.entries(topic_count || {})
    .sort((a, b)=> a[1] < b[1])

  const displayItems = items
    .filter(([k, v])=> v>=threshold)
    .slice(0, 3)
  
  const remainingItems = items
    .filter(i => !displayItems.includes(i))

  return <Box display='flex' alignItems='center' className={classes.topicsRow}>
    {displayItems.map(([k, v]) => <Chip style={{backgroundColor: getIntensityColor(v/20)}} key={k} label={`${k}:${v}`}/>)}
    {displayRest && remainingItems.length > 0 && <MoreHorizIcon ref={ref} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}/>}
    {displayRest && remainingItems.length > 0 && <Popover 
      className={classes.popover}
      classes={{
        paper: classes.paper,
      }}
      open={open} anchorEl={ref.current} disableRestoreFocus
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
    }}
    >
      {remainingItems.map(([k, v]) => <Chip style={{backgroundColor: getIntensityColor(v/20)}} key={k} label={`${k}:${v}`}/>)}
    </Popover>}
  </Box>
}

export default TopicsRow;