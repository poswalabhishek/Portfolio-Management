import { Checkbox, FormControlLabel } from "@material-ui/core";

const CheckboxWithLabel = (props) => {
  const { label, ...rest } = props;

  return (
    <FormControlLabel 
      label={label}
      control={<Checkbox onClick={(evt)=>{evt.preventDefault()}} {...rest}/>}
    />
  );
}

export default CheckboxWithLabel;

  