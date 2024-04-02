import { useEffect, useState, memo } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { chartOptions } from './chartConfig';
import { Button, Popover } from '@material-ui/core';
import { seriesToGrouped } from './chartHelper';
import CheckboxWithLabel from '../../../components/CheckboxWithLabel';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import { TreeView, TreeItem } from '@material-ui/lab';
import DragPanes from "highcharts/modules/drag-panes.js";
import HollowCandlestick from "highcharts/modules/hollowcandlestick"
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

var highcharts;

function timestampToNearestDate(timestamp){
  let nearestDayTimestamp = Math.round(timestamp / 86400000) * 86400000;
  let date = new Date(nearestDayTimestamp);
  return date.toISOString().substring(0, 10)
}

const SelectPopover = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { series } = props;
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState([]);

  const seriesGrouped = seriesToGrouped(series);
  const serieskeyToIdx = Object.fromEntries(series.map((s, idx) => [s.key, idx]));

  useEffect(()=>{
    setChecked(Object.fromEntries(series.map(s => [s.key, s.visible === undefined? true: s.visible])))
  }, [series])

  function handleClick(evt){
    setAnchorEl(evt.currentTarget);
  }
  function handleClose(){
    setAnchorEl(null);
  };

  function handleChange(evt, keys){    
    let changes =  Object.fromEntries(keys.map(key=> [[key], evt.target.checked]));
    setChecked({...checked, ...changes});
    Object.entries(changes).map(([k, v]) => {
      highcharts.series[serieskeyToIdx[k]].setVisible(v, false);
    })
    highcharts.redraw();
  };

  function handleNodeToggle(evt, nodeIds){
    setExpanded(nodeIds)
  }

  const Selections = () => {

    const CheckboxWithLabelFromSerie = (props) => {

      const serie = props.serie;

      return (
      <CheckboxWithLabel
        label={serie.name}
        checked={serie.items?.map(i=> checked[i.key])?.every(Boolean) || checked[serie.key]}
        indeterminate={serie.items?.map(i=> checked[i.key])?.some(Boolean) && !serie.items?.map(i=> checked[i.key])?.every(Boolean)}
        onChange={(evt)=>{handleChange(evt, serie.items?.map(i=>i.key) || [serie.key])}}
      />
      )
    }

    return (
      <TreeView 
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        onNodeToggle={handleNodeToggle}
        disableSelection={true}
      >
        { seriesGrouped.map( s =>
          <TreeItem
            nodeId={s.key} key={s.key}
            label={<CheckboxWithLabelFromSerie serie={s} />}
          >
            {s.items?.map(i => 
              <TreeItem nodeId={i.key} key={i.key} label={<CheckboxWithLabelFromSerie serie={i} />}/>
            )}
          </TreeItem>
        )}
      </TreeView>
    );
  }

  return (
    <>
    <Button variant="outlined" size="small" onClick={handleClick}>Display/ Hide Data</Button>
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Selections/>
    </Popover>
    </>
  )
}

const Chart = (props) => {

  const { chartData, setNewsListParam, history, counterparty } = props;

  let series = [];

  for (const type in chartData)
    series = series.concat(
      chartData[type]
    );

  const options = {
    series,
    ...chartOptions,
    chart: { ...chartOptions.chart, events: { 
      render: function(){ highcharts = this},
      click: function(e){
        setNewsListParam({ date: timestampToNearestDate(this.hoverPoint.category), page: 1})},
    }},
    plotOptions: {
      series: { ...chartOptions.plotOptions.series,
        events: {click: function(e){ setNewsListParam({ date: timestampToNearestDate(e.point.category), page: 1})},}
      },
      column: { ...chartOptions.plotOptions.column,
        events: {click: function(e){setNewsListParam({ date: timestampToNearestDate(e.point.category), page: 1})},}
      }
    }
  };

  DragPanes(Highcharts);
  HollowCandlestick(Highcharts);

  return (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 2}}>
      <SelectPopover
        series={series}
      />
      <Button variant="contained" size="small" 
        onClick={()=>history.push(`/edit-topic?symbol=${counterparty}`)}
      >
        Add Topics
      </Button>
    </div>
    <HighchartsReact
      highcharts={Highcharts}
      constructorType={'stockChart'}
      options={options}
    />
    </>
  )
};

function propsAreEqual(prevProps, nextProps) {
  return prevProps.chartData === nextProps.chartData;
}

export default withRouter(memo(Chart, propsAreEqual))