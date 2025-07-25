import React from 'react';
import { Gauge } from '@mui/x-charts/Gauge';

function TemperatureGauge({ value }) {
  return (
    <div className="TemperatureGauge">
      <Gauge width={100} height={100} value={value} color="#03635d" />
    </div>
  );
}

export default TemperatureGauge;


