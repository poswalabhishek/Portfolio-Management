import TextField from "@material-ui/core/TextField"
import { InputAdornment } from "@material-ui/core"
import SearchIcon from '@material-ui/icons/Search';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import axios from "axios";
import { useState, useRef } from "react";
import debounce from 'lodash/debounce';
import MuiPopper from "@material-ui/core/Popper";

const useStyles = makeStyles((theme) => ({
  autocomplete: {
    display: 'flex',
    alignItems: 'center',
  },
  input: {
  }
}))


const SearchBox = (props) =>{

  const { label, suggestionURL, debounceTime=300, onInputChange, onChange, value, variant, margin, ...rest } = props;
  const classes = useStyles();
  const [ options, setOptions ] = useState([]);
  
  function search(query){
    
    axios.get(suggestionURL+query)
      .then((response)=>{
        setOptions(
          Array.isArray(value)? value.concat(response.data):
          (value? [value, response.data] : response.data)
        )
      })
      .catch((error)=>{
        console.log("TODO error catching")
      })

  }
  
  const debouncedSearch = debounce(search, debounceTime);

  function handleInputChange(evt, value){
    if (onInputChange) onInputChange(evt, value);
    if ( suggestionURL && value) debouncedSearch(value);
  }

  function handleSelect(evt, value){
    if (onChange) onChange(evt, value);
  }


  function RenderInput(params){

    return (
    <TextField {...params}
      margin={margin}
      variant={variant}
      label={label}
      InputProps={{
        ...params.InputProps,
        className: classes.input,
        endAdornment: (
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        )
      }}
    />)
}
  return (
    <Autocomplete
      variant="outlined"
      margin='dense'
      options={options}
      filterOptions={x=>x}
      renderInput={RenderInput}
      className={classes.autocomplete}
      onInputChange={handleInputChange}
      onChange={handleSelect}
      filterSelectedOptions
      {...rest}
    />
  )
}

export default SearchBox;