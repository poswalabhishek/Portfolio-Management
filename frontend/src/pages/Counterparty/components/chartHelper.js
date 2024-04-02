import { Flag } from "@material-ui/icons";
import { calculationDataConfig, priceDataConfig, alertDataConfig, topicDataConfig } from "./chartConfig";

function parseData(input, config){

  if (!input) return [];
  
  const datetime = input.map(obj => Date.parse(obj.date));

  return config.map(function({key,defaultValue, type, threshold, ...rest}){
    const path = key.split('.');
    const data = input.map((obj, idx) => {
      let value = path.reduce((prev, curr)=> prev?.[curr], obj) || defaultValue
      if ( value < threshold ) return [ undefined, undefined ]
      if (Array.isArray(value))
        return type === 'hollowcandlestick'? 
          [datetime[idx], ...value] :
          [datetime[idx], value[value.length - 1]];
      else return [datetime[idx], value]
    }).filter(([_, value]) => value != undefined);
    return {
      data,
      key,
      type,
      ...rest
    };
  });
};

export function parseCalculationData(input){
  const topics = [ ... new Set(input.flatMap(i => Object.keys(i.topic_count || {})))]
  const config = calculationDataConfig.concat(
    topics.map(topic => topicDataConfig(topic))
  )
  return parseData(input, config)
}

export function parsePriceData(input){
  return parseData(input, priceDataConfig)
}

export function parseAlertData(input){
  return {
    ...alertDataConfig,
    data: input.map((alert)=>({
      x: Date.parse(alert.date.substring(0, 10)),
      title: alert.category,
      text: alert.type
    })).reverse()

  }
}

export function seriesToGrouped(series){

  var result = [];
  var groupToIdx = {};

  series.forEach(
    function (s){
      if (s.group){
        if (!(s.group in groupToIdx)){
          groupToIdx[s.group] = result.length;
          
          result.push({ key: s.group, name: s.group, items: []})
        }
        result[groupToIdx[s.group]].items.push(s)
      } else {
        result.push(s)
      }
    }
  ); 
  
  return result
}