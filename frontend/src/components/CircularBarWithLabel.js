import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

function CircularBarWithLabel(props) {
  
  const { value, color, max=100, min=0, ...rest } = props

    return (
      <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
        <Box
          position="absolute"
          borderRadius={20}
          width={40}
          height={40}
          style={{backgroundColor: 'white', opacity: '30%'}}
        />
        <CircularProgress variant="determinate" thickness={20} {...rest} value={(value-min)/(max-min)*100} style={{color: color}}/>
        <Box
          top={0}
          left={0}
          bottom={0}
          right={0}
          position="absolute"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="caption" component="div">{`${
            value?.toFixed(2) || 'N/A'
          }`}</Typography>
        </Box>
      </Box>
    );
  }
  
  export default CircularBarWithLabel;